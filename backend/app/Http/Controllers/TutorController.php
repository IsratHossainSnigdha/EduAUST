<?php

namespace App\Http\Controllers;

use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TutorController extends Controller
{
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

            // Attach selected subjects
            $tutorProfile->subjects()->sync(
                $validated['subjects']
            );

            // Mark user as a tutor
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
}