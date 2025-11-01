@echo off
REM Start Backend Server
start cmd /k "cd /d %~dp0backend && npm run dev"

REM Start Frontend Server
start cmd /k "cd /d %~dp0frontend && npm run dev"