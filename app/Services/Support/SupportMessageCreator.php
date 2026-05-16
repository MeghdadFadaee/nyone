<?php

namespace App\Services\Support;

use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupportMessageCreator
{
    /**
     * @param  array<int, UploadedFile>  $attachments
     */
    public function createConversation(User $author, string $category, string $subject, string $body, array $attachments = []): SupportConversation
    {
        return DB::transaction(function () use ($attachments, $author, $body, $category, $subject): SupportConversation {
            $conversation = $author->supportConversations()->create([
                'category' => $category,
                'subject' => trim($subject),
                'status' => SupportConversation::STATUS_OPEN,
            ]);

            $this->create($conversation, $author, $body, $attachments);

            return $conversation;
        });
    }

    /**
     * @param  array<int, UploadedFile>  $attachments
     */
    public function create(SupportConversation $conversation, User $author, string $body, array $attachments = []): SupportMessage
    {
        return DB::transaction(function () use ($attachments, $author, $body, $conversation): SupportMessage {
            $message = $conversation->messages()->create([
                'user_id' => $author->id,
                'body' => trim($body),
            ]);

            foreach ($attachments as $attachment) {
                $path = $attachment->store("support/{$conversation->id}/{$message->id}", 'local');

                $message->attachments()->create([
                    'disk' => 'local',
                    'path' => $path,
                    'original_name' => Str::limit($attachment->getClientOriginalName(), 255, ''),
                    'mime_type' => $attachment->getMimeType() ?: 'application/octet-stream',
                    'size' => $attachment->getSize() ?: 0,
                ]);
            }

            $conversation->forceFill([
                'last_message_at' => now(),
            ])->save();

            return $message;
        });
    }
}
