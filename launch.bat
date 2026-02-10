@echo off
start python -m http.server 8000
timeout /t 1 >nul
start http://localhost:8000/index.html