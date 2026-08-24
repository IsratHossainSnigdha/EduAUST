<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteProfileRequest;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * Fill in the details a Google sign-in cannot supply.
     */
    public function update(CompleteProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->fill($request->validated())->save();

        return response()->json([
            'message' => 'Your profile has been updated.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'phone' => $user->phone,
                'department_id' => $user->department_id,
                'semester' => $user->semester,
            ],
            'profile_complete' => filled($user->student_id)
                && filled($user->phone)
                && filled($user->department_id)
                && filled($user->semester),
        ]);
    }
}
