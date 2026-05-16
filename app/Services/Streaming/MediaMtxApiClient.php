<?php

namespace App\Services\Streaming;

use Illuminate\Support\Facades\Http;

class MediaMtxApiClient
{
    /**
     * @return array<int, array{id: string, path: string, query: string, is_cdn: bool}>
     */
    public function hlsSessions(): array
    {
        $sessions = [];
        $page = 0;

        do {
            $payload = (array) Http::baseUrl($this->baseUrl())
                ->acceptJson()
                ->connectTimeout((float) config('streaming.mediamtx_api_connect_timeout', 1.0))
                ->timeout((float) config('streaming.mediamtx_api_timeout', 3.0))
                ->get('/v3/hlssessions/list', [
                    'page' => $page,
                    'itemsPerPage' => max(1, (int) config('streaming.mediamtx_api_items_per_page', 100)),
                ])
                ->throw()
                ->json();

            foreach ((array) ($payload['items'] ?? []) as $session) {
                if (! is_array($session)) {
                    continue;
                }

                $path = trim((string) ($session['path'] ?? ''), '/');
                $id = (string) ($session['id'] ?? '');

                if ($path === '' || $id === '') {
                    continue;
                }

                $sessions[] = [
                    'id' => $id,
                    'path' => $path,
                    'query' => (string) ($session['query'] ?? ''),
                    'is_cdn' => (bool) ($session['isCDN'] ?? false),
                ];
            }

            $page++;
            $pageCount = max(1, (int) ($payload['pageCount'] ?? $page));
        } while ($page < $pageCount);

        return $sessions;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('streaming.mediamtx_api_url'), '/');
    }
}
