<?php

namespace Database\Factories;

use App\Models\TuitionRequest;
use App\Models\TutoringSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutoringSession>
 */
class TutoringSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tutor = User::factory();
        $student = User::factory();

        return [
            'tuition_request_id' => TuitionRequest::factory()->accepted(),
            'tutor_id' => $tutor,
            'student_id' => $student,
            'scheduled_at' => now()->addDays(3)->setTime(15, 0),
            'duration_minutes' => 60,
            'location' => fake()->randomElement(['Library, 3rd floor', 'CSE Lab 2', 'Online']),
            'note' => null,
            'status' => TutoringSession::STATUS_PROPOSED,
            'proposed_by' => $student,
        ];
    }

    /**
     * A session both sides have agreed to.
     */
    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => TutoringSession::STATUS_CONFIRMED]);
    }

    /**
     * A session that was called off.
     */
    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => TutoringSession::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);
    }

    /**
     * A session whose time has already passed.
     */
    public function past(): static
    {
        return $this->state(fn () => [
            'scheduled_at' => now()->subWeek(),
            'status' => TutoringSession::STATUS_CONFIRMED,
        ]);
    }
}
