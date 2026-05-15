<?php

namespace Tests\Feature;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_exposes_channel_display_media_props(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $channel = Channel::factory()->create([
            'avatar_path' => 'channels/demo/avatar.jpg',
            'thumbnail_path' => 'channels/demo/thumb.jpg',
            'is_live' => true,
        ]);
        $broadcast = Broadcast::factory()->for($channel)->live()->create();
        $channel->forceFill(['live_broadcast_id' => $broadcast->id])->save();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('liveBroadcasts.0.channel.thumbnail_url', '/storage/channels/demo/thumb.jpg')
                ->where('channels.0.avatar_url', '/storage/channels/demo/avatar.jpg')
                ->where('channels.0.thumbnail_url', '/storage/channels/demo/thumb.jpg'),
            );
    }
}
