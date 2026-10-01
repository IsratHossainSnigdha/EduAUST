<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Notification;
use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What the settings screen reads and writes.
 *
 * Most of that screen used to be switches and boxes that changed nothing but
 * the page's own state. These are the endpoints that make them real.
 */
class SettingsBackendTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(User $user): User
    {
        $this->withToken(app(JwtService::class)->tokensFor($user)['access_token']);

        return $user;
    }

    private function tutor(array $profile = []): User
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create($profile);

        return $tutor;
    }

    /**
     * A tutor and student who are allowed to message each other, and their
     * thread.
     *
     * @return array{0: User, 1: User, 2: Conversation}
     */
    private function talking(): array
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        return [$tutor, $student, Conversation::factory()->between($student, $tutor)->create()];
    }

    // ------------------------------------------------------------------
    // Notification preferences
    // ------------------------------------------------------------------

    public function test_every_topic_is_on_until_someone_turns_it_off(): void
    {
        $this->signIn(User::factory()->create());

        $this->getJson('/api/v1/notifications/preferences')
            ->assertOk()
            ->assertExactJson(['preferences' => [
                'messages' => true,
                'requests' => true,
                'sessions' => true,
                'system' => true,
            ]]);
    }

    public function test_changing_one_topic_leaves_the_others_alone(): void
    {
        $user = $this->signIn(User::factory()->create());

        $this->patchJson('/api/v1/notifications/preferences', ['messages' => false])
            ->assertOk()
            ->assertJsonPath('preferences.messages', false)
            ->assertJsonPath('preferences.requests', true);

        $this->patchJson('/api/v1/notifications/preferences', ['requests' => false])
            ->assertOk()
            ->assertJsonPath('preferences.messages', false)
            ->assertJsonPath('preferences.requests', false);

        // Only what is switched off is stored.
        $this->assertSame(
            ['messages' => false, 'requests' => false],
            $user->fresh()->notification_preferences
        );

        // Turning everything back on stores nothing at all.
        $this->patchJson('/api/v1/notifications/preferences', ['messages' => true, 'requests' => true]);
        $this->assertNull($user->fresh()->notification_preferences);
    }

    public function test_a_preference_must_be_a_yes_or_no(): void
    {
        $this->signIn(User::factory()->create());

        $this->patchJson('/api/v1/notifications/preferences', ['messages' => 'sometimes'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('messages');
    }

    public function test_switching_off_requests_stops_request_notifications(): void
    {
        $tutor = $this->tutor();
        $tutor->forceFill(['notification_preferences' => ['requests' => false]])->save();

        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => $tutor->id,
            'subject_id' => Subject::factory()->create()->id,
        ])->assertCreated();

        // The request itself still arrives; only the notification is skipped.
        $this->assertDatabaseHas('tuition_requests', ['tutor_id' => $tutor->id]);
        $this->assertDatabaseMissing('notifications', ['user_id' => $tutor->id]);
    }

    public function test_switching_off_messages_stops_message_notifications(): void
    {
        [$tutor, $student, $thread] = $this->talking();
        $tutor->forceFill(['notification_preferences' => ['messages' => false]])->save();

        $this->signIn($student);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Hello'])
            ->assertCreated();

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $tutor->id,
            'category' => Notification::CATEGORY_MESSAGE,
        ]);
    }

    // ------------------------------------------------------------------
    // One notification per conversation
    // ------------------------------------------------------------------

    public function test_a_burst_of_messages_leaves_one_notification_with_the_latest_text(): void
    {
        [$tutor, $student, $thread] = $this->talking();

        $this->signIn($student);

        foreach (['First', 'Second', 'Third'] as $body) {
            $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => $body])
                ->assertCreated();
        }

        $rows = Notification::where('user_id', $tutor->id)
            ->where('category', Notification::CATEGORY_MESSAGE)
            ->get();

        $this->assertCount(1, $rows);
        $this->assertSame('Third', $rows->first()->body);
        $this->assertSame('/messages?with='.$student->id, $rows->first()->link);
    }

    public function test_once_read_the_next_message_is_a_new_notification(): void
    {
        [$tutor, $student, $thread] = $this->talking();

        $this->signIn($student);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'One'])->assertCreated();

        Notification::where('user_id', $tutor->id)->update(['read_at' => now()]);

        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Two'])->assertCreated();

        $this->assertSame(2, Notification::where('user_id', $tutor->id)->count());
        $this->assertSame(1, Notification::where('user_id', $tutor->id)->whereNull('read_at')->count());
    }

    public function test_two_senders_with_the_same_name_are_never_merged(): void
    {
        $tutor = $this->tutor();
        $first = User::factory()->create(['name' => 'Sam Rahman']);
        $second = User::factory()->create(['name' => 'Sam Rahman']);

        foreach ([$first, $second] as $student) {
            TuitionRequest::factory()->accepted()->create(['student_id' => $student->id, 'tutor_id' => $tutor->id]);
            $thread = Conversation::factory()->between($student, $tutor)->create();

            $this->signIn($student);
            $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Hi'])->assertCreated();
        }

        $this->assertSame(2, Notification::where('user_id', $tutor->id)->count());
    }

    // ------------------------------------------------------------------
    // Deleting an account
    // ------------------------------------------------------------------

    public function test_deleting_an_account_needs_the_typed_confirmation(): void
    {
        $user = $this->signIn(User::factory()->create(['password' => 'Str0ng!Pass']));

        $this->deleteJson('/api/v1/auth/account', ['password' => 'Str0ng!Pass'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('confirmation');

        $this->deleteJson('/api/v1/auth/account', ['password' => 'Str0ng!Pass', 'confirmation' => 'delete me'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('confirmation');

        $this->assertModelExists($user);
    }

    public function test_deleting_an_account_with_a_password_needs_that_password(): void
    {
        $user = $this->signIn(User::factory()->create(['password' => 'Str0ng!Pass']));

        $this->deleteJson('/api/v1/auth/account', ['password' => 'Wrong!Pass1', 'confirmation' => 'DELETE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');

        $this->assertModelExists($user);
    }

    public function test_a_google_only_account_confirms_by_typing_alone(): void
    {
        $user = $this->signIn(User::factory()->create(['password' => null, 'google_id' => 'g-123']));

        $this->deleteJson('/api/v1/auth/account', ['confirmation' => 'DELETE'])->assertOk();

        $this->assertModelMissing($user);
    }

    public function test_deleting_an_account_removes_what_belongs_to_it(): void
    {
        [$tutor, $student, $thread] = $this->talking();

        $this->signIn($student);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Hello'])->assertCreated();

        $student->forceFill(['password' => 'Str0ng!Pass'])->save();

        $this->deleteJson('/api/v1/auth/account', ['password' => 'Str0ng!Pass', 'confirmation' => 'DELETE'])
            ->assertOk();

        $this->assertModelMissing($student);
        $this->assertDatabaseMissing('tuition_requests', ['student_id' => $student->id]);
        $this->assertDatabaseMissing('conversations', ['id' => $thread->id]);
        $this->assertDatabaseMissing('messages', ['sender_id' => $student->id]);

        // The other side of it is untouched.
        $this->assertModelExists($tutor);
    }

    public function test_a_tutors_students_taught_figure_follows_a_deleted_student(): void
    {
        [$tutor, $student] = $this->talking();

        TutorProfile::where('user_id', $tutor->id)->update(['student_count' => 1]);

        $student->forceFill(['password' => 'Str0ng!Pass'])->save();
        $this->signIn($student);
        $this->deleteJson('/api/v1/auth/account', ['password' => 'Str0ng!Pass', 'confirmation' => 'DELETE'])
            ->assertOk();

        $this->assertSame(0, $tutor->tutorProfile()->first()->student_count);
    }

    public function test_the_deleted_accounts_token_stops_working(): void
    {
        $user = User::factory()->create(['password' => 'Str0ng!Pass']);
        $token = app(JwtService::class)->tokensFor($user)['access_token'];

        $this->withToken($token)
            ->deleteJson('/api/v1/auth/account', ['password' => 'Str0ng!Pass', 'confirmation' => 'DELETE'])
            ->assertOk();

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    // ------------------------------------------------------------------
    // A tutor's own profile
    // ------------------------------------------------------------------

    public function test_a_tutor_can_read_their_own_editable_profile(): void
    {
        $subject = Subject::factory()->create(['name' => 'Algorithms']);
        $tutor = $this->tutor(['headline' => 'DSA help', 'languages' => ['English']]);
        $tutor->tutorProfile->subjects()->sync([$subject->id]);

        $this->signIn($tutor);

        $this->getJson('/api/v1/tutor/profile')
            ->assertOk()
            ->assertJsonPath('tutor_profile.headline', 'DSA help')
            ->assertJsonPath('tutor_profile.languages', ['English'])
            ->assertJsonPath('tutor_profile.subjects.0.name', 'Algorithms');
    }

    public function test_someone_who_does_not_tutor_has_no_tutor_profile_to_read(): void
    {
        $this->signIn(User::factory()->create());

        $this->getJson('/api/v1/tutor/profile')->assertForbidden();
    }

    public function test_a_tutor_must_keep_at_least_one_subject(): void
    {
        $this->signIn($this->tutor());

        $this->patchJson('/api/v1/tutor/profile', ['subjects' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('subjects');
    }

    public function test_the_same_language_twice_is_kept_once(): void
    {
        $this->signIn($this->tutor());

        $this->patchJson('/api/v1/tutor/profile', ['languages' => ['English', ' english ', 'Bangla', '']])
            ->assertOk()
            ->assertJsonPath('tutor_profile.languages', ['English', 'Bangla']);
    }

    public function test_updating_subjects_returns_the_new_list(): void
    {
        $tutor = $this->tutor();
        $old = Subject::factory()->create(['name' => 'Physics']);
        $new = Subject::factory()->create(['name' => 'Calculus']);
        $tutor->tutorProfile->subjects()->sync([$old->id]);

        $this->signIn($tutor);

        $this->patchJson('/api/v1/tutor/profile', ['subjects' => [$new->id]])
            ->assertOk()
            ->assertJsonCount(1, 'tutor_profile.subjects')
            ->assertJsonPath('tutor_profile.subjects.0.name', 'Calculus');
    }

    public function test_becoming_a_tutor_twice_is_refused_cleanly(): void
    {
        $this->signIn(User::factory()->create());
        $subject = Subject::factory()->create();

        $this->postJson('/api/v1/tutor/account', ['subjects' => [$subject->id]])->assertCreated();
        $this->postJson('/api/v1/tutor/account', ['subjects' => [$subject->id]])->assertStatus(409);
    }

    // ------------------------------------------------------------------
    // Personal profile
    // ------------------------------------------------------------------

    public function test_clearing_the_name_says_a_name_is_needed(): void
    {
        $this->signIn(User::factory()->create());

        $this->patchJson('/api/v1/auth/profile', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name' => 'required']);
    }

    public function test_the_profile_picture_must_be_a_web_address(): void
    {
        $this->signIn(User::factory()->create());

        $this->patchJson('/api/v1/auth/profile', ['profile_picture' => 'not a url'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('profile_picture');

        $this->patchJson('/api/v1/auth/profile', ['profile_picture' => 'javascript:alert(1)'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('profile_picture');

        $this->patchJson('/api/v1/auth/profile', ['profile_picture' => 'https://example.com/me.png'])
            ->assertOk();

        // Clearing it is still allowed.
        $this->patchJson('/api/v1/auth/profile', ['profile_picture' => null])->assertOk();
    }

    public function test_a_tutor_not_accepting_students_cannot_be_sent_a_request(): void
    {
        $tutor = $this->tutor(['is_available' => false]);

        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => $tutor->id,
            'subject_id' => Subject::factory()->create()->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tutor_id');

        $this->assertDatabaseMissing('tuition_requests', ['tutor_id' => $tutor->id]);
    }
}
