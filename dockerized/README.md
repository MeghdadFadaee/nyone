# Nyone Dockerized Deployment

This folder is a self-contained deployment bundle. A server only needs the `dockerized/` directory; the application repository is cloned later into `runtime/source` by `scripts/deploy.sh`.

## What It Runs

- Laravel app served by Apache.
- PostgreSQL database.
- Redis cache for Laravel cache and streaming viewer counts.
- MediaMTX for RTMP ingest, HLS playback, hooks, recordings, and the private API.
- Laravel queue worker.
- Laravel scheduler worker.
- Long-running `streaming:sync-viewer-counts` worker.

Default ports use the services' normal defaults:

- HTTP app/HLS proxy: `80`
- RTMP ingest: `1935`
- MediaMTX HLS inside Docker: `8888`
- MediaMTX API inside Docker: `9997`
- PostgreSQL inside Docker: `5432`
- Redis inside Docker: `6379`

Only HTTP and RTMP are published by default. HLS is served through Apache on `HLS_DOMAIN`, not directly from MediaMTX.

## Server Requirements

- Docker with Compose v2.
- Git.
- OpenSSL.
- Network access from the server to the Git repository.
- DNS for both `APP_DOMAIN` and `HLS_DOMAIN`.
- External TLS termination through a reverse proxy, load balancer, or CDN.

If a host-level reverse proxy already uses port `80`, set `APP_HTTP_PORT` to another local port and forward both hostnames to that port.

## First Deployment

```bash
cd dockerized
cp .env.example .env
nano .env
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

At minimum, change these values in `.env`:

```env
GIT_REPOSITORY_URL=https://github.com/your-org/nyone.git
GIT_REF=main
APP_DOMAIN=nyone.example.com
HLS_DOMAIN=nyone-hls.example.com
PUBLIC_SCHEME=https
```

Leave `APP_KEY`, `POSTGRES_PASSWORD`, and `MEDIAMTX_SHARED_SECRET` empty on first deploy if you want `scripts/deploy.sh` to generate them.

The deploy script will:

1. Create `.env` from `.env.example` if needed.
2. Generate missing secrets.
3. Clone or update the app into `runtime/source`.
4. Validate the Compose config.
5. Build Docker images.
6. Start PostgreSQL and Redis.
7. Run Laravel migrations.
8. Start Apache, MediaMTX, queue, scheduler, and viewer-sync services.

## Runtime Configuration

This bundle does not use the cloned repository's `.env` file for production settings. Docker Compose passes configuration from `dockerized/.env` into the containers.

Important values:

- `APP_DOMAIN`: Laravel app hostname.
- `HLS_DOMAIN`: HLS playback hostname. Must differ from `APP_DOMAIN`.
- `APP_HTTP_PORT`: host port published by Apache, default `80`.
- `RTMP_PUBLIC_PORT`: host RTMP port, default `1935`.
- `PUBLIC_SCHEME`: usually `https` behind external TLS.
- `SEED_DATABASE`: defaults to `false`; set to `true` only if you intentionally want the app seeder to run.
- `QUEUE_NAMES`: queue list for the Laravel database queue worker, default `default`.

The MediaMTX config is Docker-owned at `docker/mediamtx/mediamtx.yml.template`; it does not mount or depend on `deploy/mediamtx.yml` from the cloned repository.

## Operations

Run commands from the `dockerized/` directory.

```bash
docker compose --env-file .env -f docker-compose.yml ps
docker compose --env-file .env -f docker-compose.yml logs -f app
docker compose --env-file .env -f docker-compose.yml logs -f mediamtx
docker compose --env-file .env -f docker-compose.yml exec app php artisan migrate:status
docker compose --env-file .env -f docker-compose.yml exec app php artisan streaming:sync-viewer-counts --once -v
```

Redeploy after new Git changes:

```bash
./scripts/deploy.sh
```

Stop the stack:

```bash
docker compose --env-file .env -f docker-compose.yml down
```

Do not remove volumes unless you intend to delete database, Redis, and stored app media data.

## External Proxy Notes

Forward both `APP_DOMAIN` and `HLS_DOMAIN` to the Apache container's published HTTP port. Preserve the `Host` header and set `X-Forwarded-Proto: https` when TLS is terminated outside Docker.

Expose TCP `1935` publicly for OBS/RTMP ingest. Do not expose MediaMTX API port `9997` publicly.

## Nginx TLS Proxy Example

Use this pattern when Nginx runs on the host and handles public HTTP/HTTPS. In that setup, let Nginx own ports `80` and `443`, and bind the Docker Apache service to a private local port:

```env
APP_HTTP_PORT=127.0.0.1:8080
PUBLIC_SCHEME=https
APP_DOMAIN=app.example.com
HLS_DOMAIN=hls.example.com
RTMP_PUBLIC_PORT=1935
```

Run `./scripts/deploy.sh` after changing `.env`, then point Nginx at `http://127.0.0.1:8080`. Replace the example domains and certificate paths before enabling the config.

```nginx
# /etc/nginx/sites-available/nyone-dockerized.conf

server {
    listen 80;
    listen [::]:80;
    server_name app.example.com hls.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hls.example.com;

    ssl_certificate /etc/letsencrypt/live/hls.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hls.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
    }
}
```

Enable and validate on the server:

```bash
sudo ln -s /etc/nginx/sites-available/nyone-dockerized.conf /etc/nginx/sites-enabled/nyone-dockerized.conf
sudo nginx -t
sudo systemctl reload nginx
```

Keep RTMP separate from this HTTP proxy. Open TCP `1935` to the Docker host so OBS can publish directly to MediaMTX.
