<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Category;
use App\Models\Channel;
use App\Services\Streaming\StreamKeyManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CreatorDashboardController extends Controller
{
    public function show(Request $request, StreamKeyManager $streamKeys): Response
    {
        $channel = $request->user()
            ->channel()
            ->with(['category', 'liveBroadcast', 'streamKey'])
            ->first();

        return Inertia::render('dashboard', [
            'channel' => $channel ? $this->channelPayload($channel) : null,
            'plainStreamKey' => session('plain_stream_key'),
            'streaming' => [
                'ingestServer' => $streamKeys->ingestServer(),
                'tokenizedPath' => $channel && session('plain_stream_key')
                    ? $streamKeys->tokenizedPath($channel, (string) session('plain_stream_key'))
                    : null,
            ],
            'categories' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ]),
            'recentBroadcasts' => $channel
                ? $channel->broadcasts()->with('vod')->latest()->limit(10)->get()->map(fn (Broadcast $broadcast) => [
                    'id' => $broadcast->id,
                    'title' => $broadcast->title,
                    'status' => $broadcast->status,
                    'recording_enabled' => $broadcast->recording_enabled,
                    'started_at' => $broadcast->started_at?->toIso8601String(),
                    'ended_at' => $broadcast->ended_at?->toIso8601String(),
                    'has_vod' => $broadcast->vod !== null,
                ])
                : [],
        ]);
    }

    public function storeChannel(Request $request, StreamKeyManager $streamKeys): RedirectResponse
    {
        abort_if($request->user()->channel()->exists(), 422, 'This account already owns a channel.');

        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:80'],
            'slug' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash:ascii', 'lowercase', 'unique:channels,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['nullable', 'exists:categories,id'],
        ]);

        $channel = $request->user()->channel()->create([
            ...$validated,
            'display_name' => trim($validated['display_name']),
            'slug' => Str::slug($validated['slug']),
        ]);

        $plainStreamKey = $streamKeys->rotate($channel);

        return redirect()
            ->route('dashboard')
            ->with('plain_stream_key', $plainStreamKey)
            ->with('success', 'Channel created. Save the stream key now; it will not be shown again.');
    }

    public function updateChannel(Request $request): RedirectResponse
    {
        $channel = $request->user()->channel;

        abort_unless($channel, 404);

        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:80'],
            'slug' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash:ascii', 'lowercase', Rule::unique('channels', 'slug')->ignore($channel)],
            'description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['nullable', 'exists:categories,id'],
        ]);

        $channel->update([
            ...$validated,
            'display_name' => trim($validated['display_name']),
            'slug' => Str::slug($validated['slug']),
        ]);

        return back()->with('success', 'Channel updated.');
    }

    public function rotateStreamKey(Request $request, StreamKeyManager $streamKeys): RedirectResponse
    {
        $channel = $request->user()->channel;

        abort_unless($channel, 404);

        $plainStreamKey = $streamKeys->rotate($channel);

        return back()
            ->with('plain_stream_key', $plainStreamKey)
            ->with('success', 'Stream key rotated. Update OBS before going live again.');
    }

    public function storeBroadcast(Request $request): RedirectResponse
    {
        $channel = $request->user()->channel;

        abort_unless($channel, 404);
        abort_if($channel->isSuspended(), 403);
        abort_if(
            $channel->broadcasts()->whereIn('status', [Broadcast::STATUS_PENDING, Broadcast::STATUS_LIVE])->exists(),
            422,
            'Finish the current broadcast before creating another.',
        );

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'recording_enabled' => ['nullable', 'boolean'],
        ]);

        $channel->broadcasts()->create([
            'title' => $validated['title'],
            'status' => Broadcast::STATUS_PENDING,
            'recording_enabled' => (bool) ($validated['recording_enabled'] ?? false),
            'mediamtx_path' => $channel->slug,
        ]);

        return back()->with('success', 'Broadcast is ready. Start streaming from OBS.');
    }

    public function stopBroadcast(Request $request, Broadcast $broadcast): RedirectResponse
    {
        abort_unless($broadcast->channel->user_id === $request->user()->id, 403);

        $broadcast->forceFill([
            'status' => Broadcast::STATUS_ENDED,
            'ended_at' => $broadcast->ended_at ?? now(),
        ])->save();

        $broadcast->channel->forceFill([
            'is_live' => false,
            'viewer_count' => 0,
            'live_broadcast_id' => null,
        ])->save();

        return back()->with('success', 'Broadcast ended.');
    }

    private function channelPayload(Channel $channel): array
    {
        return [
            'id' => $channel->id,
            'slug' => $channel->slug,
            'display_name' => $channel->display_name,
            'description' => $channel->description,
            'is_live' => $channel->is_live,
            'viewer_count' => $channel->viewer_count,
            'stream_key_last_used_at' => $channel->streamKey?->last_used_at?->toIso8601String(),
            'category_id' => $channel->category_id,
            'live_broadcast' => $channel->liveBroadcast ? [
                'id' => $channel->liveBroadcast->id,
                'title' => $channel->liveBroadcast->title,
                'status' => $channel->liveBroadcast->status,
                'hls_url' => $channel->liveBroadcast->hls_url,
                'recording_enabled' => $channel->liveBroadcast->recording_enabled,
                'started_at' => $channel->liveBroadcast->started_at?->toIso8601String(),
            ] : null,
        ];
    }
}
