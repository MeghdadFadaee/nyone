<?php

namespace Tests\Feature;

use App\Enums\ChannelCategory;
use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_creator_dashboard_exposes_channel_creation_access(): void
    {
        $user = User::factory()->create(['can_create_channel' => true]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('canCreateChannel', true),
            );
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

    public function test_home_page_exposes_translated_channel_category_labels(): void
    {
        config(['app.locale' => 'es']);

        Channel::factory()->create([
            'is_live' => true,
            'category' => ChannelCategory::Music,
        ]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('liveChannels.0.category.value', ChannelCategory::Music->value)
                ->where('liveChannels.0.category.label', __('Music', [], 'es'))
                ->where('categories', fn ($categories) => $categories->firstWhere('value', ChannelCategory::Music->value)['label'] === __('Music', [], 'es')),
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

    public function test_creator_can_update_channel_thumbnail(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $channel = Channel::factory()->for($user)->create([
            'thumbnail_path' => 'channels/demo/old-thumb.jpg',
        ]);

        Storage::disk('public')->put($channel->thumbnail_path, 'old thumbnail');

        $this->actingAs($user)
            ->post(route('creator.channel.update'), [
                '_method' => 'PATCH',
                'display_name' => $channel->display_name,
                'slug' => $channel->slug,
                'description' => $channel->description,
                'category' => $channel->category?->value,
                'thumbnail' => UploadedFile::fake()->image('thumbnail.jpg', 1280, 720),
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $channel->refresh();

        $this->assertNotSame('channels/demo/old-thumb.jpg', $channel->thumbnail_path);
        $this->assertStringStartsWith("channels/{$channel->id}/thumbnails/", $channel->thumbnail_path);
        Storage::disk('public')->assertMissing('channels/demo/old-thumb.jpg');
        Storage::disk('public')->assertExists($channel->thumbnail_path);
    }

    public function test_creator_channel_thumbnail_must_be_an_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $channel = Channel::factory()->for($user)->create([
            'thumbnail_path' => 'channels/demo/current-thumb.jpg',
        ]);

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('creator.channel.update'), [
                '_method' => 'PATCH',
                'display_name' => $channel->display_name,
                'slug' => $channel->slug,
                'description' => $channel->description,
                'category' => $channel->category?->value,
                'thumbnail' => UploadedFile::fake()->create('thumbnail.txt', 8, 'text/plain'),
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('thumbnail');

        $this->assertSame('channels/demo/current-thumb.jpg', $channel->refresh()->thumbnail_path);
    }
}
