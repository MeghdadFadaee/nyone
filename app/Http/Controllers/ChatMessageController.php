<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ChatMessageController extends Controller
{
    public function store(Request $request, Channel $channel): RedirectResponse
    {
        abort_if($request->user()->isSuspended() || $channel->isSuspended(), 403);
        abort_unless($channel->is_live && $channel->live_broadcast_id, 422, __('Chat is available only while the channel is live.'));

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:500'],
        ]);

        $channel->chatMessages()->create([
            'broadcast_id' => $channel->live_broadcast_id,
            'user_id' => $request->user()->id,
            'body' => trim($validated['body']),
        ]);

        return back();
    }
}
