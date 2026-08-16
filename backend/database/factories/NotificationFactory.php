<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
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
            'audience' => Notification::AUDIENCE_BOTH,
            'category' => fake()->randomElement(Notification::CATEGORIES),
            'title' => fake()->sentence(4),
            'body' => fake()->sentence(12),
            'read_at' => null,
        ];
    }

    /**
     * Address the notification at a single dashboard.
     */
    public function audience(string $audience): static
    {
        return $this->state(fn (array $attributes) => [
            'audience' => $audience,
        ]);
    }

    /**
     * Address the notification at the student dashboard only.
     */
    public function student(): static
    {
        return $this->audience(Notification::AUDIENCE_STUDENT);
    }

    /**
     * Address the notification at the tutor dashboard only.
     */
    public function tutor(): static
    {
        return $this->audience(Notification::AUDIENCE_TUTOR);
    }

    /**
     * Indicate that the notification has already been read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => now(),
        ]);
    }

    /**
     * Place the notification in a specific category.
     */
    public function category(string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category,
        ]);
    }

    /**
     * Pin the notification to a specific creation time, so date grouping can
     * be exercised deterministically.
     */
    public function createdAt(\DateTimeInterface $at): static
    {
        return $this->state(fn (array $attributes) => [
            'created_at' => $at,
            'updated_at' => $at,
        ]);
    }
}
