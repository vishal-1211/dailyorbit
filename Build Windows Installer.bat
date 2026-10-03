@echo off
title Building The Astro Gazette
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
call npm install --no-audit --no-fund || (echo Install failed. & pause & exit /b 1)
if not exist node_modules\electron\dist\electron.exe call node node_modules\electron\install.js
call node scripts\fetch-model.js
if not exist models mkdir models
call npm run dist || (echo Build failed. & pause & exit /b 1)
echo.
echo Done! Your installer and portable app are in the "dist" folder.
explorer dist
pause
