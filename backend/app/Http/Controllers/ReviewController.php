<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Ratings a student leaves for a tutor who taught them.
 */
class ReviewController extends Controller
{
    /**
     * A tutor's reviews, newest first, with the average.
     *
     * Readable by any signed-in account: this is what a student weighs up
     * before asking, so it cannot be limited to the tutor themselves.
     */
    public function index(Request $request, string $tutor): JsonResponse
    {
        $reviews = Review::query()
            ->forTutor($tutor)
            ->with('student.department')
            ->latest()
            ->get();

        return response()->json([
            'summary' => Review::summaryFor($tutor),
            'data' => $reviews->map(fn (Review $r) => $this->present($r))->all(),
            // Lets the client offer "write a review" without a second call.
            'can_review' => Review::isAllowed($request->user()->id, $tutor),
            'my_review' => $reviews
                ->firstWhere('student_id', $request->user()->id)
                ?->id,
        ]);
    }

    /**
     * Leave a rating, or change the one already left.
     */
    public function store(Request $request): JsonResponse
    {
        // The review runs whichever way the caller names: `tutor_id` means a
        // student rating their tutor, `student_id` means a tutor rating their
        // student. Exactly one is given.
        $validated = $request->validate([
            'tutor_id' => ['required_without:student_id', 'missing_with:student_id', 'string', Rule::exists('users', 'id')],
            'student_id' => ['required_without:tutor_id', 'missing_with:tutor_id', 'string', Rule::exists('users', 'id')],
            'rating' => ['required', 'integer', 'min:'.Review::MIN_RATING, 'max:'.Review::MAX_RATING],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $me = $request->user();
        $ratingTutor = isset($validated['tutor_id']);

        // The two people in the pair, whichever way round the review runs.
        $studentId = $ratingTutor ? $me->id : $validated['student_id'];
        $tutorId = $ratingTutor ? $validated['tutor_id'] : $me->id;
        $direction = $ratingTutor ? Review::STUDENT_TO_TUTOR : Review::TUTOR_TO_STUDENT;
        $field = $ratingTutor ? 'tutor_id' : 'student_id';

        if (($validated[$field]) === $me->id) {
            throw ValidationException::withMessages([$field => ['You cannot review yourself.']]);
        }

        if (! Review::isAllowed($studentId, $tutorId)) {
            throw ValidationException::withMessages([
                $field => [$ratingTutor
                    ? 'You can review a tutor once they have taught you.'
                    : 'You can review a student once you have taught them.'],
            ]);
        }

        // Changing your mind edits the review rather than adding a second.
        $review = Review::updateOrCreate(
            ['student_id' => $studentId, 'tutor_id' => $tutorId, 'direction' => $direction],
            ['rating' => $validated['rating'], 'comment' => $validated['comment'] ?? null],
        );

        return response()->json([
            'message' => $review->wasRecentlyCreated ? 'Thanks for your review.' : 'Your review has been updated.',
            'data' => $this->present($review->load(['student.department', 'tutor.department'])),
            'summary' => Review::summaryFor($ratingTutor ? $tutorId : $studentId, $direction),
        ], $review->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Withdraw a review. Scoped to its author, so anyone else's review is
     * reported as missing rather than forbidden, including one written about
     * the person asking.
     */
    public function destroy(Request $request, string $review): JsonResponse
    {
        $model = Review::query()
            ->writtenBy($request->user()->id)
            ->findOrFail($review);

        // Whoever was rated is whose summary changes.
        $subject = $model->direction === Review::TUTOR_TO_STUDENT ? $model->student_id : $model->tutor_id;
        $direction = $model->direction;

        $model->delete();

        return response()->json([
            'message' => 'Your review has been removed.',
            'summary' => Review::summaryFor($subject, $direction),
        ]);
    }

    /**
     * The reviews the signed-in student has written, and the tutors they
     * could still review — which is what the dashboard prompts them with.
     */
    public function mine(Request $request): JsonResponse
    {
        $student = $request->user();

        // Only what this student wrote about their tutors. Reviews tutors
        // wrote about the student share its student_id, and used to be
        // counted here as the student's own, which also dropped each of
        // those tutors from the list still waiting to be rated.
        $written = Review::query()
            ->where('student_id', $student->id)
            ->where('direction', Review::STUDENT_TO_TUTOR)
            ->with('tutor.department')
            ->latest()
            ->get();

        // Everyone who taught them and has not been rated yet, including
        // tutors whose teaching has since ended; they can still be reviewed.
        $pending = User::query()
            ->whereIn('id', Review::tutorsAwaitingReviewFrom($student->id))
            ->with('department')
            ->get();

        return response()->json([
            'data' => $written->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'tutor' => $this->presentUser($r->tutor),
                'created_at' => $r->created_at?->toIso8601String(),
            ])->all(),
            'awaiting_review' => $pending->map(fn (User $tutor) => $this->presentUser($tutor))
                ->values()
                ->all(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Review $review): array
    {
        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'student' => $this->presentUser($review->student),
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function presentUser(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->profile_picture,
            'department' => $user->department?->code,
        ];
    }
}
