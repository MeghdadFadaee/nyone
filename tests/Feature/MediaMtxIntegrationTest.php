<?php

namespace Tests\Feature;

use App\Models\Broadcast;
use App\Models\Channel;
use App\Services\Streaming\StreamKeyManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediaMtxIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'streaming.hls_public_url' => 'http://localhost:8888',
            'streaming.mediamtx_shared_secret' => 'local-dev-secret',
        ]);
    }

    public function test_mediamtx_publish_auth_accepts_valid_stream_key(): void
    {
        $channel = Channel::factory()->create(['slug' => 'valid-channel']);
        $plainTextKey = app(StreamKeyManager::class)->rotate($channel);

        $response = $this->post('/internal/mediamtx/auth?secret=local-dev-secret', [
            'action' => 'publish',
            'protocol' => 'rtmp',
            'path' => 'valid-channel',
            'token' => $plainTextKey,
        ]);

        $response->assertNoContent();
    }

    public function test_mediamtx_publish_auth_rejects_invalid_key(): void
    {
        Channel::factory()->create(['slug' => 'valid-channel']);

        $response = $this->post('/internal/mediamtx/auth?secret=local-dev-secret', [
            'action' => 'publish',
            'protocol' => 'rtmp',
            'path' => 'valid-channel',
            'token' => 'wrong-key',
        ]);

        $response->assertForbidden();
    }

    public function test_mediamtx_ready_and_not_ready_hooks_update_broadcast_state(): void
    {
        $channel = Channel::factory()->create(['slug' => 'demo']);
        $broadcast = Broadcast::factory()->for($channel)->create([
            'title' => 'Demo stream',
            'recording_enabled' => true,
        ]);

        $this->post('/internal/mediamtx/ready?secret=local-dev-secret', [
            'path' => 'demo',
            'source_type' => 'rtmp',
            'source_id' => 'publisher-1',
        ])->assertNoContent();

        $broadcast->refresh();
        $channel->refresh();

        $this->assertSame(Broadcast::STATUS_LIVE, $broadcast->status);
        $this->assertTrue($channel->is_live);
        $this->assertSame($broadcast->id, $channel->live_broadcast_id);
        $this->assertSame('http://localhost:8888/demo/index.m3u8', $broadcast->hls_url);

        $this->post('/internal/mediamtx/not-ready?secret=local-dev-secret', [
            'path' => 'demo',
        ])->assertNoContent();

        $broadcast->refresh();
        $channel->refresh();

        $this->assertSame(Broadcast::STATUS_ENDED, $broadcast->status);
        $this->assertFalse($channel->is_live);
        $this->assertNull($channel->live_broadcast_id);
    }

    public function test_recording_complete_creates_vod_when_recording_is_enabled(): void
    {
        $channel = Channel::factory()->create(['slug' => 'demo']);
        Broadcast::factory()->for($channel)->live()->create([
            'title' => 'Recorded stream',
            'recording_enabled' => true,
            'started_at' => now(),
        ]);

        $this->post('/internal/mediamtx/recording-complete?secret=local-dev-secret', [
            'path' => 'demo',
            'segment_path' => storage_path('app/private/recordings/demo/segment.ts'),
            'duration' => '12.4s',
        ])->assertNoContent();

        $this->assertDatabaseHas('vods', [
            'channel_id' => $channel->id,
            'title' => 'Recorded stream',
            'duration_seconds' => 12,
        ]);
    }
}
