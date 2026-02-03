# Check if ports 8080 (backend) and 3000 (frontend) are in use
# Run: .\check-ports.ps1

$ports = @(
    @{ Port = 8080; Name = "Backend (Spring Boot API)" },
    @{ Port = 3000; Name = "Frontend (React)" }
)

Write-Host "`nPort status for Employee Manager" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

foreach ($p in $ports) {
    $raw = netstat -ano | findstr "LISTENING" | findstr ":$($p.Port) "
    if ($raw) {
        $procId = "?"
        $oneLine = ($raw -split "`n")[0].Trim()
        $tokens = $oneLine -split "\s+"
        if ($tokens.Count -gt 0) { $procId = $tokens[-1] }
        Write-Host "  Port $($p.Port) ($($p.Name)): IN USE (PID $procId)" -ForegroundColor Green
    } else {
        Write-Host "  Port $($p.Port) ($($p.Name)): FREE" -ForegroundColor Yellow
    }
}

Write-Host ""
# Quick backend health check if 8080 is in use
$backendUp = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8080/employees" -UseBasicParsing -TimeoutSec 2
    $backendUp = $true
    Write-Host "  Backend API: responding OK" -ForegroundColor Green
} catch {
    if ((netstat -ano | findstr ":8080 ") -match "LISTENING") {
        Write-Host "  Backend API: port open but /employees did not respond" -ForegroundColor Yellow
    } else {
        Write-Host "  Backend API: not running (start backend to fix 'Failed to fetch employees')" -ForegroundColor Red
    }
}
Write-Host ""
