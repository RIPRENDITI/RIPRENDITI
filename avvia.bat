@echo off
echo ====================================
echo    RIPRENDI.TI
echo    L'app dei rimborsi automatici
echo ====================================
echo.
echo Avvio il server...
echo.
cd /d "%~dp0"
start "RIPRENDI.TI" "C:\Program Files\nodejs\node.exe" src\server.js
timeout /t 3 /nobreak >nul
echo App disponibile su: http://localhost:3000
echo.
echo Premi un tasto per aprire il browser...
pause >nul
start http://localhost:3000
