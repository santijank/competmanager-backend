@echo off
REM Enhanced Frontend Combiner - Check files before combining
REM Save as: combine-frontend-v2.bat

echo ================================================
echo Frontend Code Combiner v2
echo ================================================
echo.

cd /d C:\competmanagernew\frontend

REM สร้างไฟล์ output
echo Frontend Code Review - %date% %time% > combined-frontend.txt
echo ================================================ >> combined-frontend.txt
echo. >> combined-frontend.txt

REM ตรวจสอบและรวมไฟล์ทีละไฟล์
echo Checking files...
echo.

REM === Scores ===
if exist "src\pages\scores\ScoreManagement.jsx" (
    echo [OK] ScoreManagement.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/pages/scores/ScoreManagement.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\pages\scores\ScoreManagement.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] ScoreManagement.jsx - Not found
)

if exist "src\pages\scores\ScoreEntry.jsx" (
    echo [OK] ScoreEntry.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/pages/scores/ScoreEntry.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\pages\scores\ScoreEntry.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] ScoreEntry.jsx - Not found
)

REM === Registrations ===
if exist "src\pages\registrations\RegistrationForm.jsx" (
    echo [OK] RegistrationForm.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/pages/registrations/RegistrationForm.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\pages\registrations\RegistrationForm.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] RegistrationForm.jsx - Not found
)

if exist "src\pages\registrations\RegistrationList.jsx" (
    echo [OK] RegistrationList.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/pages/registrations/RegistrationList.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\pages\registrations\RegistrationList.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] RegistrationList.jsx - Not found
)

if exist "src\pages\registrations\MyRegistrations.jsx" (
    echo [OK] MyRegistrations.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/pages/registrations/MyRegistrations.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\pages\registrations\MyRegistrations.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] MyRegistrations.jsx - Not found
)

REM === Dashboard ===
if exist "src\pages\Dashboard.jsx" (
    echo [OK] Dashboard.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/pages/Dashboard.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\pages\Dashboard.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] Dashboard.jsx - Not found
)

REM === Lib ===
if exist "src\lib\api.js" (
    echo [OK] api.js
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/lib/api.js >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\lib\api.js" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] api.js - Not found
)

REM === Stores ===
if exist "src\stores\authStore.js" (
    echo [OK] authStore.js
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/stores/authStore.js >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\stores\authStore.js" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] authStore.js - Not found
)

REM === App ===
if exist "src\App.jsx" (
    echo [OK] App.jsx
    echo ================================================ >> combined-frontend.txt
    echo FILE: src/App.jsx >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "src\App.jsx" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] App.jsx - Not found
)

REM === Package.json ===
if exist "package.json" (
    echo [OK] package.json
    echo ================================================ >> combined-frontend.txt
    echo FILE: package.json >> combined-frontend.txt
    echo ================================================ >> combined-frontend.txt
    type "package.json" >> combined-frontend.txt
    echo. >> combined-frontend.txt
    echo. >> combined-frontend.txt
) else (
    echo [SKIP] package.json - Not found
)

echo.
echo ================================================
echo Done! Created: combined-frontend.txt
echo ================================================
echo.
pause
