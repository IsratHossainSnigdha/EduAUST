<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Review;
use App\Models\SavedTutor;
use App\Models\TuitionRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The student side of the dashboard.
 *
 * Every account is a student, tutors included — tutoring is something an
 * account gains, not something it becomes — so nothing here is behind the
 * tutor middleware, and a tutor reading this endpoint sees their own student
 * activity rather than their teaching.
 */
class StudentDashboardController extends Controller
{
    /**
     * Everything the student dashboard renders, in one request.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $counts = TuitionRequest::query()
            ->where('student_id', $user->id)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // Distinct tutors who agreed to teach them, which is what "my tutors"
        // means to a student — several subjects with one tutor is one tutor.
        $tutors = TuitionRequest::query()
            ->where('student_id', $user->id)
            ->where('status', TuitionRequest::STATUS_ACCEPTED)
            ->distinct()
            ->count('tutor_id');

        $recent = TuitionRequest::query()
            ->where('student_id', $user->id)
            ->with(['tutor.department', 'subject'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'student' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->profile_picture,
                'student_id' => $user->student_id,
                'department' => $user->department?->code,
                'semester' => $user->semester,
                // The dashboard offers "Become a Tutor" or "Switch" on this.
                'is_tutor' => (bool) $user->isTutor,
            ],
            'stats' => [
                'pending_requests' => (int) ($counts[TuitionRequest::STATUS_PENDING] ?? 0),
                'accepted_requests' => (int) ($counts[TuitionRequest::STATUS_ACCEPTED] ?? 0),
                'declined_requests' => (int) ($counts[TuitionRequest::STATUS_DECLINED] ?? 0),
                'total_requests' => (int) $counts->sum(),
                'my_tutors' => $tutors,
                'saved_tutors' => SavedTutor::where('student_id', $user->id)->count(),
                'unread_messages' => $this->unreadMessages($user->id),
                // What they wrote about their tutors, not what tutors wrote
                // about them.
                'reviews_written' => Review::where('student_id', $user->id)
                    ->where('direction', Review::STUDENT_TO_TUTOR)
                    ->count(),
                // Tutors who taught them and have not been rated yet, counted
                // as tutors. Subtracting all-time reviews from current tutors
                // mixed two different sets.
                'reviews_pending' => Review::tutorsAwaitingReviewFrom($user->id)->count(),
            ],
            'recent_requests' => $recent->map(fn (TuitionRequest $r) => $this->presentRequest($r))->all(),
            'tutors' => $this->tutors($user->id, TuitionRequest::STATUS_ACCEPTED),
            'past_tutors' => $this->tutors($user->id, TuitionRequest::STATUS_ENDED),
        ]);
    }

    /**
     * The tutors teaching this student right now, and what they are teaching.
     *
     * The mirror of the tutor dashboard's list of current students: the same
     * relationship, read from the other end.
     */
    /**
     * The tutors on one side of this student's history, grouped one row each.
     *
     * The mirror of the tutor dashboard's student lists: accepted gives who is
     * teaching them now, ended gives who used to.
     */
    private function tutors(string $studentId, string $status): array
    {
        $arrangements = TuitionRequest::query()
            ->where('student_id', $studentId)
            ->where('status', $status)
            ->with(['tutor.department', 'subject'])
            ->latest($status === TuitionRequest::STATUS_ENDED ? 'ended_at' : 'responded_at')
            ->get()
            ->filter(fn (TuitionRequest $r) => $r->tutor !== null);

        if ($status === TuitionRequest::STATUS_ENDED) {
            // Still being taught by them for something else is not "past".
            $current = TuitionRequest::query()
                ->where('student_id', $studentId)
                ->where('status', TuitionRequest::STATUS_ACCEPTED)
                ->pluck('tutor_id')
                ->unique();

            $arrangements = $arrangements->reject(
                fn (TuitionRequest $r) => $current->contains($r->tutor_id)
            );
        }

        // What this student already said about each of them, so a rated tutor
        // offers "edit" rather than asking again.
        $myRatings = Review::query()
            ->where('student_id', $studentId)
            ->where('direction', Review::STUDENT_TO_TUTOR)
            ->get()
            ->keyBy('tutor_id');

        // Everyone else's verdict on each of them, gathered in one grouped
        // query rather than one per tutor.
        $public = Review::query()
            ->whereIn('tutor_id', $arrangements->pluck('tutor_id')->unique())
            ->where('direction', Review::STUDENT_TO_TUTOR)
            ->groupBy('tutor_id')
            ->selectRaw('tutor_id, AVG(rating) as average, COUNT(*) as total')
            ->get()
            ->keyBy('tutor_id');

        return $arrangements
            // One row per tutor: several subjects with the same tutor is still
            // one tutor to deal with.
            ->groupBy('tutor_id')
            ->map(function ($forTutor) use ($myRatings, $public, $studentId, $status) {
                $first = $forTutor->first();
                $tutor = $first->tutor;
                $rating = $myRatings->get($tutor->id);
                $summary = $public->get($tutor->id);

                // The longest-running of them is the one that dates the
                // relationship, not whichever subject was added last.
                $started = $forTutor->map(fn (TuitionRequest $r) => $r->startedAt())
                    ->filter()
                    ->min();

                $ended = $forTutor->map(fn (TuitionRequest $r) => $r->ended_at)
                    ->filter()
                    ->max();

                /*
                 * A student commits to a full month before they may end an
                 * arrangement, so the row can say when rather than letting
                 * them press a button that will be refused.
                 */
                $endable = $first->endableBy($studentId);
                $dueAt = $first->studentMayEndAt();

                return [
                    'request_id' => $first->id,
                    'tutor_id' => $tutor->id,
                    'name' => $tutor->name,
                    'avatar' => $tutor->profile_picture,
                    'department' => $tutor->department?->code,
                    'semester' => $tutor->semester,
                    'subjects' => $forTutor
                        ->map(fn (TuitionRequest $r) => $r->subject?->name)
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                    'since' => $started?->toIso8601String(),
                    'ended_at' => $ended?->toIso8601String(),
                    'my_rating' => $rating?->rating,
                    // What everyone else makes of them, which is the figure the
                    // student sees everywhere else the tutor appears. No
                    // reviews is not a rating of zero, which would read badly.
                    'rating' => $summary && (int) $summary->total > 0
                        ? round((float) $summary->average, 1)
                        : null,
                    'rating_count' => (int) ($summary->total ?? 0),
                    // What has already finished cannot be finished again.
                    'can_end' => $status === TuitionRequest::STATUS_ACCEPTED
                        && $endable['allowed'],
                    'end_blocked_reason' => $status === TuitionRequest::STATUS_ACCEPTED
                        ? $endable['reason']
                        : null,
                    'can_end_at' => $dueAt?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * The student's own requests, newest first, for the My Requests page.
     */
    public function requests(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in([
                TuitionRequest::STATUS_PENDING,
                TuitionRequest::STATUS_ACCEPTED,
                TuitionRequest::STATUS_DECLINED,
            ])],
        ]);

        $query = TuitionRequest::query()
            ->where('student_id', $request->user()->id)
            ->with(['tutor.department', 'subject'])
            ->latest();

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json([
            'data' => $query->get()->map(fn (TuitionRequest $r) => $this->presentRequest($r))->all(),
        ]);
    }

    /**
     * The student's shortlist.
     */
    public function savedTutors(Request $request): JsonResponse
    {
        $saved = SavedTutor::query()
            ->where('student_id', $request->user()->id)
            ->with(['tutor.department', 'tutor.tutorProfile.subjects'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $saved
                // A tutor who has since deleted their account leaves a row
                // pointing at nobody; drop it rather than render a blank card.
                ->filter(fn (SavedTutor $s) => $s->tutor !== null)
                ->map(fn (SavedTutor $s) => $this->presentSaved($s))
                ->values()
                ->all(),
        ]);
    }

    /**
     * Keep a tutor on the shortlist.
     */
    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_id' => ['required', 'string', Rule::exists('users', 'id')],
        ]);

        $student = $request->user();

        if ($validated['tutor_id'] === $student->id) {
            throw ValidationException::withMessages([
                'tutor_id' => ['You cannot save yourself.'],
            ]);
        }

        if (! User::where('id', $validated['tutor_id'])->where('isTutor', true)->exists()) {
            throw ValidationException::withMessages([
                'tutor_id' => ['That account does not tutor.'],
            ]);
        }

        // Saving twice is the same shortlist, so this is idempotent rather
        // than an error the UI would have to explain.
        $saved = SavedTutor::firstOrCreate([
            'student_id' => $student->id,
            'tutor_id' => $validated['tutor_id'],
        ]);

        return response()->json([
            'message' => 'Tutor saved.',
            'data' => $this->presentSaved($saved->load(['tutor.department', 'tutor.tutorProfile.subjects'])),
        ], $saved->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Drop a tutor from the shortlist.
     */
    public function unsave(Request $request, string $tutor): JsonResponse
    {
        $removed = SavedTutor::query()
            ->where('student_id', $request->user()->id)
            ->where('tutor_id', $tutor)
            ->delete();

        // Removing something already gone is the state the caller wanted.
        return response()->json([
            'message' => $removed ? 'Tutor removed from your saved list.' : 'That tutor was not saved.',
        ]);
    }

    /**
     * The API shape of a request as the student sees it: the tutor, not them.
     *
     * @return array<string, mixed>
     */
    private function presentRequest(TuitionRequest $r): array
    {
        return [
            'id' => $r->id,
            'status' => $r->status,
            'level' => $r->level,
            'message' => $r->message,
            'subject' => $r->subject?->name,
            'subject_id' => $r->subject_id,
            'tutor' => [
                'id' => $r->tutor?->id,
                'name' => $r->tutor?->name,
                'department' => $r->tutor?->department?->code,
                'avatar' => $r->tutor?->profile_picture,
            ],
            'created_at' => $r->created_at?->toIso8601String(),
            'responded_at' => $r->responded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSaved(SavedTutor $s): array
    {
        $tutor = $s->tutor;
        $profile = $tutor?->tutorProfile;

        return [
            'id' => $s->id,
            'tutor_id' => $tutor?->id,
            'name' => $tutor?->name,
            'avatar' => $tutor?->profile_picture,
            'department' => $tutor?->department?->code,
            'headline' => $profile?->headline,
            'hourly_rate' => $profile?->hourly_rate,
            'experience_years' => $profile?->experience_years ?? 0,
            'subjects' => $profile
                ? $profile->subjects->map(fn ($subject) => $subject->name)->all()
                : [],
            'saved_at' => $s->created_at?->toIso8601String(),
        ];
    }

    /**
     * Unread messages across all of the student's conversations.
     */
    private function unreadMessages(string $userId): int
    {
        return Message::query()
            ->unreadFor($userId)
            ->whereHas('conversation', fn ($query) => $query->forUser($userId))
            ->count();
    }
}
