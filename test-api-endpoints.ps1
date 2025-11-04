# Script para testar endpoints da API
Write-Host "🔍 TESTE DE ENDPOINTS - Academia Krav Maga" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Função para fazer requests e mostrar resultados
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body,
        [string]$Description
    )
    
    Write-Host "`n🧪 Testando: $Description" -ForegroundColor Cyan
    Write-Host "📡 $Method $Url" -ForegroundColor Yellow
    
    try {
        $headers = @{"Content-Type" = "application/json"}
        
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers
        }
        
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        
        $content = $response.Content | ConvertFrom-Json
        if ($content.data -and $content.data.Count -gt 0) {
            Write-Host "📊 Dados encontrados: $($content.data.Count) registros" -ForegroundColor Green
        } elseif ($content.data -and $content.data.Count -eq 0) {
            Write-Host "📊 Sem dados (array vazio)" -ForegroundColor Yellow
        }
        
        return $true
    } catch {
        Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Teste 1: Health Check
Test-Endpoint -Method "GET" -Url "http://localhost:3000/health" -Description "Health Check"

# Teste 2: Students API
Test-Endpoint -Method "GET" -Url "http://localhost:3000/api/students" -Description "Listar Estudantes"

# Teste 3: Billing Plans API
Test-Endpoint -Method "GET" -Url "http://localhost:3000/api/billing-plans" -Description "Listar Planos"

# Teste 4: Courses API  
Test-Endpoint -Method "GET" -Url "http://localhost:3000/api/courses" -Description "Listar Cursos"

# Teste 5: Criar Billing Plan
$billingPlanBody = @{
    name = "Plano Teste PowerShell"
    description = "Teste via PowerShell"
    price = 150.00
    billingType = "MONTHLY"
} | ConvertTo-Json

$createSuccess = Test-Endpoint -Method "POST" -Url "http://localhost:3000/api/billing-plans" -Body $billingPlanBody -Description "Criar Plano"

if ($createSuccess) {
    Write-Host "`n✅ Testando novamente lista de planos após criação..."
    Test-Endpoint -Method "GET" -Url "http://localhost:3000/api/billing-plans" -Description "Listar Planos (após criação)"
}

Write-Host "`n🎯 RESUMO DOS TESTES CONCLUÍDO" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
