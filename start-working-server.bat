@echo off
echo Stopping any existing servers...
taskkill /F /IM node.exe 2>nul

echo Starting Working Server...
node working-server.js
pause
