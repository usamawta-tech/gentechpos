@echo off
REM Kill whatever process is listening on port 3000 (the GenTech server)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1
