<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Review;
use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TutorController extends Controller
{
    /**
     * Create a tutor account.
     */
    public function create(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isTutor) {
            return response()->json([
                'message' => 'User already has a tutor account.',
                'isTutor' => true,
            ], 409);
        }

        $validated = $request->validate([
            'subjects' => ['required', 'array', 'min:1'],
            'subjects.*' => ['integer', 'exists:subjects,id'],
            'experience' => ['nullable', 'integer', 'min:0'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $tutorProfile = DB::transaction(function () use (
            $user,
            $validated
        ) {
            $tutorProfile = TutorProfile::create([
                'user_id' => $user->id,
                'bio' => $validated['bio'] ?? null,
                'experience_years' => $validated['experience'] ?? 0,
                'student_count' => 0,
                'languages' => [],
                'is_available' => true,
            ]);

            $tutorProfile->subjects()->sync(
                $validated['subjects']
            );

            $user->update([
                'isTutor' => true,
            ]);

            return $tutorProfile->load('subjects');
        });

        return response()->json([
            'message' => 'Tutor account created successfully.',
            'isTutor' => true,
            'tutorProfile' => $tutorProfile,
            'user' => $user->fresh(),
        ], 201);
    }

    /**
     * Check whether the authenticated user has a tutor profile.
     */
    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'isTutor' => (bool) $request->user()->isTutor,
        ]);
    }

    /**
     * List the tutors a student can browse.
     *
     * Filtering, searching and sorting are delegated to the query scopes on
     * TutorProfile so the rules live with the model rather than here.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'subject_id' => ['sometimes', 'integer', Rule::exists('subjects', 'id')],
            'department_id' => ['sometimes', 'integer', Rule::exists('departments', 'id')],
            'language' => ['sometimes', 'string', 'max:50'],
            'min_experience' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'min_students' => ['sometimes', 'integer', 'min:0'],
            'sort' => ['sometimes', Rule::in(TutorProfile::SORTS)],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $query = TutorProfile::query()
            ->listable()
            ->with(['user.department', 'subjects'])
            // Aggregated in the same query rather than per card, so a page of
            // tutors does not become a page of extra round trips.
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        // A tutor browsing the listing should not be offered their own card.
        if ($request->user()) {
            $query->where('user_id', '!=', $request->user()->id);
        }

        if (filled($filters['search'] ?? null)) {
            $query->search($filters['search']);
        }

        if (isset($filters['subject_id'])) {
            $query->teaching((int) $filters['subject_id']);
        }

        if (isset($filters['department_id'])) {
            $query->inDepartment((int) $filters['department_id']);
        }

        if (filled($filters['language'] ?? null)) {
            $query->speaking($filters['language']);
        }

        if (isset($filters['min_experience'])) {
            $query->where('experience_years', '>=', (int) $filters['min_experience']);
        }

        if (isset($filters['min_students'])) {
            $query->where('student_count', '>=', (int) $filters['min_students']);
        }

        $query->sorted($filters['sort'] ?? TutorProfile::DEFAULT_SORT);

        $page = $query->paginate($filters['per_page'] ?? 6);

        return response()->json([
            'data' => collect($page->items())
                ->map(fn (TutorProfile $tutor) => $this->presentTutor($tutor))
                ->all(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /**
     * The options a student can filter the listing by.
     */
    public function filters(): JsonResponse
    {
        // Languages are stored per profile as a JSON array, so the distinct
        // set is collected in PHP rather than by the database.
        $languages = TutorProfile::query()
            ->listable()
            ->pluck('languages')
            ->flatten()
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return response()->json([
            'subjects' => Subject::orderBy('name')->get(['id', 'name', 'slug']),
            'departments' => Department::orderBy('name')->get(['id', 'name', 'code']),
            'languages' => $languages,
            'sorts' => TutorProfile::SORTS,
        ]);
    }

    /**
     * Flatten a profile into the shape the tutor cards consume, so the client
     * never has to reach through the underlying relations.
     *
     * @return array<string, mixed>
     */
    private function presentTutor(TutorProfile $tutor): array
    {
        return [
            'id' => $tutor->id,
            'user_id' => $tutor->user_id,
            'name' => $tutor->user?->name,
            'avatar' => $tutor->user?->profile_picture,
            'department' => $tutor->user?->department?->code,
            'semester' => $tutor->user?->semester,
            'headline' => $tutor->headline,
            'bio' => $tutor->bio,
            'hourly_rate' => $tutor->hourly_rate,
            'experience_years' => $tutor->experience_years,
            'student_count' => $tutor->student_count,
            'languages' => $tutor->languages ?? [],
            'is_available' => (bool) $tutor->is_available,
            // The cards have shown stars since the listing was built, read
            // from nothing. Null means nobody has rated them yet, which is
            // not the same as a rating of zero.
            'rating' => $tutor->reviews_avg_rating !== null
                ? round((float) $tutor->reviews_avg_rating, 1)
                : null,
            'rating_count' => (int) ($tutor->reviews_count ?? 0),
            'subjects' => $tutor->subjects
                ->map(fn (Subject $subject) => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'slug' => $subject->slug,
                ])
                ->all(),
        ];
    }

    /**
     * Everything the tutor dashboard shows: who the tutor is, their headline
     * figures, and the requests currently waiting on them.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->tutorProfile()->with('subjects')->first();

        $requests = TuitionRequest::query()
            ->where('tutor_id', $user->id)
            ->with(['student.department', 'subject'])
            ->latest()
            ->limit(5)
            ->get();

        $counts = TuitionRequest::query()
            ->where('tutor_id', $user->id)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $rating = Review::summaryFor($user->id);

        return response()->json([
            'tutor' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->profile_picture,
                'department' => $user->department?->code,
                'semester' => $user->semester,
                'headline' => $profile?->headline,
                'bio' => $profile?->bio,
                'hourly_rate' => $profile?->hourly_rate,
                'experience_years' => $profile?->experience_years ?? 0,
                'is_available' => (bool) ($profile?->is_available ?? false),
                'subjects' => $profile
                    ? $profile->subjects->map(fn (Subject $s) => ['id' => $s->id, 'name' => $s->name])->all()
                    : [],
            ],
            'stats' => [
                'pending_requests' => (int) ($counts[TuitionRequest::STATUS_PENDING] ?? 0),
                'accepted_requests' => (int) ($counts[TuitionRequest::STATUS_ACCEPTED] ?? 0),
                'declined_requests' => (int) ($counts[TuitionRequest::STATUS_DECLINED] ?? 0),
                'total_requests' => (int) $counts->sum(),
                // Students being taught right now, versus everyone ever taken
                // on — the latter does not fall when an arrangement ends.
                'currently_teaching' => TuitionRequest::currentlyTeaching($user->id),
                'students_taught' => TuitionRequest::studentsTaught($user->id),
                'subjects_count' => $profile ? $profile->subjects->count() : 0,
                // What students made of the teaching, which is the figure a
                // tutor most wants on their own dashboard.
                'rating' => $rating['average'],
                'rating_count' => $rating['count'],
            ],
            // A profile with nothing filled in looks broken on a public card,
            // so the dashboard can prompt the tutor to finish it.
            'profile_complete' => (bool) ($profile && filled($profile->headline) && filled($profile->hourly_rate)),
            'recent_requests' => $requests
                ->map(fn (TuitionRequest $r) => TuitionRequestController::presentRequest($r))
                ->all(),
            // The students being taught right now, so the dashboard can act on
            // them — message, rate or stop teaching — without hunting through
            // the request list for the right row.
            'students' => $this->students($user->id, TuitionRequest::STATUS_ACCEPTED),
            'past_students' => $this->students($user->id, TuitionRequest::STATUS_ENDED),
        ]);
    }

    /**
     * The tutor's active students, each with what is needed to act on them.
     *
     * @return array<int, array<string, mixed>>
     */
    /**
     * The students on one side of this tutor's history, grouped one row each.
     *
     * Accepted gives who is being taught now; ended gives who was. A student
     * who is still being taught for one subject is not "past" because another
     * arrangement with them finished, so they only ever appear in one list.
     */
    private function students(string $tutorId, string $status): array
    {
        $arrangements = TuitionRequest::query()
            ->where('tutor_id', $tutorId)
            ->where('status', $status)
            ->with(['student.department', 'subject'])
            ->latest($status === TuitionRequest::STATUS_ENDED ? 'ended_at' : 'responded_at')
            ->get()
            ->filter(fn (TuitionRequest $r) => $r->student !== null);

        if ($status === TuitionRequest::STATUS_ENDED) {
            $current = TuitionRequest::query()
                ->where('tutor_id', $tutorId)
                ->where('status', TuitionRequest::STATUS_ACCEPTED)
                ->pluck('student_id')
                ->unique();

            $arrangements = $arrangements->reject(
                fn (TuitionRequest $r) => $current->contains($r->student_id)
            );
        }

        // What this tutor already said about each of them, so a rated student
        // offers "edit" rather than asking again.
        $myRatings = Review::query()
            ->where('tutor_id', $tutorId)
            ->where('direction', Review::TUTOR_TO_STUDENT)
            ->get()
            ->keyBy('student_id');

        return $arrangements
            // One row per student: several subjects with the same student is
            // still one student to manage.
            ->groupBy('student_id')
            ->map(function ($forStudent) use ($myRatings, $status) {
                $first = $forStudent->first();
                $student = $first->student;
                $rating = $myRatings->get($student->id);

                // The longest-running of them is the one that dates the
                // relationship, not whichever subject was added last.
                $started = $forStudent->map(fn (TuitionRequest $r) => $r->startedAt())
                    ->filter()
                    ->min();

                $ended = $forStudent->map(fn (TuitionRequest $r) => $r->ended_at)
                    ->filter()
                    ->max();

                return [
                    'request_id' => $first->id,
                    'student_id' => $student->id,
                    'name' => $student->name,
                    'avatar' => $student->profile_picture,
                    'department' => $student->department?->code,
                    'semester' => $student->semester,
                    'subjects' => $forStudent
                        ->map(fn (TuitionRequest $r) => $r->subject?->name)
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                    'since' => $started?->toIso8601String(),
                    'ended_at' => $ended?->toIso8601String(),
                    'my_rating' => $rating?->rating,
                    // A tutor is giving their own time, so they may stop
                    // whenever they need to. What has already finished cannot
                    // be finished again.
                    'can_end' => $status === TuitionRequest::STATUS_ACCEPTED,
                    'end_blocked_reason' => null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Update the tutoring side of the signed-in tutor's profile.
     *
     * These are the fields that appear on the public tutor card, so a tutor
     * can correct them without recreating their account.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->tutorProfile;

        if (! $profile) {
            return response()->json([
                'message' => 'You do not have a tutor profile yet.',
            ], 404);
        }

        $validated = $request->validate([
            'headline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'hourly_rate' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
            'experience_years' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'is_available' => ['sometimes', 'boolean'],
            'languages' => ['sometimes', 'array'],
            'languages.*' => ['string', 'max:50'],
            'subjects' => ['sometimes', 'array'],
            'subjects.*' => ['integer', Rule::exists('subjects', 'id')],
        ]);

        $profile->fill(Arr::except($validated, ['subjects']))->save();

        if (array_key_exists('subjects', $validated)) {
            $profile->subjects()->sync($validated['subjects']);
        }

        $profile->load('subjects');

        return response()->json([
            'message' => 'Your tutor profile has been updated.',
            'tutor_profile' => [
                'headline' => $profile->headline,
                'bio' => $profile->bio,
                'hourly_rate' => $profile->hourly_rate,
                'experience_years' => $profile->experience_years,
                'is_available' => (bool) $profile->is_available,
                'languages' => $profile->languages ?? [],
                'subjects' => $profile->subjects
                    ->map(fn (Subject $s) => ['id' => $s->id, 'name' => $s->name])
                    ->all(),
            ],
        ]);
    }
}
