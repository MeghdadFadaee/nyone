<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminChannelCreationController extends Controller
{
    public function updateDefault(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'channel_creation_open' => ['required', 'boolean'],
        ]);

        $settings = PlatformSetting::current();

        $settings->forceFill([
            'channel_creation_open' => (bool) $validated['channel_creation_open'],
        ])->save();

        $this->audit($request, $settings, 'platform.channel_creation_default.updated', [
            'channel_creation_open' => $settings->channel_creation_open,
        ]);

        return back()->with(
            'success',
            $settings->channel_creation_open
                ? 'All verified users can create channels.'
                : 'Channel creation now requires admin approval.',
        );
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'can_create_channel' => ['required', 'boolean'],
        ]);

        $user->forceFill([
            'can_create_channel' => (bool) $validated['can_create_channel'],
        ])->save();

        $this->audit($request, $user, 'user.creator_access.updated', [
            'can_create_channel' => $user->can_create_channel,
        ]);

        return back()->with(
            'success',
            $user->can_create_channel
                ? 'User can create a channel.'
                : 'User channel creation access removed.',
        );
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function audit(Request $request, object $subject, string $action, array $metadata = []): void
    {
        AdminAuditLog::query()->create([
            'admin_user_id' => $request->user()?->id,
            'subject_type' => $subject::class,
            'subject_id' => $subject->id,
            'action' => $action,
            'metadata' => $metadata === [] ? null : $metadata,
            'created_at' => now(),
        ]);
    }
}
