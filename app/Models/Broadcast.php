<?php

namespace App\Models;

use Database\Factories\BroadcastFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'channel_id',
    'title',
    'status',
    'recording_enabled',
    'mediamtx_path',
    'source_type',
    'source_id',
    'hls_url',
    'viewer_peak',
    'started_at',
    'ended_at',
])]
class Broadcast extends Model
{
    /** @use HasFactory<BroadcastFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_LIVE = 'live';

    public const STATUS_ENDED = 'ended';

    protected function casts(): array
    {
        return [
            'recording_enabled' => 'boolean',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function vod(): HasOne
    {
        return $this->hasOne(Vod::class);
    }
}
