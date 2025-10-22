# 🔍 GUIA PARA DEBUGAR O BOTÃO DELETAR

## O que fazer agora

### Passo 1: Abrir Developer Tools
```
Pressione: F12 (Windows/Linux) ou Cmd+Option+I (Mac)
```

### Passo 2: Ir para Aba Console
```
Clique na aba "Console" no Developer Tools
```

### Passo 3: Recarregar Página
```
Pressione: F5 ou Ctrl+R
```

### Passo 4: Navegar até Financeiro
```
1. Alunos
2. Double-click em um aluno
3. Clique na aba "Financeiro"
4. Veja o console enquanto faz isso
```

### Passo 5: Clicar no Botão Deletar
```
1. Mantendo F12 aberto (console visível)
2. Clique no botão [🗑️ Deletar]
3. Observe os logs que aparecem no console
```

## O que Procurar no Console

### ✅ Logs Esperados
```
🗑️ checkAndDeleteSubscription called with ID: {id}
   this.api: ModuleAPIHelper { ... }
   this.api.api: ApiClient { ... }
   studentId: {student-id}
   Fetching student data from /api/students/{id}
📊 Checkins do aluno: {count}
```

### ❌ Erros Comuns

**Erro 1: `this.api is undefined`**
```
Problema: O controller não foi inicializado com a API
Solução: Recarregue a página (F5)
```

**Erro 2: `this.api.api is undefined`**
```
Problema: O ModuleAPIHelper não tem a instância do ApiClient
Solução: Verifique se api-client.js foi carregado
```

**Erro 3: `Cannot read property 'get' of undefined`**
```
Problema: ApiClient.get não existe
Solução: Verifique se api-client.js está correto
```

**Erro 4: `DELETE /api/subscriptions/{id} 404`**
```
Problema: O endpoint DELETE não existe no backend
Solução: Verifique se subscriptions.ts foi modificado corretamente
```

## Teste Rápido no Console

Copie e cole isso no console (F12):

```javascript
// Teste 1: Verificar window.studentEditor
console.log('Teste 1 - window.studentEditor:', !!window.studentEditor);

// Teste 2: Verificar methods
console.log('Teste 2 - checkAndDeleteSubscription:', typeof window.studentEditor?.checkAndDeleteSubscription);

// Teste 3: Verificar API
console.log('Teste 3 - api.api:', !!window.studentEditor?.api?.api);

// Teste 4: Verificar delete method
console.log('Teste 4 - api.api.delete:', typeof window.studentEditor?.api?.api?.delete);

// Teste 5: Chamar delete manualmente
if (window.studentEditor?.current?.subscriptions?.[0]) {
  const subId = window.studentEditor.current.subscriptions[0].id;
  console.log('Teste 5 - Chamando checkAndDeleteSubscription com ID:', subId);
  window.studentEditor.checkAndDeleteSubscription(subId);
} else {
  console.log('❌ Sem subscription para testar!');
}
```

## Se Ainda Não Funcionar

### 1. Copie TODO o log do console
```
- Clique direito no console
- Selecione "Save as..."
- Salve como "console-log.txt"
```

### 2. Envie o erro completo
```
A mensagem de erro completa ajuda a diagnosticar
```

### 3. Informações úteis
```
- Navegador (Chrome, Firefox, Safari, Edge)
- Sistema (Windows, Mac, Linux)
- URL completa que está acessando
- Quantos alunos tem com/sem checkins
```

## Se Tiver 404 no DELETE

Isso significa o endpoint está funcionando, mas retorna 404. Possíveis causas:

### 1. Subscription ID inválido
```javascript
// Verifique no console:
console.log(window.studentEditor.current.subscriptions);
// Veja se tem "id" em cada subscription
```

### 2. Endpoint não foi criado
```
Verifique se src/routes/subscriptions.ts foi editado
E se tem a função DELETE
```

### 3. Servidor não foi reiniciado
```
Comando: npm run dev
Verifique se compila sem erros
```

## Próximos Passos

1. Execute os testes acima
2. Verifique o console para logs e erros
3. Compartilhe os logs se ainda não funcionar
4. Posso ajudar com mais diagnósticos

---

**Data**: 16 de outubro de 2025  
**Versão**: v1.0  
**Status**: Em diagnóstico
