<?php

namespace Tests\Feature;

use App\Models\SavedTutor;
use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The student dashboard had no endpoint of its own: the page stitched together
 * /auth/me and the request listing and showed no figures at all.
 */
class StudentDashboardTest extends TestCase
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

    public function test_the_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/v1/student/dashboard')->assertUnauthorized();
    }

    public function test_it_returns_the_signed_in_students_own_details(): void
    {
        $student = $this->signIn(User::factory()->create([
            'name' => 'Ada Lovelace',
            'semester' => '3.1',
        ]));

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('student.id', $student->id)
            ->assertJsonPath('student.name', 'Ada Lovelace')
            ->assertJsonPath('student.semester', '3.1')
            ->assertJsonPath('student.is_tutor', false);
    }

    public function test_stats_count_the_students_own_requests_by_status(): void
    {
        $student = User::factory()->create();

        TuitionRequest::factory()->count(2)->create(['student_id' => $student->id]);
        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $this->tutor()->id,
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.pending_requests', 2)
            ->assertJsonPath('stats.accepted_requests', 1)
            ->assertJsonPath('stats.total_requests', 3);
    }

    public function test_my_tutors_counts_each_tutor_once(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();

        // Two subjects with the same tutor is still one tutor.
        foreach (Subject::factory()->count(2)->create() as $subject) {
            TuitionRequest::factory()->accepted()->create([
                'student_id' => $student->id,
                'tutor_id' => $tutor->id,
                'subject_id' => $subject->id,
            ]);
        }

        $this->signIn($student);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.accepted_requests', 2)
            ->assertJsonPath('stats.my_tutors', 1);
    }

    /**
     * The point of the split: an account that tutors is still a student, and
     * the two sides must not be read off each other.
     */
    public function test_a_tutors_teaching_does_not_appear_on_their_student_dashboard(): void
    {
        $tutor = $this->tutor();

        TuitionRequest::factory()->accepted()->count(3)->create(['tutor_id' => $tutor->id]);

        $this->signIn($tutor);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('student.is_tutor', true)
            ->assertJsonPath('stats.total_requests', 0)
            ->assertJsonPath('stats.my_tutors', 0);

        // The same account's tutor dashboard still reports the teaching.
        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.accepted_requests', 3);
    }

    public function test_a_student_only_sees_their_own_requests(): void
    {
        $student = User::factory()->create();
        TuitionRequest::factory()->count(2)->create(['student_id' => $student->id]);
        TuitionRequest::factory()->count(3)->create();

        $this->signIn($student);

        $this->getJson('/api/v1/student/requests')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_requests_can_be_filtered_by_status(): void
    {
        $student = User::factory()->create();
        TuitionRequest::factory()->count(2)->create(['student_id' => $student->id]);
        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $this->tutor()->id,
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/student/requests?status=accepted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'accepted');
    }

    public function test_a_request_names_the_tutor_not_the_student(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();
        $tutor->update(['name' => 'Grace Hopper']);

        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/student/requests')
            ->assertOk()
            ->assertJsonPath('data.0.tutor.name', 'Grace Hopper');
    }

    public function test_a_student_can_save_and_unsave_a_tutor(): void
    {
        $student = $this->signIn(User::factory()->create());
        $tutor = $this->tutor();

        $this->postJson('/api/v1/student/saved-tutors', ['tutor_id' => $tutor->id])
            ->assertCreated();

        $this->getJson('/api/v1/student/saved-tutors')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tutor_id', $tutor->id);

        $this->deleteJson('/api/v1/student/saved-tutors/'.$tutor->id)->assertOk();

        $this->getJson('/api/v1/student/saved-tutors')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->assertSame(0, SavedTutor::where('student_id', $student->id)->count());
    }

    public function test_saving_the_same_tutor_twice_is_not_an_error(): void
    {
        $this->signIn(User::factory()->create());
        $tutor = $this->tutor();

        $this->postJson('/api/v1/student/saved-tutors', ['tutor_id' => $tutor->id])->assertCreated();
        $this->postJson('/api/v1/student/saved-tutors', ['tutor_id' => $tutor->id])->assertOk();

        $this->getJson('/api/v1/student/saved-tutors')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_an_account_that_does_not_tutor_cannot_be_saved(): void
    {
        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/student/saved-tutors', [
            'tutor_id' => User::factory()->create(['isTutor' => false])->id,
        ])->assertStatus(422);
    }

    public function test_a_student_cannot_save_themselves(): void
    {
        $me = $this->signIn($this->tutor());

        $this->postJson('/api/v1/student/saved-tutors', ['tutor_id' => $me->id])
            ->assertStatus(422);
    }

    public function test_saved_tutors_are_private_to_the_student_who_saved_them(): void
    {
        $tutor = $this->tutor();

        $this->signIn(User::factory()->create());
        $this->postJson('/api/v1/student/saved-tutors', ['tutor_id' => $tutor->id])->assertCreated();

        // Somebody else's shortlist is not visible here.
        $this->signIn(User::factory()->create());
        $this->getJson('/api/v1/student/saved-tutors')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_the_saved_count_shows_on_the_dashboard(): void
    {
        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/student/saved-tutors', ['tutor_id' => $this->tutor()->id])
            ->assertCreated();

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.saved_tutors', 1);
    }

    public function test_the_dashboard_lists_the_tutors_currently_teaching_them(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();
        $subject = Subject::factory()->create(['name' => 'Algorithms']);

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'subject_id' => $subject->id,
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonCount(1, 'tutors')
            ->assertJsonPath('tutors.0.tutor_id', $tutor->id)
            ->assertJsonPath('tutors.0.name', $tutor->name)
            ->assertJsonPath('tutors.0.subjects.0', 'Algorithms');
    }

    public function test_several_subjects_with_one_tutor_is_still_one_tutor(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();

        foreach (['Algorithms', 'Databases'] as $name) {
            TuitionRequest::factory()->accepted()->create([
                'student_id' => $student->id,
                'tutor_id' => $tutor->id,
                'subject_id' => Subject::factory()->create(['name' => $name])->id,
            ]);
        }

        $this->signIn($student);

        $response = $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonCount(1, 'tutors');

        $this->assertEqualsCanonicalizing(
            ['Algorithms', 'Databases'],
            $response->json('tutors.0.subjects')
        );
    }

    public function test_a_request_that_was_never_accepted_is_not_a_current_tutor(): void
    {
        $student = User::factory()->create();

        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $this->tutor()->id,
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonCount(0, 'tutors');
    }

    public function test_a_student_can_end_an_arrangement_once_the_month_is_up(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();

        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'responded_at' => now()->subMonths(2),
        ]);

        $this->signIn($student);

        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)->assertOk();

        $this->assertSame(
            TuitionRequest::STATUS_ENDED,
            $arrangement->fresh()->status
        );

        // And they stop being listed as a current tutor.
        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonCount(0, 'tutors');
    }

    public function test_ending_an_arrangement_tells_the_other_side(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();

        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'responded_at' => now()->subMonths(2),
        ]);

        $this->signIn($student);
        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)->assertOk();

        // The tutor hears about it, not the student who did it.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $tutor->id,
            'title' => 'Tutoring ended',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $student->id,
            'title' => 'Tutoring ended',
        ]);
    }

    public function test_a_stranger_cannot_end_someone_elses_arrangement(): void
    {
        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => User::factory()->create()->id,
            'tutor_id' => $this->tutor()->id,
        ]);

        $this->signIn(User::factory()->create());

        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)
            ->assertNotFound();

        $this->assertSame(
            TuitionRequest::STATUS_ACCEPTED,
            $arrangement->fresh()->status
        );
    }

    public function test_a_student_cannot_end_an_arrangement_inside_the_first_month(): void
    {
        $student = User::factory()->create();

        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $this->tutor()->id,
            'responded_at' => now()->subDays(10),
        ]);

        $this->signIn($student);

        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertSame(
            TuitionRequest::STATUS_ACCEPTED,
            $arrangement->fresh()->status
        );
    }

    public function test_a_tutor_may_end_an_arrangement_at_any_time(): void
    {
        $tutor = $this->tutor();

        // The same age that a student would be refused for.
        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => User::factory()->create()->id,
            'tutor_id' => $tutor->id,
            'responded_at' => now()->subDays(2),
        ]);

        $this->signIn($tutor);

        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)->assertOk();

        $this->assertSame(
            TuitionRequest::STATUS_ENDED,
            $arrangement->fresh()->status
        );
    }

    public function test_the_dashboard_says_when_a_student_may_end_an_arrangement(): void
    {
        $student = User::factory()->create();

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $this->tutor()->id,
            'responded_at' => now()->subDays(3),
        ]);

        $this->signIn($student);

        $response = $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('tutors.0.can_end', false);

        // The row explains itself rather than offering a button that fails.
        $this->assertStringContainsString(
            'first month',
            $response->json('tutors.0.end_blocked_reason')
        );
        $this->assertNotNull($response->json('tutors.0.can_end_at'));
    }

    public function test_ending_an_arrangement_records_when_it_ended(): void
    {
        $student = User::factory()->create();

        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $this->tutor()->id,
            'responded_at' => now()->subMonths(3),
        ]);

        $this->signIn($student);
        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)->assertOk();

        $this->assertNotNull($arrangement->fresh()->ended_at);
    }

    public function test_an_ended_arrangement_moves_to_the_past_tutors_list(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();

        $arrangement = TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'responded_at' => now()->subMonths(4),
        ]);

        $this->signIn($student);
        $this->deleteJson('/api/v1/tuition-requests/'.$arrangement->id)->assertOk();

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonCount(0, 'tutors')
            ->assertJsonCount(1, 'past_tutors')
            ->assertJsonPath('past_tutors.0.tutor_id', $tutor->id)
            // Both ends of the relationship are dated.
            ->assertJsonPath('past_tutors.0.can_end', false);
    }

    public function test_a_tutor_still_teaching_one_subject_is_not_a_past_tutor(): void
    {
        $student = User::factory()->create();
        $tutor = $this->tutor();

        // One arrangement finished, another is still running.
        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'status' => TuitionRequest::STATUS_ENDED,
            'responded_at' => now()->subMonths(5),
            'ended_at' => now()->subMonths(1),
        ]);

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'responded_at' => now()->subMonths(2),
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonCount(1, 'tutors')
            ->assertJsonCount(0, 'past_tutors');
    }
}
