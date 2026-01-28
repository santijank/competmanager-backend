# ทดสอบ Railway Backend API
# ============================

param(
    [Parameter(Mandatory=$true)]
    [string]$RailwayUrl
)

Write-Host "`n" + ("="*70) -ForegroundColor Cyan
Write-Host "ทดสอบ Railway Backend API" -ForegroundColor Cyan
Write-Host ("="*70) -ForegroundColor Cyan

# ลบ trailing slash
$RailwayUrl = $RailwayUrl.TrimEnd('/')

Write-Host "`n🌐 Backend URL: $RailwayUrl" -ForegroundColor Yellow
Write-Host ""

# ฟังก์ชันทดสอบ API
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{}
    )
    
    Write-Host "📍 Testing: $Name" -ForegroundColor Cyan
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 10
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200 -or $statusCode -eq 204) {
            Write-Host "   ✅ PASS (Status: $statusCode)" -ForegroundColor Green
            
            # แสดงข้อมูลบางส่วน
            if ($response.Content) {
                $content = $response.Content
                if ($content.Length -gt 200) {
                    $content = $content.Substring(0, 200) + "..."
                }
                Write-Host "   📄 Response: $content" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "   ⚠️  WARN (Status: $statusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "   ❌ FAIL: $errorMsg" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
}

# เริ่มทดสอบ
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "กำลังทดสอบ API Endpoints..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$results = @()

# 1. Health Check (root endpoint)
$results += Test-Endpoint -Name "Health Check" -Url "$RailwayUrl/"

# 2. CSRF Cookie
$results += Test-Endpoint -Name "CSRF Cookie" -Url "$RailwayUrl/sanctum/csrf-cookie"

# 3. Public Overview
$results += Test-Endpoint -Name "Public Overview" -Url "$RailwayUrl/api/public/overview"

# 4. Public Announcements
$results += Test-Endpoint -Name "Public Announcements" -Url "$RailwayUrl/api/public/announcements"

# 5. Categories
$results += Test-Endpoint -Name "Categories" -Url "$RailwayUrl/api/categories"

# 6. School Groups
$results += Test-Endpoint -Name "School Groups" -Url "$RailwayUrl/api/school-groups"

# สรุปผล
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "สรุปผลการทดสอบ" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$passCount = ($results | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

Write-Host "✅ ผ่าน: $passCount/$totalCount tests" -ForegroundColor Green
Write-Host "❌ ไม่ผ่าน: $($totalCount - $passCount)/$totalCount tests" -ForegroundColor Red
Write-Host ""

if ($passCount -eq $totalCount) {
    Write-Host "🎉 Backend พร้อมใช้งาน!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 ขั้นตอนถัดไป:" -ForegroundColor Cyan
    Write-Host "   1. รัน deploy_frontend_to_firebase.ps1" -ForegroundColor Gray
    Write-Host "   2. ตั้งค่า Backend URL: $RailwayUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 คำสั่ง:" -ForegroundColor Yellow
    Write-Host "   .\deploy_frontend_to_firebase.ps1 -BackendUrl `"$RailwayUrl`" -FrontendPath `"C:\CompetManagerNew\frontend`"" -ForegroundColor Gray
} elseif ($passCount -gt 0) {
    Write-Host "⚠️  Backend ทำงานบางส่วน" -ForegroundColor Yellow
    Write-Host "   อาจมีปัญหา CORS หรือ route configuration" -ForegroundColor Yellow
    Write-Host "   ลองดู logs ใน Railway Dashboard" -ForegroundColor Yellow
} else {
    Write-Host "❌ Backend ไม่ทำงาน!" -ForegroundColor Red
    Write-Host "   1. ตรวจสอบว่า deployment สำเร็จแล้ว" -ForegroundColor Yellow
    Write-Host "   2. ตรวจสอบ logs ใน Railway Dashboard" -ForegroundColor Yellow
    Write-Host "   3. ตรวจสอบว่า URL ถูกต้อง" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Export config สำหรับ frontend
Write-Host "📝 Frontend Configuration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   VITE_API_BASE_URL=$RailwayUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "   คัดลอกไปใส่ใน frontend/.env" -ForegroundColor Gray
Write-Host ""
