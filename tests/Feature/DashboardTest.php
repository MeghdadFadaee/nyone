<?php

namespace Tests\Feature;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_home_page_exposes_channel_display_media_props(): void
    {
        $channel = Channel::factory()->create([
            'is_live' => true,
            'avatar_path' => 'channels/demo/avatar.jpg',
            'banner_path' => 'channels/demo/banner.jpg',
            'thumbnail_path' => 'channels/demo/thumb.jpg',
        ]);
        $broadcast = Broadcast::factory()->for($channel)->live()->create();
        $channel->forceFill(['live_broadcast_id' => $broadcast->id])->save();

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('liveChannels.0.avatar_url', '/storage/channels/demo/avatar.jpg')
                ->where('liveChannels.0.banner_url', '/storage/channels/demo/banner.jpg')
                ->where('liveChannels.0.thumbnail_url', '/storage/channels/demo/thumb.jpg'),
            );
    }

    public function test_creator_dashboard_exposes_channel_display_media_props(): void
    {
        $user = User::factory()->create();
        Channel::factory()->for($user)->create([
            'avatar_path' => 'channels/demo/avatar.jpg',
            'banner_path' => 'channels/demo/banner.jpg',
            'thumbnail_path' => 'channels/demo/thumb.jpg',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('channel.avatar_url', '/storage/channels/demo/avatar.jpg')
                ->where('channel.banner_url', '/storage/channels/demo/banner.jpg')
                ->where('channel.thumbnail_url', '/storage/channels/demo/thumb.jpg'),
            );
    }
}
