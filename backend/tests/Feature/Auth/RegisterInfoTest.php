<?php

namespace Tests\Feature\Auth;

use App\Models\Department;
use App\Models\User;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegisterInfoTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        $department = Department::factory()->create();

        return array_merge([
            'name' => 'Ada Lovelace',
            'student_id' => '20200104123',
            'email' => 'ada@aust.edu',
            'phone' => '+8801712345678',
            'department_id' => $department->id,
            'semester' => '3.1',
        ], $overrides);
    }

    public function test_valid_details_store_a_draft_and_send_a_code(): void
    {
        Notification::fake();

        $payload = $this->validPayload();

        $response = $this->postJson('/api/v1/auth/register/info', $payload);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'registration_token', 'expires_in']);

        $token = $response->json('registration_token');
        $draft = Cache::get('registration:'.$token);

        $this->assertNotNull($draft);
        $this->assertSame($payload['email'], $draft['email']);
        $this->assertFalse($draft['verified']);
        // The verification code is stored hashed, never in plaintext.
        $this->assertDoesNotMatchRegularExpression('/^\d{6}$/', $draft['code']);

        Notification::assertSentOnDemand(
            VerificationCodeNotification::class,
            fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === $payload['email']
        );
    }

    public function test_email_must_belong_to_the_aust_domain(): void
    {
        $response = $this->postJson('/api/v1/auth/register/info', $this->validPayload([
            'email' => 'ada@gmail.com',
        ]));

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_email_must_be_unique(): void
    {
        User::factory()->create(['email' => 'ada@aust.edu']);

        $response = $this->postJson('/api/v1/auth/register/info', $this->validPayload([
            'email' => 'ada@aust.edu',
        ]));

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_student_id_must_be_unique(): void
    {
        User::factory()->create(['student_id' => '20200104123']);

        $response = $this->postJson('/api/v1/auth/register/info', $this->validPayload([
            'student_id' => '20200104123',
        ]));

        $response->assertUnprocessable()->assertJsonValidationErrors('student_id');
    }

    public function test_phone_must_be_unique(): void
    {
        User::factory()->create(['phone' => '+8801712345678']);

        $response = $this->postJson('/api/v1/auth/register/info', $this->validPayload([
            'phone' => '+8801712345678',
        ]));

        $response->assertUnprocessable()->assertJsonValidationErrors('phone');
    }

    public function test_department_must_exist(): void
    {
        $response = $this->postJson('/api/v1/auth/register/info', $this->validPayload([
            'department_id' => 99999,
        ]));

        $response->assertUnprocessable()->assertJsonValidationErrors('department_id');
    }

    public function test_required_fields_are_validated(): void
    {
        $response = $this->postJson('/api/v1/auth/register/info', []);

        $response->assertUnprocessable()->assertJsonValidationErrors([
            'name', 'student_id', 'email', 'phone', 'department_id', 'semester',
        ]);
    }
}
