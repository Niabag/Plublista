# FFmpeg Video Composition Script
# Adds branding, music, and normalizes audio for Instagram Reels

param(
    [Parameter(Mandatory=$true)]
    [string]$In,

    [Parameter(Mandatory=$true)]
    [string]$Out,

    [int]$Duration = 0,

    [string]$Music = "",

    [double]$MusicVolume = 0.15,

    [string]$ConfigPath = "..\config.yaml"
)

# Set UTF-8 encoding for console output
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Add FFmpeg to PATH - check multiple locations
$ffmpegPaths = @(
    "$PSScriptRoot\..\node_modules\ffmpeg-static",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"
)
foreach ($fp in $ffmpegPaths) {
    if (Test-Path "$fp\ffmpeg.exe") {
        $env:Path = $env:Path + ";" + $fp
        break
    }
}

Write-Host "Starting video composition..." -ForegroundColor Cyan

# Check if FFmpeg is available
try {
    $null = & ffmpeg -version 2>&1
    Write-Host "FFmpeg found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: FFmpeg not found in PATH" -ForegroundColor Red
    Write-Host "Please install FFmpeg: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    exit 1
}

# Check if input file exists
if (-not (Test-Path $In)) {
    Write-Host "ERROR: Input file not found: $In" -ForegroundColor Red
    exit 1
}

Write-Host "Input file: $In" -ForegroundColor Cyan
Write-Host "Output file: $Out" -ForegroundColor Cyan

# Load config (simplified - in production, parse YAML properly)
$brandLogo = "assets\brand\logo.png"
# $musicTrack = "assets\music\tech-energy.mp3"  # No longer used - music now plays live in Stream View

# Create output directory if it doesn't exist
$outDir = Split-Path -Parent $Out
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# Step 0: Check if portrait conversion needed (skip if already 1080x1920)
Write-Host ""
Write-Host "Step 0: Checking video format..." -ForegroundColor Yellow
$step0 = "$outDir\step0_portrait.mp4"

# Detect input resolution
$inputWidth = 0
$inputHeight = 0
try {
    $probeOutput = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $In 2>&1
    if ($probeOutput -match '(\d+),(\d+)') {
        $inputWidth = [int]$Matches[1]
        $inputHeight = [int]$Matches[2]
    }
} catch {}

Write-Host "  Input resolution: ${inputWidth}x${inputHeight}" -ForegroundColor Cyan

$needsPortraitCrop = ($inputWidth -gt $inputHeight)
if ($needsPortraitCrop) {
    Write-Host "  Landscape detected - cropping to portrait 1080x1920..." -ForegroundColor Yellow
    $portraitFilter = 'crop=ih*9/16:ih,scale=1080:1920'
    $ffmpegArgs = @('-i', $In)

    if ($Duration -gt 0) {
        Write-Host "  Cutting video to $Duration seconds" -ForegroundColor Cyan
        $ffmpegArgs += @('-t', $Duration.ToString())
    }

    $ffmpegArgs += @('-vf', $portraitFilter, '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', $step0, '-y')
    $output = & ffmpeg @ffmpegArgs 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Portrait crop applied" -ForegroundColor Green
        $currentInput = $step0
    } else {
        Write-Host "  WARNING: Portrait conversion failed, using original" -ForegroundColor Yellow
        $currentInput = $In
    }
} else {
    Write-Host "  Already portrait format - skipping crop" -ForegroundColor Green

    # Still apply duration cut if needed
    if ($Duration -gt 0) {
        Write-Host "  Cutting video to $Duration seconds" -ForegroundColor Cyan
        $ffmpegArgs = @('-i', $In, '-t', $Duration.ToString(), '-c:v', 'copy', '-c:a', 'copy', $step0, '-y')
        $output = & ffmpeg @ffmpegArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            $currentInput = $step0
        } else {
            $currentInput = $In
        }
    } else {
        $currentInput = $In
    }
}

# Step 1: Brand overlay (disabled - branding is now handled by HTML scenes)
Write-Host ""
Write-Host "Step 1: Brand overlay skipped (handled by stream-view scenes)" -ForegroundColor Yellow
$step1 = $currentInput

# Step 2: Add background music via FFmpeg
Write-Host ""
Write-Host "Step 2: Background music..." -ForegroundColor Yellow

if ($Music -and (Test-Path $Music)) {
    Write-Host "  Music file: $Music" -ForegroundColor Cyan
    Write-Host "  Volume: $MusicVolume" -ForegroundColor Cyan
    $step2 = "$outDir\step2_music.mp4"

    # Check if input video has an audio stream
    $hasAudio = $false
    try {
        $audioProbe = & ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 $step1 2>&1
        if ($audioProbe -match 'audio') {
            $hasAudio = $true
            Write-Host "  Input has audio track - will mix with music" -ForegroundColor Cyan
        }
    } catch {}

    if ($hasAudio) {
        # Mix original audio with background music
        $musicFilter = "[1:a]volume=${MusicVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]"
        $ffmpegArgs = @('-i', $step1, '-i', $Music, '-filter_complex', $musicFilter, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', $step2, '-y')
    } else {
        # No audio in video - add music as the only audio track
        Write-Host "  No audio in recording - adding music as audio track" -ForegroundColor Yellow
        $musicFilter = "[0:a]volume=${MusicVolume}"
        $ffmpegArgs = @('-i', $step1, '-i', $Music, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', $step2, '-y')
    }

    Write-Host "  [DEBUG] Command: ffmpeg $($ffmpegArgs -join ' ')" -ForegroundColor DarkGray
    $output = & ffmpeg @ffmpegArgs 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Background music added successfully" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Music mixing failed, continuing without music" -ForegroundColor Yellow
        if ($output) {
            $errorLines = $output | Select-Object -Last 5
            $errorLines | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
        $step2 = $step1
    }
} else {
    if ($Music) {
        Write-Host "  WARNING: Music file not found: $Music" -ForegroundColor Yellow
    } else {
        Write-Host "  No music file specified" -ForegroundColor Yellow
    }
    $step2 = $step1
}

# Step 3: Normalize loudness for Instagram
Write-Host ""
Write-Host "Step 3: Normalizing audio..." -ForegroundColor Yellow

Write-Host "  [DEBUG] Input file for step 3: $step2" -ForegroundColor Magenta
Write-Host "  [DEBUG] Output file: $Out" -ForegroundColor Magenta

# Check if step2 file exists
if (-not (Test-Path $step2)) {
    Write-Host "  ERROR: Step 2 output file not found: $step2" -ForegroundColor Red
    Write-Host "  This might mean step 2 failed silently" -ForegroundColor Yellow
    exit 1
}

$loudnormFilter = 'loudnorm=I=-16:TP=-1.5:LRA=11'
Write-Host "  Applying loudness normalization..." -ForegroundColor Cyan

# Build args array carefully
$ffmpegArgs = @(
    '-i', $step2,
    '-af', $loudnormFilter,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    $Out,
    '-y'
)

Write-Host "  [DEBUG] FFmpeg command:" -ForegroundColor Magenta
Write-Host "  ffmpeg $($ffmpegArgs -join ' ')" -ForegroundColor DarkGray

$output = & ffmpeg @ffmpegArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Audio normalized successfully" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Audio normalization failed" -ForegroundColor Red
    Write-Host "  FFmpeg exit code: $LASTEXITCODE" -ForegroundColor Red
    
    Write-Host "  [DEBUG] Failed command: ffmpeg $($ffmpegArgs -join ' ')" -ForegroundColor Magenta
    
    if ($output) {
        $errorLines = $output | Select-Object -Last 10
        Write-Host "  Last error lines:" -ForegroundColor Yellow
        $errorLines | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
    exit 1
}

# Clean up intermediate files
if ($step0 -and (Test-Path $step0)) { Remove-Item $step0 -ErrorAction SilentlyContinue }
if ($step1 -ne $currentInput -and (Test-Path $step1)) { Remove-Item $step1 -ErrorAction SilentlyContinue }
if ($step2 -ne $step1 -and (Test-Path $step2)) { Remove-Item $step2 -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "Video composition complete!" -ForegroundColor Green
Write-Host "Output: $Out" -ForegroundColor Cyan

# Get video info
try {
    $duration = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Out 2>&1
    $size = (Get-Item $Out).Length / 1MB
    
    if ($duration -match '^\d+\.?\d*$') {
        Write-Host "Duration: $([math]::Round([double]$duration, 1))s" -ForegroundColor Gray
    }
    Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
} catch {
    # Ignore errors getting video info
}
