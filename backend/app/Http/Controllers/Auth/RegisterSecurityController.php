<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterSecurityRequest;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class RegisterSecurityController extends Controller
{
    /**
     * Cache key prefix for pending step-1 registration drafts.
     */
    private const CACHE_PREFIX = 'registration:';

    /**
     * Handle step 2 of the registration flow: account security.
     *
     * Retrieves the validated draft stored in step 1 using the registration
     * token, sets up the account password, persists the complete user record,
     * and discards the draft.
     *
     * @throws ValidationException
     */
    public function store(RegisterSecurityRequest $request, JwtService $jwt): JsonResponse
    {
        $token = $request->string('registration_token')->value();
        $key = self::CACHE_PREFIX.$token;

        $draft = Cache::get($key);

        if (! $draft) {
            throw ValidationException::withMessages([
                'registration_token' => 'Your registration session has expired or is invalid. Please start again.',
            ]);
        }

        // The email address must be verified (step "verify") before the
        // account can be created.
        if (empty($draft['verified'])) {
            throw ValidationException::withMessages([
                'registration_token' => 'Please verify your email address before setting a password.',
            ]);
        }

        // Guard against a collision created between step 1 and step 2.
        $this->ensureStillUnique($draft);

        $user = User::create([
            'name' => $draft['name'],
            'student_id' => $draft['student_id'],
            'email' => $draft['email'],
            'phone' => $draft['phone'],
            'department_id' => $draft['department_id'],
            'semester' => $draft['semester'] ?? null,
            'password' => Hash::make($request->string('password')->value()),
        ]);

        Cache::forget($key);

        // Auto-login: hand back tokens so the client is signed in immediately.
        return response()->json(array_merge([
            'message' => 'Registration completed successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'student_id' => $user->student_id,
                'email' => $user->email,
                'phone' => $user->phone,
                'department_id' => $user->department_id,
                'semester' => $user->semester,
            ],
        ], $jwt->tokensFor($user)), 201);
    }

    /**
     * Ensure the drafted identifiers were not registered by someone else
     * while step 1 was pending.
     *
     * @param  array<string, mixed>  $draft
     *
     * @throws ValidationException
     */
    private function ensureStillUnique(array $draft): void
    {
        $conflicts = [];

        foreach (['email', 'student_id', 'phone'] as $field) {
            if (User::where($field, $draft[$field])->exists()) {
                $conflicts[$field] = "This {$field} has already been registered.";
            }
        }

        if ($conflicts !== []) {
            throw ValidationException::withMessages($conflicts);
        }
    }
}
