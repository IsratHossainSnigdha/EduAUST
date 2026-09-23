<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TutorDashboardTest extends TestCase
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

        TutorProfile::factory()->for($tutor)->create([
            'headline' => 'DSA Tutor',
            'hourly_rate' => 500,
            'student_count' => 12,
        ]);

        return $tutor;
    }

    public function test_the_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/v1/tutor/dashboard')->assertUnauthorized();
    }

    public function test_a_non_tutor_cannot_read_tutor_data(): void
    {
        $this->signIn(User::factory()->create(['isTutor' => false]));

        $this->getJson('/api/v1/tutor/dashboard')->assertForbidden();
        $this->getJson('/api/v1/tuition-requests')->assertForbidden();
    }

    public function test_it_returns_the_signed_in_tutors_own_details(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('tutor.id', $tutor->id)
            ->assertJsonPath('tutor.name', $tutor->name)
            ->assertJsonPath('tutor.headline', 'DSA Tutor')
            // Derived from real requests, not the factory's stored figure: a
            // tutor with no accepted requests has taught nobody yet.
            ->assertJsonPath('stats.currently_teaching', 0)
            ->assertJsonPath('stats.students_taught', 0);
    }

    public function test_ending_an_arrangement_lowers_currently_teaching_but_not_taught(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        $request = TuitionRequest::factory()->accepted()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
        ]);

        $this->signIn($tutor);

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.currently_teaching', 1)
            ->assertJsonPath('stats.students_taught', 1);

        // End the arrangement — they stop being taught now, but were taught.
        $this->deleteJson('/api/v1/tuition-requests/'.$request->id)->assertOk();

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.currently_teaching', 0)
            ->assertJsonPath('stats.students_taught', 1);
    }

    public function test_only_the_owning_tutor_can_end_an_arrangement(): void
    {
        $tutor = $this->tutor();
        $request = TuitionRequest::factory()->accepted()->create(['tutor_id' => $tutor->id]);

        $this->signIn($this->tutor());
        $this->deleteJson('/api/v1/tuition-requests/'.$request->id)->assertNotFound();
    }

    public function test_a_pending_request_cannot_be_ended(): void
    {
        $tutor = $this->tutor();
        $request = TuitionRequest::factory()->create(['tutor_id' => $tutor->id]);

        $this->signIn($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$request->id)->assertStatus(422);
    }

    public function test_stats_count_requests_by_status(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        TuitionRequest::factory()->count(3)->create(['tutor_id' => $tutor->id]);
        TuitionRequest::factory()->accepted()->create(['tutor_id' => $tutor->id]);
        TuitionRequest::factory()->declined()->create(['tutor_id' => $tutor->id]);

        // A request addressed to a different tutor must not be counted here.
        TuitionRequest::factory()->create();

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.pending_requests', 3)
            ->assertJsonPath('stats.accepted_requests', 1)
            ->assertJsonPath('stats.declined_requests', 1)
            ->assertJsonPath('stats.total_requests', 5);
    }

    public function test_recent_requests_carry_the_student_and_subject(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        $student = User::factory()->create(['name' => 'Ada Lovelace']);
        $subject = Subject::factory()->named('Algorithms')->create();

        TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
            'level' => 'University Level',
        ]);

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('recent_requests.0.student.name', 'Ada Lovelace')
            ->assertJsonPath('recent_requests.0.subject', 'Algorithms')
            ->assertJsonPath('recent_requests.0.status', TuitionRequest::STATUS_PENDING);
    }

    public function test_a_tutor_only_sees_their_own_requests(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        TuitionRequest::factory()->create(['tutor_id' => $tutor->id]);
        TuitionRequest::factory()->count(2)->create();

        $this->getJson('/api/v1/tuition-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_requests_can_be_filtered_by_status(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        TuitionRequest::factory()->create(['tutor_id' => $tutor->id]);
        TuitionRequest::factory()->accepted()->create(['tutor_id' => $tutor->id]);

        $this->getJson('/api/v1/tuition-requests?status=accepted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'accepted');
    }

    public function test_a_student_can_send_a_request_to_a_tutor(): void
    {
        $tutor = $this->tutor();
        $student = $this->signIn(User::factory()->create());
        $subject = Subject::factory()->create();

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => $tutor->id,
            'subject_id' => $subject->id,
            'level' => 'University Level',
            'message' => 'Could you help with recursion?',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('tuition_requests', [
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);
    }

    public function test_a_request_cannot_be_sent_to_a_non_tutor(): void
    {
        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/tuition-requests', [
            'tutor_id' => User::factory()->create(['isTutor' => false])->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('tutor_id');
    }

    public function test_a_student_cannot_request_themselves(): void
    {
        $me = $this->signIn(User::factory()->create(['isTutor' => true]));

        $this->postJson('/api/v1/tuition-requests', ['tutor_id' => $me->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tutor_id');
    }

    public function test_a_duplicate_pending_request_is_rejected(): void
    {
        $tutor = $this->tutor();
        $this->signIn(User::factory()->create());
        $subject = Subject::factory()->create();

        $payload = ['tutor_id' => $tutor->id, 'subject_id' => $subject->id];

        $this->postJson('/api/v1/tuition-requests', $payload)->assertCreated();

        $this->postJson('/api/v1/tuition-requests', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tutor_id');
    }

    public function test_a_tutor_can_accept_a_request(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        $request = TuitionRequest::factory()->create(['tutor_id' => $tutor->id]);

        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'accepted'])
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted');

        $this->assertNotNull($request->fresh()->responded_at);
    }

    public function test_a_tutor_cannot_answer_a_request_addressed_to_someone_else(): void
    {
        $this->signIn($this->tutor());

        $other = TuitionRequest::factory()->create();

        $this->patchJson('/api/v1/tuition-requests/'.$other->id, ['status' => 'accepted'])
            ->assertNotFound();

        $this->assertSame(TuitionRequest::STATUS_PENDING, $other->fresh()->status);
    }

    public function test_a_request_cannot_be_answered_twice(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        $request = TuitionRequest::factory()->accepted()->create(['tutor_id' => $tutor->id]);

        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'declined'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_an_invalid_status_is_rejected(): void
    {
        $tutor = $this->tutor();
        $this->signIn($tutor);

        $request = TuitionRequest::factory()->create(['tutor_id' => $tutor->id]);

        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'maybe'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_accepting_a_request_counts_the_student_as_taught(): void
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

        // The factory seeds a figure of its own; accepting replaces it with
        // the number of students actually taken on.
        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.students_taught', 1);
    }

    public function test_students_taught_counts_each_student_once(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        // Two subjects with the same student is still one student taught.
        foreach (Subject::factory()->count(2)->create() as $subject) {
            $request = TuitionRequest::factory()->create([
                'tutor_id' => $tutor->id,
                'student_id' => $student->id,
                'subject_id' => $subject->id,
            ]);

            $this->signIn($tutor);
            $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'accepted']);
        }

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.accepted_requests', 2)
            ->assertJsonPath('stats.students_taught', 1);
    }

    public function test_a_declined_request_does_not_count_as_a_student(): void
    {
        $tutor = $this->tutor();

        $request = TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => User::factory()->create()->id,
        ]);

        $this->signIn($tutor);

        $this->patchJson('/api/v1/tuition-requests/'.$request->id, ['status' => 'declined'])
            ->assertOk();

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.students_taught', 0);
    }

    public function test_the_dashboard_dates_the_students_it_lists(): void
    {
        $tutor = $this->tutor();
        $started = now()->subMonths(3);

        TuitionRequest::factory()->accepted()->create([
            'tutor_id' => $tutor->id,
            'student_id' => User::factory()->create(['name' => 'Ada Lovelace'])->id,
            'subject_id' => Subject::factory()->create(['name' => 'Algorithms'])->id,
            'responded_at' => $started,
        ]);

        $this->signIn($tutor);

        $response = $this->getJson('/api/v1/tutor/dashboard')->assertOk()
            ->assertJsonCount(1, 'students')
            ->assertJsonPath('students.0.name', 'Ada Lovelace')
            // A tutor may stop whenever they need to.
            ->assertJsonPath('students.0.can_end', true);

        $this->assertSame(
            $started->toIso8601String(),
            $response->json('students.0.since')
        );
        $this->assertNull($response->json('students.0.ended_at'));
    }

    public function test_an_ended_student_moves_to_the_past_list_with_both_dates(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        $arrangement = TuitionRequest::factory()->accepted()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'responded_at' => now()->subMonths(6),
        ]);

        $this->signIn($tutor);
        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)->assertOk();

        $response = $this->getJson('/api/v1/tutor/dashboard')->assertOk()
            ->assertJsonCount(0, 'students')
            ->assertJsonCount(1, 'past_students')
            ->assertJsonPath('past_students.0.student_id', $student->id)
            // What has finished cannot be finished again.
            ->assertJsonPath('past_students.0.can_end', false);

        $this->assertNotNull($response->json('past_students.0.since'));
        $this->assertNotNull($response->json('past_students.0.ended_at'));
    }

    public function test_a_student_still_being_taught_is_not_a_past_student(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        TuitionRequest::factory()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'status' => TuitionRequest::STATUS_ENDED,
            'responded_at' => now()->subMonths(5),
            'ended_at' => now()->subMonths(2),
        ]);

        TuitionRequest::factory()->accepted()->create([
            'tutor_id' => $tutor->id,
            'student_id' => $student->id,
            'responded_at' => now()->subMonths(1),
        ]);

        $this->signIn($tutor);

        $this->getJson('/api/v1/tutor/dashboard')->assertOk()
            ->assertJsonCount(1, 'students')
            ->assertJsonCount(0, 'past_students');
    }

    public function test_the_relationship_is_dated_from_its_earliest_arrangement(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();
        $earliest = now()->subMonths(8);

        foreach ([$earliest, now()->subMonths(2)] as $when) {
            TuitionRequest::factory()->accepted()->create([
                'tutor_id' => $tutor->id,
                'student_id' => $student->id,
                'subject_id' => Subject::factory()->create()->id,
                'responded_at' => $when,
            ]);
        }

        $this->signIn($tutor);

        $response = $this->getJson('/api/v1/tutor/dashboard')->assertOk()
            ->assertJsonCount(1, 'students');

        // Adding a second subject does not restart the relationship.
        $this->assertSame(
            $earliest->toIso8601String(),
            $response->json('students.0.since')
        );
    }
}
