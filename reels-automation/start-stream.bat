@echo off
echo.
echo ========================================
echo   Reels Automation - Stream Mode
echo ========================================
echo.
echo Demarrage de l'application de streaming...
echo.
echo Cette fenetre va ouvrir :
echo   - VS Code (fenetre externe)
echo   - Application web (dans l'interface)
echo.
echo Placez les fenetres cote a cote et capturez dans OBS !
echo.

REM Démarrer le serveur backend
start "Backend Server" cmd /c "npm run dev:server"

REM Attendre que le serveur démarre
timeout /t 3 /nobreak > nul

REM Démarrer l'application Electron
npm run stream:app

echo.
echo Application fermee. Merci !
pause
