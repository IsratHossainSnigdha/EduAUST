<?php

namespace App\Http\Controllers;

use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TuitionRequestController extends Controller
{
    public function __construct(private Notifier $notifier) {}

    /**
     * The requests addressed to the signed-in tutor, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in([
                TuitionRequest::STATUS_PENDING,
                TuitionRequest::STATUS_ACCEPTED,
                TuitionRequest::STATUS_DECLINED,
            ])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = TuitionRequest::query()
            ->where('tutor_id', $request->user()->id)
            ->with(['student.department', 'subject'])
            ->latest();

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $page = $query->paginate($filters['per_page'] ?? 15);

        return response()->json([
            'data' => collect($page->items())
                ->map(fn (TuitionRequest $r) => $this->present($r))
                ->all(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /**
     * Send a request to a tutor.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_id' => ['required', 'string', Rule::exists('users', 'id')],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
            'level' => ['nullable', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $student = $request->user();

        if ($validated['tutor_id'] === $student->id) {
            throw ValidationException::withMessages([
                'tutor_id' => ['You cannot send a tuition request to yourself.'],
            ]);
        }

        $tutor = User::find($validated['tutor_id']);

        // Only an account that actually tutors can receive requests.
        if (! $tutor?->isTutor) {
            throw ValidationException::withMessages([
                'tutor_id' => ['That account is not accepting tuition requests.'],
            ]);
        }

        // A second request for the same subject would just be noise in the
        // tutor's inbox while the first is still unanswered.
        $duplicate = TuitionRequest::query()
            ->pending()
            ->where('student_id', $student->id)
            ->where('tutor_id', $tutor->id)
            ->where('subject_id', $validated['subject_id'] ?? null)
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'tutor_id' => ['You already have a pending request with this tutor for that subject.'],
            ]);
        }

        $tuitionRequest = TuitionRequest::create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'subject_id' => $validated['subject_id'] ?? null,
            'level' => $validated['level'] ?? null,
            'message' => $validated['message'] ?? null,
            'status' => TuitionRequest::STATUS_PENDING,
        ]);

        // The tutor is only told by the dashboard otherwise, which they may
        // not open for days.
        $this->notifier->tuitionRequested($tuitionRequest->load(['student', 'subject']));

        return response()->json([
            'message' => 'Your request has been sent.',
            'data' => $this->present($tuitionRequest->load(['student', 'subject'])),
        ], 201);
    }

    /**
     * Accept or decline a request addressed to the signed-in tutor.
     */
    public function update(Request $request, TuitionRequest $tuitionRequest): JsonResponse
    {
        // A tutor may only answer their own requests.
        if ($tuitionRequest->tutor_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(TuitionRequest::RESPONSES)],
        ]);

        if ($tuitionRequest->isAnswered()) {
            throw ValidationException::withMessages([
                'status' => ['This request has already been answered.'],
            ]);
        }

        $tuitionRequest->update([
            'status' => $validated['status'],
            'responded_at' => now(),
        ]);

        $this->syncStudentCount($tuitionRequest->tutor_id);

        // Acceptance also unlocks messaging, so the student needs to know.
        $this->notifier->tuitionAnswered($tuitionRequest->load(['tutor', 'subject']));

        return response()->json([
            'message' => 'Request updated.',
            'data' => $this->present($tuitionRequest->load(['student.department', 'subject'])),
        ]);
    }

    /**
     * Bring a tutor's student count in line with the requests they have
     * actually accepted.
     *
     * The column was written once as 0 when the tutor account was created and
     * never touched again, so the dashboard reported "students taught: 0" no
     * matter how many students a tutor took on — and the seeded tutors carried
     * invented figures instead. Counting distinct students keeps it honest,
     * and keeps the stored column that the tutor listing filters and sorts on.
     */
    private function syncStudentCount(string $tutorId): void
    {
        // The public card shows how many students a tutor has taught, which
        // does not fall when an arrangement ends, so this counts everyone
        // ever taken on rather than only those currently being taught.
        TutorProfile::query()
            ->where('user_id', $tutorId)
            ->update(['student_count' => TuitionRequest::studentsTaught($tutorId)]);
    }

    /**
     * Close an active tutoring arrangement.
     *
     * The tutor stops teaching this student — messaging closes with it — but
     * the student still counts as taught, so this is a distinct state from a
     * request that was declined outright.
     */
    public function end(Request $request, TuitionRequest $tuitionRequest): JsonResponse
    {
        $me = $request->user()->id;

        // Either party may walk away: a student who has stopped working with a
        // tutor was previously stuck waiting for the tutor to end it.
        $isTutor = $tuitionRequest->tutor_id === $me;
        $isStudent = $tuitionRequest->student_id === $me;

        if (! $isTutor && ! $isStudent) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        /*
         * A student may take back a request the tutor has not answered yet.
         * They had no way to do that: a request sent by mistake, or to a
         * tutor they no longer need, sat in someone's inbox indefinitely.
         */
        if ($tuitionRequest->status === TuitionRequest::STATUS_PENDING && $isStudent) {
            $tuitionRequest->update(['status' => TuitionRequest::STATUS_WITHDRAWN]);

            // Nothing had begun, so there is nothing to tell the tutor about;
            // it simply leaves their inbox.
            return response()->json([
                'message' => 'Your request has been withdrawn.',
                'data' => $this->present($tuitionRequest->load(['student.department', 'subject'])),
            ]);
        }

        if ($tuitionRequest->status !== TuitionRequest::STATUS_ACCEPTED) {
            throw ValidationException::withMessages([
                'status' => [$isTutor
                    ? 'Only a student you are currently teaching can be removed.'
                    : 'Only a tutor who is currently teaching you can be removed.'],
            ]);
        }

        /*
         * A tutor may stop at any point; a student commits to a full month
         * first. The model owns that rule so the dashboards can explain it
         * before the button is pressed rather than only after.
         */
        $endable = $tuitionRequest->endableBy($me);

        if (! $endable['allowed']) {
            throw ValidationException::withMessages([
                'status' => [$endable['reason']],
            ]);
        }

        $tuitionRequest->update([
            'status' => TuitionRequest::STATUS_ENDED,
            'ended_at' => now(),
        ]);

        $this->syncStudentCount($tuitionRequest->tutor_id);

        // The other side loses the conversation with it, so tell them.
        $this->notifier->tuitionEnded(
            $tuitionRequest->load(['tutor', 'student', 'subject']),
            $me
        );

        return response()->json([
            'message' => $isTutor
                ? 'You are no longer teaching this student.'
                : 'This tutor is no longer teaching you.',
            'data' => $this->present($tuitionRequest->load(['student.department', 'subject'])),
        ]);
    }

    /**
     * Shape a request for the dashboard cards, so the client never has to
     * reach through relations that may be missing.
     *
     * @return array<string, mixed>
     */
    public static function presentRequest(TuitionRequest $r): array
    {
        return [
            'id' => $r->id,
            'status' => $r->status,
            'level' => $r->level,
            'message' => $r->message,
            'subject' => $r->subject?->name,
            'subject_id' => $r->subject_id,
            'student' => [
                'id' => $r->student?->id,
                'name' => $r->student?->name,
                'department' => $r->student?->department?->code,
                'semester' => $r->student?->semester,
                'avatar' => $r->student?->profile_picture,
            ],
            'created_at' => $r->created_at?->toIso8601String(),
            'responded_at' => $r->responded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function present(TuitionRequest $r): array
    {
        return self::presentRequest($r);
    }

    /**
     * The requests the signed-in student has sent, so the tutor listing can
     * show what has already been asked and where chat is now unlocked.
     */
    public function mine(Request $request): JsonResponse
    {
        $requests = TuitionRequest::query()
            ->where('student_id', $request->user()->id)
            ->with(['tutor', 'subject'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $requests->map(fn (TuitionRequest $r) => [
                'id' => $r->id,
                'status' => $r->status,
                'tutor_id' => $r->tutor_id,
                'tutor_name' => $r->tutor?->name,
                'subject' => $r->subject?->name,
                'created_at' => $r->created_at?->toIso8601String(),
            ])->all(),
        ]);
    }
}
