@echo off
echo ============================================
echo MGS Morning Maintenance - %DATE% %TIME%
echo ============================================
echo.

cd /d "C:\Users\fervi\Downloads\mgs"

echo Starting maintenance tasks...
node scripts/morning-maintenance-0700.js

echo.
echo ============================================
echo Maintenance completed at %TIME%
echo ============================================

pause