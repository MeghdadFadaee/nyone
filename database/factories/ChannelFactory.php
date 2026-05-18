<?php

namespace Database\Factories;

use App\Enums\ChannelCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ChannelFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'user_id' => User::factory(),
            'category' => fake()->randomElement(ChannelCategory::cases())->value,
            'slug' => Str::slug($name),
            'display_name' => Str::headline($name),
            'description' => fake()->sentence(),
            'is_live' => false,
            'viewer_count' => 0,
        ];
    }
}
