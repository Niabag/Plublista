# Test FFmpeg command
$ffmpegPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin"
if (Test-Path $ffmpegPath) {
    $env:Path = $env:Path + ";" + $ffmpegPath
}

$inputVideo = "C:\Users\gabai\Videos\2025-10-25 19-20-36.mp4"
$outputVideo = "C:\Users\gabai\Documents\GitHub\Plublista\reels-automation\test-output.mp4"

Write-Host "Testing FFmpeg with proper argument passing..."
Write-Host "Input: $inputVideo"
Write-Host "Output: $outputVideo"

# Test 1: Simple copy (no filtering)
Write-Host "`nTest 1: Simple copy (should work)"
$args1 = @('-i', $inputVideo, '-c', 'copy', "$outputVideo.test1.mp4", '-y')
Write-Host "Command: ffmpeg $($args1 -join ' ')"
& ffmpeg $args1 2>&1 | Select-Object -Last 3

# Test 2: Audio filter with array
Write-Host "`nTest 2: Audio filter with array"
$loudnormFilter = 'loudnorm=I=-16:TP=-1.5:LRA=11'
$args2 = @('-i', $inputVideo, '-af', $loudnormFilter, '-c:v', 'copy', '-c:a', 'aac', "$outputVideo.test2.mp4", '-y')
Write-Host "Command: ffmpeg $($args2 -join ' ')"
& ffmpeg $args2 2>&1 | Select-Object -Last 3

Write-Host "`nDone!"
