<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Closing an account for good.
 *
 * Settings has offered "Delete Account" since it was built, and the button had
 * no handler. Every table that refers to a user cascades on delete, so
 * removing the row removes the account's profile, requests, sessions,
 * conversations, reviews, saved tutors and notifications with it.
 */
class AccountController extends Controller
{
    /**
     * The word typed to confirm, so a stray click cannot delete an account.
     */
    public const CONFIRMATION = 'DELETE';

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'confirmation' => ['required', 'string', 'in:'.self::CONFIRMATION],
        ];

        // An account that has a password proves it is really them. One that
        // joined through Google has none to give, and the typed confirmation
        // on a signed-in session is what stands in for it.
        if ($user->hasPassword()) {
            $rules['password'] = ['required', 'string'];
        }

        $validated = $request->validate($rules, [
            'confirmation.in' => 'Type '.self::CONFIRMATION.' to confirm.',
            'confirmation.required' => 'Type '.self::CONFIRMATION.' to confirm.',
        ]);

        if ($user->hasPassword() && ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['That is not your current password.'],
            ]);
        }

        // Tutors whose "students taught" figure counts this account. Their
        // arrangements with it disappear in the cascade, so the stored figure
        // is brought back in line with what remains.
        $tutorIds = TuitionRequest::query()
            ->where('student_id', $user->id)
            ->pluck('tutor_id')
            ->unique()
            ->reject(fn (string $id) => $id === $user->id);

        DB::transaction(function () use ($user, $tutorIds) {
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            $user->delete();

            foreach ($tutorIds as $tutorId) {
                TutorProfile::query()
                    ->where('user_id', $tutorId)
                    ->update(['student_count' => TuitionRequest::studentsTaught($tutorId)]);
            }
        });

        return response()->json([
            'message' => 'Your account has been deleted.',
        ]);
    }
}
