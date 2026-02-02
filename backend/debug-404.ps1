# debug-404.ps1 - ตรวจสอบปัญหา 404 Error

Write-Host "🔍 Debug 404 Error - CompetManager" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red

# 1. ตรวจสอบว่า Laravel Server รันอยู่หรือไม่
Write-Host "1. 🌐 ตรวจสอบ Laravel Server..." -ForegroundColor Cyan

try {
    $Response = Invoke-WebRequest -Uri "http://localhost:8000" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Server รันอยู่ (Status: $($Response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server ไม่ทำงาน หรือไม่ได้รัน php artisan serve" -ForegroundColor Red
    Write-Host "   💡 รัน: php artisan serve" -ForegroundColor Yellow
    exit 1
}

# 2. ตรวจสอบ Controller Syntax
Write-Host "2. 📄 ตรวจสอบ Controller Syntax..." -ForegroundColor Cyan

$ControllerFile = "app\Http\Controllers\Api\CompetitionController.php"
if (Test-Path $ControllerFile) {
    $SyntaxCheck = & php -l $ControllerFile 2>&1
    if ($SyntaxCheck -like "*No syntax errors detected*") {
        Write-Host "   ✅ Controller Syntax ถูกต้อง" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Controller มี Syntax Error:" -ForegroundColor Red
        Write-Host "   $SyntaxCheck" -ForegroundColor White
        Write-Host "   💡 แก้ไข syntax error ใน $ControllerFile" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ ไม่พบไฟล์ Controller: $ControllerFile" -ForegroundColor Red
}

# 3. ตรวจสอบ Routes
Write-Host "3. 🛣️  ตรวจสอบ Routes..." -ForegroundColor Cyan

try {
    $RouteOutput = & php artisan route:list 2>&1
    if ($RouteOutput -like "*competitions*") {
        $CompetitionRoutes = $RouteOutput | Select-String "competitions"
        Write-Host "   ✅ พบ Competitions Routes:" -ForegroundColor Green
        foreach ($Route in $CompetitionRoutes) {
            Write-Host "      $Route" -ForegroundColor White
        }
    } else {
        Write-Host "   ❌ ไม่พบ Competitions Routes" -ForegroundColor Red
        Write-Host "   💡 Controller อาจมีปัญหา หรือ routes cache" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ ไม่สามารถดู routes: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. ทดสอบ API Endpoints
Write-Host "4. 🧪 ทดสอบ API Endpoints..." -ForegroundColor Cyan

# Test Statistics (ที่รู้ว่าทำงาน)
try {
    $StatsResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions/statistics"
    Write-Host "   ✅ Statistics API ทำงาน" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Statistics API ไม่ทำงาน: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Main Competitions
try {
    $CompResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions"
    Write-Host "   ✅ Competitions API ทำงาน (ไม่ต้อง auth?)" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "   ❌ Competitions API: 404 Not Found" -ForegroundColor Red
    } elseif ($_.Exception.Message -like "*401*") {
        Write-Host "   ✅ Competitions API ทำงาน (ต้อง auth - ถูกต้อง)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Competitions API Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 สรุปและวิธีแก้ไข:" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta

Write-Host "หาก Server ไม่รัน:" -ForegroundColor Yellow
Write-Host "   → รัน: php artisan serve" -ForegroundColor White

Write-Host "หาก Controller มี Syntax Error:" -ForegroundColor Yellow  
Write-Host "   → แก้ไขไฟล์ หรือใช้ backup" -ForegroundColor White

Write-Host "หาก Routes หาย:" -ForegroundColor Yellow
Write-Host "   → php artisan cache:clear" -ForegroundColor White
Write-Host "   → php artisan config:clear" -ForegroundColor White

Write-Host "หาก API ยังไม่ทำงาน:" -ForegroundColor Yellow
Write-Host "   → ตรวจสอบ Laravel logs: storage/logs/laravel.log" -ForegroundColor White
