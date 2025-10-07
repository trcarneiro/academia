# SOLUÇÃO DEFINITIVA: Servidor Estável

## 🔴 PROBLEMA CRÍTICO

O servidor **inicia** mas **crashasegs depois** devido a 615 erros TypeScript. Isso faz o curso "desaparecer" porque o endpoint `/api/courses` para de responder.

## ✅ SOLUÇÃO IMEDIATA (FAÇA AGORA)

### Opção 1: Terminal Dedicado (RECOMENDADO)

1. **Abra um NOVO terminal PowerShell** (Windows Terminal, VS Code, ou CMD)

2. **Execute**:
   ```powershell
   cd H:\projetos\academia
   npm run dev
   ```

3. **DEIXE O TERMINAL ABERTO E RODANDO**
   - NÃO feche
   - NÃO interrompa (Ctrl+C)
   - Minimize se quiser, mas mantenha rodando

4. **Volte ao browser e recarregue** (`Ctrl + Shift + R`)

### Opção 2: Usar nodemon (Reinicialização Automática)

```powershell
npm install -g nodemon
nodemon --exec npx tsx src/server.ts
```

Isso reinicia automaticamente quando crashar.

### Opção 3: PM2 (Mais Robusto)

```powershell
npm install -g pm2
pm2 start "npx tsx src/server.ts" --name academia
pm2 logs academia  # Ver logs
pm2 restart academia  # Reiniciar
pm2 stop academia  # Parar
```

## 🔧 POR QUE ISSO ACONTECE?

**615 erros TypeScript** no código:
- `src/services/evaluationService.ts` (8 erros)
- `src/services/financialService.ts` (9 erros)
- `src/services/googleAdsService.ts` (34 erros)
- `src/types/index.ts` (13 erros - tipos faltando!)

Quando qualquer código toca esses arquivos, o servidor explode.

## ✅ VALIDAÇÃO

Depois de iniciar o servidor, teste:

```powershell
# Em outro terminal:
Invoke-WebRequest -Uri 'http://localhost:3000/api/courses' -Headers @{'x-organization-id'='a55ad715-2eb0-493c-996c-bb0f60bacec9'}
```

**Resultado esperado**:
```json
{
  "success": true,
  "data": [{
    "id": "krav-maga-faixa-branca-2025",
    "name": "Krav Maga Faixa Branca",
    ...
  }]
}
```

## 🎯 PRÓXIMOS PASSOS

### Curto Prazo (Hoje)
1. ✅ Manter servidor rodando em terminal dedicado
2. ✅ Recarregar browser (`Ctrl + Shift + R`)
3. ✅ Verificar se curso aparece em Cursos e Pacotes

### Médio Prazo (Esta Semana)
1. 🔧 Corrigir os 615 erros TypeScript
2. 🔧 Focar em arquivos críticos:
   - `src/types/index.ts` (exportar `UserRole`, `AIProvider`, etc.)
   - `src/services/evaluationService.ts` (tipos do Prisma)
   - `src/services/financialService.ts` (tipos de billing)

### Longo Prazo (Próximo Sprint)
1. 📊 Executar `npm run build` diariamente (CI/CD)
2. 📊 Configurar TypeScript strict mode gradualmente
3. 📊 Adicionar testes que detectam crashes

## 🚨 SE O CURSO SUMIR NOVAMENTE

**Causa**: Servidor crashou

**Solução Rápida**:
```powershell
# 1. Matar processos Node
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Reiniciar servidor
cd H:\projetos\academia
npm run dev

# 3. Recarregar browser (Ctrl + Shift + R)
```

**Verificar se curso existe**:
```powershell
node check-org-mismatch.js
```

Se retornar "✅ MESMA ORGANIZAÇÃO", o curso está OK no banco. O problema é só servidor crashado.

## 📋 CHECKLIST DE VERIFICAÇÃO

Quando o curso "desaparece":

```
✅ Curso existe no banco? → node check-org-mismatch.js
✅ Servidor está rodando? → Get-Process -Name node
✅ Servidor responde? → curl http://localhost:3000/health
✅ Endpoint correto? → curl http://localhost:3000/api/courses
✅ Headers enviados? → Ver Network tab no browser
```

## 💡 DICA PRO

Adicione ao `package.json`:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "dev:stable": "nodemon --exec tsx src/server.ts",
  "dev:debug": "tsx --inspect src/server.ts",
  "health": "curl http://localhost:3000/health"
}
```

Depois use `npm run dev:stable` para servidor que reinicia automaticamente.

---

## 🎯 AÇÃO IMEDIATA

**FAÇA AGORA** (5 segundos):

1. Abra novo terminal PowerShell
2. Execute: `cd H:\projetos\academia && npm run dev`
3. Deixe rodando
4. Recarregue browser (`Ctrl + Shift + R`)
5. Navegue para Cursos → Deve aparecer "Krav Maga Faixa Branca"

**Me avise quando o servidor estiver estável!** 🚀
