<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_returns_the_user_with_a_valid_access_token(): void
    {
        $user = User::factory()->create();
        $token = app(JwtService::class)->tokensFor($user)['access_token'];

        $response = $this->withToken($token)->getJson('/api/v1/auth/me');

        $response->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_me_is_rejected_without_a_token(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_me_rejects_a_refresh_token(): void
    {
        $user = User::factory()->create();
        $refresh = app(JwtService::class)->tokensFor($user, true)['refresh_token'];

        // A refresh token must not be usable as an access token.
        $this->withToken($refresh)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_refresh_exchanges_a_refresh_token_for_new_tokens(): void
    {
        $user = User::factory()->create();
        $refresh = app(JwtService::class)->tokensFor($user, true)['refresh_token'];

        $response = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $refresh,
        ]);

        $response->assertOk()->assertJsonStructure(['access_token', 'refresh_token', 'expires_in']);

        // The freshly minted access token authenticates /me.
        $this->withToken($response->json('access_token'))
            ->getJson('/api/v1/auth/me')
            ->assertOk();
    }

    public function test_refresh_rejects_an_access_token(): void
    {
        $user = User::factory()->create();
        $access = app(JwtService::class)->tokensFor($user)['access_token'];

        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $access])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('refresh_token');
    }

    public function test_logout_succeeds_for_an_authenticated_user(): void
    {
        $user = User::factory()->create();
        $token = app(JwtService::class)->tokensFor($user)['access_token'];

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
    }
}
