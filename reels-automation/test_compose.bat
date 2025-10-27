@echo off
echo Testing compose_ffmpeg.ps1 with fixed version...
echo.

cd scripts

powershell -ExecutionPolicy Bypass -File compose_ffmpeg.ps1 -In "C:\Users\gabai\Videos\2025-10-27 12-12-11.mp4" -Out "..\out\final\test_job.mp4"

echo.
echo Test complete!
pause
