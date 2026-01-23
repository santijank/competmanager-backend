@echo off
REM ============================================
REM เช็คข้อมูล Test Users
REM ============================================

echo ============================================
echo   เช็คข้อมูล Test Users
echo ============================================
echo.

cd /d C:\competmanagernew\backend

if not exist check-test-users.php (
    echo ✗ ไม่พบไฟล์ check-test-users.php
    echo   กรุณาวางไฟล์ check-test-users.php ในโฟลเดอร์ backend
    echo.
    pause
    exit /b 1
)

echo [กำลังเช็คข้อมูล...]
echo.

php check-test-users.php

echo.
echo ============================================
echo   เสร็จสิ้น
echo ============================================
echo.

pause
