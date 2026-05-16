<?php

namespace Tests\Feature;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ViewerInteractionTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_follow_channel(): void
    {
        $viewer = User::factory()->create();
        $channel = Channel::factory()->create(['slug' => 'demo']);

        $this->actingAs($viewer)
            ->post(route('channels.follow', $channel))
            ->assertRedirect();

        $this->assertDatabaseHas('follows', [
            'channel_id' => $channel->id,
            'user_id' => $viewer->id,
        ]);
    }

    public function test_authenticated_user_can_chat_while_channel_is_live(): void
    {
        $viewer = User::factory()->create([
            'avatar_path' => 'users/demo/avatar.jpg',
        ]);
        $channel = Channel::factory()->create(['slug' => 'demo', 'is_live' => true]);
        $broadcast = Broadcast::factory()->for($channel)->live()->create();
        $channel->forceFill(['live_broadcast_id' => $broadcast->id])->save();

        $this->actingAs($viewer)
            ->post(route('channels.chat.store', $channel), [
                'body' => 'Hello chat',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('chat_messages', [
            'channel_id' => $channel->id,
            'broadcast_id' => $broadcast->id,
            'user_id' => $viewer->id,
            'body' => 'Hello chat',
        ]);

        $this->actingAs($viewer)
            ->get(route('channels.show', $channel))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('channels/show')
                ->where('chatMessages.0.user.avatar_url', '/storage/users/demo/avatar.jpg'),
            );
    }

    public function test_anonymous_users_can_watch_channel_page_but_not_chat(): void
    {
        $channel = Channel::factory()->create(['slug' => 'demo']);

        $this->get(route('channels.show', $channel))->assertOk();

        $this->post(route('channels.chat.store', $channel), [
            'body' => 'No auth',
        ])->assertRedirect(route('login'));
    }

    public function test_channel_page_exposes_display_media_props(): void
    {
        $channel = Channel::factory()->create([
            'slug' => 'demo',
            'avatar_path' => 'channels/demo/avatar.jpg',
            'banner_path' => 'channels/demo/banner.jpg',
            'thumbnail_path' => 'channels/demo/thumb.jpg',
        ]);

        $this->get(route('channels.show', $channel))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('channels/show')
                ->where('channel.avatar_url', '/storage/channels/demo/avatar.jpg')
                ->where('channel.banner_url', '/storage/channels/demo/banner.jpg')
                ->where('channel.thumbnail_url', '/storage/channels/demo/thumb.jpg'),
            );
    }
}
