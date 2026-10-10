@echo off
title The Daily Orbit
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
if not exist node_modules\electron\package.json (
  echo First run: installing, this takes a few minutes...
  call npm install --no-audit --no-fund || (echo. & echo Install failed. Please send the messages above to Claude. & pause & exit /b 1)
)
if not exist node_modules\electron\dist\electron.exe (
  echo Downloading the Electron runtime...
  call node node_modules\electron\install.js
)
if not exist models\Xenova\all-MiniLM-L6-v2\onnx\model_quantized.onnx call node scripts\fetch-model.js
if exist node_modules\electron\dist\electron.exe (
  start "" "node_modules\electron\dist\electron.exe" .
  exit /b 0
)
echo Starting through npx...
call npx --no-install electron . || (echo. & echo The app could not start. Please send the messages above to Claude. & pause & exit /b 1)
