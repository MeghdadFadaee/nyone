<?php

namespace Tests\Feature;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\PlatformSetting;
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

    public function test_admin_dashboard_exposes_channel_creation_controls(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $creator = User::factory()->create(['can_create_channel' => true]);
        Channel::factory()->for($creator)->create(['display_name' => 'Creator One']);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('channelCreationPolicy.channel_creation_open', false)
                ->where('users.0.id', $creator->id)
                ->where('users.0.can_create_channel', true)
                ->where('users.0.channel.display_name', 'Creator One'),
            );
    }

    public function test_admin_can_update_channel_creation_default(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->patch(route('admin.channel-creation.update'), [
                'channel_creation_open' => true,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue(PlatformSetting::current()->channel_creation_open);
    }

    public function test_admin_can_grant_user_channel_creation_access(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['can_create_channel' => false]);

        $this->actingAs($admin)
            ->patch(route('admin.users.creator-access.update', $user), [
                'can_create_channel' => true,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue($user->refresh()->can_create_channel);
    }

    public function test_non_admin_cannot_update_user_channel_creation_access(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('admin.users.creator-access.update', $target), [
                'can_create_channel' => true,
            ])
            ->assertForbidden();

        $this->assertFalse($target->refresh()->can_create_channel);
    }
}
