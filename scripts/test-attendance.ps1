# Test script para testar o endpoint de attendance
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    studentId = "0b997817-3ce9-426b-9230-ab2a71e5b53a"
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    present = $true
    arrived_late = $false
    left_early = $false
    method = "QUICK_CHECKIN"
} | ConvertTo-Json

Write-Host "Testing attendance check-in..."
Write-Host "Body: $body"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/attendance" -Method POST -Body $body -Headers $headers
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseContent)
        Write-Host "Error response: $($reader.ReadToEnd())"
    }
}
