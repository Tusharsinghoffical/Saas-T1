@echo off
title Stop TASQ-ONE Docker
echo ======================================================================
echo           Stopping TASQ-ONE Docker Container...
echo ======================================================================
echo.

docker compose down

echo.
echo [*] Container stopped successfully.
pause
