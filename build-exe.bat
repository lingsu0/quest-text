@echo off
echo ==========================================
echo      Build EXE - Online Exam System
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

echo [2/4] Installing pkg...
npm install -g pkg

echo [3/4] Compiling TypeScript...
call npx tsc
if errorlevel 1 (
    echo [ERROR] TypeScript compilation failed!
    pause
    exit /b 1
)

echo [4/4] Building EXE...
mkdir dist 2>nul
pkg . --compress GZip

echo.
echo ==========================================
echo      Build Complete!
echo      Output: dist\online-exam-system.exe
echo ==========================================
echo.
pause
