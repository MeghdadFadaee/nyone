<?php

namespace App\Console\Commands;

use App\Services\Streaming\MediaMtxViewerCountSynchronizer;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;
use Throwable;

#[Signature('streaming:sync-viewer-counts {--once : Run one synchronization pass and exit} {--interval= : Seconds between MediaMTX polls}')]
#[Description('Sync live viewer counts from MediaMTX HLS sessions')]
class SyncMediaMtxViewerCounts extends Command implements Isolatable
{
    public function handle(MediaMtxViewerCountSynchronizer $viewerCounts): int
    {
        $interval = max(1, (int) ($this->option('interval') ?: config('streaming.viewer_sync_interval', 2)));

        if ($this->option('once')) {
            $this->syncOnce($viewerCounts);

            return self::SUCCESS;
        }

        while (true) {
            try {
                $this->syncOnce($viewerCounts);
            } catch (Throwable $exception) {
                report($exception);
                $this->components->error($exception->getMessage());
            }

            sleep($interval);
        }

        return self::SUCCESS;
    }

    private function syncOnce(MediaMtxViewerCountSynchronizer $viewerCounts): void
    {
        $result = $viewerCounts->sync();

        if ($this->output->isVerbose()) {
            $this->components->info(
                "Synced {$result['viewers']} viewers across {$result['channels']} live channels.",
            );
        }
    }
}
