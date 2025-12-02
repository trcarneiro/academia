# Test Portal API
$baseUrl = "http://localhost:3000"

try {
    # Health check
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health: $($health.status)"
    
    # Register test
    $body = @{
        fullName = "Teste API $(Get-Date -Format 'HHmmss')"
        email = "teste.api.$(Get-Date -Format 'yyyyMMddHHmmss')@teste.com"
        cpf = "$(Get-Random -Minimum 10000000000 -Maximum 99999999999)"
        phone = "11999999999"
        password = "Teste@123"
    } | ConvertTo-Json
    
    $register = Invoke-RestMethod -Uri "$baseUrl/api/portal/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Register: $($register | ConvertTo-Json -Compress)"
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
