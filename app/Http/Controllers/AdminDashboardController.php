<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Vod;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => User::query()->count(),
                'channels' => Channel::query()->count(),
                'live_channels' => Channel::query()->where('is_live', true)->count(),
                'vods' => Vod::query()->count(),
                'creator_access_grants' => User::query()->where('can_create_channel', true)->count(),
            ],
            'channelCreationPolicy' => [
                'channel_creation_open' => PlatformSetting::current()->channel_creation_open,
            ],
            'liveBroadcasts' => Broadcast::query()
                ->where('status', Broadcast::STATUS_LIVE)
                ->with('channel.user')
                ->latest('started_at')
                ->limit(20)
                ->get()
                ->map(fn (Broadcast $broadcast) => [
                    'id' => $broadcast->id,
                    'title' => $broadcast->title,
                    'started_at' => $broadcast->started_at?->toIso8601String(),
                    'channel' => [
                        'id' => $broadcast->channel->id,
                        'slug' => $broadcast->channel->slug,
                        'display_name' => $broadcast->channel->display_name,
                        'thumbnail_url' => $this->mediaUrl($broadcast->channel->thumbnail_path),
                        'owner' => $broadcast->channel->user->name,
                    ],
                ]),
            'channels' => Channel::query()
                ->with('user')
                ->latest()
                ->limit(25)
                ->get()
                ->map(fn (Channel $channel) => [
                    'id' => $channel->id,
                    'slug' => $channel->slug,
                    'display_name' => $channel->display_name,
                    'avatar_url' => $this->mediaUrl($channel->avatar_path),
                    'thumbnail_url' => $this->mediaUrl($channel->thumbnail_path),
                    'is_live' => $channel->is_live,
                    'suspended_at' => $channel->suspended_at?->toIso8601String(),
                    'owner' => [
                        'id' => $channel->user->id,
                        'name' => $channel->user->name,
                    ],
                ]),
            'users' => User::query()
                ->with('channel')
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                    'can_create_channel' => $user->can_create_channel,
                    'suspended_at' => $user->suspended_at?->toIso8601String(),
                    'created_at' => $user->created_at?->toIso8601String(),
                    'channel' => $user->channel ? [
                        'id' => $user->channel->id,
                        'slug' => $user->channel->slug,
                        'display_name' => $user->channel->display_name,
                    ] : null,
                ]),
        ]);
    }

    private function mediaUrl(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }
}
