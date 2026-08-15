<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TutorListingTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();

        $this->withToken(app(JwtService::class)->tokensFor($user)['access_token']);

        return $user;
    }

    /**
     * Build a listable tutor, optionally with subjects attached.
     *
     * @param  array<string, mixed>  $attributes
     * @param  array<int, Subject>  $subjects
     */
    private function tutor(array $attributes = [], array $subjects = [], ?User $user = null): TutorProfile
    {
        $tutor = TutorProfile::factory()
            ->for($user ?: User::factory())
            ->create($attributes);

        if ($subjects !== []) {
            $tutor->subjects()->attach(collect($subjects)->pluck('id'));
        }

        return $tutor;
    }

    /**
     * @return array<int, string>
     */
    private function names(array $body): array
    {
        return array_column($body['data'], 'name');
    }

    public function test_the_listing_requires_authentication(): void
    {
        $this->getJson('/api/v1/tutors')->assertUnauthorized();
        $this->getJson('/api/v1/tutors/filters')->assertUnauthorized();
    }

    public function test_it_lists_available_tutors(): void
    {
        $this->actingAsUser();
        $subject = Subject::factory()->named('Data Structures')->create();
        $this->tutor(['headline' => 'DSA tutor'], [$subject]);

        $response = $this->getJson('/api/v1/tutors')->assertOk();

        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.headline', 'DSA tutor')
            ->assertJsonPath('data.0.subjects.0.name', 'Data Structures')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_unavailable_tutors_are_hidden(): void
    {
        $this->actingAsUser();
        $this->tutor(['is_available' => false]);

        $this->getJson('/api/v1/tutors')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_tutors_with_unverified_accounts_are_hidden(): void
    {
        $this->actingAsUser();
        $this->tutor(user: User::factory()->unverified()->create());

        $this->getJson('/api/v1/tutors')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_a_tutor_is_not_shown_their_own_card(): void
    {
        $me = $this->actingAsUser();
        $this->tutor(user: $me);
        $this->tutor();

        $this->getJson('/api/v1/tutors')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_search_matches_the_tutor_name(): void
    {
        $this->actingAsUser();
        $this->tutor(user: User::factory()->create(['name' => 'Nusrat Jahan']));
        $this->tutor(user: User::factory()->create(['name' => 'Rafi Ahmed']));

        $body = $this->getJson('/api/v1/tutors?search=nusrat')->assertOk()->json();

        $this->assertSame(['Nusrat Jahan'], $this->names($body));
    }

    public function test_search_matches_a_subject_name(): void
    {
        $this->actingAsUser();
        $calculus = Subject::factory()->named('Calculus')->create();
        $this->tutor([], [$calculus], User::factory()->create(['name' => 'Meher Afroz']));
        $this->tutor(user: User::factory()->create(['name' => 'Rafi Ahmed']));

        $body = $this->getJson('/api/v1/tutors?search=calc')->assertOk()->json();

        $this->assertSame(['Meher Afroz'], $this->names($body));
    }

    public function test_a_wildcard_search_term_is_treated_literally(): void
    {
        $this->actingAsUser();
        $this->tutor(user: User::factory()->create(['name' => 'Nusrat Jahan']));

        // "%" must not behave as a LIKE wildcard matching every tutor.
        $this->getJson('/api/v1/tutors?search=%')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_it_filters_by_subject(): void
    {
        $this->actingAsUser();
        $physics = Subject::factory()->named('Physics')->create();
        $calculus = Subject::factory()->named('Calculus')->create();

        $this->tutor([], [$physics], User::factory()->create(['name' => 'Physics Tutor']));
        $this->tutor([], [$calculus], User::factory()->create(['name' => 'Calculus Tutor']));

        $body = $this->getJson("/api/v1/tutors?subject_id={$physics->id}")->assertOk()->json();

        $this->assertSame(['Physics Tutor'], $this->names($body));
    }

    public function test_it_filters_by_department(): void
    {
        $this->actingAsUser();
        $cse = Department::factory()->create();
        $eee = Department::factory()->create();

        $this->tutor(user: User::factory()->create(['name' => 'CSE Tutor', 'department_id' => $cse->id]));
        $this->tutor(user: User::factory()->create(['name' => 'EEE Tutor', 'department_id' => $eee->id]));

        $body = $this->getJson("/api/v1/tutors?department_id={$cse->id}")->assertOk()->json();

        $this->assertSame(['CSE Tutor'], $this->names($body));
    }

    public function test_it_filters_by_language(): void
    {
        $this->actingAsUser();
        TutorProfile::factory()->speaking(['Bangla'])->for(User::factory()->create(['name' => 'Bangla Tutor']))->create();
        TutorProfile::factory()->speaking(['English'])->for(User::factory()->create(['name' => 'English Tutor']))->create();

        $body = $this->getJson('/api/v1/tutors?language=Bangla')->assertOk()->json();

        $this->assertSame(['Bangla Tutor'], $this->names($body));
    }

    public function test_it_filters_by_minimum_experience_and_students(): void
    {
        $this->actingAsUser();
        $this->tutor(['experience_years' => 5, 'student_count' => 40], [], User::factory()->create(['name' => 'Senior']));
        $this->tutor(['experience_years' => 1, 'student_count' => 3], [], User::factory()->create(['name' => 'Junior']));

        $this->assertSame(
            ['Senior'],
            $this->names($this->getJson('/api/v1/tutors?min_experience=3')->assertOk()->json())
        );

        $this->assertSame(
            ['Senior'],
            $this->names($this->getJson('/api/v1/tutors?min_students=10')->assertOk()->json())
        );
    }

    public function test_filters_combine(): void
    {
        $this->actingAsUser();
        $physics = Subject::factory()->named('Physics')->create();
        $department = Department::factory()->create();

        $this->tutor(
            ['experience_years' => 5],
            [$physics],
            User::factory()->create(['name' => 'Match', 'department_id' => $department->id])
        );
        // Right subject and department, but not enough experience.
        $this->tutor(
            ['experience_years' => 1],
            [$physics],
            User::factory()->create(['name' => 'Too Junior', 'department_id' => $department->id])
        );

        $body = $this->getJson(
            "/api/v1/tutors?subject_id={$physics->id}&department_id={$department->id}&min_experience=3"
        )->assertOk()->json();

        $this->assertSame(['Match'], $this->names($body));
    }

    public function test_it_sorts_by_experience_students_and_rate(): void
    {
        $this->actingAsUser();
        $this->tutor(['experience_years' => 2, 'student_count' => 50, 'hourly_rate' => 900], [], User::factory()->create(['name' => 'Popular']));
        $this->tutor(['experience_years' => 6, 'student_count' => 5, 'hourly_rate' => 300], [], User::factory()->create(['name' => 'Experienced']));

        $this->assertSame(
            ['Experienced', 'Popular'],
            $this->names($this->getJson('/api/v1/tutors?sort=experience')->assertOk()->json())
        );

        $this->assertSame(
            ['Popular', 'Experienced'],
            $this->names($this->getJson('/api/v1/tutors?sort=students')->assertOk()->json())
        );

        $this->assertSame(
            ['Experienced', 'Popular'],
            $this->names($this->getJson('/api/v1/tutors?sort=rate_asc')->assertOk()->json())
        );

        $this->assertSame(
            ['Popular', 'Experienced'],
            $this->names($this->getJson('/api/v1/tutors?sort=rate_desc')->assertOk()->json())
        );
    }

    public function test_the_default_sort_puts_the_most_taught_tutors_first(): void
    {
        $this->actingAsUser();
        $this->tutor(['student_count' => 5], [], User::factory()->create(['name' => 'Quiet']));
        $this->tutor(['student_count' => 60], [], User::factory()->create(['name' => 'Busy']));

        $this->assertSame(
            ['Busy', 'Quiet'],
            $this->names($this->getJson('/api/v1/tutors')->assertOk()->json())
        );
    }

    public function test_it_paginates_without_repeating_tutors_across_pages(): void
    {
        $this->actingAsUser();
        // Identical sort values force the tiebreaker to do the work.
        TutorProfile::factory()->count(5)->create(['student_count' => 10]);

        $first = $this->getJson('/api/v1/tutors?per_page=2&page=1')->assertOk();
        $second = $this->getJson('/api/v1/tutors?per_page=2&page=2')->assertOk();

        $first->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.current_page', 1);

        $firstIds = array_column($first->json('data'), 'id');
        $secondIds = array_column($second->json('data'), 'id');

        $this->assertEmpty(array_intersect($firstIds, $secondIds));
    }

    public function test_invalid_query_parameters_are_rejected(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/v1/tutors?sort=cheapest')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');

        $this->getJson('/api/v1/tutors?subject_id=99999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('subject_id');

        $this->getJson('/api/v1/tutors?department_id=99999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('department_id');

        $this->getJson('/api/v1/tutors?per_page=500')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');

        $this->getJson('/api/v1/tutors?min_experience=-1')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('min_experience');
    }

    public function test_the_filters_endpoint_returns_the_available_options(): void
    {
        $this->actingAsUser();
        Subject::factory()->named('Calculus')->create();
        Department::factory()->create(['name' => 'Computer Science and Engineering']);
        TutorProfile::factory()->speaking(['Bangla', 'English'])->create();

        $response = $this->getJson('/api/v1/tutors/filters')->assertOk();

        $response->assertJsonPath('subjects.0.name', 'Calculus')
            ->assertJsonStructure([
                'subjects' => [['id', 'name', 'slug']],
                'departments' => [['id', 'name', 'code']],
                'languages',
                'sorts',
            ]);

        $this->assertSame(['Bangla', 'English'], $response->json('languages'));
    }

    public function test_the_listing_does_not_scale_its_query_count_with_page_size(): void
    {
        $this->actingAsUser();
        $subject = Subject::factory()->create();

        foreach (range(1, 5) as $i) {
            $this->tutor([], [$subject]);
        }

        DB::enableQueryLog();
        $this->getJson('/api/v1/tutors?per_page=5')->assertOk()->assertJsonCount(5, 'data');
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        // Count + page + the three eager loads, not one query per tutor.
        $this->assertLessThanOrEqual(8, $queries, "Listing ran {$queries} queries; N+1 likely.");
    }
}
