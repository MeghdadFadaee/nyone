#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

role="${CONTAINER_ROLE:-${1:-app}}"

fail() {
    echo "nyone-entrypoint: $*" >&2
    exit 1
}

require_env() {
    local key="$1"
    local value="${!key:-}"

    if [[ -z "$value" || "$value" == "change-me"* || "$value" == "base64:change-me"* ]]; then
        fail "$key is required. Run dockerized/scripts/deploy.sh or set it in dockerized/.env."
    fi
}

wait_for() {
    local host="$1"
    local port="$2"
    local label="$3"
    local attempts="${4:-60}"

    for ((i = 1; i <= attempts; i++)); do
        if nc -z "$host" "$port" >/dev/null 2>&1; then
            return 0
        fi

        sleep 2
    done

    fail "Timed out waiting for $label at $host:$port."
}

artisan() {
    gosu www-data php artisan "$@"
}

render_apache_config() {
    export APP_DOMAIN HLS_DOMAIN HLS_INTERNAL_PORT APP_URL

    envsubst '${APP_DOMAIN} ${HLS_DOMAIN} ${HLS_INTERNAL_PORT} ${APP_URL}' \
        < /etc/apache2/sites-available/nyone.conf.template \
        > /etc/apache2/sites-available/000-default.conf
}

prepare_laravel_paths() {
    mkdir -p \
        storage/app/private/recordings \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache

    chown -R www-data:www-data storage bootstrap/cache
}

ensure_public_storage_link() {
    mkdir -p public storage/app/public

    if [[ -L public/storage || -e public/storage ]]; then
        return 0
    fi

    ln -s ../storage/app/public public/storage
}

cache_laravel_bootstrap() {
    if [[ "${APP_OPTIMIZE_ON_BOOT:-true}" != "true" ]]; then
        return 0
    fi

    artisan config:clear
    artisan route:clear
    artisan view:clear
    artisan event:clear
    artisan config:cache
    artisan route:cache
    artisan view:cache
}

require_env APP_KEY
require_env APP_DOMAIN
require_env HLS_DOMAIN
require_env MEDIAMTX_SHARED_SECRET
require_env DB_DATABASE
require_env DB_USERNAME
require_env DB_PASSWORD

if [[ "${WAIT_FOR_SERVICES:-true}" == "true" ]]; then
    wait_for "${DB_HOST:-db}" "${DB_PORT:-5432}" "PostgreSQL"
    wait_for "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" "Redis"

    if [[ "$role" == "viewer-sync" ]]; then
        wait_for "${MEDIAMTX_HOST:-mediamtx}" "${MEDIAMTX_API_PORT:-9997}" "MediaMTX API"
    fi
fi

prepare_laravel_paths
ensure_public_storage_link
cache_laravel_bootstrap

case "$role" in
    app)
        render_apache_config
        exec apache2-foreground
        ;;
    migrate)
        artisan migrate --force

        if [[ "${SEED_DATABASE:-false}" == "true" ]]; then
            artisan db:seed --force
        fi
        ;;
    queue)
        exec gosu www-data php artisan queue:work "${QUEUE_CONNECTION:-database}" \
            --queue="${QUEUE_NAMES:-default}" \
            --sleep="${QUEUE_SLEEP:-3}" \
            --tries="${QUEUE_TRIES:-3}" \
            --max-time="${QUEUE_MAX_TIME:-3600}" \
            --timeout="${QUEUE_TIMEOUT:-90}"
        ;;
    scheduler)
        exec gosu www-data php artisan schedule:work
        ;;
    viewer-sync)
        exec gosu www-data php artisan streaming:sync-viewer-counts \
            --interval="${STREAMING_VIEWER_SYNC_INTERVAL:-2}"
        ;;
    artisan)
        shift || true
        exec gosu www-data php artisan "$@"
        ;;
    *)
        exec "$@"
        ;;
esac
