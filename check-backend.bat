@echo off
REM ============================================
REM Backend Registration System - Health Check
REM ============================================

echo ============================================
echo   Registration System - Backend Health Check
echo ============================================
echo.

cd /d C:\competmanagernew\backend

echo [1/6] Checking Laravel installation...
if exist artisan (
    echo ✓ Laravel found
) else (
    echo ✗ Laravel NOT found - Wrong directory?
    pause
    exit /b 1
)
echo.

echo [2/6] Checking PHP version...
php -v
echo.

echo [3/6] Checking database connection...
php artisan migrate:status
echo.

echo [4/6] Checking Registration routes...
php artisan route:list | findstr "registrations"
echo.

echo [5/6] Checking Registration files...
if exist app\Models\Registration.php (
    echo ✓ Registration.php exists
) else (
    echo ✗ Registration.php NOT found
)

if exist app\Http\Controllers\Api\RegistrationController.php (
    echo ✓ RegistrationController.php exists
) else (
    echo ✗ RegistrationController.php NOT found
)
echo.

echo [6/6] Checking recent errors in log...
echo Last 20 lines of laravel.log:
echo ----------------------------------------
powershell -Command "Get-Content storage\logs\laravel.log -Tail 20 -ErrorAction SilentlyContinue"
echo ----------------------------------------
echo.

echo ============================================
echo   Health Check Complete!
echo ============================================
echo.

echo Next Steps:
echo 1. If routes are missing: Install backend files
echo 2. If migration failed: Run 'php artisan migrate'
echo 3. If errors in log: Read error message above
echo 4. If all OK: Check frontend API configuration
echo.

pause
