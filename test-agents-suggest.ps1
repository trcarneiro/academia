# Test Agents Suggest Endpoint
# PowerShell script to test agent suggestion API

$headers = @{
    "Content-Type" = "application/json"
    "x-organization-id" = "452c0b35-1822-4890-851e-922356c812fb"
}

Write-Host "🧪 Testing Agent Suggestion Endpoint..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000/api/agents/orchestrator/suggest" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/agents/orchestrator/suggest" `
        -Method POST `
        -Headers $headers `
        -TimeoutSec 15
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "`n📊 Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        Write-Host "`n✅ API returned success=true" -ForegroundColor Green
        $agentCount = $response.data.suggestedAgents.Count
        Write-Host "📦 Suggested agents: $agentCount" -ForegroundColor Cyan
        
        foreach ($agent in $response.data.suggestedAgents) {
            Write-Host "  - $($agent.name) [$($agent.type)]" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "`n❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n🔍 Check server logs for Gemini API details" -ForegroundColor Gray
