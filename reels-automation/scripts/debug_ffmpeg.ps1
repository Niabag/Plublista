# FFmpeg Debugger
# Comprehensive debugging tool for FFmpeg operations

param(
    [Parameter(Mandatory=$false)]
    [string]$TestMode = "full",  # full, command, paths
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = ""
)

# UTF-8 encoding
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  FFmpeg Debugger v1.0" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Colors for different log levels
function Write-Debug-Info { param($msg) Write-Host "[DEBUG] $msg" -ForegroundColor Gray }
function Write-Debug-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Debug-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Debug-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Test 1: Check FFmpeg Installation
Write-Host "Test 1: FFmpeg Installation" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor DarkGray

# Check PATH
$ffmpegInPath = $null
try {
    $ffmpegInPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
} catch {}

if ($ffmpegInPath) {
    Write-Debug-Success "FFmpeg found in PATH: $($ffmpegInPath.Source)"
} else {
    Write-Debug-Warning "FFmpeg NOT in system PATH"
    
    # Check WinGet location
    $wingetPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin"
    if (Test-Path "$wingetPath\ffmpeg.exe") {
        Write-Debug-Info "Found FFmpeg in WinGet location: $wingetPath"
        $env:Path = $env:Path + ";" + $wingetPath
        Write-Debug-Success "Added to PATH for this session"
    }
}

# Test version
try {
    $version = & ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Debug-Success "Version: $version"
} catch {
    Write-Debug-Error "Cannot execute FFmpeg: $_"
    exit 1
}

Write-Host ""

# Test 2: Check FFprobe
Write-Host "Test 2: FFprobe Availability" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor DarkGray

try {
    $null = & ffprobe -version 2>&1
    Write-Debug-Success "FFprobe is available"
} catch {
    Write-Debug-Warning "FFprobe not found (needed for video info)"
}

Write-Host ""

# Test 3: Asset Files
Write-Host "Test 3: Asset Files" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor DarkGray

$basePath = Split-Path -Parent $PSScriptRoot
$brandLogo = Join-Path $basePath "assets\brand\logo.png"
$musicTrack = Join-Path $basePath "assets\music\tech-energy.mp3"

Write-Debug-Info "Base path: $basePath"
Write-Debug-Info "Logo path: $brandLogo"
Write-Debug-Info "Music path: $musicTrack"

if (Test-Path $brandLogo) {
    $logoSize = (Get-Item $brandLogo).Length / 1KB
    Write-Debug-Success "Brand logo exists ($([math]::Round($logoSize, 2)) KB)"
} else {
    Write-Debug-Warning "Brand logo NOT found"
}

if (Test-Path $musicTrack) {
    $musicSize = (Get-Item $musicTrack).Length / 1MB
    Write-Debug-Success "Music track exists ($([math]::Round($musicSize, 2)) MB)"
} else {
    Write-Debug-Warning "Music track NOT found"
}

Write-Host ""

# Test 4: Input File (if provided)
if ($InputFile) {
    Write-Host "Test 4: Input File Analysis" -ForegroundColor Yellow
    Write-Host "---------------------------" -ForegroundColor DarkGray
    
    if (Test-Path $InputFile) {
        Write-Debug-Success "Input file exists: $InputFile"
        $inputSize = (Get-Item $InputFile).Length / 1MB
        Write-Debug-Info "Size: $([math]::Round($inputSize, 2)) MB"
        
        # Get video info
        try {
            $duration = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$InputFile" 2>&1
            if ($duration -match '^\d+\.?\d*$') {
                Write-Debug-Info "Duration: $([math]::Round([double]$duration, 2))s"
            }
            
            $codec = & ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$InputFile" 2>&1
            if ($codec) {
                Write-Debug-Info "Video codec: $codec"
            }
            
            $resolution = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$InputFile" 2>&1
            if ($resolution) {
                Write-Debug-Info "Resolution: $resolution"
            }
        } catch {
            Write-Debug-Warning "Could not get video info: $_"
        }
    } else {
        Write-Debug-Error "Input file NOT found: $InputFile"
    }
    
    Write-Host ""
}

# Test 5: Test FFmpeg Commands
Write-Host "Test 5: Command Syntax Test" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor DarkGray

# Test basic command construction
Write-Debug-Info "Testing PowerShell array to FFmpeg args..."

$testArgs = '-version'
try {
    $result = & ffmpeg $testArgs 2>&1 | Select-Object -First 1
    Write-Debug-Success "Basic command works: $result"
} catch {
    Write-Debug-Error "Basic command failed: $_"
}

# Test complex array args (like in compose script)
$testInput = "test.mp4"
$testOutput = "output.mp4"
$testFilter = "loudnorm=I=-16:TP=-1.5:LRA=11"
$complexArgs = @('-i', $testInput, '-af', $testFilter, '-c:v', 'copy', $testOutput, '-y')

Write-Debug-Info "Test command array:"
Write-Debug-Info "  Args: $($complexArgs -join ' ')"

# Show how it would be called
$cmdPreview = "ffmpeg " + ($complexArgs -join ' ')
Write-Debug-Info "  Full command: $cmdPreview"

Write-Host ""

# Test 6: Output Directory
if ($OutputFile) {
    Write-Host "Test 6: Output Path" -ForegroundColor Yellow
    Write-Host "---------------------------" -ForegroundColor DarkGray
    
    $outDir = Split-Path -Parent $OutputFile
    Write-Debug-Info "Output directory: $outDir"
    
    if (Test-Path $outDir) {
        Write-Debug-Success "Output directory exists"
    } else {
        Write-Debug-Warning "Output directory does NOT exist"
        try {
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
            Write-Debug-Success "Created output directory"
        } catch {
            Write-Debug-Error "Cannot create output directory: $_"
        }
    }
    
    Write-Host ""
}

# Test 7: Permissions
Write-Host "Test 7: File Permissions" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor DarkGray

try {
    $tempFile = Join-Path $env:TEMP "ffmpeg_test_$(Get-Random).txt"
    "test" | Out-File -FilePath $tempFile -Encoding UTF8
    Remove-Item $tempFile
    Write-Debug-Success "Can write to temp directory"
} catch {
    Write-Debug-Error "Cannot write to temp directory: $_"
}

if ($OutputFile) {
    $outDir = Split-Path -Parent $OutputFile
    try {
        $tempFile = Join-Path $outDir "test_$(Get-Random).txt"
        "test" | Out-File -FilePath $tempFile -Encoding UTF8
        Remove-Item $tempFile
        Write-Debug-Success "Can write to output directory"
    } catch {
        Write-Debug-Error "Cannot write to output directory: $_"
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Diagnostic Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Fix any [ERROR] items above" -ForegroundColor Gray
Write-Host "  2. Review [WARN] items" -ForegroundColor Gray
Write-Host "  3. Run: .\debug_ffmpeg.ps1 -InputFile 'path\to\video.mp4' -OutputFile 'path\to\out.mp4'" -ForegroundColor Gray
Write-Host ""
