<?php

namespace App\Services\Streaming;

use App\Models\Broadcast;
use App\Models\Channel;

class MediaMtxViewerCountSynchronizer
{
    public function __construct(
        private readonly MediaMtxApiClient $mediaMtx,
        private readonly ViewerCountStore $viewerCounts,
        private readonly PlaybackViewerSigner $playbackViewers,
    ) {}

    /**
     * @return array{channels: int, viewers: int}
     */
    public function sync(): array
    {
        $sessionsByPath = $this->sessionsByPath($this->mediaMtx->hlsSessions());
        $liveChannels = Channel::query()
            ->where('is_live', true)
            ->with('liveBroadcast:id,viewer_peak')
            ->get(['id', 'slug', 'live_broadcast_id', 'viewer_count']);

        $totalViewers = 0;

        foreach ($liveChannels as $channel) {
            $count = $this->uniqueViewerCount($channel, $sessionsByPath[$channel->slug] ?? []);
            $totalViewers += $count;

            $this->viewerCounts->put($channel, $count);

            if ($channel->viewer_count !== $count) {
                $channel->forceFill(['viewer_count' => $count])->save();
            }

            if ($count > 0 && $channel->live_broadcast_id) {
                Broadcast::query()
                    ->whereKey($channel->live_broadcast_id)
                    ->where('viewer_peak', '<', $count)
                    ->update(['viewer_peak' => $count]);
            }
        }

        Channel::query()
            ->where('is_live', false)
            ->where('viewer_count', '>', 0)
            ->get(['id', 'viewer_count'])
            ->each(function (Channel $channel): void {
                $this->viewerCounts->forget($channel);
                $channel->forceFill(['viewer_count' => 0])->save();
            });

        return [
            'channels' => $liveChannels->count(),
            'viewers' => $totalViewers,
        ];
    }

    /**
     * @param  array<int, array{id: string, path: string, query: string, is_cdn: bool}>  $sessions
     * @return array<string, array<int, array{id: string, path: string, query: string, is_cdn: bool}>>
     */
    private function sessionsByPath(array $sessions): array
    {
        $grouped = [];

        foreach ($sessions as $session) {
            if ($session['is_cdn']) {
                continue;
            }

            $grouped[$session['path']][] = $session;
        }

        return $grouped;
    }

    /**
     * @param  array<int, array{id: string, path: string, query: string, is_cdn: bool}>  $sessions
     */
    private function uniqueViewerCount(Channel $channel, array $sessions): int
    {
        $viewerKeys = [];

        foreach ($sessions as $session) {
            $viewerKey = $this->playbackViewers->viewerKeyFromQuery(
                $session['query'],
                $channel,
                $channel->liveBroadcast,
            ) ?? "session:{$session['id']}";

            $viewerKeys[$viewerKey] = true;
        }

        return count($viewerKeys);
    }
}
