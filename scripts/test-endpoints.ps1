Write-Host "🔍 Testing Diagnostic Endpoints..." -ForegroundColor Green

$endpoints = @(
    "/health",
    "/api/students", 
    "/api/courses",
    "/api/classes",
    "/api/organizations",
    "/api/techniques",
    "/api/billing-plans",
    "/api/financial-responsibles"
)

foreach ($endpoint in $endpoints) {
    try {
        Write-Host "Testing $endpoint..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "http://localhost:3000$endpoint" -Method GET -TimeoutSec 5
        
        if ($response.success) {
            $count = if ($response.data -is [Array]) { $response.data.Count } else { "N/A" }
            Write-Host "✅ $endpoint`: Status OK, Success: $($response.success), Data: $count items" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $endpoint`: Success: $($response.success), Error: $($response.error)" -ForegroundColor Orange
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "Unknown" }
        Write-Host "❌ $endpoint`: Error $statusCode - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host "✅ Testing complete!" -ForegroundColor Green
