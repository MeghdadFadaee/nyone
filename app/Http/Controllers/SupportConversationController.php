<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupportConversationRequest;
use App\Http\Requests\StoreSupportMessageRequest;
use App\Models\SupportAttachment;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Services\Support\SupportMessageCreator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupportConversationController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('support/index', [
            'categories' => $this->categories(),
            'conversations' => $request->user()
                ->supportConversations()
                ->with(['latestMessage.user'])
                ->withCount('messages')
                ->latest('last_message_at')
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (SupportConversation $conversation) => $this->conversationSummary($conversation)),
        ]);
    }

    public function store(StoreSupportConversationRequest $request, SupportMessageCreator $messages): RedirectResponse
    {
        $validated = $request->validated();

        $conversation = $messages->createConversation(
            $request->user(),
            $validated['category'],
            $validated['subject'],
            $validated['body'],
            $request->file('attachments', []) ?: [],
        );

        return redirect()
            ->route('support.show', $conversation)
            ->with('success', 'Message sent to admin.');
    }

    public function show(Request $request, SupportConversation $conversation): Response
    {
        $this->authorizeUserConversation($request, $conversation);

        $conversation->load([
            'messages' => fn ($query) => $query->oldest()->with(['attachments', 'user']),
            'user',
        ]);

        return Inertia::render('support/show', [
            'conversation' => $this->conversationPayload($conversation),
        ]);
    }

    public function reply(StoreSupportMessageRequest $request, SupportConversation $conversation, SupportMessageCreator $messages): RedirectResponse
    {
        $this->authorizeUserConversation($request, $conversation);
        abort_unless($conversation->isOpen(), 422, 'This conversation is closed.');

        $validated = $request->validated();

        $messages->create(
            $conversation,
            $request->user(),
            $validated['body'],
            $request->file('attachments', []) ?: [],
        );

        return back()->with('success', 'Reply sent.');
    }

    private function authorizeUserConversation(Request $request, SupportConversation $conversation): void
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function categories(): array
    {
        return collect(SupportConversation::categoryLabels())
            ->map(fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function conversationPayload(SupportConversation $conversation): array
    {
        return [
            ...$this->conversationSummary($conversation),
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
