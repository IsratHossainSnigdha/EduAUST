<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterVerifyRequest;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class RegisterVerifyController extends Controller
{
    /**
     * Cache key prefix for pending step-1 registration drafts.
     */
    private const CACHE_PREFIX = 'registration:';

    /**
     * Verify the 6-digit code emailed during step 1.
     *
     * On success the draft is marked as verified so the account-security
     * step is allowed to create the user.
     *
     * @throws ValidationException
     */
    public function verify(RegisterVerifyRequest $request): JsonResponse
    {
        $token = $request->string('registration_token')->value();
        $key = self::CACHE_PREFIX.$token;

        $draft = $this->draftOrFail($key);

        if (! Hash::check($request->string('code')->value(), $draft['code'])) {
            throw ValidationException::withMessages([
                'code' => 'The verification code is incorrect.',
            ]);
        }

        $draft['verified'] = true;
        Cache::put($key, $draft, $this->remainingTtl());

        return response()->json([
            'message' => 'Email verified successfully.',
            'registration_token' => $token,
        ]);
    }

    /**
     * Regenerate and resend the verification code for a pending draft.
     *
     * @throws ValidationException
     */
    public function resend(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'registration_token' => ['required', 'string'],
        ]);

        $key = self::CACHE_PREFIX.$validated['registration_token'];
        $draft = $this->draftOrFail($key);

        $code = (string) random_int(100000, 999999);
        $draft['code'] = Hash::make($code);
        Cache::put($key, $draft, $this->remainingTtl());

        try {
            Notification::route('mail', $draft['email'])
                ->notify(new VerificationCodeNotification($code));
        } catch (\Throwable $e) {
            Log::warning('Failed to resend registration verification code.', [
                'email' => $draft['email'],
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'A new verification code has been sent to your AUST email address.',
        ]);
    }

    /**
     * Fetch the pending draft or fail with a token error.
     *
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    private function draftOrFail(string $key): array
    {
        $draft = Cache::get($key);

        if (! $draft) {
            throw ValidationException::withMessages([
                'registration_token' => 'Your registration session has expired or is invalid. Please start again.',
            ]);
        }

        return $draft;
    }

    /**
     * The TTL (seconds) reused when re-storing a draft so its original
     * expiry window is preserved rather than extended indefinitely.
     */
    private function remainingTtl(): int
    {
        return (int) config('services.aust.registration_ttl');
    }
}
