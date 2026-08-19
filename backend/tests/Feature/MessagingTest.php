<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(?User $user = null): User
    {
        $user = $user ?: User::factory()->create();

        $this->withToken(app(JwtService::class)->tokensFor($user)['access_token']);

        return $user;
    }

    /**
     * A thread between two users with an optional message from each side.
     */
    private function threadBetween(User $a, User $b): Conversation
    {
        return Conversation::factory()->between($a, $b)->create();
    }

    public function test_messaging_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/conversations')->assertUnauthorized();
        $this->postJson('/api/v1/conversations', [])->assertUnauthorized();
        $this->getJson('/api/v1/conversations/unread-count')->assertUnauthorized();
        $this->getJson('/api/v1/conversations/x/messages')->assertUnauthorized();
        $this->postJson('/api/v1/conversations/x/messages', [])->assertUnauthorized();
        $this->patchJson('/api/v1/conversations/x/read')->assertUnauthorized();
    }

    public function test_starting_a_conversation_creates_it_once_and_then_reuses_it(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create(['name' => 'Fahim Rahman']);

        $first = $this->postJson('/api/v1/conversations', ['user_id' => $other->id])
            ->assertCreated()
            ->assertJsonPath('data.participant.name', 'Fahim Rahman');

        // Opening it again returns the same thread rather than a duplicate.
        $second = $this->postJson('/api/v1/conversations', ['user_id' => $other->id])
            ->assertOk();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Conversation::count());
    }

    public function test_a_conversation_is_the_same_thread_whoever_opens_it(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();

        $mine = $this->postJson('/api/v1/conversations', ['user_id' => $other->id])
            ->assertCreated()->json('data.id');

        // The other participant opening it from their side must land in the
        // same thread, not create a mirrored one.
        $this->actingAsUser($other);
        $theirs = $this->postJson('/api/v1/conversations', ['user_id' => $me->id])
            ->assertOk()->json('data.id');

        $this->assertSame($mine, $theirs);
        $this->assertSame(1, Conversation::count());
    }

    public function test_a_user_cannot_start_a_conversation_with_themselves(): void
    {
        $me = $this->actingAsUser();

        $this->postJson('/api/v1/conversations', ['user_id' => $me->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user_id');
    }

    public function test_starting_a_conversation_with_an_unknown_user_is_rejected(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/v1/conversations', ['user_id' => 'not-a-user'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user_id');
    }

    public function test_the_conversation_list_shows_only_the_users_own_threads(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create(['name' => 'Mine']);
        $this->threadBetween($me, $other);
        // A thread between two other people.
        Conversation::factory()->create();

        $response = $this->getJson('/api/v1/conversations')->assertOk();

        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.participant.name', 'Mine');
    }

    public function test_sending_a_message_stores_it_and_bumps_the_thread(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);

        $this->postJson("/api/v1/conversations/{$thread->id}/messages", [
            'body' => 'Are you free on Wednesday?',
        ])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Are you free on Wednesday?')
            ->assertJsonPath('data.sent_by_me', true);

        $this->assertSame(1, Message::where('conversation_id', $thread->id)->count());
        $this->assertNotNull($thread->fresh()->last_message_at);
    }

    public function test_an_empty_or_whitespace_message_is_rejected(): void
    {
        $me = $this->actingAsUser();
        $thread = $this->threadBetween($me, User::factory()->create());

        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => '   '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => str_repeat('a', 2001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->assertSame(0, Message::count());
    }

    public function test_a_stranger_cannot_read_or_post_to_a_thread(): void
    {
        $thread = Conversation::factory()->create();
        $this->actingAsUser();

        // Indistinguishable from a thread that does not exist.
        $this->getJson("/api/v1/conversations/{$thread->id}/messages")->assertNotFound();
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'hello'])->assertNotFound();
        $this->patchJson("/api/v1/conversations/{$thread->id}/read")->assertNotFound();

        $this->assertSame(0, Message::count());
    }

    public function test_messages_are_returned_oldest_first_and_flagged_per_viewer(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);

        Message::factory()->for($thread)->from($other)->create(['body' => 'first']);
        Message::factory()->for($thread)->from($me)->create(['body' => 'second']);

        $response = $this->getJson("/api/v1/conversations/{$thread->id}/messages")->assertOk();

        $this->assertSame(['first', 'second'], array_column($response->json('data'), 'body'));
        $this->assertFalse($response->json('data.0.sent_by_me'));
        $this->assertTrue($response->json('data.1.sent_by_me'));
    }

    public function test_the_same_thread_is_mirrored_for_the_other_participant(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);
        Message::factory()->for($thread)->from($me)->create(['body' => 'hello']);

        // What one side sends, the other receives.
        $this->actingAsUser($other);
        $response = $this->getJson("/api/v1/conversations/{$thread->id}/messages")->assertOk();

        $this->assertSame('hello', $response->json('data.0.body'));
        $this->assertFalse($response->json('data.0.sent_by_me'));
    }

    public function test_unread_counts_ignore_the_users_own_messages(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);

        Message::factory()->for($thread)->from($other)->count(3)->create();
        Message::factory()->for($thread)->from($me)->count(2)->create();

        $this->getJson('/api/v1/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.unread_count', 3)
            ->assertJsonPath('unread_total', 3);

        $this->getJson('/api/v1/conversations/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_total', 3);
    }

    public function test_opening_a_thread_marks_it_read(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);
        Message::factory()->for($thread)->from($other)->count(2)->create();

        $this->getJson("/api/v1/conversations/{$thread->id}/messages")->assertOk();

        $this->getJson('/api/v1/conversations/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_total', 0);
    }

    public function test_a_thread_can_be_marked_read_explicitly(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);
        Message::factory()->for($thread)->from($other)->count(2)->create();

        $this->patchJson("/api/v1/conversations/{$thread->id}/read")
            ->assertOk()
            ->assertJsonPath('marked_count', 2)
            ->assertJsonPath('unread_total', 0);
    }

    public function test_marking_one_thread_read_leaves_others_unread(): void
    {
        $me = $this->actingAsUser();
        $a = User::factory()->create();
        $b = User::factory()->create();
        $first = $this->threadBetween($me, $a);
        $second = $this->threadBetween($me, $b);

        Message::factory()->for($first)->from($a)->create();
        Message::factory()->for($second)->from($b)->count(2)->create();

        $this->patchJson("/api/v1/conversations/{$first->id}/read")->assertOk();

        $this->getJson('/api/v1/conversations/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_total', 2);
    }

    public function test_conversations_are_ordered_by_most_recent_activity(): void
    {
        $me = $this->actingAsUser();
        $older = $this->threadBetween($me, User::factory()->create(['name' => 'Older']));
        $newer = $this->threadBetween($me, User::factory()->create(['name' => 'Newer']));

        $older->forceFill(['last_message_at' => now()->subDay()])->save();
        $newer->forceFill(['last_message_at' => now()])->save();

        $response = $this->getJson('/api/v1/conversations')->assertOk();

        $this->assertSame(
            ['Newer', 'Older'],
            array_column(array_column($response->json('data'), 'participant'), 'name')
        );
    }

    public function test_threads_without_messages_sort_after_active_ones(): void
    {
        $me = $this->actingAsUser();
        $active = $this->threadBetween($me, User::factory()->create(['name' => 'Active']));
        $this->threadBetween($me, User::factory()->create(['name' => 'Empty']));

        $active->forceFill(['last_message_at' => now()->subHour()])->save();

        $response = $this->getJson('/api/v1/conversations')->assertOk();

        $this->assertSame(
            ['Active', 'Empty'],
            array_column(array_column($response->json('data'), 'participant'), 'name')
        );
    }

    public function test_deleting_a_user_removes_their_conversations_and_messages(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $thread = $this->threadBetween($me, $other);
        Message::factory()->for($thread)->from($other)->create();

        $other->delete();

        $this->assertSame(0, Conversation::count());
        $this->assertSame(0, Message::count());
    }

    /**
     * Tutoring is something an account has, not something it is: the same
     * person tutors one subject and takes lessons in another. Messaging must
     * therefore never consult a role, in either direction.
     */
    public function test_any_two_accounts_can_converse_regardless_of_tutoring_status(): void
    {
        $plainStudent = User::factory()->create(['name' => 'Plain Student']);
        $alsoATutor = User::factory()->create(['name' => 'Student Who Tutors']);
        TutorProfile::factory()->for($alsoATutor)->create();

        // The account that also tutors opens the thread and writes first.
        $this->actingAsUser($alsoATutor);
        $threadId = $this->postJson('/api/v1/conversations', ['user_id' => $plainStudent->id])
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/conversations/{$threadId}/messages", ['body' => 'Free for a session?'])
            ->assertCreated();

        // The plain student sees the same thread and can answer in it.
        $this->actingAsUser($plainStudent);
        $this->getJson('/api/v1/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.id', $threadId)
            ->assertJsonPath('data.0.participant.name', 'Student Who Tutors')
            ->assertJsonPath('data.0.unread_count', 1);

        $this->postJson("/api/v1/conversations/{$threadId}/messages", ['body' => 'Yes, tomorrow works.'])
            ->assertCreated();

        // And the reverse direction resolves to that one thread, not a second.
        $this->actingAsUser($alsoATutor);
        $this->postJson('/api/v1/conversations', ['user_id' => $plainStudent->id])
            ->assertOk()
            ->assertJsonPath('data.id', $threadId);

        $this->assertSame(1, Conversation::count());
        $this->assertSame(2, Message::count());
    }

    public function test_two_tutoring_accounts_can_message_each_other(): void
    {
        $tutorA = User::factory()->create(['name' => 'Tutor A']);
        $tutorB = User::factory()->create(['name' => 'Tutor B']);
        TutorProfile::factory()->for($tutorA)->create();
        TutorProfile::factory()->for($tutorB)->create();

        $this->actingAsUser($tutorA);
        $threadId = $this->postJson('/api/v1/conversations', ['user_id' => $tutorB->id])
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/conversations/{$threadId}/messages", ['body' => 'Covering my 4pm?'])
            ->assertCreated();

        $this->actingAsUser($tutorB);
        $this->getJson("/api/v1/conversations/{$threadId}/messages")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Covering my 4pm?')
            ->assertJsonPath('data.0.sent_by_me', false);
    }
}
