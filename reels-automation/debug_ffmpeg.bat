@echo off
REM FFmpeg debugger script for Windows
REM Double-click this file to run FFmpeg diagnostics

echo.
echo ========================================
echo   FFmpeg Debugger
echo ========================================
echo.

cd scripts

echo Running FFmpeg diagnostics...
echo.

powershell -ExecutionPolicy Bypass -File debug_ffmpeg.ps1

echo.
echo ========================================
echo   Diagnostic Complete
echo ========================================
echo.
pause
