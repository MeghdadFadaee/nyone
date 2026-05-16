<?php

namespace Tests\Feature;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Services\Streaming\MediaMtxViewerCountSynchronizer;
use App\Services\Streaming\PlaybackViewerSigner;
use App\Services\Streaming\ViewerCountStore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MediaMtxViewerCountSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'streaming.mediamtx_api_url' => 'http://mediamtx.test',
            'streaming.viewer_count_cache_store' => 'array',
            'streaming.viewer_count_ttl' => 10,
        ]);

        Cache::store('array')->flush();
    }

    public function test_it_syncs_hls_session_counts_from_mediamtx(): void
    {
        $channel = Channel::factory()->create([
            'slug' => 'demo',
            'is_live' => true,
            'viewer_count' => 1,
        ]);
        $broadcast = Broadcast::factory()->for($channel)->live()->create(['viewer_peak' => 2]);
        $channel->forceFill(['live_broadcast_id' => $broadcast->id])->save();

        $emptyLiveChannel = Channel::factory()->create([
            'slug' => 'quiet',
            'is_live' => true,
            'viewer_count' => 7,
        ]);
        $emptyBroadcast = Broadcast::factory()->for($emptyLiveChannel)->live()->create(['viewer_peak' => 4]);
        $emptyLiveChannel->forceFill(['live_broadcast_id' => $emptyBroadcast->id])->save();

        $offlineChannel = Channel::factory()->create([
            'slug' => 'offline',
            'is_live' => false,
            'viewer_count' => 5,
        ]);
        $viewerOneQuery = $this->viewerQuery('g:'.str_repeat('a', 64), $channel, $broadcast);
        $viewerTwoQuery = $this->viewerQuery('u:'.str_repeat('b', 64), $channel, $broadcast);
        $wrongBroadcast = Broadcast::factory()->for($channel)->live()->create();
        $invalidViewerQuery = $this->viewerQuery('g:'.str_repeat('c', 64), $channel, $wrongBroadcast);

        Http::fake([
            'mediamtx.test/*' => Http::sequence()
                ->push([
                    'pageCount' => 2,
                    'items' => [
                        ['id' => 'session-1', 'path' => 'demo', 'query' => $viewerOneQuery, 'isCDN' => false],
                        ['id' => 'session-2', 'path' => 'demo', 'query' => $viewerOneQuery, 'isCDN' => false],
                        ['id' => 'session-3', 'path' => 'demo', 'query' => $viewerTwoQuery, 'isCDN' => false],
                        ['id' => 'cdn-session', 'path' => 'demo', 'query' => $viewerTwoQuery, 'isCDN' => true],
                        ['id' => 'unknown-session', 'path' => 'missing', 'query' => $viewerOneQuery, 'isCDN' => false],
                    ],
                ])
                ->push([
                    'pageCount' => 2,
                    'items' => [
                        ['id' => 'session-4', 'path' => 'demo', 'query' => $invalidViewerQuery, 'isCDN' => false],
                    ],
                ]),
        ]);

        $result = app(MediaMtxViewerCountSynchronizer::class)->sync();

        $this->assertSame(['channels' => 2, 'viewers' => 3], $result);
        $this->assertSame(3, $channel->refresh()->viewer_count);
        $this->assertSame(3, $broadcast->refresh()->viewer_peak);
        $this->assertSame(0, $emptyLiveChannel->refresh()->viewer_count);
        $this->assertSame(4, $emptyBroadcast->refresh()->viewer_peak);
        $this->assertSame(0, $offlineChannel->refresh()->viewer_count);
        $this->assertSame(3, app(ViewerCountStore::class)->current($channel));
        $this->assertSame(0, app(ViewerCountStore::class)->current($emptyLiveChannel));

        Http::assertSentCount(2);
    }

    private function viewerQuery(string $viewerKey, Channel $channel, Broadcast $broadcast): string
    {
        return http_build_query(
            app(PlaybackViewerSigner::class)->queryParametersForViewerKey(
                $viewerKey,
                $channel,
                $broadcast,
                now()->addHour()->getTimestamp(),
            ),
        );
    }
}
