<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\ChatMessage;
use App\Models\Vod;
use App\Services\Streaming\PlaybackViewerSigner;
use App\Services\Streaming\ViewerCountStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ChannelController extends Controller
{
    public function show(
        Request $request,
        Channel $channel,
        ViewerCountStore $viewerCounts,
        PlaybackViewerSigner $playbackViewers,
    ): Response {
        abort_if($channel->isSuspended(), 404);

        $channel->load(['category', 'liveBroadcast', 'user']);
        $channel->loadCount('follows');

        $currentBroadcast = $channel->liveBroadcast;

        return Inertia::render('channels/show', [
            'channel' => fn () => [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'display_name' => $channel->display_name,
                'description' => $channel->description,
                'avatar_url' => $this->mediaUrl($channel->avatar_path),
                'banner_url' => $this->mediaUrl($channel->banner_path),
                'thumbnail_url' => $this->mediaUrl($channel->thumbnail_path),
                'is_live' => $channel->is_live,
                'viewer_count' => $channel->is_live ? $viewerCounts->current($channel) : 0,
                'followers_count' => $channel->follows_count,
                'category' => $channel->category ? [
                    'id' => $channel->category->id,
                    'name' => $channel->category->name,
                    'slug' => $channel->category->slug,
                ] : null,
                'owner' => [
                    'id' => $channel->user->id,
                    'name' => $channel->user->name,
                ],
            ],
            'currentBroadcast' => fn () => $currentBroadcast ? [
                'id' => $currentBroadcast->id,
                'title' => $currentBroadcast->title,
                'hls_url' => $currentBroadcast->hls_url
                    ? $playbackViewers->signedPlaybackUrl($currentBroadcast->hls_url, $channel, $currentBroadcast, $request)
                    : null,
                'recording_enabled' => $currentBroadcast->recording_enabled,
                'started_at' => $currentBroadcast->started_at?->toIso8601String(),
            ] : null,
            'viewerStats' => fn () => [
                'current' => $channel->is_live ? $viewerCounts->current($channel) : 0,
                'peak' => $currentBroadcast && $channel->is_live
                    ? max($currentBroadcast->viewer_peak, $viewerCounts->current($channel))
                    : 0,
                'refresh_interval_ms' => max(5000, (int) config('streaming.viewer_stats_poll_interval', 30000)),
            ],
            'vods' => fn () => $channel->vods()
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->latest('published_at')
                ->limit(12)
                ->get()
                ->map(fn (Vod $vod) => [
                    'id' => $vod->id,
                    'title' => $vod->title,
                    'playback_url' => $vod->playback_url,
                    'duration_seconds' => $vod->duration_seconds,
                    'published_at' => $vod->published_at?->toIso8601String(),
                    'expires_at' => $vod->expires_at?->toIso8601String(),
                ]),
            'chatMessages' => fn () => ChatMessage::query()
                ->where('channel_id', $channel->id)
                ->when($currentBroadcast, fn ($query) => $query->where('broadcast_id', $currentBroadcast->id))
                ->with('user')
                ->latest()
                ->limit(50)
                ->get()
                ->reverse()
                ->values()
                ->map(fn (ChatMessage $message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'created_at' => $message->created_at?->toIso8601String(),
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'avatar_url' => $message->user->avatar,
                    ],
                ]),
            'isFollowing' => fn () => $request->user() && $channel->follows()->where('user_id', $request->user()->id)->exists(),
        ]);
    }

    private function mediaUrl(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }
}
