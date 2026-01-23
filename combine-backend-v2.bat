@echo off
REM Enhanced Backend Combiner - Check files before combining
REM Save as: combine-backend-v2.bat

echo ================================================
echo Backend Code Combiner v2
echo ================================================
echo.

cd /d C:\competmanagernew\backend

REM สร้างไฟล์ output
echo Backend Code Review - %date% %time% > combined-backend.txt
echo ================================================ >> combined-backend.txt
echo. >> combined-backend.txt

REM ตรวจสอบและรวมไฟล์ทีละไฟล์
echo Checking files...
echo.

REM === Models ===
if exist "app\Models\Competition.php" (
    echo [OK] Competition.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Models/Competition.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Models\Competition.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] Competition.php - Not found
)

if exist "app\Models\Score.php" (
    echo [OK] Score.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Models/Score.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Models\Score.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] Score.php - Not found
)

if exist "app\Models\Registration.php" (
    echo [OK] Registration.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Models/Registration.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Models\Registration.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] Registration.php - Not found
)

if exist "app\Models\User.php" (
    echo [OK] User.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Models/User.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Models\User.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] User.php - Not found
)

REM === Controllers ===
if exist "app\Http\Controllers\Api\ScoreController.php" (
    echo [OK] ScoreController.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Http/Controllers/Api/ScoreController.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Http\Controllers\Api\ScoreController.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] ScoreController.php - Not found
)

if exist "app\Http\Controllers\Api\CompetitionController.php" (
    echo [OK] CompetitionController.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Http/Controllers/Api/CompetitionController.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Http\Controllers\Api\CompetitionController.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] CompetitionController.php - Not found
)

if exist "app\Http\Controllers\Api\RegistrationController.php" (
    echo [OK] RegistrationController.php
    echo ================================================ >> combined-backend.txt
    echo FILE: app/Http/Controllers/Api/RegistrationController.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "app\Http\Controllers\Api\RegistrationController.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] RegistrationController.php - Not found
)

REM === Routes ===
if exist "routes\api.php" (
    echo [OK] api.php
    echo ================================================ >> combined-backend.txt
    echo FILE: routes/api.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "routes\api.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] api.php - Not found
)

REM === Config ===
if exist "config\cors.php" (
    echo [OK] cors.php
    echo ================================================ >> combined-backend.txt
    echo FILE: config/cors.php >> combined-backend.txt
    echo ================================================ >> combined-backend.txt
    type "config\cors.php" >> combined-backend.txt
    echo. >> combined-backend.txt
    echo. >> combined-backend.txt
) else (
    echo [SKIP] cors.php - Not found
)

echo.
echo ================================================
echo Done! Created: combined-backend.txt
echo ================================================
echo.
pause
