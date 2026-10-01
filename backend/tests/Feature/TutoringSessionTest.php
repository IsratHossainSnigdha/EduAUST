<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\TutoringSession;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Agreeing a time to meet.
 *
 * The product went request, accept, then chat, and stopped: there was no way
 * to settle on a time or see what was coming up.
 */
class TutoringSessionTest extends TestCase
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

    /**
     * An active arrangement between a fresh tutor and student.
     *
     * @return array{0: TuitionRequest, 1: User, 2: User}
     */
    private function arrangement(): array
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        $request = TuitionRequest::factory()->accepted()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'subject_id' => Subject::factory()->create(['name' => 'Algorithms'])->id,
        ]);

        return [$request, $tutor, $student];
    }

    public function test_listing_sessions_requires_authentication(): void
    {
        $this->getJson('/api/v1/sessions')->assertUnauthorized();
    }

    public function test_a_student_can_propose_a_session(): void
    {
        [$request, , $student] = $this->arrangement();

        $this->signIn($student);

        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->addDays(2)->setTime(14, 0)->toDateTimeString(),
            'duration_minutes' => 90,
            'location' => 'Library, 3rd floor',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', TutoringSession::STATUS_PROPOSED)
            ->assertJsonPath('data.duration_minutes', 90)
            ->assertJsonPath('data.location', 'Library, 3rd floor')
            ->assertJsonPath('data.subject', 'Algorithms')
            ->assertJsonPath('data.proposed_by_me', true)
            // The person who proposed it does not also confirm it.
            ->assertJsonPath('data.can_confirm', false);
    }

    public function test_a_tutor_can_propose_a_session_too(): void
    {
        [$request, $tutor] = $this->arrangement();

        $this->signIn($tutor);

        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->addDay()->toDateTimeString(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'tutor');
    }

    public function test_a_stranger_cannot_propose_a_session_on_someone_elses_arrangement(): void
    {
        [$request] = $this->arrangement();

        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->addDay()->toDateTimeString(),
        ])->assertNotFound();
    }

    public function test_sessions_cannot_be_arranged_for_tutoring_that_is_not_active(): void
    {
        [$request, , $student] = $this->arrangement();

        $request->update(['status' => TuitionRequest::STATUS_ENDED, 'ended_at' => now()]);

        $this->signIn($student);

        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->addDay()->toDateTimeString(),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tuition_request_id');
    }

    public function test_a_session_cannot_be_put_in_the_past(): void
    {
        [$request, , $student] = $this->arrangement();

        $this->signIn($student);

        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->subDay()->toDateTimeString(),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('scheduled_at');
    }

    public function test_a_session_cannot_be_put_absurdly_far_ahead(): void
    {
        [$request, , $student] = $this->arrangement();

        $this->signIn($student);

        // A mistyped year should be refused rather than quietly accepted.
        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->addYears(2)->toDateTimeString(),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('scheduled_at');
    }

    public function test_the_other_side_confirms_it(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $session = TutoringSession::factory()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn($tutor);

        $this->patchJson("/api/v1/sessions/{$session->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', TutoringSession::STATUS_CONFIRMED);

        $this->assertSame(
            TutoringSession::STATUS_CONFIRMED,
            $session->fresh()->status
        );
    }

    public function test_whoever_proposed_a_session_cannot_confirm_their_own(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $session = TutoringSession::factory()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn($student);

        // Agreeing with yourself is not agreement.
        $this->patchJson("/api/v1/sessions/{$session->id}/confirm")
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertSame(
            TutoringSession::STATUS_PROPOSED,
            $session->fresh()->status
        );
    }

    public function test_either_side_can_cancel(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        foreach ([$tutor, $student] as $actor) {
            $session = TutoringSession::factory()->confirmed()->create([
                'tuition_request_id' => $request->id,
                'tutor_id' => $tutor->id,
                'student_id' => $student->id,
                'proposed_by' => $student->id,
            ]);

            $this->signIn($actor);

            $this->deleteJson("/api/v1/sessions/{$session->id}")->assertOk();

            $this->assertSame(
                TutoringSession::STATUS_CANCELLED,
                $session->fresh()->status
            );
            $this->assertSame($actor->id, $session->fresh()->cancelled_by);
        }
    }

    public function test_a_session_that_has_happened_cannot_be_cancelled(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $session = TutoringSession::factory()->past()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn($tutor);

        $this->deleteJson("/api/v1/sessions/{$session->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_a_confirmed_session_whose_time_has_passed_reads_as_completed(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        TutoringSession::factory()->past()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn($student);

        // Nothing sweeps the table, so the status is worked out on the way out.
        $this->getJson('/api/v1/sessions?filter=past')
            ->assertOk()
            ->assertJsonPath('data.0.status', TutoringSession::STATUS_COMPLETED);
    }

    public function test_upcoming_is_the_default_and_excludes_what_has_been_and_gone(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        TutoringSession::factory()->past()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        TutoringSession::factory()->confirmed()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
            'scheduled_at' => now()->addDays(5),
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/sessions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', TutoringSession::STATUS_CONFIRMED);
    }

    public function test_sessions_are_private_to_the_two_people_in_them(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        TutoringSession::factory()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn(User::factory()->create());

        $this->getJson('/api/v1/sessions')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_the_count_awaiting_you_ignores_your_own_proposals(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        TutoringSession::factory()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn($student);
        $this->getJson('/api/v1/sessions')->assertOk()->assertJsonPath('awaiting_you', 0);

        $this->signIn($tutor);
        $this->getJson('/api/v1/sessions')->assertOk()->assertJsonPath('awaiting_you', 1);
    }

    public function test_proposing_a_session_notifies_the_other_side(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $this->signIn($student);

        $this->postJson('/api/v1/sessions', [
            'tuition_request_id' => $request->id,
            'scheduled_at' => now()->addDays(3)->toDateTimeString(),
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $tutor->id,
            'title' => 'New session proposed',
            'link' => '/sessions',
        ]);

        // And not back to whoever proposed it.
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $student->id,
            'title' => 'New session proposed',
        ]);
    }

    public function test_cancelling_notifies_the_other_side(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $session = TutoringSession::factory()->confirmed()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        $this->signIn($tutor);
        $this->deleteJson("/api/v1/sessions/{$session->id}")->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'title' => 'Session cancelled',
        ]);
    }

    public function test_ending_an_arrangement_takes_its_sessions_with_it(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $session = TutoringSession::factory()->confirmed()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
        ]);

        // Deleting the arrangement cascades; ending it is a status change, so
        // the session stays but can no longer be added to.
        $request->delete();

        $this->assertDatabaseMissing('tutoring_sessions', ['id' => $session->id]);
    }

    public function test_confirming_does_not_move_the_agreed_time(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $agreed = now()->addDays(4)->startOfHour();

        $session = TutoringSession::factory()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
            'scheduled_at' => $agreed,
        ]);

        $this->signIn($tutor);
        $this->patchJson("/api/v1/sessions/{$session->id}/confirm")->assertOk();

        /*
         * MySQL attaches ON UPDATE CURRENT_TIMESTAMP to the first non-nullable
         * TIMESTAMP column in a table, so saving the status once rewrote the
         * agreed time to the moment of saving. The column is a DATETIME for
         * exactly this reason.
         */
        $this->assertSame(
            $agreed->toDateTimeString(),
            $session->fresh()->scheduled_at->toDateTimeString()
        );
    }

    public function test_cancelling_does_not_move_the_agreed_time_either(): void
    {
        [$request, $tutor, $student] = $this->arrangement();

        $agreed = now()->addDays(4)->startOfHour();

        $session = TutoringSession::factory()->confirmed()->create([
            'tuition_request_id' => $request->id,
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'proposed_by' => $student->id,
            'scheduled_at' => $agreed,
        ]);

        $this->signIn($student);
        $this->deleteJson("/api/v1/sessions/{$session->id}")->assertOk();

        $this->assertSame(
            $agreed->toDateTimeString(),
            $session->fresh()->scheduled_at->toDateTimeString()
        );
    }
}
