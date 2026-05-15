<?php

namespace App\Models;

use Database\Factories\ChannelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_id',
    'category_id',
    'live_broadcast_id',
    'slug',
    'display_name',
    'description',
    'avatar_path',
    'banner_path',
    'thumbnail_path',
    'is_live',
    'viewer_count',
    'suspended_at',
])]
class Channel extends Model
{
    /** @use HasFactory<ChannelFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_live' => 'boolean',
            'suspended_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function streamKey(): HasOne
    {
        return $this->hasOne(StreamKey::class);
    }

    public function broadcasts(): HasMany
    {
        return $this->hasMany(Broadcast::class);
    }

    public function liveBroadcast(): BelongsTo
    {
        return $this->belongsTo(Broadcast::class, 'live_broadcast_id');
    }

    public function vods(): HasMany
    {
        return $this->hasMany(Vod::class);
    }

    public function follows(): HasMany
    {
        return $this->hasMany(Follow::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null || $this->user?->suspended_at !== null;
    }
}
