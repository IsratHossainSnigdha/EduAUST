<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AustEmailParser;
use App\Services\GoogleTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Lets someone who joined through one sign-in method add the other.
 *
 * Whichever way an account was created, the holder should be able to use both
 * a password and their AUST Google account — and never end up with neither.
 */
class SignInMethodController extends Controller
{
    public function __construct(
        private GoogleTokenVerifier $verifier,
        private AustEmailParser $emails,
    ) {}

    /**
     * Which ways this account can currently be signed into.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'password' => [
                'enabled' => $user->hasPassword(),
            ],
            'google' => [
                'enabled' => $user->hasGoogleLinked(),
                'linked_at' => $user->google_linked_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Set a password, or change an existing one.
     *
     * An account created through Google has no password to confirm, so the
     * current one is only demanded when there is one.
     */
    public function setPassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ];

        if ($user->hasPassword()) {
            $rules['current_password'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        if ($user->hasPassword()
            && ! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['That is not your current password.'],
            ]);
        }

        $wasNew = ! $user->hasPassword();

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->json([
            'message' => $wasNew
                ? 'Your password has been set. You can now sign in with your email as well.'
                : 'Your password has been changed.',
        ]);
    }

    /**
     * Link an AUST Google account to the signed-in account.
     */
    public function linkGoogle(Request $request): JsonResponse
    {
        $request->validate(['id_token' => ['required', 'string']]);

        $claims = $this->verifier->verify($request->string('id_token')->value());

        if ($claims === null) {
            return response()->json([
                'message' => 'We could not verify that Google sign-in. Please try again.',
            ], 401);
        }

        $user = $request->user();
        $email = strtolower(trim((string) $claims['email']));
        $googleId = (string) ($claims['sub'] ?? '');

        if (! $this->emails->isInstitutional($email)) {
            return response()->json([
                'message' => 'Please link your AUST institutional Google account.',
            ], 403);
        }

        // Linking someone else's Google account would hand them a second way
        // into this one, so the addresses have to agree.
        if ($email !== strtolower((string) $user->email)) {
            return response()->json([
                'message' => "That Google account (“{$email}”) does not match this account.",
            ], 403);
        }

        // The same Google account must not open two EduAUST accounts.
        $takenBy = User::where('google_id', $googleId)
            ->where('id', '!=', $user->id)
            ->exists();

        if ($takenBy) {
            return response()->json([
                'message' => 'That Google account is already linked to another EduAUST account.',
            ], 409);
        }

        $user->forceFill([
            'google_id' => $googleId,
            'google_linked_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Your Google account is now linked.',
        ]);
    }

    /**
     * Unlink Google, provided another way in remains.
     */
    public function unlinkGoogle(Request $request): JsonResponse
    {
        $user = $request->user();

        // Removing the only way in would lock the holder out of their own
        // account, so a password has to exist first.
        if (! $user->hasPassword()) {
            return response()->json([
                'message' => 'Set a password first, otherwise you would have no way to sign in.',
            ], 422);
        }

        $user->forceFill([
            'google_id' => null,
            'google_linked_at' => null,
        ])->save();

        return response()->json([
            'message' => 'Your Google account has been unlinked.',
        ]);
    }
}
