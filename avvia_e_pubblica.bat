@echo off
echo ============================================
echo    RIPRENDI.TI — Avvio e pubblicazione
echo ============================================
echo.
cd /d "%~dp0"

echo [1/3] Avvio server locale...
start "RIPRENDI-SERVER" "C:\Program Files\nodejs\node.exe" src\server.js
timeout /t 3 /nobreak >nul
echo       Server su http://localhost:3000

echo [2/3] Avvio tunnel pubblico...
start "RIPRENDI-TUNNEL" "C:\Program Files\nodejs\npx.cmd" localtunnel --port 3000
timeout /t 5 /nobreak >nul

echo [3/3] Apertura browser...
start https://riprenditi.loca.lt

echo.
echo ============================================
echo    SE VUOI UN NOME PERSONALIZZATO:
echo    Usa: npx localtunnel --port 3000 --subdomain TUONOME
echo ============================================
echo.
pause
