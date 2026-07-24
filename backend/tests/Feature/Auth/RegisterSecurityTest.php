<?php

namespace Tests\Feature\Auth;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegisterSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Seed a pending step-1 draft in the cache and return its token.
     *
     * @param  array<string, mixed>  $overrides
     */
    private function pendingDraft(array $overrides = []): string
    {
        $department = Department::factory()->create();

        $draft = array_merge([
            'name' => 'Ada Lovelace',
            'student_id' => '20200104123',
            'email' => 'ada@aust.edu',
            'phone' => '+8801712345678',
            'department_id' => $department->id,
            'semester' => '3.1',
            'code' => Hash::make('123456'),
            'verified' => true,
        ], $overrides);

        $token = (string) Str::uuid();
        Cache::put('registration:'.$token, $draft, 1800);

        return $token;
    }

    public function test_it_persists_the_user_and_returns_201(): void
    {
        $token = $this->pendingDraft();

        $response = $this->postJson('/api/v1/auth/register/security', [
            'registration_token' => $token,
            'password' => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Registration completed successfully.')
            ->assertJsonPath('user.email', 'ada@aust.edu')
            // Auto-login: the completed registration returns an access token.
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in']);

        $this->assertDatabaseHas('users', [
            'email' => 'ada@aust.edu',
            'student_id' => '20200104123',
            'phone' => '+8801712345678',
        ]);

        $user = User::where('email', 'ada@aust.edu')->first();
        $this->assertTrue(Hash::check('Str0ng!Pass', $user->password));

        // The draft is consumed once the account is created.
        $this->assertNull(Cache::get('registration:'.$token));
    }

    public function test_it_rejects_an_unverified_draft(): void
    {
        $token = $this->pendingDraft(['verified' => false]);

        $response = $this->postJson('/api/v1/auth/register/security', [
            'registration_token' => $token,
            'password' => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('registration_token');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_it_rejects_an_invalid_or_expired_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register/security', [
            'registration_token' => 'does-not-exist',
            'password' => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('registration_token');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_password_confirmation_must_match(): void
    {
        $token = $this->pendingDraft();

        $response = $this->postJson('/api/v1/auth/register/security', [
            'registration_token' => $token,
            'password' => 'Str0ng!Pass',
            'password_confirmation' => 'Different!1',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 0);
    }

    #[DataProvider('weakPasswords')]
    public function test_it_enforces_strong_password_complexity(string $password): void
    {
        $token = $this->pendingDraft();

        $response = $this->postJson('/api/v1/auth/register/security', [
            'registration_token' => $token,
            'password' => $password,
            'password_confirmation' => $password,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 0);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function weakPasswords(): array
    {
        return [
            'too short' => ['Ab1!c'],
            'no uppercase' => ['str0ng!pass'],
            'no lowercase' => ['STR0NG!PASS'],
            'no number' => ['Strong!Pass'],
            'no symbol' => ['Str0ngPass1'],
        ];
    }

    public function test_it_rejects_when_email_taken_between_steps(): void
    {
        $token = $this->pendingDraft();

        // Someone else registers the same email while step 1 was pending.
        User::factory()->create(['email' => 'ada@aust.edu']);

        $response = $this->postJson('/api/v1/auth/register/security', [
            'registration_token' => $token,
            'password' => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }
}
