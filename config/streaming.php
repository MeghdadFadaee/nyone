<?php

return [
    'rtmp_ingest_url' => env('STREAMING_RTMP_INGEST_URL', 'rtmp://nyone.net:19935'),
    'hls_public_url' => env('STREAMING_HLS_PUBLIC_URL', 'https://nyone-hls.net'),
    'mediamtx_api_url' => env('STREAMING_MEDIAMTX_API_URL', 'http://127.0.0.1:9997'),
    'mediamtx_api_connect_timeout' => (float) env('STREAMING_MEDIAMTX_API_CONNECT_TIMEOUT', 1.0),
    'mediamtx_api_timeout' => (float) env('STREAMING_MEDIAMTX_API_TIMEOUT', 3.0),
    'mediamtx_api_items_per_page' => (int) env('STREAMING_MEDIAMTX_API_ITEMS_PER_PAGE', 100),
    'viewer_count_cache_store' => env('STREAMING_VIEWER_COUNT_CACHE_STORE', env('CACHE_STORE', 'database')),
    'viewer_count_ttl' => (int) env('STREAMING_VIEWER_COUNT_TTL', 10),
    'viewer_sync_interval' => (int) env('STREAMING_VIEWER_SYNC_INTERVAL', 2),
    'viewer_identity_cookie' => env('STREAMING_VIEWER_IDENTITY_COOKIE', 'nyone_visitor_id'),
    'viewer_identity_cookie_lifetime_days' => (int) env('STREAMING_VIEWER_IDENTITY_COOKIE_LIFETIME_DAYS', 365),
    'viewer_identity_ttl' => (int) env('STREAMING_VIEWER_IDENTITY_TTL', 86400),
    'viewer_stats_poll_interval' => (int) env('STREAMING_VIEWER_STATS_POLL_INTERVAL', 30000),
    'mediamtx_shared_secret' => env('MEDIAMTX_SHARED_SECRET', 'local-dev-secret'),
    'vod_retention_days' => (int) env('STREAMING_VOD_RETENTION_DAYS', 30),
    'recordings_path' => env('STREAMING_RECORDINGS_PATH', storage_path('app/private/recordings')),
];
