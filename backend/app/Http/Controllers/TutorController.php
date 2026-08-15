<?php

namespace App\Http\Controllers;

use App\Http\Requests\TutorIndexRequest;
use App\Models\Department;
use App\Models\Subject;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TutorController extends Controller
{
    /**
     * List tutors for the Find Tutor page.
     *
     * Supports free-text search over tutor name and subject, filtering by
     * subject, department, language, experience and students taught, plus
     * sorting and pagination.
     */
    public function index(TutorIndexRequest $request): JsonResponse
    {
        $query = TutorProfile::query()
            ->listable()
            // Everything the payload reads is loaded up front so the listing
            // stays at a fixed number of queries regardless of page size.
            ->with([
                'user:id,name,department_id,profile_picture',
                'user.department:id,name,code',
                'subjects:id,name,slug',
            ]);

        // A tutor should never be shown their own card.
        $query->where('user_id', '!=', $request->user()->id);

        if ($search = $request->search()) {
            $query->search($search);
        }

        if ($subjectId = $request->subjectId()) {
            $query->teaching($subjectId);
        }

        if ($departmentId = $request->departmentId()) {
            $query->inDepartment($departmentId);
        }

        if ($language = $request->language()) {
            $query->speaking($language);
        }

        if (! is_null($minExperience = $request->minExperience())) {
            $query->where('experience_years', '>=', $minExperience);
        }

        if (! is_null($minStudents = $request->minStudents())) {
            $query->where('student_count', '>=', $minStudents);
        }

        $tutors = $query->sorted($request->sort())
            ->paginate($request->perPage())
            ->withQueryString();

        return response()->json([
            'data' => collect($tutors->items())->map(fn (TutorProfile $tutor) => $this->present($tutor)),
            'meta' => [
                'current_page' => $tutors->currentPage(),
                'last_page' => $tutors->lastPage(),
                'per_page' => $tutors->perPage(),
                'total' => $tutors->total(),
            ],
        ]);
    }

    /**
     * The options the Find Tutor filter panel is built from.
     *
     * Languages come from the tutors that actually exist, so the filter can
     * never offer a choice that returns nothing.
     */
    public function filters(Request $request): JsonResponse
    {
        $languages = TutorProfile::query()
            ->listable()
            ->pluck('languages')
            ->flatten()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'subjects' => Subject::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name', 'code']),
            'languages' => $languages,
            'sorts' => TutorProfile::SORTS,
        ]);
    }

    /**
     * The API shape of a single tutor card.
     *
     * @return array<string, mixed>
     */
    private function present(TutorProfile $tutor): array
    {
        return [
            'id' => $tutor->id,
            'name' => $tutor->user->name,
            'avatar' => $tutor->user->profile_picture,
            'department' => $tutor->user->department?->name,
            'department_id' => $tutor->user->department_id,
            'headline' => $tutor->headline,
            'bio' => $tutor->bio,
            'hourly_rate' => $tutor->hourly_rate,
            'experience_years' => $tutor->experience_years,
            'student_count' => $tutor->student_count,
            'languages' => $tutor->languages,
            'subjects' => $tutor->subjects->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'slug' => $subject->slug,
            ]),
        ];
    }
}
