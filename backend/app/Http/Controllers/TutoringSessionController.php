<?php

namespace App\Http\Controllers;

use App\Models\TuitionRequest;
use App\Models\TutoringSession;
use App\Services\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Agreeing a time to actually meet.
 *
 * Both sides of an arrangement use the same endpoints: either may propose a
 * session, and whichever did not propose it is the one who answers. Nothing
 * here is behind the tutor middleware, because a session belongs to the pair
 * rather than to one role.
 */
class TutoringSessionController extends Controller
{
    public function __construct(private readonly Notifier $notifier) {}

    /**
     * The sessions this account is part of.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filter' => ['sometimes', Rule::in(['upcoming', 'past', 'all'])],
        ]);

        $me = $request->user()->id;
        $filter = $validated['filter'] ?? 'upcoming';

        $query = TutoringSession::query()
            ->forUser($me)
            ->with(['tutor.department', 'student.department', 'tuitionRequest.subject']);

        if ($filter === 'upcoming') {
            $query->upcoming()->orderBy('scheduled_at');
        } elseif ($filter === 'past') {
            // Anything that has been and gone, plus anything called off.
            $query->where(function ($q) {
                $q->where('scheduled_at', '<', now())
                    ->orWhere('status', TutoringSession::STATUS_CANCELLED);
            })->orderByDesc('scheduled_at');
        } else {
            $query->orderByDesc('scheduled_at');
        }

        $sessions = $query->limit(50)->get();

        return response()->json([
            'data' => $sessions->map(fn (TutoringSession $s) => $this->present($s, $me))->all(),
            // What the dashboards badge, so they do not have to count it.
            'awaiting_you' => TutoringSession::query()
                ->forUser($me)
                ->upcoming()
                ->where('status', TutoringSession::STATUS_PROPOSED)
                ->where('proposed_by', '!=', $me)
                ->count(),
        ]);
    }

    /**
     * Propose a time to the other side of an arrangement.
     */
    public function store(Request $request): JsonResponse
    {
        $me = $request->user()->id;

        $validated = $request->validate([
            'tuition_request_id' => ['required', 'string', Rule::exists('tuition_requests', 'id')],
            'scheduled_at' => [
                'required',
                'date',
                'after:now',
                'before:'.now()->addMonths(TutoringSession::MAX_MONTHS_AHEAD)->toDateTimeString(),
            ],
            'duration_minutes' => [
                'sometimes',
                'integer',
                'min:'.TutoringSession::MIN_MINUTES,
                'max:'.TutoringSession::MAX_MINUTES,
            ],
            'location' => ['sometimes', 'nullable', 'string', 'max:160'],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ], [
            'scheduled_at.after' => 'Pick a time in the future.',
            'scheduled_at.before' => 'Sessions can only be arranged up to six months ahead.',
        ]);

        $arrangement = TuitionRequest::find($validated['tuition_request_id']);

        if (! $arrangement || ! in_array($me, [$arrangement->tutor_id, $arrangement->student_id], true)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        /*
         * Only a live arrangement can have sessions. Scheduling against one
         * that was declined or has ended would put a meeting in two diaries
         * for teaching that is not happening.
         */
        if ($arrangement->status !== TuitionRequest::STATUS_ACCEPTED) {
            throw ValidationException::withMessages([
                'tuition_request_id' => ['You can only arrange sessions for active tutoring.'],
            ]);
        }

        $session = TutoringSession::create([
            'tuition_request_id' => $arrangement->id,
            'tutor_id' => $arrangement->tutor_id,
            'student_id' => $arrangement->student_id,
            'scheduled_at' => $validated['scheduled_at'],
            'duration_minutes' => $validated['duration_minutes'] ?? 60,
            'location' => $validated['location'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => TutoringSession::STATUS_PROPOSED,
            'proposed_by' => $me,
        ]);

        $this->notifier->sessionProposed($session->load(['tutor', 'student']), $me);

        return response()->json([
            'message' => 'Session proposed. They will be asked to confirm.',
            'data' => $this->present($session->fresh(['tutor.department', 'student.department', 'tuitionRequest.subject']), $me),
        ], 201);
    }

    /**
     * Confirm a proposed session.
     */
    public function confirm(Request $request, TutoringSession $tutoringSession): JsonResponse
    {
        $me = $request->user()->id;

        if (! $tutoringSession->involves($me)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        // Agreeing with yourself is not agreement.
        if (! $tutoringSession->awaitingAnswerFrom($me)) {
            throw ValidationException::withMessages([
                'status' => [$tutoringSession->proposed_by === $me
                    ? 'You proposed this session, so the other person confirms it.'
                    : 'This session is not waiting to be confirmed.'],
            ]);
        }

        if ($tutoringSession->scheduled_at->isPast()) {
            throw ValidationException::withMessages([
                'status' => ['That time has already passed. Propose a new one.'],
            ]);
        }

        $tutoringSession->update(['status' => TutoringSession::STATUS_CONFIRMED]);

        $this->notifier->sessionConfirmed($tutoringSession->load(['tutor', 'student']), $me);

        return response()->json([
            'message' => 'Session confirmed.',
            'data' => $this->present($tutoringSession->fresh(['tutor.department', 'student.department', 'tuitionRequest.subject']), $me),
        ]);
    }

    /**
     * Call off a session, whether or not it had been confirmed.
     */
    public function cancel(Request $request, TutoringSession $tutoringSession): JsonResponse
    {
        $me = $request->user()->id;

        if (! $tutoringSession->involves($me)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($tutoringSession->status === TutoringSession::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'status' => ['That session was already cancelled.'],
            ]);
        }

        if ($tutoringSession->isPast()) {
            throw ValidationException::withMessages([
                'status' => ['That session has already happened.'],
            ]);
        }

        $tutoringSession->update([
            'status' => TutoringSession::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancelled_by' => $me,
        ]);

        $this->notifier->sessionCancelled($tutoringSession->load(['tutor', 'student']), $me);

        return response()->json([
            'message' => 'Session cancelled.',
            'data' => $this->present($tutoringSession->fresh(['tutor.department', 'student.department', 'tuitionRequest.subject']), $me),
        ]);
    }

    /**
     * One session, as the given account sees it.
     *
     * @return array<string, mixed>
     */
    private function present(TutoringSession $session, string $me): array
    {
        $other = $session->counterpartFor($me);
        $status = $session->effectiveStatus();

        return [
            'id' => $session->id,
            'tuition_request_id' => $session->tuition_request_id,
            'subject' => $session->tuitionRequest?->subject?->name,
            'scheduled_at' => $session->scheduled_at?->toIso8601String(),
            'ends_at' => $session->endsAt()->toIso8601String(),
            'duration_minutes' => $session->duration_minutes,
            'location' => $session->location,
            'note' => $session->note,
            'status' => $status,
            // Who the other person is, so a row reads the same from both ends.
            'with' => $other ? [
                'id' => $other->id,
                'name' => $other->name,
                'avatar' => $other->profile_picture,
                'department' => $other->department?->code,
            ] : null,
            'role' => $session->tutor_id === $me ? 'tutor' : 'student',
            'proposed_by_me' => $session->proposed_by === $me,
            // Drives the buttons, so the browser does not re-derive the rules.
            'can_confirm' => $session->awaitingAnswerFrom($me),
            'can_cancel' => $status !== TutoringSession::STATUS_CANCELLED && ! $session->isPast(),
        ];
    }
}
