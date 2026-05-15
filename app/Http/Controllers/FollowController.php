<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function store(Request $request, Channel $channel): RedirectResponse
    {
        abort_if($channel->isSuspended(), 404);

        $channel->follows()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        return back();
    }

    public function destroy(Request $request, Channel $channel): RedirectResponse
    {
        $channel->follows()->where('user_id', $request->user()->id)->delete();

        return back();
    }
}
