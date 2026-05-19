#!/usr/bin/env sh
set -eu

fail() {
    echo "nyone-mediamtx-entrypoint: $*" >&2
    exit 1
}

if [ -z "${MEDIAMTX_SHARED_SECRET:-}" ] || [ "${MEDIAMTX_SHARED_SECRET#change-me}" != "$MEDIAMTX_SHARED_SECRET" ]; then
    fail "MEDIAMTX_SHARED_SECRET is required. Run dockerized/scripts/deploy.sh or set it in dockerized/.env."
fi

: "${APP_URL:?APP_URL is required.}"
: "${HLS_PUBLIC_URL:?HLS_PUBLIC_URL is required.}"
: "${RTMP_INTERNAL_PORT:=1935}"
: "${HLS_INTERNAL_PORT:=8888}"

mkdir -p /config /var/www/html/storage/app/private/recordings

export APP_URL HLS_PUBLIC_URL MEDIAMTX_SHARED_SECRET RTMP_INTERNAL_PORT HLS_INTERNAL_PORT

envsubst '${APP_URL} ${HLS_PUBLIC_URL} ${MEDIAMTX_SHARED_SECRET} ${RTMP_INTERNAL_PORT} ${HLS_INTERNAL_PORT}' \
    < /etc/mediamtx/mediamtx.yml.template \
    > /config/mediamtx.yml

if command -v mediamtx >/dev/null 2>&1; then
    exec mediamtx /config/mediamtx.yml
fi

if [ -x /mediamtx ]; then
    exec /mediamtx /config/mediamtx.yml
fi

fail "MediaMTX binary was not found in the base image."
