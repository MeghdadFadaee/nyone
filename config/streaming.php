<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Public Streaming Endpoints
    |--------------------------------------------------------------------------
    |
    | Creators publish to the RTMP ingest URL, while viewers play HLS from the
    | public HLS base URL. The channel slug and playlist path are appended by
    | the streaming services when a broadcast goes live.
    |
    */

    'rtmp_ingest_url' => env('STREAMING_RTMP_INGEST_URL', 'rtmp://nyone.app:19935'),
    'hls_public_url' => env('STREAMING_HLS_PUBLIC_URL', 'https://nyone-hls.net'),

    /*
    |--------------------------------------------------------------------------
    | MediaMTX Control API
    |--------------------------------------------------------------------------
    |
    | Laravel reads active HLS sessions from the private MediaMTX Control API.
    | Keep this API bound to localhost or another trusted private network.
    |
    */

    'mediamtx_api_url' => env('STREAMING_MEDIAMTX_API_URL', 'http://127.0.0.1:9997'),
    'mediamtx_api_connect_timeout' => (float) env('STREAMING_MEDIAMTX_API_CONNECT_TIMEOUT', 1.0),
    'mediamtx_api_timeout' => (float) env('STREAMING_MEDIAMTX_API_TIMEOUT', 3.0),
    'mediamtx_api_items_per_page' => (int) env('STREAMING_MEDIAMTX_API_ITEMS_PER_PAGE', 100),

    /*
    |--------------------------------------------------------------------------
    | Viewer Counts
    |--------------------------------------------------------------------------
    |
    | Viewer counts are deduplicated by signed playback identity, cached for
    | quick page reads, and periodically materialized into the channels table.
    |
    */

    'viewer_count_cache_store' => env('STREAMING_VIEWER_COUNT_CACHE_STORE', env('CACHE_STORE', 'database')),
    'viewer_count_ttl' => (int) env('STREAMING_VIEWER_COUNT_TTL', 10),
    'viewer_sync_interval' => (int) env('STREAMING_VIEWER_SYNC_INTERVAL', 2),

    /*
    |--------------------------------------------------------------------------
    | Playback Viewer Identity
    |--------------------------------------------------------------------------
    |
    | Guests receive an encrypted visitor cookie, and all live HLS URLs receive
    | signed viewer query parameters. The sync worker uses these to count one
    | active visitor across multiple HLS sessions or browser tabs.
    |
    */

    'viewer_identity_cookie' => env('STREAMING_VIEWER_IDENTITY_COOKIE', 'nyone_visitor_id'),
    'viewer_identity_cookie_lifetime_days' => (int) env('STREAMING_VIEWER_IDENTITY_COOKIE_LIFETIME_DAYS', 365),
    'viewer_identity_ttl' => (int) env('STREAMING_VIEWER_IDENTITY_TTL', 86400),
    'viewer_stats_poll_interval' => (int) env('STREAMING_VIEWER_STATS_POLL_INTERVAL', 30000),

    /*
    |--------------------------------------------------------------------------
    | MediaMTX Hook Authentication
    |--------------------------------------------------------------------------
    |
    | MediaMTX sends lifecycle and recording hooks to Laravel with this shared
    | secret. It must match the secret configured in the MediaMTX deployment.
    |
    */

    'mediamtx_shared_secret' => env('MEDIAMTX_SHARED_SECRET', 'local-dev-secret'),

    /*
    |--------------------------------------------------------------------------
    | Video On Demand
    |--------------------------------------------------------------------------
    |
    | Completed recording segments are stored under this path and retained for
    | the configured number of days when creators enable recording.
    |
    */

    'vod_retention_days' => (int) env('STREAMING_VOD_RETENTION_DAYS', 30),
    'recordings_path' => env('STREAMING_RECORDINGS_PATH', storage_path('app/private/recordings')),
];
