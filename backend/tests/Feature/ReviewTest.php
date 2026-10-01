<?php

namespace Tests\Feature;

use App\Models\Review;
use App\Models\TuitionRequest;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tutor cards carried a star rating from the day the listing was built, read
 * from nothing at all. These cover the ratings that now sit behind it.
 */
class ReviewTest extends TestCase
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
     * A student the tutor accepted, which is what earns the right to rate.
     */
    private function taughtBy(User $tutor): User
    {
        $student = User::factory()->create();

        TuitionRequest::factory()->accepted()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        return $student;
    }

    public function test_reviewing_requires_authentication(): void
    {
        $this->postJson('/api/v1/reviews', [])->assertUnauthorized();
    }

    public function test_a_taught_student_can_rate_their_tutor(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));

        $this->postJson('/api/v1/reviews', [
            'tutor_id' => $tutor->id,
            'rating' => 5,
            'comment' => 'Explained recursion clearly.',
        ])
            ->assertCreated()
            ->assertJsonPath('summary.average', 5)
            ->assertJsonPath('summary.count', 1);
    }

    public function test_a_student_the_tutor_never_accepted_cannot_rate_them(): void
    {
        $tutor = $this->tutor();
        $this->signIn(User::factory()->create());

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 1])
            ->assertStatus(422);

        $this->assertSame(0, Review::count());
    }

    public function test_a_pending_request_does_not_earn_a_review(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
        ]);

        $this->signIn($student);

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5])
            ->assertStatus(422);
    }

    public function test_reviewing_twice_edits_the_first_review(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5])
            ->assertCreated();

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 3])
            ->assertOk()
            ->assertJsonPath('summary.average', 3)
            ->assertJsonPath('summary.count', 1);

        $this->assertSame(1, Review::count());
    }

    public function test_a_rating_outside_one_to_five_is_rejected(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 0])->assertStatus(422);
        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 6])->assertStatus(422);
    }

    public function test_a_tutor_cannot_review_themselves(): void
    {
        $tutor = $this->signIn($this->tutor());

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5])
            ->assertStatus(422);
    }

    public function test_the_average_is_taken_across_students(): void
    {
        $tutor = $this->tutor();

        foreach ([5, 4] as $rating) {
            $this->signIn($this->taughtBy($tutor));
            $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => $rating]);
        }

        $this->getJson('/api/v1/tutors/'.$tutor->id.'/reviews')
            ->assertOk()
            ->assertJsonPath('summary.average', 4.5)
            ->assertJsonPath('summary.count', 2);
    }

    public function test_an_unrated_tutor_has_no_rating_rather_than_zero(): void
    {
        $tutor = $this->tutor();
        $this->signIn(User::factory()->create());

        $this->getJson('/api/v1/tutors/'.$tutor->id.'/reviews')
            ->assertOk()
            ->assertJsonPath('summary.average', null)
            ->assertJsonPath('summary.count', 0);
    }

    public function test_the_rating_shows_on_the_tutor_listing(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 4]);

        $this->getJson('/api/v1/tutors')
            ->assertOk()
            ->assertJsonPath('data.0.rating', 4)
            ->assertJsonPath('data.0.rating_count', 1);
    }

    public function test_the_rating_shows_on_the_tutors_own_dashboard(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));
        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5]);

        $this->signIn($tutor);

        $this->getJson('/api/v1/tutor/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.rating', 5)
            ->assertJsonPath('stats.rating_count', 1);
    }

    public function test_a_student_can_withdraw_their_own_review(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));

        $id = $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 2])
            ->assertCreated()
            ->json('data.id');

        $this->deleteJson('/api/v1/reviews/'.$id)
            ->assertOk()
            ->assertJsonPath('summary.count', 0);
    }

    public function test_one_student_cannot_withdraw_anothers_review(): void
    {
        $tutor = $this->tutor();
        $this->signIn($this->taughtBy($tutor));

        $id = $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 2])
            ->json('data.id');

        $this->signIn($this->taughtBy($tutor));
        $this->deleteJson('/api/v1/reviews/'.$id)->assertNotFound();

        $this->assertSame(1, Review::count());
    }

    public function test_the_dashboard_lists_tutors_still_awaiting_a_review(): void
    {
        $tutor = $this->tutor();
        $student = $this->signIn($this->taughtBy($tutor));

        $this->getJson('/api/v1/reviews/mine')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonCount(1, 'awaiting_review')
            ->assertJsonPath('awaiting_review.0.id', $tutor->id);

        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5]);

        // Once rated, the tutor moves out of the prompt.
        $this->getJson('/api/v1/reviews/mine')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonCount(0, 'awaiting_review');

        $this->assertSame($student->id, Review::first()->student_id);
    }

    public function test_a_tutor_can_rate_a_student_they_taught(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        $this->signIn($tutor);

        $this->postJson('/api/v1/reviews', [
            'student_id' => $student->id,
            'rating' => 4,
            'comment' => 'Great to work with.',
        ])->assertCreated()->assertJsonPath('summary.average', 4);

        // It shows as the student's rating, and does not touch the tutor's.
        $this->getJson('/api/v1/users/'.$student->id.'/profile')
            ->assertOk()
            ->assertJsonPath('student_rating.average', 4)
            ->assertJsonPath('student_rating.count', 1)
            ->assertJsonPath('tutor_rating.count', 0);
    }

    public function test_a_tutor_cannot_rate_a_student_they_never_taught(): void
    {
        $tutor = $this->tutor();
        $stranger = User::factory()->create();

        $this->signIn($tutor);

        $this->postJson('/api/v1/reviews', ['student_id' => $stranger->id, 'rating' => 1])
            ->assertStatus(422);
    }

    public function test_the_two_directions_are_independent(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        // Student rates tutor 5, tutor rates student 2 — separate rows.
        $this->signIn($student);
        $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5])->assertCreated();

        $this->signIn($tutor);
        $this->postJson('/api/v1/reviews', ['student_id' => $student->id, 'rating' => 2])->assertCreated();

        $this->getJson('/api/v1/users/'.$tutor->id.'/profile')
            ->assertOk()
            ->assertJsonPath('tutor_rating.average', 5)
            ->assertJsonPath('student_rating.count', 0);

        $this->getJson('/api/v1/users/'.$student->id.'/profile')
            ->assertOk()
            ->assertJsonPath('student_rating.average', 2)
            ->assertJsonPath('tutor_rating.count', 0);
    }

    public function test_a_students_rating_does_not_leak_into_the_tutor_listing(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        // The tutor rates the student; the tutor's own listing rating stays empty.
        $this->signIn($tutor);
        $this->postJson('/api/v1/reviews', ['student_id' => $student->id, 'rating' => 1])->assertCreated();

        $this->getJson('/api/v1/tutors')
            ->assertOk()
            ->assertJsonPath('data.0.rating', null);
    }

    public function test_the_profile_tells_a_tutor_they_may_rate_a_taught_student(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        $this->signIn($tutor);

        $this->getJson('/api/v1/users/'.$student->id.'/profile')
            ->assertOk()
            ->assertJsonPath('review.can_review', true)
            ->assertJsonPath('review.direction', 'tutor_to_student');
    }

    public function test_a_student_cannot_delete_a_rating_a_tutor_gave_them(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        // The tutor rates the student.
        $this->signIn($tutor);
        $id = $this->postJson('/api/v1/reviews', ['student_id' => $student->id, 'rating' => 2])
            ->assertCreated()
            ->json('data.id');

        // The student it is about may not make it disappear.
        $this->signIn($student);
        $this->deleteJson("/api/v1/reviews/{$id}")->assertNotFound();

        $this->assertDatabaseHas('reviews', ['id' => $id]);
    }

    public function test_a_tutor_can_withdraw_a_rating_they_gave_a_student(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        $this->signIn($tutor);
        $id = $this->postJson('/api/v1/reviews', ['student_id' => $student->id, 'rating' => 4])
            ->assertCreated()
            ->json('data.id');

        $this->deleteJson("/api/v1/reviews/{$id}")->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $id]);
    }

    public function test_a_student_can_still_withdraw_their_own_review_of_a_tutor(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        $this->signIn($student);
        $id = $this->postJson('/api/v1/reviews', ['tutor_id' => $tutor->id, 'rating' => 5])
            ->assertCreated()
            ->json('data.id');

        $this->deleteJson("/api/v1/reviews/{$id}")->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $id]);
    }

    public function test_a_rating_a_tutor_gave_is_not_counted_as_one_the_student_wrote(): void
    {
        $tutor = $this->tutor();
        $student = $this->taughtBy($tutor);

        // Only the tutor has said anything so far.
        $this->signIn($tutor);
        $this->postJson('/api/v1/reviews', ['student_id' => $student->id, 'rating' => 3])->assertCreated();

        $this->signIn($student);

        $this->getJson('/api/v1/reviews/mine')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            // So the tutor is still waiting for the student's review.
            ->assertJsonCount(1, 'awaiting_review')
            ->assertJsonPath('awaiting_review.0.id', $tutor->id);

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.reviews_written', 0)
            ->assertJsonPath('stats.reviews_pending', 1);
    }

    public function test_a_tutor_whose_teaching_has_ended_can_still_be_reviewed_and_is_prompted_for(): void
    {
        $tutor = $this->tutor();
        $student = User::factory()->create();

        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $tutor->id,
            'status' => TuitionRequest::STATUS_ENDED,
            'responded_at' => now()->subMonths(3),
            'ended_at' => now()->subMonth(),
        ]);

        $this->signIn($student);

        $this->getJson('/api/v1/reviews/mine')
            ->assertOk()
            ->assertJsonCount(1, 'awaiting_review');

        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.reviews_pending', 1);
    }

    public function test_reviews_pending_counts_tutors_not_arithmetic(): void
    {
        // Reviewed one past tutor, one current tutor not yet reviewed.
        $past = $this->tutor();
        $current = $this->tutor();
        $student = User::factory()->create();

        TuitionRequest::factory()->create([
            'student_id' => $student->id,
            'tutor_id' => $past->id,
            'status' => TuitionRequest::STATUS_ENDED,
            'responded_at' => now()->subMonths(4),
            'ended_at' => now()->subMonths(2),
        ]);
        TuitionRequest::factory()->accepted()->create(['student_id' => $student->id, 'tutor_id' => $current->id]);

        $this->signIn($student);
        $this->postJson('/api/v1/reviews', ['tutor_id' => $past->id, 'rating' => 5])->assertCreated();

        // Current tutors (1) minus reviews written (1) used to say nothing
        // was pending; the current tutor is.
        $this->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.reviews_written', 1)
            ->assertJsonPath('stats.reviews_pending', 1);
    }
}
