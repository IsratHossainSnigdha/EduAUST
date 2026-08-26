<?php

namespace App\Http\Controllers;

use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     * Get tutors.
     */
    public function index(Request $request): JsonResponse
    {
        $query = TutorProfile::with([
            'user.department',
            'subjects',
        ]);

        /*
         * Search by tutor name
         */
        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        /*
         * Filter by department
         */
        if ($request->filled('department_id')) {
            $departmentId = $request->input('department_id');

            $query->whereHas('user', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        /*
         * Filter by subject
         */
        if ($request->filled('subject_id')) {
            $subjectId = $request->input('subject_id');

            $query->whereHas('subjects', function ($q) use ($subjectId) {
                $q->where('subjects.id', $subjectId);
            });
        }

        /*
         * Filter by availability
         */
        if ($request->has('is_available')) {
            $query->where(
                'is_available',
                filter_var(
                    $request->input('is_available'),
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
         * Sorting
         */
        switch ($request->input('sort')) {
            case 'students':
                $query->orderByDesc('student_count');
                break;

            case 'experience':
                $query->orderByDesc('experience_years');
                break;

            case 'name':
                $query->join(
                    'users',
                    'tutor_profiles.user_id',
                    '=',
                    'users.id'
                )
                ->orderBy('users.name')
                ->select('tutor_profiles.*');
                break;

            default:
                $query->latest();
                break;
        }

        $perPage = min(
            max($request->integer('per_page', 6), 1),
            50
        );

        $tutors = $query->paginate($perPage);

        return response()->json($tutors);
    }

    /**
     * Get available tutor filters.
     */
    public function filters(): JsonResponse
    {
        $departments = DB::table('departments')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $subjects = DB::table('subjects')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'departments' => $departments,
            'subjects' => $subjects,
        ]);
    }
}