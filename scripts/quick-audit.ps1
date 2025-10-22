# Quick Audit - Academia Pre-Producao
# Auditoria rapida e focada

$rootPath = "h:\projetos\academia"
Write-Host "`n=== AUDITORIA PRE-PRODUCAO ===" -ForegroundColor Cyan
Write-Host "Iniciando analise...`n" -ForegroundColor Yellow

# Contadores
$summary = @{
    "modulesTotal" = 0
    "modulesWithIssues" = 0
    "routesTotal" = 0
    "routesWithIssues" = 0
    "tsErrorsTotal" = 0
}

# Arrays para resultados
$frontendIssues = @()
$backendIssues = @()

# 1. MODULOS FRONTEND
Write-Host "[1/3] Auditando modulos frontend..." -ForegroundColor Yellow
$modulesPath = Join-Path $rootPath "public\js\modules"
$modules = Get-ChildItem -Path $modulesPath -Directory -ErrorAction SilentlyContinue

foreach ($module in $modules) {
    $summary.modulesTotal++
    $moduleName = $module.Name
    $moduleProblems = @()
    
    $indexPath = Join-Path $module.FullName "index.js"
    if (Test-Path $indexPath) {
        $content = Get-Content $indexPath -Raw
        
        # Verificacoes criticas
        if ($content -notmatch "createModuleAPI|moduleAPI") {
            $moduleProblems += "Sem API Client pattern"
        }
        if ($content -notmatch "loading|empty|error") {
            $moduleProblems += "Sem estados UI"
        }
        if ($content -notmatch "window.app") {
            $moduleProblems += "Nao integrado ao AcademyApp"
        }
    } else {
        $moduleProblems += "CRITICO: index.js ausente"
    }
    
    if ($moduleProblems.Count -gt 0) {
        $summary.modulesWithIssues++
        $frontendIssues += @{
            "module" = $moduleName
            "problems" = $moduleProblems
        }
    }
}

Write-Host "  Resultado: $($summary.modulesWithIssues) de $($summary.modulesTotal) com problemas`n" -ForegroundColor $(if ($summary.modulesWithIssues -eq 0) {"Green"} else {"Yellow"})

# 2. ROTAS BACKEND
Write-Host "[2/3] Auditando rotas backend..." -ForegroundColor Yellow
$routesPath = Join-Path $rootPath "src\routes"
$routes = Get-ChildItem -Path $routesPath -File -Filter "*.ts" -ErrorAction SilentlyContinue

foreach ($route in $routes) {
    $summary.routesTotal++
    $routeName = $route.BaseName
    $routeProblems = @()
    
    $content = Get-Content $route.FullName -Raw
    
    # Verificacoes criticas
    if ($content -notmatch "try\s*{|catch") {
        $routeProblems += "Sem error handling"
    }
    if ($content -notmatch "success.*true|success.*false") {
        $routeProblems += "Response format nao padrao"
    }
    if ($content -match "findMany" -and $content -notmatch "take|skip|limit") {
        $routeProblems += "findMany sem paginacao"
    }
    
    if ($routeProblems.Count -gt 0) {
        $summary.routesWithIssues++
        $backendIssues += @{
            "route" = $routeName
            "problems" = $routeProblems
        }
    }
}

Write-Host "  Resultado: $($summary.routesWithIssues) de $($summary.routesTotal) com problemas`n" -ForegroundColor $(if ($summary.routesWithIssues -eq 0) {"Green"} else {"Yellow"})

# 3. ERROS TYPESCRIPT
Write-Host "[3/3] Verificando erros TypeScript..." -ForegroundColor Yellow
Set-Location $rootPath
$buildOutput = & npm run build 2>&1 | Out-String

if ($buildOutput -match "Found (\d+) error") {
    $summary.tsErrorsTotal = [int]$matches[1]
}

Write-Host "  Resultado: $($summary.tsErrorsTotal) erros encontrados`n" -ForegroundColor $(if ($summary.tsErrorsTotal -eq 0) {"Green"} else {"Red"})

# GERAR RELATORIO
Write-Host "Gerando relatorio..." -ForegroundColor Yellow

$reportContent = @"
# AUDITORIA PRE-PRODUCAO - Academia Krav Maga v2.0
**Data**: $(Get-Date -Format 'dd/MM/yyyy HH:mm')

## RESUMO EXECUTIVO

| Categoria | Total | Problemas | Status |
|-----------|-------|-----------|--------|
| Modulos Frontend | $($summary.modulesTotal) | $($summary.modulesWithIssues) | $(if ($summary.modulesWithIssues -eq 0) {"✅"} else {"⚠️"}) |
| Rotas Backend | $($summary.routesTotal) | $($summary.routesWithIssues) | $(if ($summary.routesWithIssues -eq 0) {"✅"} else {"⚠️"}) |
| Erros TypeScript | - | $($summary.tsErrorsTotal) | $(if ($summary.tsErrorsTotal -eq 0) {"✅"} else {"❌"}) |

---

## 1. PROBLEMAS FRONTEND ($($summary.modulesWithIssues) modulos)

$(
    if ($frontendIssues.Count -eq 0) {
        "✅ **Todos os modulos em conformidade!**`n"
    } else {
        $frontendIssues | ForEach-Object {
            "### $($_.module)`n" + ($_.problems | ForEach-Object {"- ❌ $_`n"}) + "`n"
        }
    }
)

---

## 2. PROBLEMAS BACKEND ($($summary.routesWithIssues) rotas)

$(
    if ($backendIssues.Count -eq 0) {
        "✅ **Todas as rotas bem estruturadas!**`n"
    } else {
        $backendIssues | ForEach-Object {
            "### $($_.route).ts`n" + ($_.problems | ForEach-Object {"- ❌ $_`n"}) + "`n"
        }
    }
)

---

## 3. ERROS TYPESCRIPT

Total: $($summary.tsErrorsTotal) erros

$(if ($summary.tsErrorsTotal -eq 0) {"✅ **Build passa sem erros!**"} else {"❌ **Build falha - corrija os erros TypeScript**"})

---

## TASKS PRIORIZADAS

### P0 - CRITICO (Bloqueia producao)
$(
    $tasks = @()
    if ($summary.tsErrorsTotal -gt 0) {
        $tasks += "- [ ] **[TS-BUILD]** Corrigir $($summary.tsErrorsTotal) erros TypeScript"
    }
    if ($frontendIssues | Where-Object {$_.problems -match "CRITICO"}) {
        $count = ($frontendIssues | Where-Object {$_.problems -match "CRITICO"}).Count
        $tasks += "- [ ] **[FRONTEND]** Corrigir $count modulos sem index.js"
    }
    if ($tasks.Count -eq 0) {"✅ Nenhuma task critica!"} else {$tasks -join "`n"}
)

### P1 - ALTO (Impacta funcionalidade)
$(
    $tasks = @()
    if ($backendIssues | Where-Object {$_.problems -match "error handling"}) {
        $count = ($backendIssues | Where-Object {$_.problems -match "error handling"}).Count
        $tasks += "- [ ] **[BACKEND]** Adicionar error handling em $count rotas"
    }
    if ($frontendIssues | Where-Object {$_.problems -match "API Client"}) {
        $count = ($frontendIssues | Where-Object {$_.problems -match "API Client"}).Count
        $tasks += "- [ ] **[FRONTEND]** Migrar $count modulos para API Client pattern"
    }
    if ($frontendIssues | Where-Object {$_.problems -match "AcademyApp"}) {
        $count = ($frontendIssues | Where-Object {$_.problems -match "AcademyApp"}).Count
        $tasks += "- [ ] **[FRONTEND]** Integrar $count modulos ao AcademyApp"
    }
    if ($tasks.Count -eq 0) {"✅ Nenhuma task de alta prioridade!"} else {$tasks -join "`n"}
)

### P2 - MEDIO (Impacta qualidade)
$(
    $tasks = @()
    if ($frontendIssues | Where-Object {$_.problems -match "estados UI"}) {
        $count = ($frontendIssues | Where-Object {$_.problems -match "estados UI"}).Count
        $tasks += "- [ ] **[FRONTEND]** Implementar estados UI em $count modulos"
    }
    if ($backendIssues | Where-Object {$_.problems -match "Response"}) {
        $count = ($backendIssues | Where-Object {$_.problems -match "Response"}).Count
        $tasks += "- [ ] **[BACKEND]** Padronizar response format em $count rotas"
    }
    if ($tasks.Count -eq 0) {"✅ Nenhuma task de media prioridade!"} else {$tasks -join "`n"}
)

### P3 - BAIXO (Performance)
$(
    $tasks = @()
    if ($backendIssues | Where-Object {$_.problems -match "paginacao"}) {
        $count = ($backendIssues | Where-Object {$_.problems -match "paginacao"}).Count
        $tasks += "- [ ] **[BACKEND-PERF]** Adicionar paginacao em $count rotas"
    }
    if ($tasks.Count -eq 0) {"✅ Nenhuma task de performance!"} else {$tasks -join "`n"}
)

---

## PROXIMOS PASSOS

1. ✅ Revisar este relatorio
2. ⏳ Priorizar tasks P0 e P1
3. ⏳ Criar issues no GitHub
4. ⏳ Executar correcoes
5. ⏳ Rodar auditoria novamente
6. ⏳ Deploy para pre-producao

---

**Gerado**: $(Get-Date -Format 'dd/MM/yyyy HH:mm')
"@

$reportPath = Join-Path $rootPath "AUDITORIA_PRE_PRODUCAO.md"
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8 -Force

# RESUMO FINAL
Write-Host "`n==================================" -ForegroundColor Green
Write-Host "   AUDITORIA COMPLETA" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "`nResultados:" -ForegroundColor Cyan
Write-Host "  Frontend: $($summary.modulesWithIssues)/$($summary.modulesTotal) modulos com problemas" -ForegroundColor $(if ($summary.modulesWithIssues -eq 0) {"Green"} else {"Yellow"})
Write-Host "  Backend: $($summary.routesWithIssues)/$($summary.routesTotal) rotas com problemas" -ForegroundColor $(if ($summary.routesWithIssues -eq 0) {"Green"} else {"Yellow"})
Write-Host "  TypeScript: $($summary.tsErrorsTotal) erros" -ForegroundColor $(if ($summary.tsErrorsTotal -eq 0) {"Green"} else {"Red"})

$totalIssues = $summary.modulesWithIssues + $summary.routesWithIssues + $summary.tsErrorsTotal

Write-Host "`nRelatorio gerado:" -ForegroundColor Cyan
Write-Host "  $reportPath" -ForegroundColor Yellow
Write-Host "`n"

if ($totalIssues -eq 0) {
    Write-Host "🎉 PROJETO PRONTO PARA PRODUCAO! 🎉" -ForegroundColor Green
} elseif ($summary.tsErrorsTotal -gt 0) {
    Write-Host "❌ PROJETO NAO PRONTO - Erros criticos (TypeScript)" -ForegroundColor Red
} else {
    Write-Host "⚠️ PROJETO PRECISA DE AJUSTES - Revise tarefas P0 e P1" -ForegroundColor Yellow
}
Write-Host "`n"
