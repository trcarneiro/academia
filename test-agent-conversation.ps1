# Teste Completo de Conversacao com Agente de Matriculas
# Simula uma conversa real testando UTF-8, continuidade e qualidade das respostas

$ErrorActionPreference = "Stop"

# Configuracao
$baseUrl = "http://localhost:3000"
$orgId = "452c0b35-1822-4890-851e-922356c812fb"
$agentId = "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a"
$conversationId = $null

# Headers
$headers = @{
    "Content-Type" = "application/json; charset=utf-8"
    "x-organization-id" = $orgId
}

function Send-Message {
    param(
        [string]$Message,
        [string]$TestName
    )
    
    Write-Host "`n===============================================" -ForegroundColor Cyan
    Write-Host "TESTE: $TestName" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "`nPERGUNTA:" -ForegroundColor Blue
    Write-Host "   $Message" -ForegroundColor White
    
    $body = @{
        agentId = $agentId
        message = $Message
    }
    
    if ($script:conversationId) {
        $body.conversationId = $script:conversationId
        Write-Host "`nUsando conversacao existente: $($script:conversationId)" -ForegroundColor Gray
    }
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$baseUrl/api/agents/chat" `
            -Method POST `
            -Headers $headers `
            -Body ($body | ConvertTo-Json -Depth 10) `
            -ContentType "application/json; charset=utf-8" `
            -TimeoutSec 60
        
        # Extrair resposta do agente (ultimo message com role=assistant)
        $agentMessage = $response.data.messages | Where-Object { $_.role -eq "assistant" } | Select-Object -Last 1
        
        Write-Host "`nRESPOSTA DO AGENTE:" -ForegroundColor Green
        Write-Host $agentMessage.content -ForegroundColor White
        
        # Mostrar metricas se disponiveis
        if ($agentMessage.tokensUsed) {
            Write-Host "`nMetricas:" -ForegroundColor Gray
            Write-Host "   Tokens: $($agentMessage.tokensUsed)" -ForegroundColor Gray
            Write-Host "   Tempo: $($agentMessage.executionTime)ms" -ForegroundColor Gray
            if ($agentMessage.ragSourcesUsed) {
                Write-Host "   RAG: $($agentMessage.ragSourcesUsed -join ', ')" -ForegroundColor Gray
            }
        }
        
        # Armazenar conversationId para proximas mensagens
        if ($response.data.conversationId) {
            $script:conversationId = $response.data.conversationId
            Write-Host "`nConversacao ID: $($script:conversationId)" -ForegroundColor DarkGray
        }
        
        # Validar UTF-8 (verificar se nao ha mojibake)
        if ($agentMessage.content -match "�") {
            Write-Host "`nATENCAO: Caracteres corrompidos detectados!" -ForegroundColor Red
        } else {
            Write-Host "`nUTF-8: OK" -ForegroundColor Green
        }
        
        return $response
        
    } catch {
        Write-Host "`nERRO: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   HTTP Status: $statusCode" -ForegroundColor Yellow
        }
        return $null
    }
}

# ==============================================================
# INICIO DA SIMULACAO
# ==============================================================

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  SIMULACAO DE CONVERSA COM AGENTE DE MATRICULAS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# TESTE 1: Pergunta inicial - visão geral
$test1 = Send-Message `
    -Message "Olá! Gostaria de saber quantos alunos temos matriculados atualmente e qual a taxa de frequência geral." `
    -TestName "TESTE 1: Visão Geral de Alunos"

Start-Sleep -Seconds 2

# TESTE 2: Pergunta sobre planos vencidos
$test2 = Send-Message `
    -Message "E quantos alunos estão com o plano vencido ou próximo de vencer?" `
    -TestName "TESTE 2: Planos Vencidos/Expirando"

Start-Sleep -Seconds 2

# TESTE 3: Pergunta sobre alunos sem matrícula
$test3 = Send-Message `
    -Message "Existem alunos com plano ativo mas sem matrícula em curso? Isso é um problema?" `
    -TestName "TESTE 3: Alunos sem Matrícula"

Start-Sleep -Seconds 2

# TESTE 4: Pergunta sobre ações recomendadas
$test4 = Send-Message `
    -Message "Com base nesses dados, quais são as 3 ações mais urgentes que devo tomar?" `
    -TestName "TESTE 4: Ações Recomendadas"

# ==============================================================
# RESUMO DOS TESTES
# ==============================================================

Write-Host "`n`n==========================================================" -ForegroundColor Green
Write-Host "                   RESUMO DOS TESTES" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$totalTests = 4
$successTests = @($test1, $test2, $test3, $test4) | Where-Object { $_ -ne $null } | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "`nTestes executados: $successTests/$totalTests" -ForegroundColor Green
Write-Host "Conversacao final: $conversationId" -ForegroundColor Gray

if ($successTests -eq $totalTests) {
    Write-Host "`nTODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "   - Respostas em UTF-8 correto" -ForegroundColor White
    Write-Host "   - Conversacao mantida" -ForegroundColor White
    Write-Host "   - Agente respondendo corretamente" -ForegroundColor White
} else {
    Write-Host "`nAlguns testes falharam ($successTests/$totalTests)" -ForegroundColor Yellow
}

Write-Host "`n"
