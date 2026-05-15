<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Channel;
use App\Models\StreamKey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreatorChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_one_channel_and_receives_one_time_stream_key(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($user)->post(route('creator.channel.store'), [
            'display_name' => 'Nyone Live',
            'slug' => 'nyone-live',
            'description' => 'Live builds and demos.',
            'category_id' => $category->id,
        ]);

        $response
            ->assertRedirect(route('dashboard', absolute: false))
            ->assertSessionHas('plain_stream_key');

        $this->assertDatabaseHas(Channel::class, [
            'user_id' => $user->id,
            'slug' => 'nyone-live',
            'display_name' => 'Nyone Live',
            'category_id' => $category->id,
        ]);

        $this->assertDatabaseCount(StreamKey::class, 1);
    }

    public function test_user_cannot_create_more_than_one_channel(): void
    {
        $user = User::factory()->create();
        Channel::factory()->for($user)->create();

        $response = $this->actingAs($user)->post(route('creator.channel.store'), [
            'display_name' => 'Second Channel',
            'slug' => 'second-channel',
        ]);

        $response->assertUnprocessable();
    }
}
