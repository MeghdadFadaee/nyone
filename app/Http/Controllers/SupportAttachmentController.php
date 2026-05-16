<?php

namespace App\Http\Controllers;

use App\Models\SupportAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupportAttachmentController extends Controller
{
    public function __invoke(Request $request, SupportAttachment $attachment): StreamedResponse
    {
        $attachment->loadMissing('message.conversation');

        abort_unless(
            $request->user()?->is_admin || $attachment->message->conversation->user_id === $request->user()?->id,
            403,
        );

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->original_name);
    }
}
