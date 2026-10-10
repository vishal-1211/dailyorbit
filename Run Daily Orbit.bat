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
rem 1st fallback: reuse an Electron runtime another app already downloaded on this laptop
if not exist node_modules\electron\dist\electron.exe call :reuse "%USERPROFILE%\Downloads"
if not exist node_modules\electron\dist\electron.exe call :reuse "%USERPROFILE%\Desktop"
if not exist node_modules\electron\dist\electron.exe call :reuse "%USERPROFILE%\Documents"
rem 2nd fallback: download from a mirror of the official Electron releases (for networks that block GitHub downloads)
if not exist node_modules\electron\dist\electron.exe (
  echo Trying the Electron download mirror...
  set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
  call node node_modules\electron\install.js
)
if not exist models\Xenova\all-MiniLM-L6-v2\onnx\model_quantized.onnx call node scripts\fetch-model.js
if exist node_modules\electron\dist\electron.exe (
  start "" "node_modules\electron\dist\electron.exe" .
  exit /b 0
)
echo.
echo Could not get the Electron runtime. The network may be blocking the download:
echo try again on another network (for example a phone hotspot), or send these messages to Claude.
pause
exit /b 1

:reuse
for /d %%D in ("%~1\*") do (
  if not exist node_modules\electron\dist\electron.exe (
    for /d %%E in ("%%D\*") do (
      if not exist node_modules\electron\dist\electron.exe if exist "%%E\node_modules\electron\dist\electron.exe" (
        echo Reusing the Electron runtime from %%E
        robocopy "%%E\node_modules\electron\dist" "node_modules\electron\dist" /E /NFL /NDL /NJH /NJS /NP >nul
      )
    )
  )
)
exit /b 0
