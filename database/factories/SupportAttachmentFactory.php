<?php

namespace Database\Factories;

use App\Models\SupportAttachment;
use App\Models\SupportMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupportAttachment>
 */
class SupportAttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'support_message_id' => SupportMessage::factory(),
            'disk' => 'local',
            'path' => 'support/testing/debug.log',
            'original_name' => 'debug.log',
            'mime_type' => 'text/plain',
            'size' => 128,
        ];
    }
}
