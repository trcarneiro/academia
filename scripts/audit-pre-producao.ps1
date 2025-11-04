# Script de Auditoria Completa - Academia Krav Maga v2.0
# Pre-Producao - Testes e Performance
# Data: 19/10/2025

param(
    [string]$rootPath = "h:\projetos\academia"
)

Write-Host "`n"
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  AUDITORIA COMPLETA - PRE-PRODUCAO" -ForegroundColor Cyan
Write-Host "  Academia Krav Maga v2.0" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "`n"

# Estruturas para armazenar resultados
$auditResults = @{
    "frontend" = @()
    "backend" = @()
    "performance" = @()
    "errors" = @()
}

# ============================================
# FASE 1: AUDITORIA FRONTEND (Modulos JS)
# ============================================
Write-Host "[FASE 1/5] Auditando modulos frontend..." -ForegroundColor Yellow

$modulesPath = Join-Path $rootPath "public\js\modules"
$modules = Get-ChildItem -Path $modulesPath -Directory -ErrorAction SilentlyContinue

$frontendIssues = @()

foreach ($module in $modules) {
    $moduleName = $module.Name
    Write-Host "  [CHECK] Modulo: $moduleName" -ForegroundColor Gray
    
    $moduleIssues = @{
        "name" = $moduleName
        "issues" = @()
        "compliance" = "FULL"
    }
    
    # Verificar index.js
    $indexPath = Join-Path $module.FullName "index.js"
    if (Test-Path $indexPath) {
        $content = Get-Content $indexPath -Raw
        
        # Verificacao 1: API Client pattern
        if ($content -notmatch "createModuleAPI|moduleAPI") {
            $moduleIssues.issues += "API Client: NAO usa createModuleAPI()"
            $moduleIssues.compliance = "PARTIAL"
        }
        
        # Verificacao 2: Estados UI (loading, empty, error)
        if ($content -notmatch "loading|empty|error") {
            $moduleIssues.issues += "Estados UI: Sem tratamento de estados"
            $moduleIssues.compliance = "PARTIAL"
        }
        
        # Verificacao 3: CSS isolado
        $cssPath = Join-Path $rootPath "public\css\modules\$moduleName.css"
        if (-not (Test-Path $cssPath)) {
            $moduleIssues.issues += "CSS: Arquivo CSS isolado nao encontrado"
            $moduleIssues.compliance = "PARTIAL"
        }
        
        # Verificacao 4: Navegacao SPA
        if ($content -notmatch "window.location.hash|navigateTo|router") {
            $moduleIssues.issues += "Navegacao: Sem SPA navigation"
            $moduleIssues.compliance = "PARTIAL"
        }
        
        # Verificacao 5: Registro no AcademyApp
        if ($content -notmatch "window.app|AcademyApp") {
            $moduleIssues.issues += "Integracao: Nao registrado no AcademyApp"
            $moduleIssues.compliance = "PARTIAL"
        }
        
        # Verificacao 6: Tamanho do arquivo (performance)
        $fileSize = (Get-Item $indexPath).Length / 1KB
        if ($fileSize -gt 500) {
            $moduleIssues.issues += "Performance: Arquivo muito grande ($([math]::Round($fileSize, 2)) KB)"
        }
        
    } else {
        $moduleIssues.issues += "CRITICO: index.js nao encontrado"
        $moduleIssues.compliance = "NONE"
    }
    
    if ($moduleIssues.issues.Count -gt 0) {
        $frontendIssues += $moduleIssues
    }
}

$auditResults.frontend = $frontendIssues
Write-Host "  [OK] $($modules.Count) modulos auditados, $($frontendIssues.Count) com problemas`n" -ForegroundColor Green

# ============================================
# FASE 2: AUDITORIA BACKEND (Rotas API)
# ============================================
Write-Host "[FASE 2/5] Auditando rotas backend..." -ForegroundColor Yellow

$routesPath = Join-Path $rootPath "src\routes"
$routes = Get-ChildItem -Path $routesPath -File -Filter "*.ts" -ErrorAction SilentlyContinue

$backendIssues = @()

foreach ($route in $routes) {
    $routeName = $route.BaseName
    Write-Host "  [CHECK] Rota: $routeName" -ForegroundColor Gray
    
    $routeIssues = @{
        "name" = $routeName
        "issues" = @()
    }
    
    $content = Get-Content $route.FullName -Raw
    
    # Verificacao 1: Error handling
    if ($content -notmatch "try\s*{|catch") {
        $routeIssues.issues += "Error Handling: Sem try-catch"
    }
    
    # Verificacao 2: Response format padrao
    if ($content -notmatch "success.*true|success.*false") {
        $routeIssues.issues += "Response Format: Nao usa formato padrao {success, data, message}"
    }
    
    # Verificacao 3: Logging
    if ($content -notmatch "logger\.|console\.log") {
        $routeIssues.issues += "Logging: Sem logs de operacao"
    }
    
    # Verificacao 4: Validacao de entrada (Zod)
    if ($content -notmatch "z\.|zod|validate") {
        $routeIssues.issues += "Validacao: Sem validacao Zod de entrada"
    }
    
    # Verificacao 5: N+1 queries (include aninhado)
    if ($content -match "include.*include") {
        $routeIssues.issues += "Performance: Possivel N+1 query (includes aninhados)"
    }
    
    # Verificacao 6: Paginacao para listagens
    if ($content -match "findMany" -and $content -notmatch "take|skip|limit") {
        $routeIssues.issues += "Performance: findMany sem paginacao"
    }
    
    if ($routeIssues.issues.Count -gt 0) {
        $backendIssues += $routeIssues
    }
}

$auditResults.backend = $backendIssues
Write-Host "  [OK] $($routes.Count) rotas auditadas, $($backendIssues.Count) com problemas`n" -ForegroundColor Green

# ============================================
# FASE 3: VERIFICACAO DE ERROS TYPESCRIPT
# ============================================
Write-Host "[FASE 3/5] Verificando erros TypeScript..." -ForegroundColor Yellow

$buildOutput = & npm run build 2>&1 | Out-String
$tsErrors = @()

if ($buildOutput -match "error TS\d+") {
    $errorMatches = [regex]::Matches($buildOutput, "src[^:]+:\s*error TS\d+:.*")
    
    foreach ($match in $errorMatches) {
        $errorLine = $match.Value
        if ($errorLine -match "src/([^(]+)\((\d+),\d+\):\s*error (TS\d+):\s*(.+)") {
            $tsErrors += @{
                "file" = $matches[1]
                "line" = $matches[2]
                "code" = $matches[3]
                "message" = $matches[4]
            }
        }
    }
}

$auditResults.errors = $tsErrors
Write-Host "  [OK] $($tsErrors.Count) erros TypeScript encontrados`n" -ForegroundColor $(if ($tsErrors.Count -gt 0) { "Red" } else { "Green" })

# ============================================
# FASE 4: TESTES DE PERFORMANCE
# ============================================
Write-Host "[FASE 4/5] Analisando performance..." -ForegroundColor Yellow

$performanceIssues = @()

# Verificar tamanho de node_modules
$nodeModulesPath = Join-Path $rootPath "node_modules"
if (Test-Path $nodeModulesPath) {
    $nodeModulesSize = (Get-ChildItem $nodeModulesPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB
    if ($nodeModulesSize -gt 1.5) {
        $performanceIssues += @{
            "area" = "Dependencies"
            "issue" = "node_modules muito grande: $([math]::Round($nodeModulesSize, 2)) GB"
            "suggestion" = "Revisar dependencias e remover nao utilizadas"
        }
    }
}

# Verificar arquivos grandes no frontend
$publicPath = Join-Path $rootPath "public"
$largeFiles = Get-ChildItem -Path $publicPath -Recurse -File |
              Where-Object { $_.Length -gt 500KB } |
              Select-Object -First 10

foreach ($file in $largeFiles) {
    $sizeKB = [math]::Round($file.Length / 1KB, 2)
    $performanceIssues += @{
        "area" = "Frontend"
        "issue" = "Arquivo grande: $($file.Name) ($sizeKB KB)"
        "suggestion" = "Considerar minificacao ou code splitting"
    }
}

# Verificar imagens nao otimizadas
$images = Get-ChildItem -Path $publicPath -Recurse -File -Include "*.jpg","*.jpeg","*.png" |
          Where-Object { $_.Length -gt 200KB }

foreach ($image in $images) {
    $sizeKB = [math]::Round($image.Length / 1KB, 2)
    $performanceIssues += @{
        "area" = "Assets"
        "issue" = "Imagem nao otimizada: $($image.Name) ($sizeKB KB)"
        "suggestion" = "Comprimir com TinyPNG ou WebP"
    }
}

$auditResults.performance = $performanceIssues
Write-Host "  [OK] $($performanceIssues.Count) problemas de performance encontrados`n" -ForegroundColor $(if ($performanceIssues.Count -gt 0) { "Yellow" } else { "Green" })

# ============================================
# FASE 5: GERAR RELATORIO COMPLETO
# ============================================
Write-Host "[FASE 5/5] Gerando relatorio completo..." -ForegroundColor Yellow

$reportPath = Join-Path $rootPath "AUDITORIA_PRE_PRODUCAO.md"
$reportContent = @"
# AUDITORIA PRE-PRODUCAO - Academia Krav Maga v2.0
**Data**: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
**Status**: Auditoria completa executada

---

## RESUMO EXECUTIVO

| Categoria | Total Auditado | Problemas Encontrados | Status |
|-----------|----------------|----------------------|--------|
| **Modulos Frontend** | $($modules.Count) | $($frontendIssues.Count) | $(if ($frontendIssues.Count -eq 0) { "✅" } else { "⚠️" }) |
| **Rotas Backend** | $($routes.Count) | $($backendIssues.Count) | $(if ($backendIssues.Count -eq 0) { "✅" } else { "⚠️" }) |
| **Erros TypeScript** | - | $($tsErrors.Count) | $(if ($tsErrors.Count -eq 0) { "✅" } else { "❌" }) |
| **Performance** | - | $($performanceIssues.Count) | $(if ($performanceIssues.Count -eq 0) { "✅" } else { "⚠️" }) |

---

## 1. PROBLEMAS DE MODULOS FRONTEND

### Modulos com Problemas ($($frontendIssues.Count) de $($modules.Count))

$(
    if ($frontendIssues.Count -eq 0) {
        "✅ **Nenhum problema encontrado!** Todos os modulos estao em conformidade.`n"
    } else {
        $frontendIssues | ForEach-Object {
            $module = $_
            "#### **$($module.name)** - Compliance: $($module.compliance)`n`n" +
            ($module.issues | ForEach-Object { "- ❌ $_`n" }) + "`n"
        }
    }
)

---

## 2. PROBLEMAS DE ROTAS BACKEND

### Rotas com Problemas ($($backendIssues.Count) de $($routes.Count))

$(
    if ($backendIssues.Count -eq 0) {
        "✅ **Nenhum problema encontrado!** Todas as rotas estao bem estruturadas.`n"
    } else {
        $backendIssues | ForEach-Object {
            $route = $_
            "#### **$($route.name).ts**`n`n" +
            ($route.issues | ForEach-Object { "- ❌ $_`n" }) + "`n"
        }
    }
)

---

## 3. ERROS TYPESCRIPT

### Total de Erros: $($tsErrors.Count)

$(
    if ($tsErrors.Count -eq 0) {
        "✅ **Nenhum erro TypeScript!** Build passa sem erros.`n"
    } else {
        $tsErrors | Select-Object -First 20 | ForEach-Object {
            $tsError = $_
            "#### **$($tsError.file)** (Linha $($tsError.line))`n" +
            "- **Codigo**: $($tsError.code)`n" +
            "- **Mensagem**: $($tsError.message)`n`n"
        }
        if ($tsErrors.Count -gt 20) {
            "... e mais $($tsErrors.Count - 20) erros.`n`n"
        }
    }
)

---

## 4. PROBLEMAS DE PERFORMANCE

### Total de Problemas: $($performanceIssues.Count)

$(
    if ($performanceIssues.Count -eq 0) {
        "✅ **Nenhum problema de performance!** Projeto bem otimizado.`n"
    } else {
        $performanceIssues | ForEach-Object {
            $perf = $_
            "#### **$($perf.area)**`n" +
            "- **Problema**: $($perf.issue)`n" +
            "- **Sugestao**: $($perf.suggestion)`n`n"
        }
    }
)

---

## 5. TASKS DE CORRECAO (PRIORIZADAS)

### P0 - CRITICO (Bloqueia producao)
$(
    $criticalTasks = @()
    if ($tsErrors.Count -gt 0) {
        $criticalTasks += "- [ ] **[TS-ERRORS]** Corrigir $($tsErrors.Count) erros TypeScript para build passar"
    }
    if ($frontendIssues | Where-Object { $_.compliance -eq "NONE" }) {
        $noneCount = ($frontendIssues | Where-Object { $_.compliance -eq "NONE" }).Count
        $criticalTasks += "- [ ] **[FRONTEND-CRITICAL]** Corrigir $noneCount modulos sem index.js"
    }
    
    if ($criticalTasks.Count -eq 0) {
        "✅ Nenhuma task critica!`n"
    } else {
        $criticalTasks -join "`n"
    }
)

### P1 - ALTO (Impacta funcionalidade)
$(
    $highTasks = @()
    if ($backendIssues | Where-Object { $_.issues -match "Error Handling" }) {
        $count = ($backendIssues | Where-Object { $_.issues -match "Error Handling" }).Count
        $highTasks += "- [ ] **[BACKEND-ERROR]** Adicionar error handling em $count rotas"
    }
    if ($backendIssues | Where-Object { $_.issues -match "Response Format" }) {
        $count = ($backendIssues | Where-Object { $_.issues -match "Response Format" }).Count
        $highTasks += "- [ ] **[BACKEND-FORMAT]** Padronizar response em $count rotas"
    }
    if ($frontendIssues | Where-Object { $_.issues -match "API Client" }) {
        $count = ($frontendIssues | Where-Object { $_.issues -match "API Client" }).Count
        $highTasks += "- [ ] **[FRONTEND-API]** Migrar $count modulos para createModuleAPI()"
    }
    
    if ($highTasks.Count -eq 0) {
        "✅ Nenhuma task de alta prioridade!`n"
    } else {
        $highTasks -join "`n"
    }
)

### P2 - MEDIO (Impacta qualidade)
$(
    $mediumTasks = @()
    if ($backendIssues | Where-Object { $_.issues -match "Validacao" }) {
        $count = ($backendIssues | Where-Object { $_.issues -match "Validacao" }).Count
        $mediumTasks += "- [ ] **[BACKEND-VALIDATION]** Adicionar validacao Zod em $count rotas"
    }
    if ($backendIssues | Where-Object { $_.issues -match "Logging" }) {
        $count = ($backendIssues | Where-Object { $_.issues -match "Logging" }).Count
        $mediumTasks += "- [ ] **[BACKEND-LOGGING]** Adicionar logging em $count rotas"
    }
    if ($frontendIssues | Where-Object { $_.issues -match "Estados UI" }) {
        $count = ($frontendIssues | Where-Object { $_.issues -match "Estados UI" }).Count
        $mediumTasks += "- [ ] **[FRONTEND-STATES]** Implementar estados UI em $count modulos"
    }
    if ($frontendIssues | Where-Object { $_.issues -match "CSS" }) {
        $count = ($frontendIssues | Where-Object { $_.issues -match "CSS" }).Count
        $mediumTasks += "- [ ] **[FRONTEND-CSS]** Criar CSS isolado para $count modulos"
    }
    
    if ($mediumTasks.Count -eq 0) {
        "✅ Nenhuma task de media prioridade!`n"
    } else {
        $mediumTasks -join "`n"
    }
)

### P3 - BAIXO (Performance e otimizacao)
$(
    $lowTasks = @()
    if ($backendIssues | Where-Object { $_.issues -match "N+1" }) {
        $count = ($backendIssues | Where-Object { $_.issues -match "N+1" }).Count
        $lowTasks += "- [ ] **[BACKEND-PERF]** Otimizar $count queries com N+1 problema"
    }
    if ($backendIssues | Where-Object { $_.issues -match "paginacao" }) {
        $count = ($backendIssues | Where-Object { $_.issues -match "paginacao" }).Count
        $lowTasks += "- [ ] **[BACKEND-PAGINATION]** Adicionar paginacao em $count rotas"
    }
    if ($performanceIssues.Count -gt 0) {
        $lowTasks += "- [ ] **[PERFORMANCE]** Resolver $($performanceIssues.Count) problemas de performance"
    }
    
    if ($lowTasks.Count -eq 0) {
        "✅ Nenhuma task de baixa prioridade!`n"
    } else {
        $lowTasks -join "`n"
    }
)

---

## 6. RECOMENDACOES GERAIS

### Antes de Producao
1. ✅ Corrigir TODOS os erros P0 (criticos)
2. ✅ Corrigir MAIORIA dos erros P1 (alto)
3. ⚠️ Revisar erros P2 (medio) - opcional mas recomendado
4. ⏳ Planejar erros P3 (baixo) para pos-lancamento

### Proximos Passos
1. Revisar este relatorio
2. Criar issues no GitHub para cada task
3. Priorizar e distribuir tasks
4. Executar testes manuais apos correcoes
5. Rodar auditoria novamente antes de deploy

---

**Gerado em**: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
**Script**: audit-pre-producao.ps1
**Status**: ✅ Auditoria completa
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8 -Force

Write-Host "  [OK] Relatorio gerado em: $reportPath`n" -ForegroundColor Green

# ============================================
# RESUMO FINAL
# ============================================
Write-Host "`n"
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  AUDITORIA COMPLETA FINALIZADA" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "`n"

Write-Host "Resultados:" -ForegroundColor Cyan
Write-Host "  Modulos Frontend: $($frontendIssues.Count) com problemas de $($modules.Count) auditados" -ForegroundColor $(if ($frontendIssues.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "  Rotas Backend: $($backendIssues.Count) com problemas de $($routes.Count) auditadas" -ForegroundColor $(if ($backendIssues.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "  Erros TypeScript: $($tsErrors.Count) erros encontrados" -ForegroundColor $(if ($tsErrors.Count -eq 0) { "Green" } else { "Red" })
Write-Host "  Performance: $($performanceIssues.Count) problemas encontrados" -ForegroundColor $(if ($performanceIssues.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "`n"

Write-Host "Relatorio completo:" -ForegroundColor Cyan
Write-Host "  $reportPath" -ForegroundColor Yellow
Write-Host "`n"

$totalIssues = $frontendIssues.Count + $backendIssues.Count + $tsErrors.Count + $performanceIssues.Count

if ($totalIssues -eq 0) {
    Write-Host "🎉 PROJETO PRONTO PARA PRODUCAO! 🎉" -ForegroundColor Green
} elseif ($tsErrors.Count -gt 0) {
    Write-Host "❌ PROJETO NAO PRONTO - Erros criticos encontrados" -ForegroundColor Red
} else {
    Write-Host "⚠️ PROJETO PRECISA DE AJUSTES - Revise o relatorio" -ForegroundColor Yellow
}

Write-Host "`n"
