<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\Broadcast;
use App\Models\Channel;
use App\Models\User;
use App\Models\Vod;
use App\Services\Streaming\ViewerCountStore;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminModerationController extends Controller
{
    public function suspendChannel(Request $request, Channel $channel, ViewerCountStore $viewerCounts): RedirectResponse
    {
        $channel->forceFill([
            'suspended_at' => now(),
            'is_live' => false,
            'live_broadcast_id' => null,
            'viewer_count' => 0,
        ])->save();
        $viewerCounts->forget($channel);

        $this->audit($request, $channel, 'channel.suspended');

        return back()->with('success', 'Channel suspended.');
    }

    public function restoreChannel(Request $request, Channel $channel): RedirectResponse
    {
        $channel->forceFill(['suspended_at' => null])->save();

        $this->audit($request, $channel, 'channel.restored');

        return back()->with('success', 'Channel restored.');
    }

    public function suspendUser(Request $request, User $user, ViewerCountStore $viewerCounts): RedirectResponse
    {
        $user->forceFill(['suspended_at' => now()])->save();
        $user->channel?->forceFill([
            'is_live' => false,
            'live_broadcast_id' => null,
            'viewer_count' => 0,
        ])->save();

        if ($user->channel) {
            $viewerCounts->forget($user->channel);
        }

        $this->audit($request, $user, 'user.suspended');

        return back()->with('success', 'User suspended.');
    }

    public function stopBroadcast(Request $request, Broadcast $broadcast, ViewerCountStore $viewerCounts): RedirectResponse
    {
        $broadcast->forceFill([
            'status' => Broadcast::STATUS_ENDED,
            'ended_at' => $broadcast->ended_at ?? now(),
        ])->save();

        $broadcast->channel->forceFill([
            'is_live' => false,
            'live_broadcast_id' => null,
            'viewer_count' => 0,
        ])->save();
        $viewerCounts->forget($broadcast->channel);

        $this->audit($request, $broadcast, 'broadcast.stopped');

        return back()->with('success', 'Broadcast stopped.');
    }

    public function deleteVod(Request $request, Vod $vod): RedirectResponse
    {
        $vod->delete();

        $this->audit($request, $vod, 'vod.deleted');

        return back()->with('success', 'VOD deleted.');
    }

    private function audit(Request $request, object $subject, string $action): void
    {
        AdminAuditLog::query()->create([
            'admin_user_id' => $request->user()?->id,
            'subject_type' => $subject::class,
            'subject_id' => $subject->id,
            'action' => $action,
            'created_at' => now(),
        ]);
    }
}
