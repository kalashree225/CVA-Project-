# Sentinel Intelligence Platform - Simple Dev Runner (Windows)
# This script starts both the Backend and Frontend for local development.

Write-Host "🚀 Starting Sentinel Intelligence Platform..." -ForegroundColor Cyan

# 1. Start Backend (FastAPI)
Write-Host "🐍 Starting Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd vision_monitor; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Frontend (Next.js)
Write-Host "⚛️ Starting Frontend on http://localhost:3000..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "✅ Both services are starting in separate windows." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Gray
