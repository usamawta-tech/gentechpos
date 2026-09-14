@echo off
cd /d "%~dp0"

REM Build the app once if there is no production build yet
if not exist ".next\BUILD_ID" (
  call npm install
  call npm run build
)

REM Start the production server (runs hidden; use "Stop GenTech" to end it)
call npm run start
