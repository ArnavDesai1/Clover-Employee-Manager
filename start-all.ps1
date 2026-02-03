# Start both backend and frontend
# Run this in PowerShell as Administrator

Write-Host "🍀 Clover Infotech Employee Manager Startup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check port status first (run .\check-ports.ps1 anytime to see status)
Write-Host "Checking ports 8080 and 3000..." -ForegroundColor Cyan
$net8080 = netstat -ano | findstr "LISTENING" | findstr ":8080 "
$net3000 = netstat -ano | findstr "LISTENING" | findstr ":3000 "
if ($net8080) { Write-Host "  Port 8080 (backend): in use" -ForegroundColor Yellow }
else { Write-Host "  Port 8080 (backend): free" -ForegroundColor Green }
if ($net3000) { Write-Host "  Port 3000 (frontend): in use" -ForegroundColor Yellow }
else { Write-Host "  Port 3000 (frontend): free" -ForegroundColor Green }
Write-Host ""

# Kill any existing processes
Write-Host "Cleaning up old processes..." -ForegroundColor Yellow
Get-Process java, node -ErrorAction SilentlyContinue | Stop-Process -Force -Confirm:$false 2>$null
Start-Sleep 2

# Start Backend
Write-Host ""
Write-Host "Starting Backend (Spring Boot)..." -ForegroundColor Blue
$backendPath = "c:\Users\theel\Documents\LY SEM 7\Internship\Employee Manager\backend\employee-service"
Start-Process cmd -ArgumentList "/k", "cd /d `"$backendPath`" ; mvnw spring-boot:run" -WindowStyle Normal
Write-Host "   Backend window opened" -ForegroundColor Green
Write-Host "   Wait for: Tomcat started on port 8080" -ForegroundColor Yellow

# Wait for backend to start
Start-Sleep 10

# Start Frontend  
Write-Host ""
Write-Host "Starting Frontend (React)..." -ForegroundColor Green
$frontendPath = "c:\Users\theel\Documents\LY SEM 7\Internship\Employee Manager\frontend"
Start-Process cmd -ArgumentList "/k", "cd /d `"$frontendPath`" ; npm start" -WindowStyle Normal
Write-Host "   Frontend window opened" -ForegroundColor Green
Write-Host "   Wait for: Compiled successfully!" -ForegroundColor Yellow

# Wait for frontend to start
Start-Sleep 8

# Verify services
Write-Host ""
Write-Host "Verifying services..." -ForegroundColor Cyan
Start-Sleep 2

$apiWorking = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/employees" -UseBasicParsing
    Write-Host "Backend API: Online (HTTP $($response.StatusCode))" -ForegroundColor Green
    $empCount = ($response.Content | ConvertFrom-Json).Count
    Write-Host "  $empCount employee(s) in database" -ForegroundColor Green
    $apiWorking = $true
} 
catch {
    Write-Host "Backend: Not responding yet (still starting?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Open your browser and go to: http://localhost:3000" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
if ($apiWorking) {
    Write-Host "Everything looks good! Refresh the browser if needed." -ForegroundColor Green
} else {
    Write-Host "Backend is still starting. Refresh the browser in a moment." -ForegroundColor Yellow
}

