<?php

namespace App\Http\Controllers;

use App\Services\Streaming\MediaMtxService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MediaMtxController extends Controller
{
    public function auth(Request $request, MediaMtxService $mediaMtx): Response
    {
        $this->ensureSecret($request);

        return $mediaMtx->authorize($request->all())
            ? response()->noContent()
            : response('Unauthorized', 403);
    }

    public function ready(Request $request, MediaMtxService $mediaMtx): Response
    {
        $this->ensureSecret($request);

        $mediaMtx->markReady(
            (string) $request->input('path', $request->query('path', '')),
            (string) $request->input('source_type', $request->query('source_type', '')),
            (string) $request->input('source_id', $request->query('source_id', '')),
        );

        return response()->noContent();
    }

    public function notReady(Request $request, MediaMtxService $mediaMtx): Response
    {
        $this->ensureSecret($request);

        $mediaMtx->markNotReady((string) $request->input('path', $request->query('path', '')));

        return response()->noContent();
    }

    public function recordingComplete(Request $request, MediaMtxService $mediaMtx): Response
    {
        $this->ensureSecret($request);

        $mediaMtx->recordSegmentComplete(
            (string) $request->input('path', $request->query('path', '')),
            (string) $request->input('segment_path', $request->query('segment_path', '')),
            $request->input('duration', $request->query('duration')),
        );

        return response()->noContent();
    }

    private function ensureSecret(Request $request): void
    {
        $expected = (string) config('streaming.mediamtx_shared_secret');
        $provided = (string) ($request->header('X-MediaMTX-Secret')
            ?: $request->query('secret')
            ?: $request->input('secret'));

        abort_if($expected === '' || ! hash_equals($expected, $provided), 403);
    }
}
