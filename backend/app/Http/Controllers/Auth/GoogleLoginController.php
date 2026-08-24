<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Models\User;
use App\Services\AustEmailParser;
use App\Services\GoogleTokenVerifier;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;

class GoogleLoginController extends Controller
{
    public function __construct(
        private GoogleTokenVerifier $verifier,
        private AustEmailParser $emails,
    ) {}

    /**
     * Sign in with an AUST Google account, registering the holder on their
     * first visit.
     */
    public function store(GoogleLoginRequest $request, JwtService $jwt): JsonResponse
    {
        $claims = $this->verifier->verify($request->string('id_token')->value());

        if ($claims === null) {
            return response()->json([
                'message' => 'We could not verify that Google sign-in. Please try again.',
            ], 401);
        }

        $email = strtolower(trim((string) $claims['email']));

        // Only institutional accounts may use the platform. Naming the address
        // that was tried makes it obvious when a personal account was picked
        // by mistake.
        if (! $this->emails->isInstitutional($email)) {
            return response()->json([
                'message' => "“{$email}” is not an AUST account. Please choose your @"
                    .config('services.aust.email_domain').' address instead.',
            ], 403);
        }

        $existing = User::where('email', $email)->first();
        $user = $existing ?? $this->register($email, (string) ($claims['name'] ?? ''));

        // Google has confirmed the address, which is what account verification
        // means here — so a Google sign-up needs no emailed code.
        if (! $user->hasVerifiedEmail()) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return response()->json(array_merge([
            'message' => 'Signed in successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'department_id' => $user->department_id,
                'semester' => $user->semester,
                'isTutor' => (bool) $user->isTutor,
            ],
            // Tells the client whether to route the user straight into the app
            // or through the short form that collects what Google cannot give.
            'profile_complete' => $this->isProfileComplete($user),
            'is_new_user' => $existing === null,
        ], $jwt->tokensFor($user, $request->wantsRemember())), $existing === null ? 201 : 200);
    }

    /**
     * Create an account from an AUST address, recovering the student ID and
     * department that the address itself encodes.
     */
    private function register(string $email, string $name): User
    {
        $parsed = $this->emails->parse($email);
        $department = $this->emails->department($email);

        // A student ID already belonging to someone else must never be
        // attached to a second account.
        $studentId = $parsed['student_id'];

        if ($studentId !== null && User::where('student_id', $studentId)->exists()) {
            $studentId = null;
        }

        return User::create([
            'name' => $name !== '' ? $name : $this->nameFromEmail($email),
            'email' => $email,
            'student_id' => $studentId,
            'department_id' => $department?->id,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * A readable fallback name for the rare account Google gives us none for.
     */
    private function nameFromEmail(string $email): string
    {
        $first = explode('.', explode('@', $email)[0])[0] ?? 'Student';

        return ucfirst($first);
    }

    /**
     * Whether the account holds everything the platform needs from a student.
     */
    private function isProfileComplete(User $user): bool
    {
        return filled($user->student_id)
            && filled($user->phone)
            && filled($user->department_id)
            && filled($user->semester);
    }
}
