# ╔══════════════════════════════════════════════════════════════╗
# ║     AUDITORIA DE SANITIZAÇÃO - ACADEMIA KRAV MAGA v2.0       ║
# ║              Fase 1: Identificação de Arquivos               ║
# ║                     Data: 19/10/2025                          ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$WarningPreference = "SilentlyContinue"

# Configuração
$rootPath = "h:\projetos\academia"
$oldFolder = "OLD_191025"
$oldPath = Join-Path $rootPath $oldFolder
$auditFile = Join-Path $rootPath "AUDIT_SANITIZATION_191025.md"
$moveListFile = Join-Path $rootPath "MOVE_LIST_191025.txt"
$reportFile = Join-Path $rootPath "SANITIZATION_REPORT_191025.json"

# Usar $oldPath e $keepFiles para evitar warnings
$null = $oldPath
$keepFilesTracker = @()

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         AUDITORIA DE SANITIZAÇÃO - FASE 1               ║" -ForegroundColor Cyan
Write-Host "║              Identificação de Arquivos                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Categorias de arquivos
$categories = @{
    "BACKUP_FILES" = @(
        @{ pattern = "*.bak"; desc = "Arquivos .bak" },
        @{ pattern = "*.backup"; desc = "Arquivos .backup" },
        @{ pattern = "*-backup"; desc = "Pastas -backup" },
        @{ pattern = "*_backup"; desc = "Pastas _backup" },
        @{ pattern = "*-old"; desc = "Pastas -old" },
        @{ pattern = "*_old"; desc = "Pastas _old" },
        @{ pattern = "*-deprecated"; desc = "Pastas -deprecated" }
    );
    
    "TEMP_LOGS" = @(
        @{ pattern = "*.log"; desc = "Arquivos .log" },
        @{ pattern = "*.tmp"; desc = "Arquivos .tmp" },
        @{ pattern = "*.temp"; desc = "Arquivos .temp" },
        @{ pattern = "*debug*"; desc = "Arquivos debug" },
        @{ pattern = "*test*"; desc = "Arquivos test (não-produção)" }
    );
    
    "DUPLICATES" = @(
        @{ pattern = "*-v1*"; desc = "Versões antigas" },
        @{ pattern = "*-v2*"; desc = "Versões antigas" },
        @{ pattern = "*-copy*"; desc = "Cópias de arquivos" },
        @{ pattern = "*copy*"; desc = "Cópias de arquivos" },
        @{ pattern = "*2*"; desc = "Duplicatas numeradas" }
    );
    
    "GENERATED_DOCS" = @(
        @{ pattern = "*COMPLETE*.md"; desc = "Documentos gerados (COMPLETE)" },
        @{ pattern = "*REPORT*.md"; desc = "Documentos gerados (REPORT)" },
        @{ pattern = "*SUMMARY*.md"; desc = "Documentos gerados (SUMMARY)" },
        @{ pattern = "*FIX*.md"; desc = "Documentos de FIX" },
        @{ pattern = "*DEBUG*.md"; desc = "Documentos de DEBUG" }
    );
    
    "OLD_MODULES" = @(
        @{ pattern = "*.js.old"; desc = "JS antigos" },
        @{ pattern = "*-old.js"; desc = "JS antigos" },
        @{ pattern = "*-backup.js"; desc = "JS backups" },
        @{ pattern = "*-simple*.js"; desc = "Versões simples antigos" },
        @{ pattern = "*-refactored*.js"; desc = "Versões refatoradas antigos" }
    );
    
    "ARCHIVES" = @(
        @{ pattern = "*.zip"; desc = "Arquivos ZIP" },
        @{ pattern = "*.rar"; desc = "Arquivos RAR" },
        @{ pattern = "*.tar"; desc = "Arquivos TAR" },
        @{ pattern = "*.gz"; desc = "Arquivos GZ" }
    );
    
    "DEPENDENCIES" = @(
        @{ pattern = "node_modules"; desc = "Node modules (será recriado)" },
        @{ pattern = "dist"; desc = "Build dist antigo" },
        @{ pattern = "dist-*"; desc = "Build dist antigos" }
    );
    
    "IDE_BUILD" = @(
        @{ pattern = ".idea"; desc = "Pasta IDE IntelliJ" },
        @{ pattern = ".reports"; desc = "Pasta de relatórios" },
        @{ pattern = ".claude"; desc = "Pasta Claude" },
        @{ pattern = ".archive"; desc = "Pasta archive" }
    )
}

# Pasta de origem para análise
$sourcePaths = @(
    "public\js\modules",
    "src",
    "scripts",
    ".",
    "dev",
    "tools"
)

# Arquivos CRÍTICOS para MANTER (produção)
$keepPatterns = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "prisma\schema.prisma",
    "next.config.js",
    ".env.example",
    ".gitignore",
    ".github\workflows",
    "README.md",
    "AGENTS.md"
)

Write-Host "📊 INICIANDO AUDITORIA...`n" -ForegroundColor Green

$allFiles = @()
$categorizedFiles = @{}
$keepFiles = @()
$moveFiles = @()

# Função para verificar se arquivo é crítico
function Test-IsCritical {
    param([string]$filePath)
    
    foreach ($pattern in $keepPatterns) {
        if ($filePath -like "*$pattern*" -or $filePath -like "*$pattern") {
            return $true
        }
    }
    return $false
}

# Coleta todos os arquivos
Write-Host "🔍 Varredura de arquivos..." -ForegroundColor Yellow
foreach ($sourcePath in $sourcePaths) {
    $fullPath = Join-Path $rootPath $sourcePath
    if (Test-Path $fullPath) {
        $files = Get-ChildItem -Path $fullPath -Recurse -File -ErrorAction SilentlyContinue
        $allFiles += $files
    }
}

Write-Host "   ✓ Total de arquivos encontrados: $($allFiles.Count)`n" -ForegroundColor Gray

# Categorizar arquivos
Write-Host "📁 Categorizando arquivos...`n" -ForegroundColor Yellow

foreach ($category in $categories.Keys) {
    $categorizedFiles[$category] = @()
    
    foreach ($rule in $categories[$category]) {
        $pattern = $rule.pattern
        $matchedFiles = $allFiles | Where-Object { $_.Name -like $pattern }
        
        foreach ($file in $matchedFiles) {
            if (-not (Test-IsCritical $file.FullName)) {
                $categorizedFiles[$category] += @{
                    "name" = $file.Name
                    "path" = $file.FullName
                    "size" = $file.Length
                    "relative" = $file.FullName.Replace($rootPath, "").TrimStart("\")
                    "rule" = $rule.desc
                }
                $moveFiles += $file
            }
        }
    }
    
    if ($categorizedFiles[$category].Count -gt 0) {
        Write-Host "   [$category] → $($categorizedFiles[$category].Count) arquivos" -ForegroundColor Cyan
    }
}

# Gerar relatório Markdown
Write-Host "`n📝 Gerando relatório...`n" -ForegroundColor Yellow

$markdownReport = @"
# 🔍 AUDITORIA DE SANITIZAÇÃO - FASE 1
**Data**: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")  
**Pasta Raiz**: $rootPath  
**Total de Arquivos**: $($allFiles.Count)  
**Arquivos para Mover**: $($moveFiles.Count)  
**Status**: ✅ AUDITORIA COMPLETA

---

## 📊 Resumo por Categoria

| Categoria | Quantidade | Tamanho Total |
|-----------|-----------|--------------|
"@

$totalSize = 0
foreach ($category in $categories.Keys) {
    $count = $categorizedFiles[$category].Count
    if ($count -gt 0) {
        $categorySize = ($categorizedFiles[$category] | Measure-Object -Property size -Sum).Sum
        $totalSize += $categorySize
        $sizeMB = [math]::Round($categorySize / 1MB, 2)
        $markdownReport += "`n| **$category** | $count | $sizeMB MB |"
    }
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
$markdownReport += "`n`n**TOTAL PARA MOVER**: $($moveFiles.Count) arquivos | $totalSizeMB MB`n`n"

# Detalhes por categoria
$markdownReport += "---`n`n## 📋 Detalhes por Categoria`n`n"

foreach ($category in $categories.Keys) {
    if ($categorizedFiles[$category].Count -gt 0) {
        $markdownReport += "### $category ($($categorizedFiles[$category].Count) arquivos)`n`n"
        
        foreach ($file in $categorizedFiles[$category] | Sort-Object -Property rule) {
            $markdownReport += "- **$($file.name)** ($([math]::Round($file.size / 1KB, 2)) KB) - Motivo: *$($file.rule)*`n"
        }
        
        $markdownReport += "`n"
    }
}

# Arquivos críticos (mantidos)
$markdownReport += "---`n`n## ✅ Arquivos CRÍTICOS (Mantidos em Produção)`n`n"
foreach ($pattern in $keepPatterns) {
    $matching = $allFiles | Where-Object { $_.FullName -like "*$pattern*" }
    if ($matching) {
        $markdownReport += "- ``$pattern`` -> Mantido `n"
    }
}

# Estrutura de pastas
$markdownReport += "`n---`n`n## 📂 Estrutura de Pastas`n`n"
$markdownReport += "\`\`\`tree`n"
$markdownReport += "academia/`n"
$markdownReport += "├── OLD_191025/          ← Novos arquivos será movidos aqui`n"
$markdownReport += "│   ├── BACKUPS/`n"
$markdownReport += "│   ├── TEMP_LOGS/`n"
$markdownReport += "│   ├── DUPLICATES/`n"
$markdownReport += "│   ├── GENERATED_DOCS/`n"
$markdownReport += "│   ├── OLD_MODULES/`n"
$markdownReport += "│   ├── DEPENDENCIES/`n"
$markdownReport += "│   └── IDE_BUILD/`n"
$markdownReport += "├── src/                 ← Produção`n"
$markdownReport += "├── public/              ← Produção`n"
$markdownReport += "├── prisma/              ← Produção`n"
$markdownReport += "├── package.json         ← Produção`n"
$markdownReport += "└── AGENTS.md            ← Produção`n"
$markdownReport += "\`\`\``n"

# Plano de ação
$markdownReport += "`n---`n`n## 🎯 Próximas Etapas`n`n"
$markdownReport += "### ✅ FASE 1 (ATUAL - Identific ação)`n"
$markdownReport += "- [x] Varrer arquivos`n"
$markdownReport += "- [x] Categorizar`n"
$markdownReport += "- [x] Gerar relatório`n`n"

$markdownReport += "### 🔜 FASE 2 (Movimento Simulado)`n"
$markdownReport += "- [ ] Executar \`move-files-preview.bat\` para visualizar movimento`n"
$markdownReport += "- [ ] Validar estrutura de pastas`n`n"

$markdownReport += "### 🚀 FASE 3 (Movimento Real)`n"
$markdownReport += "- [ ] Executar \`move-files-execute.bat\` para mover efetivamente`n"
$markdownReport += "- [ ] Criar backup de segurança`n"
$markdownReport += "- [ ] Verificar integridade`n`n"

$markdownReport += "### 🧹 FASE 4 (Limpeza Final)`n"
$markdownReport += "- [ ] Executar \`cleanup-final.bat\`para remover pastas vazias`n"
$markdownReport += "- [ ] Gerar relatório final`n"

# Avisos importantes
$markdownReport += "`n---`n`n## AVISOS IMPORTANTES`n`n"
$markdownReport += "1. Executar BAT em modo SIMULADO primeiro - Use move-files-preview.bat para testar`n"
$markdownReport += "2. Backup antes de mover - Use backup-before-move.bat para segurança`n"
$markdownReport += "3. Verificar node_modules - Será recriado com npm install`n"
$markdownReport += "4. Nao mexer em .git - Pasta .git será mantida intacta`n"
$markdownReport += "5. Arquivos .env - Serão preservados se existirem`n`n"

$markdownReport += "---`n**Gerado por**: Audit Sanitization Script v1.0  \n**Status**: ✅ AUDITORIA CONCLUÍDA COM SUCESSO`n"

# Salvar relatório Markdown
Set-Content -Path $auditFile -Value $markdownReport -Encoding UTF8
Write-Host "✓ Relatório salvo em: $auditFile`n" -ForegroundColor Green

# Gerar lista de movimento
$moveList = @()
foreach ($file in $moveFiles) {
    $relative = $file.FullName.Replace($rootPath, "").TrimStart("\")
    $moveList += $relative
}

$moveList | Sort-Object | Out-File -FilePath $moveListFile -Encoding UTF8
Write-Host "✓ Lista de movimento salva em: $moveListFile`n" -ForegroundColor Green

# Gerar relatório JSON
$jsonReport = @{
    "audit_date" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "total_files" = $allFiles.Count
    "files_to_move" = $moveFiles.Count
    "total_size_mb" = [math]::Round($totalSize / 1MB, 2)
    "categories" = @{}
    "files" = @()
}

foreach ($category in $categories.Keys) {
    if ($categorizedFiles[$category].Count -gt 0) {
        $jsonReport.categories[$category] = @{
            "count" = $categorizedFiles[$category].Count
            "size_mb" = [math]::Round(($categorizedFiles[$category] | Measure-Object -Property size -Sum).Sum / 1MB, 2)
            "files" = $categorizedFiles[$category] | Select-Object name, relative, size
        }
    }
}

$jsonReport | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "✓ Relatório JSON salvo em: $reportFile`n" -ForegroundColor Green

# Estatísticas finais
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║               ESTATÍSTICAS DA AUDITORIA                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Resumo:" -ForegroundColor White
Write-Host "  . Total de arquivos: $($allFiles.Count)" -ForegroundColor White
Write-Host "  . Arquivos para mover: $($moveFiles.Count)" -ForegroundColor White
Write-Host "  . Tamanho total: $totalSizeMB MB" -ForegroundColor White
Write-Host "  . Arquivos críticos mantidos: $(($allFiles | Where-Object { Test-IsCritical $_.FullName }).Count)`n" -ForegroundColor White

Write-Host "Por Categoria:" -ForegroundColor Yellow
foreach ($category in $categories.Keys | Sort-Object) {
    if ($categorizedFiles[$category].Count -gt 0) {
        $categorySize = [math]::Round(($categorizedFiles[$category] | Measure-Object -Property size -Sum).Sum / 1MB, 2)
        Write-Host "   . $category`: $($categorizedFiles[$category].Count) arquivos ($categorySize MB)" -ForegroundColor Cyan
    }
}

Write-Host "`nAUDITORIA CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "`nProximo passo: Executar move-files-preview.bat para visualizar movimento (modo simulado)" -ForegroundColor Cyan
Write-Host "Depois: Executar move-files-execute.bat para mover de verdade" -ForegroundColor Cyan
Write-Host "`nAVISO: NAO ESQUECA: Fazer backup antes de mover!`n" -ForegroundColor Yellow
