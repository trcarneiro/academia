# SOLUÇÃO TEMPORÁRIA: Servidor Crashando

## Problema
O servidor **inicia** (logs aparecem) mas **sai imediatamente** (Exit Code: 1). Isso indica um erro fatal após inicialização.

## Causa Provável
- 615 erros TypeScript causando crash em runtime
- Código problemático sendo executado após registro de rotas
- Listener HTTP fechando inesperadamente

## Solução Imediata (TESTE AGORA)

### Opção 1: Servidor Manual em Segundo Plano
```powershell
# Abrir NOVO terminal PowerShell
cd H:\projetos\academia
npx tsx src/server.ts

# DEIXAR RODANDO (não fechar)
# Em outro terminal, testar:
curl http://localhost:3000/api/courses -H "x-organization-id: a55ad715-2eb0-493c-996c-bb0f60bacec9"
```

### Opção 2: Usar npm run dev (Modo Original)
```powershell
npm run dev
```

**IMPORTANTE**: Não feche o terminal! Servidor precisa ficar rodando.

## Teste da API

Depois de iniciar o servidor, cole isto no **BROWSER CONSOLE**:

```javascript
// Testar GET /api/courses com organization header
fetch('/api/courses', {
  headers: {
    'x-organization-id': 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
  }
})
.then(r => r.json())
.then(data => {
  console.log('📚 CURSOS:', data);
  if (data.data && data.data.length > 0) {
    console.log('✅ SUCESSO! Curso encontrado:', data.data[0].name);
  } else {
    console.log('❌ AINDA VAZIO - Problema persiste');
  }
});
```

## Se Curso Aparecer

✅ **FIX FUNCIONOU!** O problema era apenas servidor crashando.

**Próximo passo**: Recarregar editor de pacote e ver curso no dropdown.

## Se Curso Continuar Vazio

Possíveis causas restantes:
1. Headers não sendo enviados pelo frontend
2. Função `getOrganizationId()` não sendo chamada
3. Fallback pegando organização errada

**Debug**: Ver logs do servidor no terminal para identificar qual organização está sendo resolvida.

---

## Status Atual

✅ Curso existe: `krav-maga-faixa-branca-2025`  
✅ Organização correta: `a55ad715-2eb0-493c-996c-bb0f60bacec9`  
✅ Fix aplicado: `getOrganizationId(request)` implementado  
❌ Servidor crashando: Exit Code 1 após inicialização  

**Ação necessária**: Manter servidor rodando manualmente e testar API
