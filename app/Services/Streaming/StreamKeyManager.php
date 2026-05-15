<?php

namespace App\Services\Streaming;

use App\Models\Channel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StreamKeyManager
{
    public function rotate(Channel $channel): string
    {
        $plainTextKey = Str::random(48);

        $channel->streamKey()->updateOrCreate(
            ['channel_id' => $channel->id],
            [
                'key_hash' => Hash::make($plainTextKey),
                'revoked_at' => null,
            ],
        );

        return $plainTextKey;
    }

    public function tokenizedPath(Channel $channel, string $plainTextKey): string
    {
        return "{$channel->slug}?token={$plainTextKey}";
    }

    public function ingestServer(): string
    {
        return rtrim((string) config('streaming.rtmp_ingest_url'), '/');
    }
}
