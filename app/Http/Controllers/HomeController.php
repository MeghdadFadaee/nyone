<?php

namespace App\Http\Controllers;

use App\Enums\ChannelCategory;
use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $liveChannels = Channel::query()
            ->where('is_live', true)
            ->whereNull('suspended_at')
            ->with(['liveBroadcast', 'user'])
            ->withCount('follows')
            ->orderByDesc('viewer_count')
            ->latest()
            ->limit(24)
            ->get()
            ->map(fn (Channel $channel) => $this->channelCard($channel));

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'liveChannels' => $liveChannels,
            'categories' => ChannelCategory::options(),
        ]);
    }

    private function channelCard(Channel $channel): array
    {
        return [
            'id' => $channel->id,
            'slug' => $channel->slug,
            'display_name' => $channel->display_name,
            'description' => $channel->description,
            'thumbnail_path' => $channel->thumbnail_path,
            'thumbnail_url' => $this->mediaUrl($channel->thumbnail_path),
            'avatar_url' => $this->mediaUrl($channel->avatar_path),
            'banner_url' => $this->mediaUrl($channel->banner_path),
            'viewer_count' => $channel->viewer_count,
            'followers_count' => $channel->follows_count ?? 0,
            'category' => $channel->category?->toOption(),
            'broadcast' => $channel->liveBroadcast ? [
                'id' => $channel->liveBroadcast->id,
                'title' => $channel->liveBroadcast->title,
                'started_at' => $channel->liveBroadcast->started_at?->toIso8601String(),
            ] : null,
            'owner' => [
                'id' => $channel->user->id,
                'name' => $channel->user->name,
            ],
        ];
    }

    private function mediaUrl(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }
}
