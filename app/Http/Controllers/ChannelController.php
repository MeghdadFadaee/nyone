<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\ChatMessage;
use App\Models\Vod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChannelController extends Controller
{
    public function show(Request $request, Channel $channel): Response
    {
        abort_if($channel->isSuspended(), 404);

        $channel->load(['category', 'liveBroadcast', 'user']);
        $channel->loadCount('follows');

        $currentBroadcast = $channel->liveBroadcast;

        return Inertia::render('channels/show', [
            'channel' => [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'display_name' => $channel->display_name,
                'description' => $channel->description,
                'is_live' => $channel->is_live,
                'viewer_count' => $channel->viewer_count,
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
            'currentBroadcast' => $currentBroadcast ? [
                'id' => $currentBroadcast->id,
                'title' => $currentBroadcast->title,
                'hls_url' => $currentBroadcast->hls_url,
                'recording_enabled' => $currentBroadcast->recording_enabled,
                'started_at' => $currentBroadcast->started_at?->toIso8601String(),
            ] : null,
            'vods' => $channel->vods()
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
            'chatMessages' => ChatMessage::query()
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
                    ],
                ]),
            'isFollowing' => $request->user()
                ? $channel->follows()->where('user_id', $request->user()->id)->exists()
                : false,
        ]);
    }
}
