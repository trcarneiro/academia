# 🐛 Debugging Guide: Course Import Timeout & 400 Error

## Problema Identificado

Ao tentar importar o curso `cursofaixabranca.json`, ocorrem dois erros:
1. **Timeout**: Requisição demora mais de 10 segundos (3 tentativas)
2. **400 Bad Request**: Servidor retorna erro de validação

## Correções Aplicadas

### Frontend (`importControllerEnhanced.js`)

1. **Timeout aumentado para 60 segundos**:
   ```javascript
   response = await this.moduleAPI.api.request('POST', '/api/courses/import-full-course', payload, {
       timeout: 60000 // 60 segundos para permitir criação de técnicas
   });
   ```

2. **Logs de debug adicionados**:
   ```javascript
   console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));
   console.log('📊 Payload size:', JSON.stringify(payload).length, 'bytes');
   ```

3. **Correção do erro de cleanup**:
   ```javascript
   updateStats() {
       const totalEl = document.getElementById('stat-total');
       // Verifica se elemento existe antes de atualizar
       if (totalEl) totalEl.textContent = this.importResults.total;
       // ... (mesmo para outros elementos)
   }
   ```

### Backend (`courses.ts`)

1. **Logs detalhados adicionados**:
   ```typescript
   console.log('📥 Received course import request');
   console.log('📦 Body keys:', Object.keys(courseData));
   console.log('📊 Techniques count:', courseData.techniques?.length);
   console.log('📅 Schedule:', courseData.schedule ? 'present' : 'missing');
   console.log('✅ Validation passed, calling service...');
   console.log('📤 Service result:', result.success ? 'SUCCESS' : 'ERROR');
   ```

2. **Melhor tratamento de erros**:
   ```typescript
   console.error('❌ Erro no endpoint de importação:', error);
   console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
   ```

## Como Testar

### 1. Reiniciar o Servidor

```powershell
# No terminal, parar o servidor (Ctrl+C) e reiniciar
npm run dev
```

### 2. Abrir Developer Tools

1. Abrir navegador (F12)
2. Ir para aba **Console**
3. Limpar console (Clear Console)

### 3. Importar o Curso

1. Ir para **Import** → **📚 Cursos Completos**
2. Upload `cursofaixabranca.json`
3. Clicar **Validar**
4. Verificar checkbox **"Criar técnicas automaticamente"** está **marcado**
5. Clicar **Importar**

### 4. Observar Logs

**Console do Navegador** deve mostrar:
```
📦 Payload completo: {...}
📊 Payload size: XXXX bytes
🔄 Enviando requisição (timeout: 60s)...
```

**Console do Servidor** (terminal) deve mostrar:
```
📥 Received course import request
📦 Body keys: [ 'courseId', 'name', 'techniques', 'schedule', ... ]
📊 Techniques count: 20
📅 Schedule: present
🚀 Import endpoint called with createMissingTechniques: true
✅ Validation passed, calling service...
🔍 Starting course import for: Curso Faixa Branca
✨ Create missing techniques: true
❌ Missing techniques found: [...]
✨ Creating missing techniques automatically...
✅ Técnica criada: postura-guarda-de-boxe
[... mais logs de criação ...]
✨ 20 técnicas criadas automaticamente
📤 Service result: SUCCESS
```

## Possíveis Problemas e Soluções

### Problema 1: Ainda dá timeout (60s)

**Causa**: Criação de 20 técnicas + associações + cronograma pode demorar muito

**Solução**: Aumentar ainda mais o timeout
```javascript
// Em importControllerEnhanced.js, linha ~918
timeout: 120000 // 2 minutos
```

### Problema 2: Erro 400 "Dados do curso inválidos"

**Causa**: Arquivo JSON não tem os campos obrigatórios

**Verificar**: Console do servidor mostrará:
```
❌ Validation failed: {
  hasCourseId: false,  // ← problema aqui
  hasName: true,
  hasTechniques: true
}
```

**Solução**: Verificar estrutura do JSON:
```json
{
  "courseId": "curso-faixa-branca",  // ← obrigatório
  "name": "Curso Faixa Branca",      // ← obrigatório
  "techniques": [...],                // ← obrigatório
  "schedule": {...}
}
```

### Problema 3: Erro 500 "Erro interno"

**Causa**: Erro no serviço de importação

**Verificar**: Console do servidor mostrará stack trace completo

**Solução**: Copiar o erro completo e investigar

### Problema 4: Erro "Cannot set properties of null"

**Causa**: Elementos HTML não existem quando `updateStats()` é chamado

**Status**: ✅ **JÁ CORRIGIDO** - agora verifica se elementos existem antes de atualizar

### Problema 5: Técnicas não são criadas

**Causa 1**: Checkbox desmarcado
- **Solução**: Marcar checkbox "Criar técnicas automaticamente"

**Causa 2**: Flag não está sendo enviada
- **Verificar**: Console do navegador deve mostrar `createMissingTechniques: true` no payload

**Causa 3**: Backend não está recebendo a flag
- **Verificar**: Console do servidor deve mostrar `createMissingTechniques: true`

## Debugging Avançado

### Ver Payload Completo

```javascript
// No console do navegador, após clicar Importar:
// Será mostrado automaticamente o payload completo
```

### Ver Tamanho do Payload

```javascript
// Console mostrará: 📊 Payload size: XXXX bytes
// Se > 1MB, pode ser problema de limite do servidor
```

### Ver Tempo de Resposta

```javascript
// No DevTools → Network tab
// Clicar na requisição /api/courses/import-full-course
// Ver "Time" column
```

### Ver Erro Completo do Backend

```javascript
// No console do servidor (terminal)
// Stack trace completo será mostrado
```

## Próximos Passos

Após corrigir os erros e importar com sucesso:

1. ✅ **Verificar técnicas criadas**:
   - Ir para módulo **Techniques**
   - Buscar por "postura-guarda-de-boxe"
   - Verificar categoria (STANCE), dificuldade (1), etc.

2. ✅ **Verificar curso criado**:
   - Ir para módulo **Courses**
   - Buscar por "Curso Faixa Branca"
   - Verificar técnicas associadas (20)

3. ✅ **Verificar cronograma**:
   - Abrir detalhes do curso
   - Ver aulas criadas (35 aulas em 18 semanas)

4. ✅ **Testar re-importação**:
   - Importar o mesmo arquivo novamente
   - Verificar que técnicas não são duplicadas
   - Curso deve ser atualizado (não duplicado)

---

## Status Atual

- ✅ Frontend corrigido (timeout + logs + cleanup)
- ✅ Backend com logs detalhados
- 🔄 **Aguardando teste com servidor reiniciado**

**Próxima ação**: Reiniciar servidor (`npm run dev`) e tentar importar novamente observando os logs.
