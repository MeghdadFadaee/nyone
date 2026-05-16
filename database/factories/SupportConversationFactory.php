<?php

namespace Database\Factories;

use App\Models\SupportConversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupportConversation>
 */
class SupportConversationFactory extends Factory
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
            'category' => fake()->randomElement(SupportConversation::categories()),
            'subject' => fake()->sentence(4),
            'status' => SupportConversation::STATUS_OPEN,
            'last_message_at' => now(),
        ];
    }
}
