# FFmpeg Video Composition Script
# Adds branding, music, and normalizes audio for Instagram Reels

param(
    [Parameter(Mandatory=$true)]
    [string]$In,
    
    [Parameter(Mandatory=$true)]
    [string]$Out,
    
    [int]$Duration = 0,
    
    [string]$ConfigPath = "..\config.yaml"
)

# Set UTF-8 encoding for console output
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Add FFmpeg to PATH if installed via WinGet
$ffmpegPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin"
if (Test-Path $ffmpegPath) {
    $env:Path = $env:Path + ";" + $ffmpegPath
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

# Step 0: Convert to portrait format (9:16 for Instagram Reels)
Write-Host ""
Write-Host "Step 0: Converting to portrait format (1080x1920)..." -ForegroundColor Yellow
$step0 = "$outDir\step0_portrait.mp4"

Write-Host "  [DEBUG] Input: $In" -ForegroundColor Magenta
Write-Host "  [DEBUG] Output: $step0" -ForegroundColor Magenta
Write-Host "  [DEBUG] Target format: 1080x1920 (9:16)" -ForegroundColor Magenta

# Crop to 9:16 aspect ratio (center crop)
# This takes the center part of the video and crops it to portrait
$portraitFilter = 'crop=ih*9/16:ih,scale=1080:1920'
$ffmpegArgs = @('-i', $In)

# Add duration cut if specified
if ($Duration -gt 0) {
    Write-Host "  [DEBUG] Cutting video to exactly $Duration seconds" -ForegroundColor Cyan
    $ffmpegArgs += @('-t', $Duration.ToString())
}

$ffmpegArgs += @('-vf', $portraitFilter, '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', $step0, '-y')

Write-Host "  [DEBUG] Command: ffmpeg $($ffmpegArgs -join ' ')" -ForegroundColor DarkGray
$output = & ffmpeg @ffmpegArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Portrait format applied successfully" -ForegroundColor Green
    $currentInput = $step0
} else {
    Write-Host "  WARNING: Portrait conversion failed, using original" -ForegroundColor Yellow
    Write-Host "  FFmpeg exit code: $LASTEXITCODE" -ForegroundColor Yellow
    $currentInput = $In
}

# Step 1: Add brand overlay
Write-Host ""
Write-Host "Step 1: Adding brand overlay..." -ForegroundColor Yellow
$step1 = "$outDir\step1_brand.mp4"

Write-Host "  [DEBUG] Input: $currentInput" -ForegroundColor Magenta
Write-Host "  [DEBUG] Logo: $brandLogo" -ForegroundColor Magenta
Write-Host "  [DEBUG] Output: $step1" -ForegroundColor Magenta

if (Test-Path $brandLogo) {
    Write-Host "  Adding brand logo overlay..." -ForegroundColor Cyan
    # No scaling needed, video is already 1080 width from step 0
    $filterComplex = '[0:v][1:v]overlay=16:16:format=auto'
    $ffmpegArgs = @('-i', $currentInput, '-i', $brandLogo, '-filter_complex', $filterComplex, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', $step1, '-y')
    
    Write-Host "  [DEBUG] Command: ffmpeg $($ffmpegArgs -join ' ')" -ForegroundColor DarkGray
    $output = & ffmpeg @ffmpegArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Brand overlay added successfully" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Brand overlay failed, continuing without it" -ForegroundColor Yellow
        Write-Host "  FFmpeg exit code: $LASTEXITCODE" -ForegroundColor Yellow
        $step1 = $currentInput
    }
} else {
    Write-Host "  Logo not found at: $brandLogo" -ForegroundColor Yellow
    Write-Host "  Continuing without brand overlay" -ForegroundColor Yellow
    $step1 = $currentInput
}

# Step 2: Skip music (now played live in Stream View and captured by OBS)
Write-Host ""
Write-Host "Step 2: Background music..." -ForegroundColor Yellow
Write-Host "  Music is now played LIVE in the Stream View window" -ForegroundColor Cyan
Write-Host "  OBS captures the audio directly during recording" -ForegroundColor Cyan
Write-Host "  No post-processing needed for music" -ForegroundColor Green
$step2 = $step1

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
