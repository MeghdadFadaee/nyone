<?php

namespace App\Services\Streaming;

use App\Models\Channel;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class ViewerCountStore
{
    public function current(Channel $channel): int
    {
        $cached = $this->cache()->get($this->cacheKey($channel));

        return is_numeric($cached) ? max(0, (int) $cached) : max(0, (int) $channel->viewer_count);
    }

    public function put(Channel $channel, int $count): void
    {
        $this->cache()->put($this->cacheKey($channel), max(0, $count), $this->ttl());
    }

    public function forget(Channel $channel): void
    {
        $this->cache()->forget($this->cacheKey($channel));
    }

    private function cache(): Repository
    {
        $store = (string) config('streaming.viewer_count_cache_store', config('cache.default'));

        return $store !== '' ? Cache::store($store) : Cache::store();
    }

    private function cacheKey(Channel $channel): string
    {
        return "streaming:viewers:channels:{$channel->id}";
    }

    private function ttl(): int
    {
        return max(1, (int) config('streaming.viewer_count_ttl', 10));
    }
}
