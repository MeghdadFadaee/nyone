---
name: dockerized-deployment
description: Work on the Nyone Dockerized deployment bundle under dockerized/. Use when modifying Docker Compose, Apache, MediaMTX, PostgreSQL, Redis, Laravel queue/scheduler/viewer-sync services, deploy.sh, deployment README files, or runtime environment defaults for this self-contained Docker deployment.
---

# Nyone Dockerized Deployment

## Core Rules

- Keep deployment changes inside `dockerized/` unless the user explicitly requests application code changes.
- Treat `dockerized/.env` and `dockerized/runtime/` as server-local generated state; do not commit or depend on them.
- Do not make this bundle depend on the cloned app repository's `.env` or `deploy/mediamtx.yml`.
- Keep MediaMTX config Docker-owned at `docker/mediamtx/mediamtx.yml.template`.
- Keep `APP_DOMAIN` and `HLS_DOMAIN` separate because Apache uses separate virtual hosts.
- Do not run `scripts/deploy.sh`, `docker compose up`, or image builds unless the user confirms this is a deployment server.

## Architecture

- `scripts/deploy.sh` is the entrypoint for server deployment.
- `docker-compose.yml` defines `app`, `db`, `redis`, `mediamtx`, `queue`, `scheduler`, `viewer-sync`, and one-shot `migrate`.
- `docker/app/Dockerfile` builds the Laravel Apache image from `runtime/source`.
- `docker/app/entrypoint.sh` selects behavior by `CONTAINER_ROLE`.
- `docker/app/apache/nyone.conf.template` serves Laravel on `APP_DOMAIN` and proxies HLS for `HLS_DOMAIN`.
- `docker/mediamtx/entrypoint.sh` renders the MediaMTX template at container start.

## Port Defaults

- Apache published HTTP: `80`.
- MediaMTX RTMP: `1935`.
- MediaMTX HLS internal: `8888`.
- MediaMTX API internal: `9997`.
- PostgreSQL internal: `5432`.
- Redis internal: `6379`.

Only publish HTTP and RTMP by default. Keep MediaMTX HLS behind Apache and keep the API private on the Docker network.

## Editing Guidance

- When adding an environment option, update `.env.example`, `docker-compose.yml`, and any entrypoint/template that consumes it.
- When changing MediaMTX ports, update Compose environment, published ports, entrypoint defaults, and the template together.
- When changing Laravel runtime behavior, update the shared `x-app-environment` block unless the value belongs to one role only.
- When changing queue behavior, prefer env-driven options on the `queue` service and `docker/app/entrypoint.sh`.
- Keep `npm run build` after PHP setup and Composer install in `docker/app/Dockerfile`; the Wayfinder Vite plugin invokes `php artisan wayfinder:generate` during the build.
- Keep deploy script behavior idempotent: repeat runs should update the Git checkout, rebuild, migrate, and restart services without deleting volumes.
- Keep generated secrets in `.env`; do not bake secrets into images or templates.

## Nginx TLS Proxy Guidance

- Document Nginx as a host-level TLS reverse proxy in `README.md`; do not add Nginx as another Compose service unless the user asks.
- Keep Docker Apache as the upstream for both app and HLS hostnames. Nginx should proxy both domains to the published Apache port and preserve the `Host` header so Apache can select the correct virtual host.
- Recommend `APP_HTTP_PORT=127.0.0.1:8080` when Nginx owns host ports `80` and `443`.
- Include `X-Forwarded-Proto https`, `X-Forwarded-Port 443`, `X-Forwarded-Host`, `X-Real-IP`, and `X-Forwarded-For` in proxy examples.
- Keep HLS proxy examples buffering off and cache headers set to no-store.
- Keep RTMP outside the HTTP proxy guidance unless explicitly using Nginx stream proxying; the default is direct TCP `1935` to MediaMTX through Docker.

## Static Verification

Use static checks when not on a deployment server:

```bash
git diff --check
rg "1993[5]|1998[8]|80[8]0|25[2]5|nyone[.]net|nyone-hls[.]net|change-this-secre[t]" dockerized -n
```

If Docker is available and the user allows non-deploy validation, validate only the Compose config:

```bash
docker compose --env-file dockerized/.env.example -f dockerized/docker-compose.yml config
```

Do not start containers during local verification unless the user explicitly asks for runtime testing.
