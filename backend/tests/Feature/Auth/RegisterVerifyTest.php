<?php

namespace Tests\Feature\Auth;

use App\Models\Department;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class RegisterVerifyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Seed a pending step-1 draft holding the hash of $code.
     */
    private function pendingDraft(string $code = '123456'): string
    {
        $department = Department::factory()->create();

        $token = (string) Str::uuid();
        Cache::put('registration:'.$token, [
            'name' => 'Ada Lovelace',
            'student_id' => '20200104123',
            'email' => 'ada@aust.edu',
            'phone' => '+8801712345678',
            'department_id' => $department->id,
            'semester' => '3.1',
            'code' => Hash::make($code),
            'verified' => false,
        ], 1800);

        return $token;
    }

    public function test_correct_code_marks_the_draft_verified(): void
    {
        $token = $this->pendingDraft('654321');

        $response = $this->postJson('/api/v1/auth/register/verify', [
            'registration_token' => $token,
            'code' => '654321',
        ]);

        $response->assertOk()->assertJsonPath('message', 'Email verified successfully.');
        $this->assertTrue(Cache::get('registration:'.$token)['verified']);
    }

    public function test_incorrect_code_is_rejected(): void
    {
        $token = $this->pendingDraft('654321');

        $response = $this->postJson('/api/v1/auth/register/verify', [
            'registration_token' => $token,
            'code' => '000000',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->assertFalse(Cache::get('registration:'.$token)['verified']);
    }

    public function test_code_must_be_six_digits(): void
    {
        $token = $this->pendingDraft();

        $response = $this->postJson('/api/v1/auth/register/verify', [
            'registration_token' => $token,
            'code' => '12ab',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_verify_rejects_an_unknown_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register/verify', [
            'registration_token' => 'nope',
            'code' => '123456',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('registration_token');
    }

    public function test_resend_issues_a_new_code_and_emails_it(): void
    {
        Notification::fake();

        $token = $this->pendingDraft('111111');
        $originalHash = Cache::get('registration:'.$token)['code'];

        $response = $this->postJson('/api/v1/auth/register/resend', [
            'registration_token' => $token,
        ]);

        $response->assertOk();
        // A fresh code replaces the old one.
        $this->assertNotSame($originalHash, Cache::get('registration:'.$token)['code']);

        Notification::assertSentOnDemand(
            VerificationCodeNotification::class,
            fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === 'ada@aust.edu'
        );
    }
}
