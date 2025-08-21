# 🔧 Script de Migração de Cores - Academia Krav Maga v2.0
# Automatiza a substituição de cores hardcoded por tokens CSS

# Mapeamento de cores hardcoded para tokens oficiais
$colorMapping = @{
    # Cores Primárias - Dashboard conflitante
    '#4f46e5' = 'var(--primary-color)'       # Indigo → Azul oficial
    '#6366f1' = 'var(--primary-light)'       # Indigo claro → Light derivado
    
    # Cores de Texto
    '#1e293b' = 'var(--color-text)'          # Cinza escuro (texto principal)
    '#64748b' = 'var(--color-text-muted)'    # Cinza médio
    '#94a3b8' = 'var(--color-text-light)'    # Cinza claro
    '#1f2937' = 'var(--color-text)'          # Variante de texto
    
    # Cores de Superfície
    '#ffffff' = 'var(--color-surface)'       # Branco
    '#f8fafc' = 'var(--color-background)'    # Cinza ultra claro
    '#f9fafb' = 'var(--color-background)'    # Variante de fundo
    
    # Cores de Borda
    '#e2e8f0' = 'var(--color-border)'        # Cinza borda
    '#cbd5e1' = 'var(--color-border)'        # Variante de borda
    '#e5e7eb' = 'var(--color-border)'        # Outra variante
    
    # Cores Semânticas
    '#10b981' = 'var(--color-success)'       # Verde
    '#ef4444' = 'var(--color-error)'         # Vermelho
    '#f59e0b' = 'var(--color-warning)'       # Amarelo
    '#3b82f6' = 'var(--color-info)'          # Azul info
    
    # Dark Theme
    '#0f172a' = 'var(--color-background-dark)' # Fundo dark
}

# Função para processar arquivos CSS
function Update-CSSColors {
    param(
        [string]$FilePath
    )
    
    Write-Host "Processando: $FilePath" -ForegroundColor Cyan
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    
    foreach ($hardcoded in $colorMapping.Keys) {
        $token = $colorMapping[$hardcoded]
        $content = $content -replace [regex]::Escape($hardcoded), $token
    }
    
    # Remover !important desnecessários
    $content = $content -replace ' !important;', ';'
    $content = $content -replace ' !important }', ' }'
    
    if ($content -ne $originalContent) {
        Set-Content $FilePath $content -Encoding UTF8
        Write-Host "Atualizado: $FilePath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Sem mudancas: $FilePath" -ForegroundColor Yellow
        return $false
    }
}

# Listar todos os arquivos CSS para processar
$cssFiles = Get-ChildItem -Path "public/css" -Recurse -Filter "*.css" | Where-Object {
    $_.Name -notlike "*tokens*" -and 
    $_.Name -notlike "*backup*" -and
    $_.FullName -notlike "*old*"
}

Write-Host "MIGRACAO DE CORES - Academia Krav Maga v2.0" -ForegroundColor Magenta
Write-Host "Encontrados $($cssFiles.Count) arquivos CSS para processar" -ForegroundColor White
Write-Host ""

$updatedCount = 0
$totalFiles = $cssFiles.Count

foreach ($file in $cssFiles) {
    $updated = Update-CSSColors -FilePath $file.FullName
    if ($updated) {
        $updatedCount++
    }
}

Write-Host ""
Write-Host "RELATORIO FINAL:" -ForegroundColor Magenta
Write-Host "• Arquivos processados: $totalFiles" -ForegroundColor White
Write-Host "• Arquivos atualizados: $updatedCount" -ForegroundColor Green
Write-Host "• Arquivos sem mudancas: $($totalFiles - $updatedCount)" -ForegroundColor Yellow

if ($updatedCount -gt 0) {
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "1. Testar a aplicacao: npm run dev" -ForegroundColor White
    Write-Host "2. Verificar consistencia visual" -ForegroundColor White
    Write-Host "3. Ajustar casos especificos se necessario" -ForegroundColor White
}

Write-Host ""
Write-Host "Migracao concluida! Paleta oficial (#667eea + #764ba2) implementada." -ForegroundColor Green
