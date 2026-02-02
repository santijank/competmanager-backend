# Deploy Frontend to Firebase
# ============================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$FrontendPath
)

Write-Host "`n" + ("="*70) -ForegroundColor Cyan
Write-Host "Deploy Frontend to Firebase" -ForegroundColor Cyan
Write-Host ("="*70) -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบพารามิเตอร์
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Backend URL: $BackendUrl" -ForegroundColor Gray
Write-Host "   Frontend Path: $FrontendPath" -ForegroundColor Gray
Write-Host ""

# ตรวจสอบโฟลเดอร์
if (-not (Test-Path $FrontendPath)) {
    Write-Host "❌ Error: Frontend path not found: $FrontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $FrontendPath
Write-Host "✅ Changed directory to: $FrontendPath" -ForegroundColor Green
Write-Host ""

# ลบ trailing slash จาก URL
$BackendUrl = $BackendUrl.TrimEnd('/')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Update .env file
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 1: Updating .env file" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$envPath = Join-Path $FrontendPath ".env"

# สำรองไฟล์ .env เดิม
if (Test-Path $envPath) {
    $backupPath = "$envPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $envPath $backupPath
    Write-Host "📦 Backup .env -> $backupPath" -ForegroundColor Gray
}

# สร้าง .env ใหม่
$envContent = "VITE_API_BASE_URL=$BackendUrl"
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host "✅ Updated .env file" -ForegroundColor Green
Write-Host "   VITE_API_BASE_URL=$BackendUrl" -ForegroundColor Gray
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: Install dependencies (if needed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 2: Checking dependencies" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$nodeModulesPath = Join-Path $FrontendPath "node_modules"

if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "📦 Installing dependencies (npm install)..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed (node_modules exists)" -ForegroundColor Green
}
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3: Build frontend
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 3: Building frontend (npm run build)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🏗️  Building... (this may take a few minutes)" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Common causes:" -ForegroundColor Yellow
    Write-Host "   1. Check .env file for correct VITE_API_BASE_URL" -ForegroundColor Gray
    Write-Host "   2. Make sure all dependencies are installed" -ForegroundColor Gray
    Write-Host "   3. Check for TypeScript or linting errors" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green

# ตรวจสอบ dist folder
$distPath = Join-Path $FrontendPath "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "❌ Error: dist folder not found after build!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ dist folder created" -ForegroundColor Green
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 4: Check Firebase CLI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 4: Checking Firebase CLI" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

try {
    $firebaseVersion = firebase --version 2>&1
    Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Please install Firebase CLI:" -ForegroundColor Yellow
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Then login:" -ForegroundColor Yellow
    Write-Host "   firebase login" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 5: Check firebase.json
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 5: Checking Firebase configuration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$firebaseJsonPath = Join-Path $FrontendPath "firebase.json"

if (-not (Test-Path $firebaseJsonPath)) {
    Write-Host "⚠️  firebase.json not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Please initialize Firebase:" -ForegroundColor Yellow
    Write-Host "   1. Run: firebase init" -ForegroundColor Gray
    Write-Host "   2. Select: Hosting" -ForegroundColor Gray
    Write-Host "   3. Public directory: dist" -ForegroundColor Gray
    Write-Host "   4. Single-page app: Yes" -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
} else {
    Write-Host "✅ firebase.json found" -ForegroundColor Green
}
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 6: Deploy to Firebase
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 6: Deploying to Firebase" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Deploying... (this may take a moment)" -ForegroundColor Cyan
Write-Host ""

firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Common causes:" -ForegroundColor Yellow
    Write-Host "   1. Not logged in: firebase login" -ForegroundColor Gray
    Write-Host "   2. No Firebase project: firebase init" -ForegroundColor Gray
    Write-Host "   3. Permission denied: Check project permissions" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ All steps completed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   ✓ Updated .env with backend URL" -ForegroundColor Gray
Write-Host "   ✓ Installed dependencies" -ForegroundColor Gray
Write-Host "   ✓ Built frontend" -ForegroundColor Gray
Write-Host "   ✓ Deployed to Firebase" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Get your Firebase Hosting URL:" -ForegroundColor Gray
Write-Host "      - Go to Firebase Console" -ForegroundColor Gray
Write-Host "      - Select your project" -ForegroundColor Gray
Write-Host "      - Go to Hosting" -ForegroundColor Gray
Write-Host "      - Copy the URL (e.g., https://yourproject.web.app)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Test your application:" -ForegroundColor Gray
Write-Host "      - Open the Firebase URL in a browser" -ForegroundColor Gray
Write-Host "      - Try logging in" -ForegroundColor Gray
Write-Host "      - Check if data loads correctly" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. If you get CORS errors:" -ForegroundColor Gray
Write-Host "      - Add Firebase URL to backend CORS config" -ForegroundColor Gray
Write-Host "      - Edit: backend/config/cors.php" -ForegroundColor Gray
Write-Host "      - Add to allowed_origins array" -ForegroundColor Gray
Write-Host "      - Redeploy backend" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# ถามว่าต้องการเปิด Firebase Console หรือไม่
$openConsole = Read-Host "Open Firebase Console in browser? (y/n)"
if ($openConsole -eq 'y') {
    Start-Process "https://console.firebase.google.com"
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
Write-Host ""
