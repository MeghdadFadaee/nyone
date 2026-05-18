<?php

namespace Tests\Feature;

use App\Enums\ChannelCategory;
use App\Models\Channel;
use App\Models\PlatformSetting;
use App\Models\StreamKey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreatorChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_creator_access_can_create_one_channel_and_receives_one_time_stream_key(): void
    {
        $user = User::factory()->create(['can_create_channel' => true]);

        $response = $this->actingAs($user)->post(route('creator.channel.store'), [
            'display_name' => 'Nyone Live',
            'slug' => 'nyone-live',
            'description' => 'Live builds and demos.',
            'category' => ChannelCategory::Creative->value,
        ]);

        $response
            ->assertRedirect(route('dashboard', absolute: false))
            ->assertSessionHas('plain_stream_key');

        $this->assertDatabaseHas(Channel::class, [
            'user_id' => $user->id,
            'slug' => 'nyone-live',
            'display_name' => 'Nyone Live',
            'category' => ChannelCategory::Creative->value,
        ]);

        $this->assertDatabaseCount(StreamKey::class, 1);
    }

    public function test_user_without_creator_access_cannot_create_channel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('creator.channel.store'), [
            'display_name' => 'Nyone Live',
            'slug' => 'nyone-live',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing(Channel::class, [
            'user_id' => $user->id,
        ]);
    }

    public function test_channel_creation_can_be_opened_by_default(): void
    {
        PlatformSetting::current()->forceFill([
            'channel_creation_open' => true,
        ])->save();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('creator.channel.store'), [
            'display_name' => 'Nyone Live',
            'slug' => 'nyone-live',
        ]);

        $response
            ->assertRedirect(route('dashboard', absolute: false))
            ->assertSessionHas('plain_stream_key');

        $this->assertDatabaseHas(Channel::class, [
            'user_id' => $user->id,
            'slug' => 'nyone-live',
        ]);
    }

    public function test_user_cannot_create_more_than_one_channel(): void
    {
        $user = User::factory()->create(['can_create_channel' => true]);
        Channel::factory()->for($user)->create();

        $response = $this->actingAs($user)->post(route('creator.channel.store'), [
            'display_name' => 'Second Channel',
            'slug' => 'second-channel',
        ]);

        $response->assertUnprocessable();
    }
}
