<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ApiLoginRequest;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * A constant, valid bcrypt hash checked against when no user is found so
     * that response timing does not reveal whether an account exists
     * (mitigates user enumeration).
     */
    private const DUMMY_HASH = '$2y$12$zXhd/8oAUkWPbHwd1KLzS.5wxyRW6yN12HVT1Uq1Rr4jnIBFToMZK';

    /**
     * Authenticate a user and issue JWT access (and optional refresh) tokens.
     *
     * @throws ValidationException
     */
    public function store(ApiLoginRequest $request, JwtService $jwt): JsonResponse
    {
        $identifier = $request->string('identifier')->trim()->value();

        // A single field accepts either the AUST email or the student ID.
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'student_id';
        $user = User::where($field, $identifier)->first();

        // Secure, constant-time-ish password comparison. When the account does
        // not exist we still perform a hash check to keep timing uniform.
        $password = $request->string('password')->value();
        $passwordValid = $user
            ? Hash::check($password, $user->password)
            : Hash::check($password, self::DUMMY_HASH);

        if (! $user || ! $passwordValid) {
            // Identical, generic error regardless of which part failed.
            throw ValidationException::withMessages([
                'identifier' => ['These credentials do not match our records.'],
            ]);
        }

        return response()->json(array_merge([
            'message' => 'Signed in successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'department_id' => $user->department_id,
            ],
        ], $jwt->tokensFor($user, $request->boolean('remember'))));
    }
}
