<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\User;
use App\Models\Vod;
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
                    'is_live' => $channel->is_live,
                    'suspended_at' => $channel->suspended_at?->toIso8601String(),
                    'owner' => [
                        'id' => $channel->user->id,
                        'name' => $channel->user->name,
                    ],
                ]),
        ]);
    }
}
