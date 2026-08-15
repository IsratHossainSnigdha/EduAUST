<?php

namespace Database\Factories;

use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutorProfile>
 */
class TutorProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'headline' => fake()->sentence(4),
            'bio' => fake()->paragraph(),
            'hourly_rate' => fake()->numberBetween(300, 900),
            'experience_years' => fake()->numberBetween(1, 6),
            'student_count' => fake()->numberBetween(0, 60),
            'languages' => ['English', 'Bangla'],
            'is_available' => true,
        ];
    }

    /**
     * Indicate that the tutor is not currently taking students.
     */
    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }

    /**
     * Set the languages the tutor teaches in.
     *
     * @param  array<int, string>  $languages
     */
    public function speaking(array $languages): static
    {
        return $this->state(fn (array $attributes) => [
            'languages' => $languages,
        ]);
    }
}
