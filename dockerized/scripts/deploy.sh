#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_ENV_FILE="$ROOT_DIR/.env.example"
SOURCE_DIR="$ROOT_DIR/runtime/source"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

info() {
    printf '[nyone-deploy] %s\n' "$*"
}

fail() {
    printf '[nyone-deploy] ERROR: %s\n' "$*" >&2
    exit 1
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

set_env_value() {
    local key="$1"
    local value="$2"
    local escaped

    escaped="$(printf '%s' "$value" | sed 's/[\/&]/\\&/g')"

    if grep -qE "^${key}=" "$ENV_FILE"; then
        sed -i.bak "s/^${key}=.*/${key}=${escaped}/" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    else
        printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    fi
}

is_missing_secret() {
    local value="$1"

    [ -z "$value" ] || [[ "$value" == "change-me"* ]] || [[ "$value" == "base64:change-me"* ]]
}

random_secret() {
    openssl rand -base64 48 | tr -d '\n' | tr '/+' '_-' | tr -d '='
}

ensure_env_file() {
    if [ -f "$ENV_FILE" ]; then
        return 0
    fi

    [ -f "$EXAMPLE_ENV_FILE" ] || fail ".env.example was not found."
    cp "$EXAMPLE_ENV_FILE" "$ENV_FILE"
    info "Created .env from .env.example."
}

ensure_secret() {
    local key="$1"
    local value

    value="$(env_value "$key")"

    if is_missing_secret "$value"; then
        set_env_value "$key" "$(random_secret)"
        info "Generated $key."
    fi
}

require_config_value() {
    local key="$1"
    local placeholder="${2:-}"
    local value

    value="$(env_value "$key")"

    [ -n "$value" ] || fail "Set $key in $ENV_FILE."

    if [ -n "$placeholder" ] && [ "$value" = "$placeholder" ]; then
        fail "Replace the placeholder $key in $ENV_FILE."
    fi
}

ensure_app_key() {
    local value

    value="$(env_value APP_KEY)"

    if is_missing_secret "$value"; then
        set_env_value APP_KEY "base64:$(openssl rand -base64 32 | tr -d '\n')"
        info "Generated APP_KEY."
    fi
}

clone_or_update_source() {
    local repository_url="$1"
    local git_ref="$2"

    mkdir -p "$(dirname "$SOURCE_DIR")"

    if [ -d "$SOURCE_DIR/.git" ]; then
        info "Updating existing source checkout."
        git -C "$SOURCE_DIR" fetch --prune --tags origin

        if git -C "$SOURCE_DIR" rev-parse --verify --quiet "origin/$git_ref" >/dev/null; then
            git -C "$SOURCE_DIR" checkout -B "$git_ref" "origin/$git_ref"
        else
            git -C "$SOURCE_DIR" checkout "$git_ref"
        fi

        return 0
    fi

    if [ -e "$SOURCE_DIR" ]; then
        fail "$SOURCE_DIR exists but is not a Git checkout. Move it away or remove it before deploying."
    fi

    info "Cloning application repository."
    git clone "$repository_url" "$SOURCE_DIR"
    git -C "$SOURCE_DIR" checkout "$git_ref"
}

run_compose() {
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

require_command git
require_command docker
require_command openssl

ensure_env_file
ensure_app_key
ensure_secret POSTGRES_PASSWORD
ensure_secret MEDIAMTX_SHARED_SECRET

GIT_REPOSITORY_URL="$(env_value GIT_REPOSITORY_URL)"
GIT_REF="$(env_value GIT_REF)"

require_config_value GIT_REPOSITORY_URL "https://github.com/your-org/nyone.git"
require_config_value APP_DOMAIN "nyone.example.com"
require_config_value HLS_DOMAIN "nyone-hls.example.com"

if [ "$(env_value APP_DOMAIN)" = "$(env_value HLS_DOMAIN)" ]; then
    fail "APP_DOMAIN and HLS_DOMAIN must be different because this deployment uses separate Apache virtual hosts."
fi

GIT_REF="${GIT_REF:-main}"

clone_or_update_source "$GIT_REPOSITORY_URL" "$GIT_REF"

info "Validating Compose configuration."
run_compose config >/dev/null

info "Building Docker images."
run_compose build

info "Starting database and Redis."
run_compose up -d db redis

info "Running migrations."
run_compose --profile tools run --rm migrate

info "Starting background workers."
run_compose up -d --remove-orphans app mediamtx queue scheduler viewer-sync

info "Current container status:"
run_compose ps
