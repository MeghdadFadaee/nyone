# Nyone

Nyone is a Laravel/Inertia live streaming platform scaffold. The first implementation supports one creator channel per user, OBS publishing through MediaMTX RTMP, HLS playback, channel follows, live chat, creator-selected VOD recording, and basic admin moderation.

## Local Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run dev
php artisan serve
```

Configure MediaMTX from `deploy/mediamtx.yml.example`, replacing `change-this-secret` with `MEDIAMTX_SHARED_SECRET`.

Creators use:

- Server: `STREAMING_RTMP_INGEST_URL`
- Stream key: `<channel-slug>?token=<generated-stream-key>`

Viewer playback uses `STREAMING_HLS_PUBLIC_URL/<channel-slug>/index.m3u8`.
