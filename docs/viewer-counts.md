# Viewer Count Setup

Viewer counts are read from MediaMTX HLS sessions, deduplicated by Laravel-signed visitor identity, cached in Redis, and materialized into `channels.viewer_count` for list sorting and page display.

Laravel signs each live HLS URL with a short query string. Logged-in users get an opaque account-based viewer key, while guests get an encrypted `nyone_visitor_id` browser cookie and an opaque browser-based viewer key. MediaMTX still proves that playback is active; Laravel does not receive viewer heartbeats.

## MediaMTX Control API

MediaMTX must expose its Control API on a private address that Laravel can reach:

```yaml
api: yes
apiAddress: 127.0.0.1:9997
```

Keep this API private. Do not expose `127.0.0.1:9997` through a public firewall rule or reverse proxy.

## Laravel Environment

Configure Laravel with the MediaMTX API URL and Redis cache store:

```env
STREAMING_MEDIAMTX_API_URL=http://127.0.0.1:9997
STREAMING_VIEWER_COUNT_CACHE_STORE=redis
STREAMING_VIEWER_COUNT_TTL=10
STREAMING_VIEWER_SYNC_INTERVAL=2
STREAMING_VIEWER_IDENTITY_COOKIE=nyone_visitor_id
STREAMING_VIEWER_IDENTITY_COOKIE_LIFETIME_DAYS=365
STREAMING_VIEWER_IDENTITY_TTL=86400
STREAMING_VIEWER_STATS_POLL_INTERVAL=30000

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

After changing these values, reload Laravel config:

```bash
php artisan config:clear
```

## Verify Sync

With MediaMTX running and at least one active HLS viewer, run one sync pass:

```bash
php artisan streaming:sync-viewer-counts --once -v
```

The command should report the number of viewers and live channels it synced.

Multiple HLS sessions with the same valid signed viewer key count as one viewer. Direct HLS clients without a valid signed viewer key are still counted, but each MediaMTX session is counted separately because Laravel has no browser or user identity for those clients.

## Run Continuously

Run the sync worker under Supervisor:

```ini
[program:nyone-viewer-counts]
process_name=%(program_name)s
command=php /var/www/nyone/artisan streaming:sync-viewer-counts --isolated
directory=/var/www/nyone
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/nyone/storage/logs/viewer-counts.log
stopwaitsecs=10
```

Reload Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status nyone-viewer-counts
```

## Troubleshooting

If counts stay at `0`, check:

- MediaMTX has active HLS sessions.
- `STREAMING_MEDIAMTX_API_URL` is reachable from Laravel.
- Redis is running and Laravel can write to `STREAMING_VIEWER_COUNT_CACHE_STORE`.
- `storage/logs/viewer-counts.log` has no connection errors.
