<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TutorMiddleware
{
    public function handle(
        Request $request,
        Closure $next
    ) {
        $user = $request->user();

        if (!$user || !$user->isTutor) {
            return response()->json([
                'message' => 'Tutor access required.',
            ], 403);
        }

        return $next($request);
    }
}