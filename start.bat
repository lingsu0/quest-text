@echo off
chcp 936 >nul
echo ==========================================
echo      Online Exam System - Start Script
echo ==========================================
echo.

cd /d "%~dp0"

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo [1/3] Checking TypeScript compilation...
if not exist "js\main.js" (
    echo         Compiling TypeScript...
    call npx tsc
    if errorlevel 1 (
        echo [ERROR] TypeScript compilation failed!
        pause
        exit /b 1
    )
    echo         Compilation complete!
) else (
    echo         Compiled files exist
)

echo.
echo [2/3] Starting local server...
echo.

for %%p in (8080 8081 8082 8083 8084) do (
    netstat -an | findstr ":%%p " | findstr "LISTENING" >nul
    if errorlevel 1 (
        echo         URL: http://127.0.0.1:%%p
        echo         Press Ctrl+C to stop server
        echo.
        call npx -y http-server -p %%p -o
        goto end
    )
)

echo [ERROR] Ports 8080-8084 are all in use!

:end
echo.
echo [INFO] Server stopped
echo.
pause
