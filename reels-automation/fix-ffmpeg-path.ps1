# Add FFmpeg to User PATH permanently
$ffmpegPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin"

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$ffmpegPath*") {
    $newPath = $currentPath + ";" + $ffmpegPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✓ FFmpeg path added to User PATH" -ForegroundColor Green
    Write-Host "Please restart PowerShell for changes to take effect" -ForegroundColor Yellow
} else {
    Write-Host "✓ FFmpeg path already in User PATH" -ForegroundColor Green
}

# Also add to current session
$env:Path = $env:Path + ";" + $ffmpegPath
Write-Host "✓ FFmpeg path added to current session" -ForegroundColor Green

# Test
Write-Host ""
Write-Host "Testing ffmpeg..." -ForegroundColor Cyan
& ffmpeg -version | Select-Object -First 1
