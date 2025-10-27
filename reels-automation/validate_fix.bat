@echo off
REM Quick validation and fix script for Windows
REM Double-click this file to validate and fix your environment

echo.
echo ========================================
echo   Reels Automation - Validate + Fix
echo ========================================
echo.

cd scripts

echo Running environment validation with auto-fix...
echo.

powershell -ExecutionPolicy Bypass -File validate_environment.ps1 -FixIssues

echo.
echo ========================================
echo   Validation Complete
echo ========================================
echo.

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Environment is ready!
    echo All issues have been fixed.
) else (
    echo [WARNING] Some issues could not be fixed automatically.
    echo Please check the output above and fix manually.
)

echo.
pause
