# Script para configurar Google Ads Sync no Windows Task Scheduler
# Execute como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Ads Sync - Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$projectPath = "H:\projetos\academia"
$taskName = "Academia Google Ads Sync"
$npmPath = "C:\Program Files\nodejs\npm.cmd"

# Verificar se npm existe
if (-not (Test-Path $npmPath)) {
    Write-Host "❌ npm não encontrado em: $npmPath" -ForegroundColor Red
    Write-Host "   Por favor, ajuste a variável `$npmPath no script" -ForegroundColor Yellow
    exit 1
}

# Verificar se projeto existe
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Projeto não encontrado em: $projectPath" -ForegroundColor Red
    Write-Host "   Por favor, ajuste a variável `$projectPath no script" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ npm encontrado: $npmPath" -ForegroundColor Green
Write-Host "✅ Projeto encontrado: $projectPath" -ForegroundColor Green
Write-Host ""

# Remover tarefa existente se houver
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Tarefa '$taskName' já existe. Removendo..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✅ Tarefa antiga removida" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Criando nova tarefa agendada..." -ForegroundColor Cyan

try {
    # Criar ação (executar npm run sync:google-ads)
    $action = New-ScheduledTaskAction `
        -Execute $npmPath `
        -Argument "run sync:google-ads" `
        -WorkingDirectory $projectPath

    # Criar trigger (diariamente às 00:00, repetir a cada 6 horas)
    $trigger = New-ScheduledTaskTrigger `
        -Daily `
        -At 12am `
        -RepetitionInterval (New-TimeSpan -Hours 6) `
        -RepetitionDuration (New-TimeSpan -Days 1)

    # Configurações de segurança
    $principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType S4U `
        -RunLevel Highest

    # Configurações gerais
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 5)

    # Registrar tarefa
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Sincroniza campanhas do Google Ads e faz upload de conversões offline automaticamente a cada 6 horas" | Out-Null

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ TAREFA CRIADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Detalhes da tarefa:" -ForegroundColor Cyan
    Write-Host "   Nome: $taskName" -ForegroundColor White
    Write-Host "   Comando: npm run sync:google-ads" -ForegroundColor White
    Write-Host "   Diretório: $projectPath" -ForegroundColor White
    Write-Host "   Frequência: A cada 6 horas" -ForegroundColor White
    Write-Host "   Horários: 00:00, 06:00, 12:00, 18:00" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Para verificar a tarefa:" -ForegroundColor Cyan
    Write-Host "   1. Abra o Task Scheduler (Agendador de Tarefas)" -ForegroundColor White
    Write-Host "   2. Procure por: $taskName" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Para testar manualmente:" -ForegroundColor Cyan
    Write-Host "   cd $projectPath" -ForegroundColor White
    Write-Host "   npm run sync:google-ads" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Para ver logs:" -ForegroundColor Cyan
    Write-Host "   Get-Content -Path '$projectPath\api-server.log' -Tail 50 -Wait" -ForegroundColor White
    Write-Host ""

    # Mostrar informações da tarefa criada
    $task = Get-ScheduledTask -TaskName $taskName
    Write-Host "✅ Estado atual: $($task.State)" -ForegroundColor Green
    Write-Host "✅ Próxima execução: $((Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime)" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ ERRO ao criar tarefa:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Certifique-se de:" -ForegroundColor Yellow
    Write-Host "   1. Executar este script como Administrador" -ForegroundColor Yellow
    Write-Host "   2. npm está instalado e acessível" -ForegroundColor Yellow
    Write-Host "   3. Caminho do projeto está correto" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
