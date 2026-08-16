<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureJwtAuthenticated
{
    public function __construct(private JwtService $jwt) {}

    /**
     * Authenticate the request using a Bearer JWT access token.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $claims = $token ? $this->jwt->decode($token) : null;

        if (! $claims || ($claims['type'] ?? null) !== 'access') {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = User::find($claims['sub'] ?? null);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // A token alone is not enough: an account that has since become
        // ineligible (e.g. its email verification was revoked) must not reach
        // authenticated features while its access token is still within TTL.
        if (! $user->canSignIn()) {
            return response()->json([
                'message' => 'Your account is not yet eligible to sign in.',
            ], 403);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
