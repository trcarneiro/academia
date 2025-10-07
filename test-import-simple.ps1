# Test script for importing curso Faixa Branca

Write-Host "========== TESTE DE IMPORTACAO DO CURSO FAIXA BRANCA ==========" -ForegroundColor Cyan
Write-Host ""

# Load the JSON file
Write-Host "Step 1: Carregando arquivo cursofaixabranca.json..." -ForegroundColor Yellow
$jsonPath = "src\cursofaixabranca.json"

if (-Not (Test-Path $jsonPath)) {
    Write-Host "Arquivo nao encontrado: $jsonPath" -ForegroundColor Red
    exit 1
}

$courseData = Get-Content $jsonPath -Raw
$courseObj = $courseData | ConvertFrom-Json

Write-Host "Arquivo carregado com sucesso" -ForegroundColor Green
Write-Host "   Curso: $($courseObj.name)"
Write-Host "   Duracao: $($courseObj.durationTotalWeeks) semanas"
Write-Host "   Total de aulas: $($courseObj.totalLessons)"
Write-Host "   Tecnicas: $($courseObj.techniques.Count)"
Write-Host ""

# Make the POST request
Write-Host "Step 2: Enviando dados para o endpoint /api/courses/import-full-course..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/courses/import-full-course" `
        -Method POST `
        -ContentType "application/json" `
        -Body $courseData `
        -UseBasicParsing
    
    Write-Host "   Status HTTP: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "========== IMPORTACAO CONCLUIDA COM SUCESSO ==========" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resultados da importacao:" -ForegroundColor Cyan
    Write-Host "   Curso criado: $($result.course.name)"
    Write-Host "   ID do curso: $($result.course.id)"
    Write-Host "   Slug: $($result.course.slug)"
    Write-Host ""
    Write-Host "   Tecnicas importadas: $($result.stats.techniquesImported)"
    Write-Host "   Tecnicas criadas: $($result.stats.techniquesCreated)"
    Write-Host "   Tecnicas ignoradas: $($result.stats.techniquesSkipped)"
    Write-Host ""
    Write-Host "   Lesson Plans criados: $($result.stats.lessonPlansCreated)"
    Write-Host "   Semanas processadas: $($result.stats.weeksProcessed)"
    Write-Host ""
    
    if ($result.warnings -and $result.warnings.Count -gt 0) {
        Write-Host "Avisos:" -ForegroundColor Yellow
        foreach ($warning in $result.warnings) {
            Write-Host "   - $warning"
        }
        Write-Host ""
    }
    
    Write-Host "========== VALIDACAO CONCLUIDA ==========" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Abrir o modulo de Cursos na interface"
    Write-Host "   2. Localizar o curso Krav Maga Faixa Branca"
    Write-Host "   3. Clicar na aba Cronograma"
    Write-Host "   4. Verificar as aulas expandidas com tecnicas"
    Write-Host "   5. Testar navegacao: clique em tecnica -> modulo Tecnicas"
    Write-Host "   6. Testar navegacao: clique em card de aula -> modulo Lesson Plans"
    Write-Host ""
    
} catch {
    Write-Host "========== ERRO NA IMPORTACAO ==========" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Detalhes: $($errorObj.message)" -ForegroundColor Red
        if ($errorObj.error) {
            Write-Host "Erro: $($errorObj.error)" -ForegroundColor Red
        }
    }
}
