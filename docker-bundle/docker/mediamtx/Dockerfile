FROM bluenviron/mediamtx:latest-ffmpeg

USER root

RUN (apk add --no-cache curl gettext >/dev/null 2>&1) \
    || (apt-get update \
        && apt-get install -y --no-install-recommends ca-certificates curl gettext-base \
        && rm -rf /var/lib/apt/lists/*)

COPY docker/mediamtx/entrypoint.sh /usr/local/bin/nyone-mediamtx-entrypoint
COPY docker/mediamtx/mediamtx.yml.template /etc/mediamtx/mediamtx.yml.template

RUN chmod +x /usr/local/bin/nyone-mediamtx-entrypoint \
    && mkdir -p /config /var/www/html/storage/app/private/recordings

ENTRYPOINT ["nyone-mediamtx-entrypoint"]

