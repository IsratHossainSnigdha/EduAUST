<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\GoogleTokenVerifier;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery\MockInterface;
use Tests\TestCase;

class SignInMethodTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(User $user): User
    {
        $this->withToken(app(JwtService::class)->tokensFor($user)['access_token']);

        return $user;
    }

    /**
     * Stand in for Google, returning the claims a real ID token would carry.
     *
     * @param  array<string, mixed>|null  $claims
     */
    private function googleReturns(?array $claims): void
    {
        $this->mock(GoogleTokenVerifier::class, function (MockInterface $mock) use ($claims) {
            $mock->shouldReceive('verify')->andReturn($claims);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function claimsFor(string $email, string $sub = 'google-sub-1'): array
    {
        return [
            'iss' => 'https://accounts.google.com',
            'sub' => $sub,
            'email' => $email,
            'email_verified' => true,
            'name' => 'Ada Lovelace',
        ];
    }

    public function test_the_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/auth/sign-in-methods')->assertUnauthorized();
        $this->postJson('/api/v1/auth/password', [])->assertUnauthorized();
        $this->postJson('/api/v1/auth/google/link', [])->assertUnauthorized();
        $this->deleteJson('/api/v1/auth/google/link')->assertUnauthorized();
    }

    public function test_it_reports_which_methods_are_available(): void
    {
        $user = $this->signIn(User::factory()->create(['password' => Hash::make('Str0ng!Pass')]));

        $this->getJson('/api/v1/auth/sign-in-methods')
            ->assertOk()
            ->assertJsonPath('password.enabled', true)
            ->assertJsonPath('google.enabled', false);
    }

    public function test_a_google_only_account_can_set_a_password(): void
    {
        $user = User::factory()->create(['google_id' => 'google-sub-1']);
        $user->forceFill(['password' => null])->save();
        $this->signIn($user);

        // No current password exists, so none is demanded.
        $this->postJson('/api/v1/auth/password', [
            'password' => 'N3w!Password',
            'password_confirmation' => 'N3w!Password',
        ])->assertOk();

        $this->assertTrue(Hash::check('N3w!Password', $user->fresh()->password));
    }

    public function test_setting_a_password_then_lets_the_account_log_in_with_it(): void
    {
        $user = User::factory()->create(['email' => 'ada@aust.edu', 'google_id' => 'google-sub-1']);
        $user->forceFill(['password' => null])->save();
        $this->signIn($user);

        $this->postJson('/api/v1/auth/password', [
            'password' => 'N3w!Password',
            'password_confirmation' => 'N3w!Password',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'aust_email' => 'ada@aust.edu',
            'password' => 'N3w!Password',
        ])->assertOk()->assertJsonStructure(['access_token']);
    }

    public function test_changing_a_password_requires_the_current_one(): void
    {
        $user = $this->signIn(User::factory()->create(['password' => Hash::make('Str0ng!Pass')]));

        $this->postJson('/api/v1/auth/password', [
            'password' => 'N3w!Password',
            'password_confirmation' => 'N3w!Password',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->postJson('/api/v1/auth/password', [
            'current_password' => 'wrong-one',
            'password' => 'N3w!Password',
            'password_confirmation' => 'N3w!Password',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        // The password is unchanged after both refusals.
        $this->assertTrue(Hash::check('Str0ng!Pass', $user->fresh()->password));
    }

    public function test_a_weak_password_is_rejected(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['password' => null])->save();
        $this->signIn($user);

        $this->postJson('/api/v1/auth/password', [
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_a_password_account_can_link_its_google_account(): void
    {
        $user = $this->signIn(User::factory()->create(['email' => 'ada@aust.edu']));
        $this->googleReturns($this->claimsFor('ada@aust.edu'));

        $this->postJson('/api/v1/auth/google/link', ['id_token' => 'stub'])->assertOk();

        $this->assertSame('google-sub-1', $user->fresh()->google_id);
        $this->assertNotNull($user->fresh()->google_linked_at);
    }

    public function test_a_google_account_belonging_to_someone_else_cannot_be_linked(): void
    {
        $this->signIn(User::factory()->create(['email' => 'ada@aust.edu']));
        $this->googleReturns($this->claimsFor('someone.else@aust.edu'));

        $this->postJson('/api/v1/auth/google/link', ['id_token' => 'stub'])
            ->assertForbidden();
    }

    public function test_a_non_aust_google_account_cannot_be_linked(): void
    {
        $this->signIn(User::factory()->create(['email' => 'ada@aust.edu']));
        $this->googleReturns($this->claimsFor('ada@gmail.com'));

        $this->postJson('/api/v1/auth/google/link', ['id_token' => 'stub'])
            ->assertForbidden();
    }

    public function test_one_google_account_cannot_be_linked_to_two_users(): void
    {
        User::factory()->create(['email' => 'other@aust.edu', 'google_id' => 'google-sub-1']);

        $this->signIn(User::factory()->create(['email' => 'ada@aust.edu']));
        $this->googleReturns($this->claimsFor('ada@aust.edu', 'google-sub-1'));

        $this->postJson('/api/v1/auth/google/link', ['id_token' => 'stub'])
            ->assertStatus(409);
    }

    public function test_google_can_be_unlinked_when_a_password_exists(): void
    {
        $user = $this->signIn(User::factory()->create([
            'google_id' => 'google-sub-1',
            'password' => Hash::make('Str0ng!Pass'),
        ]));

        $this->deleteJson('/api/v1/auth/google/link')->assertOk();

        $this->assertNull($user->fresh()->google_id);
    }

    public function test_unlinking_google_is_refused_when_it_is_the_only_way_in(): void
    {
        $user = User::factory()->create(['google_id' => 'google-sub-1']);
        $user->forceFill(['password' => null])->save();
        $this->signIn($user);

        // Removing it would leave the holder unable to sign in at all.
        $this->deleteJson('/api/v1/auth/google/link')->assertUnprocessable();

        $this->assertSame('google-sub-1', $user->fresh()->google_id);
    }

    public function test_signing_in_with_google_links_an_existing_password_account(): void
    {
        $user = User::factory()->create([
            'email' => 'ada@aust.edu',
            'password' => Hash::make('Str0ng!Pass'),
        ]);

        $this->googleReturns($this->claimsFor('ada@aust.edu', 'google-sub-9'));

        $this->postJson('/api/v1/auth/google', ['id_token' => 'stub'])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);

        // The account now has both ways in, and no duplicate was created.
        $fresh = $user->fresh();
        $this->assertSame('google-sub-9', $fresh->google_id);
        $this->assertTrue($fresh->hasPassword());
        $this->assertSame(1, User::where('email', 'ada@aust.edu')->count());
    }

    public function test_google_sign_in_matches_on_the_google_id_after_an_address_change(): void
    {
        $user = User::factory()->create([
            'email' => 'new.address@aust.edu',
            'google_id' => 'google-sub-7',
        ]);

        // Google still reports the address the account was linked under.
        $this->googleReturns($this->claimsFor('old.address@aust.edu', 'google-sub-7'));

        $this->postJson('/api/v1/auth/google', ['id_token' => 'stub'])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->assertSame(1, User::count());
    }
}
