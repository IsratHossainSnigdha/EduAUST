<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\TuitionRequest;
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
     * An accepted tuition request, which is what entitles two people to talk.
     */
    private function introduce(User $student, User $tutor): void
    {
        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);
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
        $this->introduce($me, $other);

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
        $this->introduce($me, $other);

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
        // Sending needs a live arrangement behind the thread, which is what
        // every real conversation has.
        $this->introduce($me, $other);
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
    /*
     * Messaging is unlocked by an accepted request rather than by a role: the
     * same person tutors one subject and takes lessons in another, so what
     * matters is that one of them agreed to teach the other.
     */
    public function test_a_conversation_cannot_be_opened_without_an_accepted_request(): void
    {
        $student = $this->actingAsUser();
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();

        $this->postJson('/api/v1/conversations', ['user_id' => $tutor->id])
            ->assertForbidden();

        $this->assertSame(0, Conversation::count());
    }

    public function test_a_pending_request_does_not_unlock_messaging(): void
    {
        $student = $this->actingAsUser();
        $tutor = User::factory()->create(['isTutor' => true]);

        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->postJson('/api/v1/conversations', ['user_id' => $tutor->id])
            ->assertForbidden();
    }

    public function test_a_declined_request_does_not_unlock_messaging(): void
    {
        $student = $this->actingAsUser();
        $tutor = User::factory()->create(['isTutor' => true]);

        TuitionRequest::factory()->declined()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->postJson('/api/v1/conversations', ['user_id' => $tutor->id])
            ->assertForbidden();
    }

    public function test_an_accepted_request_lets_either_side_open_the_thread(): void
    {
        $student = $this->actingAsUser();
        $tutor = User::factory()->create(['isTutor' => true]);
        $this->introduce($student, $tutor);

        $this->postJson('/api/v1/conversations', ['user_id' => $tutor->id])
            ->assertCreated();

        // The tutor may open the same thread from their side.
        $this->actingAsUser($tutor);
        $this->postJson('/api/v1/conversations', ['user_id' => $student->id])
            ->assertOk();

        $this->assertSame(1, Conversation::count());
    }

    public function test_two_tutoring_accounts_can_message_each_other(): void
    {
        $tutorA = User::factory()->create(['name' => 'Tutor A']);
        $tutorB = User::factory()->create(['name' => 'Tutor B']);
        TutorProfile::factory()->for($tutorA)->create();
        TutorProfile::factory()->for($tutorB)->create();
        $this->introduce($tutorA, $tutorB);

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

    /*
     * Ordering in the chat list. The people a tutor has agreed to work with
     * belong at the top; the ones still waiting on an answer come next, so
     * they are not buried under everyone else.
     */

    public function test_a_students_chat_list_puts_accepted_tutors_first(): void
    {
        $student = User::factory()->create();

        $accepted = User::factory()->create(['isTutor' => true, 'name' => 'Zoe Accepted']);
        TutorProfile::factory()->for($accepted)->create();
        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $accepted->id,
        ]);

        $pending = User::factory()->create(['isTutor' => true, 'name' => 'Amy Pending']);
        TutorProfile::factory()->for($pending)->create();
        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $pending->id,
        ]);

        // Never asked, and alphabetically first, so only the ordering rule
        // can put it last.
        $stranger = User::factory()->create(['isTutor' => true, 'name' => 'Aaa Stranger']);
        TutorProfile::factory()->for($stranger)->create();

        $this->actingAsUser($student);

        $names = collect($this->getJson('/api/v1/conversations/contacts?role=student')
            ->assertOk()
            ->json('data'))
            ->pluck('name')
            ->all();

        $this->assertSame(['Zoe Accepted', 'Amy Pending', 'Aaa Stranger'], $names);
    }

    public function test_a_tutors_chat_list_puts_accepted_students_before_the_ones_waiting(): void
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();

        $accepted = User::factory()->create(['name' => 'Zoe Accepted']);
        TuitionRequest::factory()->accepted()->create([
            'student_id' => $accepted->id,
            'tutor_id' => $tutor->id,
        ]);

        $waiting = User::factory()->create(['name' => 'Amy Waiting']);
        TuitionRequest::factory()->create([
            'student_id' => $waiting->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->actingAsUser($tutor);

        $contacts = $this->getJson('/api/v1/conversations/contacts?role=tutor')
            ->assertOk()
            ->json('data');

        $this->assertSame(['Zoe Accepted', 'Amy Waiting'], collect($contacts)->pluck('name')->all());
        $this->assertSame('accepted', $contacts[0]['request_status']);
        $this->assertSame('pending', $contacts[1]['request_status']);
        // Acceptance is what unlocks the thread.
        $this->assertFalse($contacts[0]['locked']);
        $this->assertTrue($contacts[1]['locked']);
    }

    public function test_a_tutors_chat_list_is_not_a_directory_of_everyone(): void
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();

        // Another tutor, and a student who never approached them.
        $other = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($other)->create();
        User::factory()->create();

        $this->actingAsUser($tutor);

        $this->getJson('/api/v1/conversations/contacts?role=tutor')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_the_request_status_is_reported_for_each_contact(): void
    {
        $student = User::factory()->create();

        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();

        $this->actingAsUser($student);

        $this->getJson('/api/v1/conversations/contacts?role=student')
            ->assertOk()
            ->assertJsonPath('data.0.request_status', null)
            ->assertJsonPath('data.0.locked', true);

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->getJson('/api/v1/conversations/contacts?role=student')
            ->assertOk()
            ->assertJsonPath('data.0.request_status', 'accepted')
            ->assertJsonPath('data.0.locked', false);
    }

    /*
     * The arrangement is what keeps a conversation open. When a tutor ends it
     * the record stays readable, but neither side can add to it.
     */

    public function test_ending_the_arrangement_closes_the_conversation(): void
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();
        $student = User::factory()->create();

        $accepted = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $thread = $this->threadBetween($student, $tutor);

        $this->actingAsUser($student);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Still on for Tuesday?'])
            ->assertCreated();

        // The tutor ends it.
        $this->actingAsUser($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$accepted->id)->assertOk();

        // Neither side can send any more.
        $this->actingAsUser($student);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Hello?'])
            ->assertForbidden();

        $this->actingAsUser($tutor);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Hello?'])
            ->assertForbidden();
    }

    public function test_an_ended_arrangement_still_shows_its_history(): void
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();
        $student = User::factory()->create();

        $accepted = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $thread = $this->threadBetween($student, $tutor);

        $this->actingAsUser($student);
        $this->postJson("/api/v1/conversations/{$thread->id}/messages", ['body' => 'Thanks for everything.'])
            ->assertCreated();

        $this->actingAsUser($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$accepted->id)->assertOk();

        // Closed for new messages, but what was said is not destroyed.
        $this->getJson("/api/v1/conversations/{$thread->id}/messages")
            ->assertOk()
            ->assertJsonFragment(['body' => 'Thanks for everything.']);
    }

    public function test_ending_the_arrangement_tells_the_student(): void
    {
        $tutor = User::factory()->create(['isTutor' => true, 'name' => 'Grace Hopper']);
        TutorProfile::factory()->for($tutor)->create();
        $student = User::factory()->create();

        $accepted = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->actingAsUser($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$accepted->id)->assertOk();

        $note = Notification::where('user_id', $student->id)->latest()->firstOrFail();

        $this->assertSame('Tutoring ended', $note->title);
        $this->assertStringContainsString('Grace Hopper', $note->body);
    }

    public function test_an_ended_contact_reports_its_status(): void
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();
        $student = User::factory()->create();

        $accepted = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->actingAsUser($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$accepted->id)->assertOk();

        $this->getJson('/api/v1/conversations/contacts?role=tutor')
            ->assertOk()
            ->assertJsonPath('data.0.request_status', 'ended');
    }
}
