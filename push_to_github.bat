@echo off
echo 🛡️  Sentinel Intelligence Platform - GitHub Sync
echo ===============================================
echo.
echo [1/3] Staging changes...
git add .
echo [2/3] Committing updates...
git commit -m "Production: Finalized Sentinel Platform stabilization, high-density UI overhaul, and Python 3.13 compatibility fixes."
echo [3/3] Pushing to repository...
git push
echo.
echo ✅ Sync Complete.
pause
