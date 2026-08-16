<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SessionController extends Controller
{
    /**
     * Return the currently authenticated user (JWT-protected).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'phone' => $user->phone,
                'department_id' => $user->department_id,
                'semester' => $user->semester,
            ],
        ]);
    }

    /**
     * Exchange a valid refresh token for a fresh set of tokens.
     *
     * @throws ValidationException
     */
    public function refresh(Request $request, JwtService $jwt): JsonResponse
    {
        $data = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $claims = $jwt->decode($data['refresh_token']);

        if (! $claims || ($claims['type'] ?? null) !== 'refresh') {
            throw ValidationException::withMessages([
                'refresh_token' => ['The refresh token is invalid or has expired.'],
            ]);
        }

        $user = User::find($claims['sub'] ?? null);

        if (! $user) {
            throw ValidationException::withMessages([
                'refresh_token' => ['The refresh token is invalid or has expired.'],
            ]);
        }

        // Rotate: issue a new access token and a new refresh token.
        return response()->json($jwt->tokensFor($user, true));
    }

    /**
     * Sign the user out.
     *
     * Tokens are stateless, so logout is handled by the client discarding
     * them; this endpoint acknowledges the action.
     */
    public function logout(): JsonResponse
    {
        return response()->json(['message' => 'Signed out successfully.']);
    }
}
