<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The public-facing profile of another user, shown when their avatar is
 * tapped in the message box. It also tells the viewer whether — and which way
 * — they may rate this person.
 */
class UserProfileController extends Controller
{
    public function show(Request $request, string $user): JsonResponse
    {
        $viewer = $request->user();

        $other = User::query()
            ->with(['department', 'tutorProfile.subjects'])
            ->findOrFail($user);

        $profile = $other->tutorProfile;

        // Has the viewer been taught by this person (viewer=student), or taught
        // this person (viewer=tutor)? That decides which way a review would run.
        $viewerWasTaught = Review::isAllowed($viewer->id, $other->id);
        $viewerTaught = Review::isAllowed($other->id, $viewer->id);

        $reviewDirection = null;
        $myReview = null;

        if ($viewer->id !== $other->id) {
            if ($other->isTutor && $viewerWasTaught) {
                $reviewDirection = Review::STUDENT_TO_TUTOR;
                $myReview = Review::query()
                    ->where('student_id', $viewer->id)
                    ->where('tutor_id', $other->id)
                    ->where('direction', Review::STUDENT_TO_TUTOR)
                    ->first();
            } elseif ($viewerTaught) {
                $reviewDirection = Review::TUTOR_TO_STUDENT;
                $myReview = Review::query()
                    ->where('student_id', $other->id)
                    ->where('tutor_id', $viewer->id)
                    ->where('direction', Review::TUTOR_TO_STUDENT)
                    ->first();
            }
        }

        return response()->json([
            'user' => [
                'id' => $other->id,
                'name' => $other->name,
                'avatar' => $other->profile_picture,
                'department' => $other->department?->code,
                'semester' => $other->semester,
                'is_tutor' => (bool) $other->isTutor,
            ],
            // The tutor side of the profile, when this account teaches.
            'tutor' => $other->isTutor && $profile ? [
                'headline' => $profile->headline,
                'bio' => $profile->bio,
                'experience_years' => $profile->experience_years,
                'hourly_rate' => $profile->hourly_rate,
                'subjects' => $profile->subjects->map(fn (Subject $s) => $s->name)->all(),
            ] : null,
            // Rating of them as a tutor, and separately as a student.
            'tutor_rating' => Review::summaryFor($other->id, Review::STUDENT_TO_TUTOR),
            'student_rating' => Review::summaryFor($other->id, Review::TUTOR_TO_STUDENT),
            // What the viewer may do about it.
            'review' => [
                'can_review' => $reviewDirection !== null,
                'direction' => $reviewDirection,
                'my_review' => $myReview ? [
                    'id' => $myReview->id,
                    'rating' => $myReview->rating,
                    'comment' => $myReview->comment,
                ] : null,
            ],
        ]);
    }

    /**
     * The reviews written about a student (by the tutors who taught them).
     */
    public function studentReviews(Request $request, string $user): JsonResponse
    {
        $reviews = Review::query()
            ->forStudent($user)
            ->with('tutor.department')
            ->latest()
            ->get();

        return response()->json([
            'summary' => Review::summaryFor($user, Review::TUTOR_TO_STUDENT),
            'data' => $reviews->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'tutor' => $r->tutor ? [
                    'id' => $r->tutor->id,
                    'name' => $r->tutor->name,
                    'avatar' => $r->tutor->profile_picture,
                    'department' => $r->tutor->department?->code,
                ] : null,
                'created_at' => $r->created_at?->toIso8601String(),
            ])->all(),
            'can_review' => Review::isAllowed($user, $request->user()->id),
        ]);
    }
}
