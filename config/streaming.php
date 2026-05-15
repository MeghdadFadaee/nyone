<?php

return [
    'rtmp_ingest_url' => env('STREAMING_RTMP_INGEST_URL', 'rtmp://localhost:1935'),
    'hls_public_url' => env('STREAMING_HLS_PUBLIC_URL', 'http://localhost:8888'),
    'mediamtx_shared_secret' => env('MEDIAMTX_SHARED_SECRET', 'local-dev-secret'),
    'vod_retention_days' => (int) env('STREAMING_VOD_RETENTION_DAYS', 30),
    'recordings_path' => env('STREAMING_RECORDINGS_PATH', storage_path('app/private/recordings')),
];
