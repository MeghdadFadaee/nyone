param(
    [Parameter(Mandatory = $true)]
    [string]$RtmpUrl,

    [Parameter(Mandatory = $true)]
    [string]$StreamKey,

    [Parameter(Mandatory = $true)]
    [string[]]$Files,

    [switch]$Loop
)

$ErrorActionPreference = "Stop"

##################################################
# Helpers
##################################################

function Write-Log {
    param([string]$Message)

    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$time] $Message"
}

function Test-FFmpeg {
    try {
        Get-Command ffmpeg -ErrorAction Stop | Out-Null
    }
    catch {
        Write-Error "ffmpeg not found in PATH."
        exit 1
    }
}

##################################################
# Validation
##################################################

Test-FFmpeg

foreach ($file in $Files) {
    if (-not (Test-Path $file)) {
        Write-Error "File not found: $file"
        exit 1
    }
}

##################################################
# Build playlist
##################################################

$playlistFile = Join-Path $env:TEMP "ffmpeg_playlist.txt"

if (Test-Path $playlistFile) {
    Remove-Item $playlistFile -Force
}

foreach ($file in $Files) {

    $fullPath = (Resolve-Path $file).Path.Replace("'", "''")

    Add-Content -Path $playlistFile -Value "file '$fullPath'"
}

##################################################
# RTMP URL
##################################################

$targetUrl = "$($RtmpUrl.TrimEnd('/'))/$($StreamKey.TrimStart('/'))"

Write-Log "RTMP Target: $targetUrl"
Write-Log "Playlist: $playlistFile"

##################################################
# FFmpeg args
##################################################

$arguments = @(
    "-hide_banner"
    "-loglevel", "info"

    # Real-time mode
    "-re"

    # Infinite loop playlist
    "-stream_loop", "-1"

    # Concat playlist
    "-f", "concat"
    "-safe", "0"
    "-i", $playlistFile

    # Video
    "-c:v", "libx264"
    "-preset", "veryfast"
    "-tune", "zerolatency"
    "-pix_fmt", "yuv420p"
    "-profile:v", "baseline"
    "-level", "3.1"
    "-b:v", "2500k"
    "-maxrate", "2500k"
    "-bufsize", "5000k"
    "-g", "60"

    # Audio
    "-c:a", "aac"
    "-b:a", "128k"
    "-ar", "44100"
    "-ac", "2"

    # Output
    "-f", "flv"
    $targetUrl
)

if (-not $Loop) {
    # Remove infinite loop if user does not want looping
    $arguments = $arguments | Where-Object { $_ -ne "-1" }
}

##################################################
# Run ffmpeg
##################################################

try {

    Write-Log "Starting stream..."

    Start-Process `
        -FilePath "ffmpeg" `
        -ArgumentList $arguments `
        -NoNewWindow `
        -Wait

}
finally {

    if (Test-Path $playlistFile) {
        Remove-Item $playlistFile -Force
    }
}

Write-Log "Finished."
