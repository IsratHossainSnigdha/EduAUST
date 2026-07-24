<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email' => 'ada@aust.edu',
            'student_id' => '20200104123',
            'password' => Hash::make('Str0ng!Pass'),
        ], $overrides));
    }

    public function test_login_with_email_returns_an_access_token(): void
    {
        $user = $this->user();

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'ada@aust.edu',
            'password' => 'Str0ng!Pass',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['access_token', 'expires_in']);

        // A remember token is only issued when requested.
        $response->assertJsonMissing(['refresh_token' => true]);

        // The access token is a valid JWT whose subject is the user.
        $claims = app(JwtService::class)->decode($response->json('access_token'));
        $this->assertSame($user->id, $claims['sub']);
        $this->assertSame('access', $claims['type']);
        $this->assertGreaterThan(time(), $claims['exp']);
    }

    public function test_login_with_student_id_works(): void
    {
        $this->user();

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => '20200104123',
            'password' => 'Str0ng!Pass',
        ]);

        $response->assertOk()->assertJsonStructure(['access_token']);
    }

    public function test_remember_me_issues_a_refresh_token(): void
    {
        $this->user();

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'ada@aust.edu',
            'password' => 'Str0ng!Pass',
            'remember' => true,
        ]);

        $response->assertOk()->assertJsonStructure([
            'access_token', 'refresh_token', 'refresh_expires_in',
        ]);

        $jwt = app(JwtService::class);
        $access = $jwt->decode($response->json('access_token'));
        $refresh = $jwt->decode($response->json('refresh_token'));

        $this->assertSame('refresh', $refresh['type']);
        // The refresh token outlives the access token.
        $this->assertGreaterThan($access['exp'], $refresh['exp']);
    }

    public function test_wrong_password_is_rejected_without_tokens(): void
    {
        $this->user();

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'ada@aust.edu',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('identifier')
            ->assertJsonMissingPath('access_token');
    }

    public function test_unknown_identifier_returns_the_same_generic_error(): void
    {
        $this->user();

        $wrongPassword = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'ada@aust.edu',
            'password' => 'wrong-password',
        ]);

        $unknownUser = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'nobody@aust.edu',
            'password' => 'wrong-password',
        ]);

        // Identical message protects against user enumeration.
        $this->assertSame(
            $wrongPassword->json('errors.identifier'),
            $unknownUser->json('errors.identifier'),
        );
        $unknownUser->assertUnprocessable();
    }

    public function test_identifier_and_password_are_required(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertUnprocessable()->assertJsonValidationErrors(['identifier', 'password']);
    }
}
