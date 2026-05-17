<?php

namespace App\Models;

use Database\Factories\SupportConversationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_id', 'category', 'subject', 'status', 'last_message_at'])]
class SupportConversation extends Model
{
    /** @use HasFactory<SupportConversationFactory> */
    use HasFactory;

    public const CATEGORY_BUG = 'bug';

    public const CATEGORY_SUGGESTION = 'suggestion';

    public const CATEGORY_CHANNEL_REQUEST = 'channel_request';

    public const CATEGORY_OTHER = 'other';

    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    /**
     * @return array<string, string>
     */
    public static function categoryLabels(): array
    {
        return [
            self::CATEGORY_BUG => (string) __('Bug report'),
            self::CATEGORY_SUGGESTION => (string) __('Suggestion'),
            self::CATEGORY_CHANNEL_REQUEST => (string) __('Channel request'),
            self::CATEGORY_OTHER => (string) __('Other'),
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function categories(): array
    {
        return array_keys(self::categoryLabels());
    }

    /**
     * @return array<int, string>
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_OPEN,
            self::STATUS_CLOSED,
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportMessage::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(SupportMessage::class)->latestOfMany();
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }
}
