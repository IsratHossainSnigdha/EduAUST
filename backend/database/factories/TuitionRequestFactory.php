<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\TuitionRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TuitionRequest>
 */
class TuitionRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => User::factory(),
            'tutor_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'level' => fake()->randomElement(['University Level', 'HSC 2nd Year', 'HSC 1st Year']),
            'message' => fake()->sentence(),
            'status' => TuitionRequest::STATUS_PENDING,
        ];
    }

    /**
     * A request the tutor has already accepted.
     */
    public function accepted(): static
    {
        return $this->state(fn () => [
            'status' => TuitionRequest::STATUS_ACCEPTED,
            'responded_at' => now(),
        ]);
    }

    /**
     * A request the tutor has already declined.
     */
    public function declined(): static
    {
        return $this->state(fn () => [
            'status' => TuitionRequest::STATUS_DECLINED,
            'responded_at' => now(),
        ]);
    }
}
