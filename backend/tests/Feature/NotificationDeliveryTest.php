<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The notifications table was read by both dashboards long before anything
 * wrote to it. These cover the events that now raise one.
 */
class NotificationDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(User $user): User
    {
        $this->withToken(app(JwtService::class)->tokensFor($user)['access_token']);

        return $user;
    }

    private function tutor(): User
    {
        $tutor = User::factory()->create(['isTutor' => true]);
        TutorProfile::factory()->for($tutor)->create();

        return $tutor;
    }

    public function test_sending_a_request_notifies_the_tutor(): void
    {
        $tutor = $this->tutor();
        $student = $this->signIn(User::factory()->create(['name' => 'Ada Lovelace']));
        $subject = Subject::factory()->named('Algorithms')->create();

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => $tutor->id,
            'subject_id' => $subject->id,
        ])->assertCreated();

        $notification = Notification::where('user_id', $tutor->id)->firstOrFail();

        $this->assertSame(Notification::CATEGORY_REQUEST, $notification->category);
        $this->assertSame(Notification::AUDIENCE_TUTOR, $notification->audience);
        $this->assertStringContainsString('Ada Lovelace', $notification->body);
        $this->assertStringContainsString('Algorithms', $notification->body);

        // The sender is not told about their own action.
        $this->assertSame(0, Notification::where('user_id', $student->id)->count());
    }

    public function test_accepting_a_request_notifies_the_student(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();
        $request = TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
        ]);

        $this->signIn($tutor);

        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'accepted'])
            ->assertOk();

        $notification = Notification::where('user_id', $student->id)->firstOrFail();

        $this->assertSame(Notification::AUDIENCE_STUDENT, $notification->audience);
        $this->assertSame('Request accepted', $notification->title);
        // Acceptance is what unlocks messaging, so the student is told.
        $this->assertStringContainsString('message them', $notification->body);
    }

    public function test_declining_a_request_notifies_the_student(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();
        $request = TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
        ]);

        $this->signIn($tutor);

        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'declined'])
            ->assertOk();

        $this->assertSame(
            'Request declined',
            Notification::where('user_id', $student->id)->firstOrFail()->title
        );
    }

    public function test_sending_a_message_notifies_the_recipient(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create(['name' => 'Ada Lovelace']);

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->signIn($student);

        $threadId = $this->postJson('/api/v1/conversations', ['user_id' => $tutor->id])
            ->assertCreated()
            ->json('data.id');

        Notification::query()->delete();

        $this->postJson("/api/v1/conversations/{$threadId}/messages", [
            'body' => 'Could you help with recursion?',
        ])->assertCreated();

        $notification = Notification::where('user_id', $tutor->id)->firstOrFail();

        $this->assertSame(Notification::CATEGORY_MESSAGE, $notification->category);
        $this->assertStringContainsString('Ada Lovelace', $notification->title);
        $this->assertStringContainsString('recursion', $notification->body);

        // The sender does not notify themselves.
        $this->assertSame(0, Notification::where('user_id', $student->id)->count());
    }

    public function test_a_notification_shows_up_in_the_unread_count(): void
    {
        $tutor = $this->tutor();
        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/tuition-requests', ['tutor_id' => $tutor->id])
            ->assertCreated();

        $this->signIn($tutor);

        $this->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('by_audience.tutor', 1);

        // The listing groups by recency, so assert on the entry itself.
        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonFragment(['title' => 'New tuition request']);
    }

    public function test_a_request_notification_points_the_tutor_at_their_inbox(): void
    {
        $tutor = $this->tutor();
        $student = $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => $tutor->id,
            'subject_id' => Subject::factory()->create()->id,
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $tutor->id,
            'title' => 'New tuition request',
            'link' => '/tutor-requests',
        ]);
    }

    public function test_an_acceptance_points_the_student_at_the_conversation_it_opened(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        $request = TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
        ]);

        $this->signIn($tutor);
        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'accepted'])
            ->assertOk();

        // Acceptance is what unlocks messaging, so that is where it leads.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'title' => 'Request accepted',
            // That tutor's conversation, not just the message box.
            'link' => '/messages?with='.$tutor->id,
        ]);
    }

    public function test_a_decline_points_the_student_at_their_own_request_list(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        $request = TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
        ]);

        $this->signIn($tutor);
        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'declined'])
            ->assertOk();

        // A decline has no conversation to open.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'title' => 'Request declined',
            'link' => '/my-requests',
        ]);
    }

    public function test_ending_an_arrangement_points_each_side_at_their_own_list(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        $request = TuitionRequest::factory()->accepted()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'responded_at' => now()->subMonths(3),
        ]);

        $this->signIn($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$request->id)->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'title' => 'Tutoring ended',
            'link' => '/my-tutors',
        ]);
    }

    public function test_the_api_hands_the_destination_to_the_browser(): void
    {
        $tutor = $this->tutor();
        $student = $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => $tutor->id,
            'subject_id' => Subject::factory()->create()->id,
        ])->assertCreated();

        $this->signIn($tutor);

        $this->getJson('/api/v1/notifications?audience=tutor')
            ->assertOk()
            // The payload is grouped by day before it reaches the browser.
            ->assertJsonPath('groups.0.notifications.0.link', '/tutor-requests');
    }
}
