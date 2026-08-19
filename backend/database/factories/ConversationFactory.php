<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_one_id' => User::factory(),
            'user_two_id' => User::factory(),
            'last_message_at' => null,
        ];
    }

    /**
     * Build the conversation between two specific users, keeping the pair in
     * the canonical order the unique index expects.
     */
    public function between(User $a, User $b): static
    {
        [$one, $two] = Conversation::orderPair($a->id, $b->id);

        return $this->state(fn (array $attributes) => [
            'user_one_id' => $one,
            'user_two_id' => $two,
        ]);
    }
}
