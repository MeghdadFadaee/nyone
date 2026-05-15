<?php

namespace Database\Factories;

use App\Models\Broadcast;
use App\Models\Channel;
use Illuminate\Database\Eloquent\Factories\Factory;

class BroadcastFactory extends Factory
{
    public function definition(): array
    {
        return [
            'channel_id' => Channel::factory(),
            'title' => fake()->sentence(4),
            'status' => Broadcast::STATUS_PENDING,
            'recording_enabled' => false,
        ];
    }

    public function live(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Broadcast::STATUS_LIVE,
            'started_at' => now(),
            'hls_url' => 'http://localhost:8888/demo/index.m3u8',
        ]);
    }
}
