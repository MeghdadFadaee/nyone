<?php

namespace App\Models;

use Database\Factories\SupportAttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['support_message_id', 'disk', 'path', 'original_name', 'mime_type', 'size'])]
class SupportAttachment extends Model
{
    /** @use HasFactory<SupportAttachmentFactory> */
    use HasFactory;

    public function message(): BelongsTo
    {
        return $this->belongsTo(SupportMessage::class, 'support_message_id');
    }
}
