@echo off
setlocal enabledelayedexpansion

:: Ensure current working directory is this script's directory
cd /d "%~dp0"

title TASQ-ONE - Multi-Tenant AI Task Management Platform
color 0B
cls

echo ======================================================================
echo           TASQ-ONE - Multi-Tenant AI Task Management Platform
echo           100%% Zero-AWS, Free-Tier, Edge-First Architecture
echo ======================================================================
echo.

:: 1. Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js v18 or later from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [*] Node.js found:
node -v

:: 2. Check if .env.local exists, create from example if missing
if not exist ".env.local" (
    echo [*] Creating .env.local from .env.local.example...
    copy ".env.local.example" ".env.local" >nul
)

:: 3. Check if node_modules exists
if not exist "node_modules" (
    echo [*] Installing dependencies with npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: 4. Clean stale .next cache to avoid Windows chunk lock issues
if exist ".next" (
    echo [*] Cleaning cache for fresh server start...
    rd /s /q ".next" 2>nul
)

echo.
echo ======================================================================
echo [*] Starting Next.js Development Server...
echo [*] App URL: https://tasq-one.onrender.com
echo ======================================================================
echo.

:: 5. Open default browser
start "" "https://tasq-one.onrender.com"

:: 6. Launch dev server using CALL to keep window open
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [NOTE] Dev server stopped.
)

pause
