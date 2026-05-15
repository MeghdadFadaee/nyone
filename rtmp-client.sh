#!/usr/bin/env bash

set -euo pipefail

########################################
# RTMP Playlist Streamer (Single Session)
# Requires: ffmpeg
########################################

RTMP_URL=""
STREAM_KEY=""
LOOP=false

FILES=()

VIDEO_BITRATE="2500k"
VIDEO_BUFSIZE="5000k"
AUDIO_BITRATE="128k"
PRESET="veryfast"
KEYFRAME_INTERVAL="60"

########################################
# Helpers
########################################

usage() {
    cat <<EOF
Usage:
  $0 --rtmp-url URL --stream-key KEY --files file1.mp4 [file2.mp4 ...]

Options:
  --rtmp-url              Example: rtmp://server/live
  --stream-key            Stream key
  --files                 One or more video files
  --loop                  Infinite playlist loop

Example:
  $0 \
    --rtmp-url rtmp://server/live \
    --stream-key mystream \
    --files intro.mp4 movie.mp4 \
    --loop
EOF
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

cleanup() {
    log "Cleaning up..."

    [[ -f "$PLAYLIST_FILE" ]] && rm -f "$PLAYLIST_FILE"

    if [[ -n "${FFMPEG_PID:-}" ]]; then
        kill "$FFMPEG_PID" 2>/dev/null || true
    fi

    exit 0
}

########################################
# Parse args
########################################

while [[ $# -gt 0 ]]; do
    case "$1" in
        --rtmp-url)
            RTMP_URL="$2"
            shift 2
            ;;

        --stream-key)
            STREAM_KEY="$2"
            shift 2
            ;;

        --files)
            shift

            while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
                FILES+=("$1")
                shift
            done
            ;;

        --loop)
            LOOP=true
            shift
            ;;

        -h|--help)
            usage
            exit 0
            ;;

        *)
            echo "Unknown argument: $1"
            usage
            exit 1
            ;;
    esac
done

########################################
# Validation
########################################

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ffmpeg is not installed."
    exit 1
fi

if [[ -z "$RTMP_URL" ]]; then
    echo "--rtmp-url is required"
    exit 1
fi

if [[ -z "$STREAM_KEY" ]]; then
    echo "--stream-key is required"
    exit 1
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "At least one file is required"
    exit 1
fi

for file in "${FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "File not found: $file"
        exit 1
    fi
done

########################################
# Signals
########################################

trap cleanup SIGINT SIGTERM

########################################
# Build playlist
########################################

PLAYLIST_FILE="$(mktemp)"

for file in "${FILES[@]}"; do
    ABS_PATH="$(realpath "$file")"

    # Escape single quotes
    ESCAPED_PATH="${ABS_PATH//\'/\'\\\'\'}"

    echo "file '$ESCAPED_PATH'" >> "$PLAYLIST_FILE"
done

########################################
# Build target URL
########################################

TARGET_URL="${RTMP_URL%/}/${STREAM_KEY#/}"

log "RTMP Target: $TARGET_URL"
log "Playlist File: $PLAYLIST_FILE"

########################################
# FFmpeg command
########################################

FFMPEG_ARGS=(
    -hide_banner
    -loglevel info

    # Real-time playback
    -re

    # Concat playlist
    -f concat
    -safe 0
    -i "$PLAYLIST_FILE"

    # Video
    -c:v libx264
    -preset "$PRESET"
    -tune zerolatency
    -pix_fmt yuv420p
    -profile:v baseline
    -level 3.1
    -b:v "$VIDEO_BITRATE"
    -maxrate "$VIDEO_BITRATE"
    -bufsize "$VIDEO_BUFSIZE"
    -g "$KEYFRAME_INTERVAL"

    # Audio
    -c:a aac
    -b:a "$AUDIO_BITRATE"
    -ar 44100
    -ac 2

    # Output
    -f flv
    "$TARGET_URL"
)

########################################
# Infinite loop
########################################

if [[ "$LOOP" == true ]]; then
    FFMPEG_ARGS=(
        -stream_loop -1
        "${FFMPEG_ARGS[@]}"
    )
fi

########################################
# Start streaming
########################################

log "Starting stream..."

ffmpeg "${FFMPEG_ARGS[@]}" &
FFMPEG_PID=$!

wait "$FFMPEG_PID"

cleanup
