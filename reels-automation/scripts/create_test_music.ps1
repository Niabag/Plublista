# Create a simple test music file using ffmpeg
# This generates a 15-second ambient tone for testing

param(
    [string]$Output = "..\assets\music\tech-energy.mp3"
)

Write-Host "Creating test music file..." -ForegroundColor Cyan

# Check if FFmpeg is available
try {
    $null = & ffmpeg -version 2>&1
} catch {
    Write-Host "ERROR: FFmpeg not found" -ForegroundColor Red
    Write-Host "Please download a real music file instead" -ForegroundColor Yellow
    exit 1
}

# Create output directory
$outDir = Split-Path -Parent $Output
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# Generate a simple ambient sound (sine wave at 220Hz with some modulation)
# Duration: 15 seconds
$ffmpegArgs = @(
    '-f', 'lavfi',
    '-i', 'aevalsrc=0.3*sin(2*PI*220*t)*sin(2*PI*0.5*t):d=15',
    '-ar', '44100',
    '-ac', '2',
    '-b:a', '128k',
    $Output,
    '-y'
)

Write-Host "Generating ambient tone..." -ForegroundColor Yellow
$output = & ffmpeg @ffmpegArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Test music created successfully!" -ForegroundColor Green
    Write-Host "File: $Output" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Yellow
    Write-Host "⚠️  WARNING: This is a TEST file with a simple tone" -ForegroundColor Yellow
    Write-Host "For production, replace with real music from:" -ForegroundColor Yellow
    Write-Host "  - YouTube Audio Library (free)" -ForegroundColor Cyan
    Write-Host "  - Pixabay Music (free)" -ForegroundColor Cyan
    Write-Host "  - https://pixabay.com/music/" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to create test music" -ForegroundColor Red
    exit 1
}
