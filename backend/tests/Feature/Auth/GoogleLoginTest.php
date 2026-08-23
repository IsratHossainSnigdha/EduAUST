<?php

namespace Tests\Feature\Auth;

use App\Models\Department;
use App\Models\User;
use App\Services\GoogleTokenVerifier;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery\MockInterface;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_a_new_aust_account_is_created_and_signed_in(): void
    {
        $department = Department::factory()->create(['code' => 'CSE', 'name' => 'Computer Science and Engineering']);

        $this->googleReturns([
            'iss' => 'https://accounts.google.com',
            'email' => 'shaikh.cse.20230204005@aust.edu',
            'email_verified' => true,
            'name' => 'Shaikh Tashrik Halim',
        ]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'stub']);

        $response->assertCreated()
            ->assertJsonPath('is_new_user', true)
            ->assertJsonPath('profile_complete', false)
            ->assertJsonPath('user.name', 'Shaikh Tashrik Halim')
            // The student ID and department are recovered from the address.
            ->assertJsonPath('user.student_id', '20230204005')
            ->assertJsonPath('user.department_id', $department->id)
            ->assertJsonStructure(['access_token', 'expires_in']);

        $user = User::where('email', 'shaikh.cse.20230204005@aust.edu')->firstOrFail();
        // Google has already confirmed the address, so no emailed code is needed.
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->password);
    }

    public function test_an_existing_user_signs_in_without_being_recreated(): void
    {
        $user = User::factory()->create(['email' => 'ada@aust.edu']);

        $this->googleReturns([
            'iss' => 'https://accounts.google.com',
            'email' => 'ada@aust.edu',
            'email_verified' => true,
            'name' => 'Ada Lovelace',
        ]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'stub']);

        $response->assertOk()
            ->assertJsonPath('is_new_user', false)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('profile_complete', true);

        $this->assertSame(1, User::where('email', 'ada@aust.edu')->count());
    }

    public function test_non_aust_google_accounts_are_rejected(): void
    {
        $this->googleReturns([
            'iss' => 'https://accounts.google.com',
            'email' => 'someone@gmail.com',
            'email_verified' => true,
            'name' => 'Some One',
        ]);

        $this->postJson('/api/v1/auth/google', ['id_token' => 'stub'])
            ->assertForbidden()
            ->assertJsonMissingPath('access_token');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_an_unverifiable_token_is_rejected(): void
    {
        $this->googleReturns(null);

        $this->postJson('/api/v1/auth/google', ['id_token' => 'forged'])
            ->assertUnauthorized()
            ->assertJsonMissingPath('access_token');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_the_id_token_is_required(): void
    {
        $this->postJson('/api/v1/auth/google', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('id_token');
    }

    public function test_remember_me_issues_a_refresh_token(): void
    {
        User::factory()->create(['email' => 'ada@aust.edu']);

        $this->googleReturns([
            'iss' => 'https://accounts.google.com',
            'email' => 'ada@aust.edu',
            'email_verified' => true,
            'name' => 'Ada Lovelace',
        ]);

        $this->postJson('/api/v1/auth/google', ['id_token' => 'stub', 'remember_me' => true])
            ->assertOk()
            ->assertJsonStructure(['access_token', 'refresh_token', 'refresh_expires_in']);
    }

    public function test_an_unknown_department_code_still_creates_the_account(): void
    {
        // No department rows exist, so the code in the address matches nothing.
        $this->googleReturns([
            'iss' => 'https://accounts.google.com',
            'email' => 'nabil.zzz.20230209999@aust.edu',
            'email_verified' => true,
            'name' => 'Nabil',
        ]);

        $this->postJson('/api/v1/auth/google', ['id_token' => 'stub'])
            ->assertCreated()
            ->assertJsonPath('user.student_id', '20230209999')
            ->assertJsonPath('user.department_id', null);
    }

    public function test_a_student_id_already_taken_is_not_duplicated(): void
    {
        User::factory()->create(['student_id' => '20230204005', 'email' => 'other@aust.edu']);

        $this->googleReturns([
            'iss' => 'https://accounts.google.com',
            'email' => 'shaikh.cse.20230204005@aust.edu',
            'email_verified' => true,
            'name' => 'Shaikh',
        ]);

        // The account is still created, just without the conflicting ID.
        $this->postJson('/api/v1/auth/google', ['id_token' => 'stub'])
            ->assertCreated()
            ->assertJsonPath('user.student_id', null);
    }

    public function test_a_google_only_account_cannot_sign_in_with_a_password(): void
    {
        $user = User::factory()->create(['email' => 'ada@aust.edu']);
        $user->forceFill(['password' => null])->save();

        $this->postJson('/api/v1/auth/login', [
            'aust_email' => 'ada@aust.edu',
            'password' => 'anything-at-all',
        ])->assertUnprocessable()->assertJsonMissingPath('access_token');
    }

    public function test_the_profile_can_be_completed_afterwards(): void
    {
        $department = Department::factory()->create(['code' => 'CSE']);
        $user = User::factory()->create(['phone' => null, 'semester' => null]);
        $token = app(JwtService::class)->tokensFor($user)['access_token'];

        $this->withToken($token)->patchJson('/api/v1/auth/profile', [
            'phone' => '01711111111',
            'semester' => '3.1',
            'department_id' => $department->id,
        ])->assertOk()->assertJsonPath('profile_complete', true);

        $user->refresh();
        $this->assertSame('01711111111', $user->phone);
        $this->assertSame('3.1', $user->semester);
    }

    public function test_completing_a_profile_cannot_steal_another_students_phone(): void
    {
        User::factory()->create(['phone' => '01722222222']);
        $user = User::factory()->create(['phone' => null]);
        $token = app(JwtService::class)->tokensFor($user)['access_token'];

        $this->withToken($token)->patchJson('/api/v1/auth/profile', [
            'phone' => '01722222222',
        ])->assertUnprocessable()->assertJsonValidationErrors('phone');
    }

    public function test_the_profile_endpoint_requires_authentication(): void
    {
        $this->patchJson('/api/v1/auth/profile', ['semester' => '3.1'])
            ->assertUnauthorized();
    }

    public function test_password_accounts_are_unaffected(): void
    {
        User::factory()->create([
            'email' => 'ada@aust.edu',
            'password' => Hash::make('Str0ng!Pass'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'aust_email' => 'ada@aust.edu',
            'password' => 'Str0ng!Pass',
        ])->assertOk()->assertJsonStructure(['access_token']);
    }
}
