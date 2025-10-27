@echo off
REM Quick validation script for Windows
REM Double-click this file to validate your environment

echo.
echo ========================================
echo   Reels Automation - Validation
echo ========================================
echo.

cd scripts

echo Running environment validation...
echo.

powershell -ExecutionPolicy Bypass -File validate_environment.ps1

echo.
echo ========================================
echo   Validation Complete
echo ========================================
echo.

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Environment is ready!
    echo You can run the automation.
) else (
    echo [ERROR] Some issues were found.
    echo.
    echo To fix automatically, run:
    echo   validate_fix.bat
    echo.
    echo Or manually:
    echo   cd scripts
    echo   .\validate_environment.ps1 -FixIssues
)

echo.
pause
