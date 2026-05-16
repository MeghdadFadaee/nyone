<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupportMessageRequest;
use App\Http\Requests\UpdateSupportConversationStatusRequest;
use App\Models\SupportAttachment;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Services\Support\SupportMessageCreator;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminSupportConversationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/support/index', [
            'stats' => [
                'open' => SupportConversation::query()->where('status', SupportConversation::STATUS_OPEN)->count(),
                'closed' => SupportConversation::query()->where('status', SupportConversation::STATUS_CLOSED)->count(),
            ],
            'conversations' => SupportConversation::query()
                ->with(['latestMessage.user', 'user'])
                ->withCount('messages')
                ->latest('last_message_at')
                ->latest()
                ->limit(75)
                ->get()
                ->map(fn (SupportConversation $conversation) => $this->conversationSummary($conversation)),
        ]);
    }

    public function show(SupportConversation $conversation): Response
    {
        $conversation->load([
            'messages' => fn ($query) => $query->oldest()->with(['attachments', 'user']),
            'user.channel',
        ]);

        return Inertia::render('admin/support/show', [
            'conversation' => $this->conversationPayload($conversation),
        ]);
    }

    public function reply(StoreSupportMessageRequest $request, SupportConversation $conversation, SupportMessageCreator $messages): RedirectResponse
    {
        abort_unless($conversation->isOpen(), 422, 'Reopen this conversation before replying.');

        $validated = $request->validated();

        $messages->create(
            $conversation,
            $request->user(),
            $validated['body'],
            $request->file('attachments', []) ?: [],
        );

        return back()->with('success', 'Reply sent.');
    }

    public function update(UpdateSupportConversationStatusRequest $request, SupportConversation $conversation): RedirectResponse
    {
        $conversation->forceFill([
            'status' => $request->validated('status'),
        ])->save();

        return back()->with(
            'success',
            $conversation->isOpen() ? 'Conversation reopened.' : 'Conversation closed.',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function conversationPayload(SupportConversation $conversation): array
    {
        return [
            ...$this->conversationSummary($conversation),
            'user' => [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
                'email' => $conversation->user->email,
                'can_create_channel' => $conversation->user->can_create_channel,
                'suspended_at' => $conversation->user->suspended_at?->toIso8601String(),
                'channel' => $conversation->user->channel ? [
                    'id' => $conversation->user->channel->id,
                    'slug' => $conversation->user->channel->slug,
                    'display_name' => $conversation->user->channel->display_name,
                ] : null,
            ],
            'messages' => $conversation->messages->map(fn (SupportMessage $message) => $this->messagePayload($message)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function conversationSummary(SupportConversation $conversation): array
    {
        return [
            'id' => $conversation->id,
            'category' => $conversation->category,
            'category_label' => SupportConversation::categoryLabels()[$conversation->category] ?? 'Other',
            'subject' => $conversation->subject,
            'status' => $conversation->status,
            'last_message_at' => $conversation->last_message_at?->toIso8601String(),
            'messages_count' => $conversation->messages_count ?? $conversation->messages()->count(),
            'user' => [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
                'email' => $conversation->user->email,
            ],
            'latest_message' => $conversation->latestMessage ? $this->messagePreviewPayload($conversation->latestMessage) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function messagePayload(SupportMessage $message): array
    {
        return [
            ...$this->messagePreviewPayload($message),
            'attachments' => $message->attachments->map(fn (SupportAttachment $attachment) => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
            ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function messagePreviewPayload(SupportMessage $message): array
    {
        return [
            'id' => $message->id,
            'body' => $message->body,
            'created_at' => $message->created_at?->toIso8601String(),
            'author' => [
                'id' => $message->user?->id,
                'name' => $message->user?->name ?? 'Deleted user',
                'is_admin' => (bool) $message->user?->is_admin,
            ],
        ];
    }
}
