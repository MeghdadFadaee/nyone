# Nyone

Nyone is a Laravel/Inertia live streaming platform. The current implementation supports one creator channel per user, OBS publishing through MediaMTX RTMP, HLS playback, channel follows, live chat, creator-selected VOD recording, and basic admin moderation.

## Stack

- Laravel 13, Fortify auth, Inertia.
- React 19, TypeScript, Tailwind CSS 4, Radix UI primitives.
- MediaMTX for RTMP ingest, HLS playback, stream auth hooks, lifecycle hooks, and recordings.
- PostgreSQL is the production target; SQLite is fine for local development.

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

For local development, override these values in `.env` if you are not using the production domains:

```env
APP_URL=http://127.0.0.1:8000
STREAMING_RTMP_INGEST_URL=rtmp://127.0.0.1:19935
STREAMING_HLS_PUBLIC_URL=http://127.0.0.1:19988
```

## Production Values

The project config is aligned to these production-style domains:

```env
APP_NAME=Nyone
APP_URL=https://nyone.net
STREAMING_RTMP_INGEST_URL=rtmp://nyone.net:19935
STREAMING_HLS_PUBLIC_URL=https://nyone-hls.net
MEDIAMTX_SHARED_SECRET=change-this-secret
```

Configure MediaMTX from `deploy/mediamtx.yml`, replacing `change-this-secret` with the same value as `MEDIAMTX_SHARED_SECRET`.

Creators use:

- OBS server: `STREAMING_RTMP_INGEST_URL`
- OBS stream key: `<channel-slug>?token=<generated-stream-key>`

Viewer playback uses:

```text
STREAMING_HLS_PUBLIC_URL/<channel-slug>/index.m3u8
```

## Verification

```bash
php artisan test
npm run format:check
npm run lint:check
npm run types:check
npm run build
```
