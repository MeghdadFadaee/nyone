#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
SOURCE_DIR="$ROOT_DIR/runtime/source"
BACKUP_ROOT="$ROOT_DIR/backups"
BACKUP_NAME="nyone-backup-$(date -u +%Y%m%d-%H%M%S)"
STOP_WRITERS=false
FORCE=false
STAGE_DIR=""
RESTART_WRITERS=false

info() {
    printf '[nyone-backup] %s\n' "$*"
}

warn() {
    printf '[nyone-backup] WARNING: %s\n' "$*" >&2
}

fail() {
    printf '[nyone-backup] ERROR: %s\n' "$*" >&2
    exit 1
}

usage() {
    cat <<'USAGE'
Usage:
  scripts/backup.sh [options]

Options:
  --output-dir PATH   Directory for the final zip file. Default: docker-bundle/backups
  --name NAME         Backup folder/zip base name. Default: nyone-backup-UTC_TIMESTAMP
  --stop-writers      Stop app, MediaMTX, queue, scheduler, and viewer-sync while files are archived
  --force             Replace an existing zip with the same name
  -h, --help          Show this help

The script creates one restore-ready zip containing:
  - docker-bundle deployment files and .env
  - runtime/source checkout when present, excluding dependencies and Laravel runtime cache/log files
  - PostgreSQL SQL dump
  - app storage volume archive
  - Redis data volume archive
  - restore.sh and README_RESTORE.md
USAGE
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 is required."
}

env_value() {
    local key="$1"

    if [ ! -f "$ENV_FILE" ]; then
        return 0
    fi

    awk -v key="$key" '
        index($0, key "=") == 1 {
            value = substr($0, length(key) + 2)
        }
        END {
            print value
        }
    ' "$ENV_FILE"
}

run_compose() {
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

cleanup() {
    local exit_code=$?

    if [ "$RESTART_WRITERS" = true ]; then
        info "Restarting writer services."
        run_compose up -d app mediamtx queue scheduler viewer-sync >/dev/null 2>&1 || true
    fi

    if [ -n "$STAGE_DIR" ] && [[ "$STAGE_DIR" == "$BACKUP_ROOT"/.*.stage ]]; then
        rm -rf "$STAGE_DIR"
    fi

    exit "$exit_code"
}

trap cleanup EXIT

while [ "$#" -gt 0 ]; do
    case "$1" in
        --output-dir)
            [ "$#" -ge 2 ] || fail "--output-dir requires a value."
            BACKUP_ROOT="$2"
            shift 2
            ;;
        --name)
            [ "$#" -ge 2 ] || fail "--name requires a value."
            BACKUP_NAME="$2"
            shift 2
            ;;
        --stop-writers)
            STOP_WRITERS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            fail "Unknown option: $1"
            ;;
    esac
done

case "$BACKUP_NAME" in
    */*|*\\*)
        fail "--name must be a file name, not a path."
        ;;
esac

[ -f "$ENV_FILE" ] || fail "$ENV_FILE was not found. Create it before running a backup."
[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE was not found."

require_command docker
require_command tar
require_command gzip
require_command zip
require_command sha256sum

mkdir -p "$BACKUP_ROOT"
BACKUP_ROOT="$(cd "$BACKUP_ROOT" && pwd)"
STAGE_DIR="$BACKUP_ROOT/.${BACKUP_NAME}.stage"
ARCHIVE_DIR="$STAGE_DIR/$BACKUP_NAME"
ZIP_PATH="$BACKUP_ROOT/$BACKUP_NAME.zip"

if [ -e "$ZIP_PATH" ] && [ "$FORCE" != true ]; then
    fail "$ZIP_PATH already exists. Use --force or choose another --name."
fi

rm -rf "$STAGE_DIR"
mkdir -p "$ARCHIVE_DIR"/{database,deployment,metadata,volumes}

info "Validating Compose configuration."
run_compose config > "$ARCHIVE_DIR/metadata/compose.resolved.yml"

if [ "$STOP_WRITERS" = true ]; then
    info "Stopping writer services for a consistent file backup."
    run_compose stop app mediamtx queue scheduler viewer-sync >/dev/null || true
    RESTART_WRITERS=true
fi

info "Writing PostgreSQL dump."
run_compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges' \
    | gzip -9 > "$ARCHIVE_DIR/database/postgres.sql.gz"

info "Archiving app storage volume."
run_compose run --rm --no-deps -T --user root --entrypoint tar \
    -v "$ARCHIVE_DIR/volumes:/backup" \
    app -czf /backup/app-storage.tar.gz -C /var/www/html/storage .

info "Archiving Redis data volume."
if ! run_compose exec -T redis redis-cli SAVE >/dev/null; then
    warn "Could not force a Redis SAVE before archiving; continuing with the current volume files."
fi

run_compose run --rm --no-deps -T --user root --entrypoint tar \
    -v "$ARCHIVE_DIR/volumes:/backup" \
    redis -czf /backup/redis-data.tar.gz -C /data .

info "Archiving docker-bundle deployment files."
tar -czf "$ARCHIVE_DIR/deployment/docker-bundle-files.tar.gz" \
    -C "$(dirname "$ROOT_DIR")" \
    --exclude='docker-bundle/backups' \
    --exclude='docker-bundle/runtime' \
    "$(basename "$ROOT_DIR")"

if [ -d "$SOURCE_DIR" ]; then
    info "Archiving runtime/source checkout."
    tar -czf "$ARCHIVE_DIR/deployment/runtime-source.tar.gz" \
        -C "$(dirname "$SOURCE_DIR")" \
        --exclude='source/.env' \
        --exclude='source/node_modules' \
        --exclude='source/vendor' \
        --exclude='source/public/build' \
        --exclude='source/storage/app/private/recordings' \
        --exclude='source/storage/framework/cache' \
        --exclude='source/storage/framework/sessions' \
        --exclude='source/storage/framework/testing' \
        --exclude='source/storage/framework/views' \
        --exclude='source/storage/logs' \
        source
else
    warn "$SOURCE_DIR was not found; the archive will rely on GIT_REPOSITORY_URL for source restoration."
fi

info "Writing metadata."
{
    printf 'created_at_utc=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf 'compose_project_name=%s\n' "$(env_value COMPOSE_PROJECT_NAME)"
    printf 'app_domain=%s\n' "$(env_value APP_DOMAIN)"
    printf 'hls_domain=%s\n' "$(env_value HLS_DOMAIN)"
    printf 'git_repository_url=%s\n' "$(env_value GIT_REPOSITORY_URL)"
    printf 'git_ref=%s\n' "$(env_value GIT_REF)"
    printf 'backup_name=%s\n' "$BACKUP_NAME"
    printf 'stop_writers=%s\n' "$STOP_WRITERS"
} > "$ARCHIVE_DIR/metadata/manifest.env"

docker version > "$ARCHIVE_DIR/metadata/docker-version.txt" 2>&1 || true
docker compose version > "$ARCHIVE_DIR/metadata/docker-compose-version.txt" 2>&1 || true
run_compose ps > "$ARCHIVE_DIR/metadata/container-status.txt" 2>&1 || true

if [ -d "$SOURCE_DIR/.git" ]; then
    {
        git -C "$SOURCE_DIR" remote -v
        git -C "$SOURCE_DIR" rev-parse HEAD
        git -C "$SOURCE_DIR" status --short
    } > "$ARCHIVE_DIR/metadata/source-git.txt" 2>&1 || true
fi

cat > "$ARCHIVE_DIR/README_RESTORE.md" <<'RESTORE_README'
# Nyone docker-bundle Backup Restore

This archive contains everything managed by the `docker-bundle/` deployment bundle:

- deployment files and `.env`
- `runtime/source` checkout when it existed at backup time
- PostgreSQL dump
- Laravel app storage volume
- Redis data volume

Host-level files outside `docker-bundle/`, such as Nginx site files and Let's Encrypt certificates, are not included.

## Restore on a fresh server

Install Docker and the Compose plugin first. Then extract this zip and run:

```bash
chmod +x restore.sh
./restore.sh /opt/nyone/docker-bundle
```

If the target already exists and you intentionally want to replace it:

```bash
./restore.sh --replace /opt/nyone/docker-bundle
```

The restore helper copies the deployment bundle, restores `runtime/source` when present, clones it from `.env` when missing, rebuilds the images, restores PostgreSQL, restores the app storage and Redis volumes, and starts the app services.

After restore, re-create host-level Nginx/TLS configuration if this is a new VPS.
RESTORE_README

cat > "$ARCHIVE_DIR/restore.sh" <<'RESTORE_SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/opt/nyone/docker-bundle"
REPLACE=false
TMP_DIR=""

info() {
    printf '[nyone-restore] %s\n' "$*"
}

fail() {
    printf '[nyone-restore] ERROR: %s\n' "$*" >&2
    exit 1
}

usage() {
    cat <<'USAGE'
Usage:
  ./restore.sh [--replace] [target-dir]

Example:
  ./restore.sh /opt/nyone/docker-bundle
  ./restore.sh --replace /opt/nyone/docker-bundle
USAGE
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 is required."
}

env_value() {
    local key="$1"
    local env_file="$TARGET_DIR/.env"

    if [ ! -f "$env_file" ]; then
        return 0
    fi

    awk -v key="$key" '
        index($0, key "=") == 1 {
            value = substr($0, length(key) + 2)
        }
        END {
            print value
        }
    ' "$env_file"
}

ensure_source_checkout() {
    local repository_url
    local git_ref

    if [ -d "$TARGET_DIR/runtime/source" ]; then
        return 0
    fi

    repository_url="$(env_value GIT_REPOSITORY_URL)"
    git_ref="$(env_value GIT_REF)"
    git_ref="${git_ref:-main}"

    [ -n "$repository_url" ] || fail "runtime/source is missing and GIT_REPOSITORY_URL is not set in .env."

    require_command git

    info "Cloning runtime/source from GIT_REPOSITORY_URL."
    mkdir -p "$TARGET_DIR/runtime"
    git clone "$repository_url" "$TARGET_DIR/runtime/source"
    git -C "$TARGET_DIR/runtime/source" checkout "$git_ref"
}

cleanup() {
    if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
        rm -rf "$TMP_DIR"
    fi
}

trap cleanup EXIT

while [ "$#" -gt 0 ]; do
    case "$1" in
        --replace)
            REPLACE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            TARGET_DIR="$1"
            shift
            ;;
    esac
done

[ "$TARGET_DIR" != "/" ] || fail "Refusing to restore into /."
[ -f "$BACKUP_DIR/deployment/docker-bundle-files.tar.gz" ] || fail "deployment/docker-bundle-files.tar.gz is missing."
[ -f "$BACKUP_DIR/database/postgres.sql.gz" ] || fail "database/postgres.sql.gz is missing."
[ -f "$BACKUP_DIR/volumes/app-storage.tar.gz" ] || fail "volumes/app-storage.tar.gz is missing."

require_command docker
require_command tar
require_command gzip

TARGET_PARENT="$(dirname "$TARGET_DIR")"
mkdir -p "$TARGET_PARENT"

if [ -e "$TARGET_DIR" ]; then
    if [ "$REPLACE" != true ]; then
        fail "$TARGET_DIR already exists. Use --replace if you want to replace it."
    fi

    if [ -f "$TARGET_DIR/docker-compose.yml" ] && [ -f "$TARGET_DIR/.env" ]; then
        info "Stopping existing Compose stack."
        docker compose --env-file "$TARGET_DIR/.env" -f "$TARGET_DIR/docker-compose.yml" down || true
    fi

    rm -rf "$TARGET_DIR"
fi

TMP_DIR="$(mktemp -d)"
info "Restoring docker-bundle files."
tar -xzf "$BACKUP_DIR/deployment/docker-bundle-files.tar.gz" -C "$TMP_DIR"
[ -d "$TMP_DIR/docker-bundle" ] || fail "Backup did not contain a docker-bundle directory."
mv "$TMP_DIR/docker-bundle" "$TARGET_DIR"

if [ -f "$BACKUP_DIR/deployment/runtime-source.tar.gz" ]; then
    info "Restoring runtime/source."
    mkdir -p "$TARGET_DIR/runtime"
    tar -xzf "$BACKUP_DIR/deployment/runtime-source.tar.gz" -C "$TARGET_DIR/runtime"
fi

chmod +x "$TARGET_DIR"/scripts/*.sh

cd "$TARGET_DIR"
ensure_source_checkout

run_compose() {
    docker compose --env-file "$TARGET_DIR/.env" -f "$TARGET_DIR/docker-compose.yml" "$@"
}

info "Validating Compose configuration."
run_compose config >/dev/null

info "Building Docker images."
run_compose build

info "Starting PostgreSQL."
run_compose up -d db
run_compose exec -T db sh -c 'until pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do sleep 2; done'

info "Restoring PostgreSQL dump."
gzip -dc "$BACKUP_DIR/database/postgres.sql.gz" \
    | run_compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

info "Restoring app storage volume."
run_compose run --rm --no-deps -T --user root --entrypoint sh \
    -v "$BACKUP_DIR/volumes:/backup:ro" \
    app -c 'find /var/www/html/storage -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /backup/app-storage.tar.gz -C /var/www/html/storage'

if [ -f "$BACKUP_DIR/volumes/redis-data.tar.gz" ]; then
    info "Restoring Redis data volume."
    run_compose up -d redis
    run_compose stop redis >/dev/null || true
    run_compose run --rm --no-deps -T --user root --entrypoint sh \
        -v "$BACKUP_DIR/volumes:/backup:ro" \
        redis -c 'find /data -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /backup/redis-data.tar.gz -C /data'
fi

info "Starting application services."
run_compose up -d --remove-orphans app mediamtx queue scheduler viewer-sync redis
run_compose ps
RESTORE_SCRIPT

chmod +x "$ARCHIVE_DIR/restore.sh"

info "Writing checksums."
(
    cd "$ARCHIVE_DIR"
    find deployment database volumes metadata -type f -print0 | sort -z | xargs -0 sha256sum > checksums.sha256
)

info "Creating zip archive."
rm -f "$ZIP_PATH"
(
    cd "$STAGE_DIR"
    zip -rq "$ZIP_PATH" "$BACKUP_NAME"
)

info "Backup ready: $ZIP_PATH"
