<?php

namespace App\Services\Streaming;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\Vod;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MediaMtxService
{
    public function __construct(private readonly ViewerCountStore $viewerCounts) {}

    public function authorize(array $payload): bool
    {
        $action = (string) ($payload['action'] ?? '');
        $path = $this->extractPath($payload);
        $channel = $this->channelForPath($path);

        if (! $channel || $channel->isSuspended()) {
            return false;
        }

        if (in_array($action, ['read', 'playback'], true)) {
            return true;
        }

        if ($action !== 'publish') {
            return false;
        }

        $token = (string) ($payload['token'] ?? $this->queryValue((string) ($payload['query'] ?? ''), 'token'));

        if ($token === '' || ! $channel->streamKey || $channel->streamKey->revoked_at) {
            return false;
        }

        $authorized = Hash::check($token, $channel->streamKey->key_hash);

        if ($authorized) {
            $channel->streamKey->forceFill(['last_used_at' => now()])->save();
        }

        return $authorized;
    }

    public function markReady(string $path, ?string $sourceType = null, ?string $sourceId = null): ?Broadcast
    {
        $channel = $this->channelForPath($path);

        if (! $channel || $channel->isSuspended()) {
            return null;
        }

        $broadcast = $channel->broadcasts()
            ->where('status', Broadcast::STATUS_PENDING)
            ->latest()
            ->first();

        if (! $broadcast) {
            $broadcast = $channel->broadcasts()->create([
                'title' => 'Untitled live stream',
                'status' => Broadcast::STATUS_PENDING,
                'recording_enabled' => false,
            ]);
        }

        $broadcast->forceFill([
            'status' => Broadcast::STATUS_LIVE,
            'mediamtx_path' => $channel->slug,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'hls_url' => $this->hlsUrl($channel),
            'started_at' => $broadcast->started_at ?? now(),
            'ended_at' => null,
        ])->save();

        $channel->forceFill([
            'is_live' => true,
            'live_broadcast_id' => $broadcast->id,
        ])->save();

        $this->viewerCounts->forget($channel);

        return $broadcast;
    }

    public function markNotReady(string $path): ?Broadcast
    {
        $channel = $this->channelForPath($path);

        if (! $channel) {
            return null;
        }

        $broadcast = $channel->live_broadcast_id
            ? Broadcast::find($channel->live_broadcast_id)
            : $channel->broadcasts()->where('status', Broadcast::STATUS_LIVE)->latest()->first();

        if ($broadcast) {
            $broadcast->forceFill([
                'status' => Broadcast::STATUS_ENDED,
                'ended_at' => $broadcast->ended_at ?? now(),
            ])->save();
        }

        $channel->forceFill([
            'is_live' => false,
            'viewer_count' => 0,
            'live_broadcast_id' => null,
        ])->save();

        $this->viewerCounts->forget($channel);

        return $broadcast;
    }

    public function recordSegmentComplete(string $path, string $segmentPath, ?string $duration = null): ?Vod
    {
        $channel = $this->channelForPath($path);

        if (! $channel) {
            return null;
        }

        $broadcast = $channel->broadcasts()
            ->whereIn('status', [Broadcast::STATUS_LIVE, Broadcast::STATUS_ENDED])
            ->latest('started_at')
            ->first();

        if (! $broadcast || ! $broadcast->recording_enabled) {
            $this->deleteSegmentIfSafe($segmentPath);

            return null;
        }

        return Vod::query()->firstOrCreate(
            ['broadcast_id' => $broadcast->id],
            [
                'channel_id' => $channel->id,
                'title' => $broadcast->title,
                'storage_path' => $segmentPath,
                'duration_seconds' => $this->durationSeconds($duration),
                'size_bytes' => is_file($segmentPath) ? filesize($segmentPath) : null,
                'published_at' => now(),
                'expires_at' => now()->addDays((int) config('streaming.vod_retention_days')),
            ],
        );
    }

    public function hlsUrl(Channel $channel): string
    {
        return rtrim((string) config('streaming.hls_public_url'), '/').'/'.rawurlencode($channel->slug).'/index.m3u8';
    }

    public function extractPath(array $payload): string
    {
        $path = trim((string) ($payload['path'] ?? ''), '/');

        if ($path === '') {
            return '';
        }

        return Str::afterLast($path, '/');
    }

    private function channelForPath(string $path): ?Channel
    {
        if ($path === '') {
            return null;
        }

        return Channel::query()
            ->where('slug', $path)
            ->with(['streamKey', 'user'])
            ->first();
    }

    private function queryValue(string $query, string $key): ?string
    {
        parse_str($query, $values);

        return isset($values[$key]) ? (string) $values[$key] : null;
    }

    private function durationSeconds(?string $duration): ?int
    {
        if ($duration === null || $duration === '') {
            return null;
        }

        preg_match('/[\d.]+/', $duration, $matches);

        return isset($matches[0]) ? (int) round((float) $matches[0]) : null;
    }

    private function deleteSegmentIfSafe(string $segmentPath): void
    {
        if ($segmentPath === '' || ! is_file($segmentPath)) {
            return;
        }

        $recordingsRoot = realpath((string) config('streaming.recordings_path'));
        $segmentRealPath = realpath($segmentPath);

        if (! $recordingsRoot || ! $segmentRealPath || ! Str::startsWith($segmentRealPath, $recordingsRoot)) {
            return;
        }

        @unlink($segmentRealPath);
    }
}
