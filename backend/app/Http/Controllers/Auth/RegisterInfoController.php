<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterInfoRequest;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class RegisterInfoController extends Controller
{
    /**
     * Cache key prefix for pending step-1 registration drafts.
     */
    private const CACHE_PREFIX = 'registration:';

    /**
     * Handle step 1 of the registration flow.
     *
     * Validates the applicant's personal and academic details, stores the
     * validated draft in the cache pending step 2, and emails a verification
     * code to the AUST institutional address.
     */
    public function store(RegisterInfoRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $code = (string) random_int(100000, 999999);
        $token = (string) Str::uuid();
        $ttl = (int) config('services.aust.registration_ttl');

        Cache::put(self::CACHE_PREFIX.$token, [
            'name' => $validated['name'],
            'student_id' => $validated['student_id'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'department_id' => $validated['department_id'],
            'semester' => $validated['semester'],
            'code' => Hash::make($code),
            'verified' => false,
        ], $ttl);

        // Without a delivered code the draft is unusable, so a failed send has
        // to surface as an error rather than a success the applicant cannot
        // act on.
        if (! $this->sendCode($validated['email'], $code)) {
            Cache::forget(self::CACHE_PREFIX.$token);

            return response()->json([
                'message' => 'We could not send your verification code right now. Please try again in a moment.',
            ], 502);
        }

        return response()->json([
            'message' => 'A verification code has been sent to your AUST email address.',
            'registration_token' => $token,
            'expires_in' => $ttl,
        ], 201);
    }

    /**
     * Email the verification code, reporting whether it was accepted by the
     * mail transport. The underlying error is logged rather than returned so
     * that transport details are never exposed to the client.
     */
    private function sendCode(string $email, string $code): bool
    {
        try {
            Notification::route('mail', $email)
                ->notify(new VerificationCodeNotification($code));

            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to send registration verification code.', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
