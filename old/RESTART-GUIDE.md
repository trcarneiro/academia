# 🔄 Scripts de Reinicialização do Servidor

Scripts para matar processos Node.js e reiniciar o servidor de desenvolvimento rapidamente.

## 📁 Arquivos Disponíveis

### 1. `restart-dev.ps1` (PowerShell - Recomendado)
```powershell
.\restart-dev.ps1
```

### 2. `restart-dev.bat` (Batch - Alternativa)
```cmd
restart-dev.bat
```

## 🚀 Como Usar

### Opção 1: PowerShell (Recomendado)
1. Abra PowerShell na pasta do projeto
2. Execute: `.\restart-dev.ps1`

### Opção 2: Command Prompt
1. Abra CMD na pasta do projeto  
2. Execute: `restart-dev.bat`

### Opção 3: Duplo Clique
- Clique duas vezes no arquivo `restart-dev.bat` no Windows Explorer

## ⚡ O que os Scripts Fazem

1. ✅ **Mata todos os processos Node.js** ativos
2. ✅ **Libera a porta 3000** especificamente  
3. ✅ **Limpa o cache do npm** (opcional)
4. ✅ **Aguarda 2 segundos** para estabilizar
5. ✅ **Inicia o servidor** com `npm run dev`

## 🛠️ Solução de Problemas

### Se der erro de "Execution Policy" no PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Se a porta ainda estiver ocupada:
```powershell
# Ver qual processo está usando a porta 3000
netstat -ano | findstr :3000

# Matar processo específico (substitua XXXX pelo PID)
taskkill /pid XXXX /f
```

### Alternativa manual:
```powershell
# Matar Node.js
Get-Process node | Stop-Process -Force

# Ou usar taskkill
taskkill /f /im node.exe

# Reiniciar
npm run dev
```

## 💡 Dicas

- ⚡ Use `Ctrl+C` no terminal para parar o servidor normalmente
- 🔄 Use os scripts quando o servidor travar ou der erro de porta ocupada
- 📝 Os scripts mostram mensagens coloridas para facilitar o acompanhamento
- ⏱️ Aguarde alguns segundos após executar para o servidor inicializar completamente