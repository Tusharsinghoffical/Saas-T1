@echo off
title TASQ-ONE Docker Runner
echo ======================================================================
echo           TASQ-ONE Work OS - Production Docker Launcher
echo ======================================================================
echo.

echo [*] Checking Docker daemon...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Docker is not running.
    echo [*] Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)

echo [*] Building and starting TASQ-ONE container...
docker compose up --build -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo [OK] TASQ-ONE is running inside Docker!
    echo [*] App URL: https://tasq-one.onrender.com
    echo [*] Health:  https://tasq-one.onrender.com/api/v1/health
    echo.
    echo [*] To view live logs, run:
    echo     docker compose logs -f
    echo.
    echo [*] To stop the container, run:
    echo     docker-stop.bat
    echo ======================================================================
) else (
    echo [!] Build or start failed. Please check Docker logs.
)

pause
