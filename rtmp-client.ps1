param(
    [Parameter(Mandatory = $true)]
    [string]$RtmpUrl,

    [Parameter(Mandatory = $true)]
    [string]$StreamKey,

    [Parameter(Mandatory = $true)]
    [string[]]$Files,

    [switch]$Loop,

    [string]$Preset = "veryfast",

    [string]$VideoBitrate = "2500k",

    [string]$VideoBufsize = "5000k",

    [string]$AudioBitrate = "128k",

    [int]$KeyframeInterval = 60
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

function Test-Ffmpeg {
    try {
        Get-Command ffmpeg -ErrorAction Stop | Out-Null
    }
    catch {
        Write-Error "ffmpeg is not installed or not in PATH."
        exit 1
    }
}

function Build-TargetUrl {
    $base = $RtmpUrl.TrimEnd('/')
    $key = $StreamKey.TrimStart('/')

    return "$base/$key"
}

function Stream-File {
    param(
        [string]$File,
        [string]$TargetUrl
    )

    Write-Log "Streaming file: $File"

    $arguments = @(
        "-hide_banner"
        "-loglevel", "info"
        "-re"
        "-i", $File
        "-map", "0:v:0"
        "-map", "0:a?"
        "-c:v", "libx264"
        "-preset", $Preset
        "-tune", "zerolatency"
        "-pix_fmt", "yuv420p"
        "-profile:v", "baseline"
        "-level", "3.1"
        "-b:v", $VideoBitrate
        "-maxrate", $VideoBitrate
        "-bufsize", $VideoBufsize
        "-g", $KeyframeInterval
        "-c:a", "aac"
        "-b:a", $AudioBitrate
        "-ar", "44100"
        "-ac", "2"
        "-f", "flv"
        $TargetUrl
    )

    $process = Start-Process `
        -FilePath "ffmpeg" `
        -ArgumentList $arguments `
        -NoNewWindow `
        -PassThru `
        -Wait

    return $process.ExitCode
}

##################################################
# Validation
##################################################

Test-Ffmpeg

foreach ($file in $Files) {
    if (-not (Test-Path $file)) {
        Write-Error "File not found: $file"
        exit 1
    }
}

##################################################
# Main
##################################################

$targetUrl = Build-TargetUrl

Write-Log "RTMP target: $targetUrl"

try {
    do {
        foreach ($file in $Files) {

            $exitCode = Stream-File `
                -File $file `
                -TargetUrl $targetUrl

            if ($exitCode -ne 0) {
                Write-Log "ffmpeg exited with code $exitCode"
            }
        }

    } while ($Loop)

}
catch {
    Write-Log "Streaming interrupted."
}

Write-Log "Finished."
