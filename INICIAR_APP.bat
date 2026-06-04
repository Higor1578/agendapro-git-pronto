@echo off
cd /d "%~dp0"
echo Iniciando AgendaPro...
echo.
echo Quando aparecer o endereco, abra: http://localhost:5173
echo.
npm.cmd run dev -- --port 5173
