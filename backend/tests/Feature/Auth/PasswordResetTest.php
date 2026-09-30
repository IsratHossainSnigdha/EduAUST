<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_can_be_requested(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
            ->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function (object $notification) use ($user) {
            $response = $this->postJson('/api/v1/auth/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'N3w!Password',
                'password_confirmation' => 'N3w!Password',
            ]);

            $response->assertOk();

            $this->assertTrue(Hash::check('N3w!Password', $user->fresh()->password));

            return true;
        });
    }

    public function test_reset_fails_with_an_invalid_token(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'N3w!Password',
            'password_confirmation' => 'N3w!Password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_a_reset_is_held_to_the_same_password_rule_as_registration(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function (object $notification) use ($user) {
            // Long enough for Laravel's default rule, but no capital, number
            // or symbol, which registering or changing a password refuses.
            $this->postJson('/api/v1/auth/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'weakpassword',
                'password_confirmation' => 'weakpassword',
            ])
                ->assertStatus(422)
                ->assertJsonValidationErrors('password');

            $this->assertFalse(Hash::check('weakpassword', $user->fresh()->password));

            return true;
        });
    }

    public function test_the_reset_link_points_at_the_frontend_page_with_the_address_encoded(): void
    {
        config(['app.frontend_url' => 'https://eduaust.example/']);

        $user = User::factory()->create(['email' => 'first+tag@aust.edu']);

        $url = (new ResetPassword('TOKEN123'))->toMail($user)->actionUrl;

        // One slash between the base and the path, however the base is
        // written, and a "+" that survives rather than arriving as a space.
        $this->assertSame(
            'https://eduaust.example/password-reset/TOKEN123?email=first%2Btag%40aust.edu',
            $url
        );
    }
}
