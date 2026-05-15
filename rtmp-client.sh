#!/usr/bin/env bash

set -euo pipefail

########################################
# Simple RTMP Streaming Client
# Requires: ffmpeg
########################################

RTMP_URL=""
STREAM_KEY=""
LOOP=false

VIDEO_BITRATE="2500k"
VIDEO_BUFSIZE="5000k"
AUDIO_BITRATE="128k"
PRESET="veryfast"
KEYFRAME_INTERVAL="60"

FILES=()

########################################
# Helpers
########################################

usage() {
    cat <<EOF
Usage:
  $0 --rtmp-url URL --stream-key KEY --files file1.mp4 [file2.mp4 ...]

Options:
  --rtmp-url              RTMP server URL
                           Example: rtmp://server/live

  --stream-key            Stream key

  --files                 One or more video files

  --loop                  Loop playlist forever

  --preset                x264 preset
                           Default: veryfast

  --video-bitrate         Video bitrate
                           Default: 2500k

  --video-bufsize         Video buffer size
                           Default: 5000k

  --audio-bitrate         Audio bitrate
                           Default: 128k

  --keyframe-interval     GOP size
                           Default: 60

Example:
  $0 \
    --rtmp-url rtmp://live.example.com/app \
    --stream-key abc123 \
    --files intro.mp4 movie.mp4 \
    --loop
EOF
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

cleanup() {
    log "Stopping stream..."

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

        --preset)
            PRESET="$2"
            shift 2
            ;;

        --video-bitrate)
            VIDEO_BITRATE="$2"
            shift 2
            ;;

        --video-bufsize)
            VIDEO_BUFSIZE="$2"
            shift 2
            ;;

        --audio-bitrate)
            AUDIO_BITRATE="$2"
            shift 2
            ;;

        --keyframe-interval)
            KEYFRAME_INTERVAL="$2"
            shift 2
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
# Main
########################################

TARGET_URL="${RTMP_URL%/}/${STREAM_KEY#/}"

log "RTMP target: $TARGET_URL"

stream_file() {
    local file="$1"

    log "Streaming file: $file"

    ffmpeg \
        -hide_banner \
        -loglevel info \
        -re \
        -i "$file" \
        -map 0:v:0 \
        -map 0:a? \
        -c:v libx264 \
        -preset "$PRESET" \
        -tune zerolatency \
        -pix_fmt yuv420p \
        -profile:v baseline \
        -level 3.1 \
        -b:v "$VIDEO_BITRATE" \
        -maxrate "$VIDEO_BITRATE" \
        -bufsize "$VIDEO_BUFSIZE" \
        -g "$KEYFRAME_INTERVAL" \
        -c:a aac \
        -b:a "$AUDIO_BITRATE" \
        -ar 44100 \
        -ac 2 \
        -f flv \
        "$TARGET_URL" &

    FFMPEG_PID=$!
    wait "$FFMPEG_PID"
}

while true; do
    for file in "${FILES[@]}"; do
        stream_file "$file"
    done

    if [[ "$LOOP" != true ]]; then
        break
    fi
done

log "Finished."
