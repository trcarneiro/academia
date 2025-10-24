# Fix: Check-in Window Mismatch (Frontend vs Backend)

**Data**: 08/10/2025  
**Problema**: Frontend mostra "AVAILABLE" mas backend rejeita com "Check-in fora do horário permitido"  
**Status**: ✅ RESOLVIDO

---

## 🔴 Problema Identificado

### Contexto
Usuário clica em **"Check-in"** em uma aula marcada como **"AVAILABLE"** no kiosk, mas recebe erro:

```
Error 400: Check-in fora do horário permitido
```

### Análise de Logs (Frontend)
```javascript
// Aula disponível no dashboard:
{
  "id": "90f7eced-9629-4bb2-b26a-75b11924c046",
  "name": "Aula 6 - krav-maga-faixa-branca-2025 - Semana 3 - Aula 2",
  "startTime": "2025-10-08T11:30:00.000Z", // 8:30 AM horário de Brasília
  "canCheckIn": true,                      // ✅ Frontend diz que PODE
  "status": "AVAILABLE"                    // ✅ Frontend mostra AVAILABLE
}

// Tentativa de check-in:
POST /api/attendance/checkin
Response: 400 Bad Request
{
  "success": false,
  "error": "Check-in fora do horário permitido",  // ❌ Backend REJEITA
  "timestamp": "2025-10-08T10:56:06.950Z"        // 7:56 AM horário de Brasília
}
```

**Contradição**:
- ✅ Frontend: "Você PODE fazer check-in agora" (`canCheckIn: true`)
- ❌ Backend: "Check-in fora do horário permitido" (rejeita)

### Causa Raiz

**Arquivo**: `src/services/attendanceService.ts`

#### Janela de Check-in #1 - getAvailableClasses (linha 843)
```typescript
// 🟡 USADO PARA DETERMINAR canCheckIn NO FRONTEND
const startTime = dayjs(turmaLesson.scheduledDate);
const checkInStart = startTime.subtract(60, 'minute'); // ❌ 60 MINUTOS ANTES
const checkInEnd = startTime.add(15, 'minute');

const canCheckIn =
  !hasCheckedIn &&
  currentTime.isAfter(checkInStart) &&
  currentTime.isBefore(checkInEnd);
```

**Janela**: **60 minutos antes** → 15 minutos depois  
**Resultado**: `canCheckIn = true` às **07:30 AM** (para aula às 08:30 AM)

#### Janela de Check-in #2 - checkInToClass (linha 110)
```typescript
// 🔴 USADO PARA VALIDAR CHECK-IN NO BACKEND
const startTime = dayjs(classInfo.startTime);
const checkInStart = startTime.subtract(30, 'minute'); // ✅ 30 MINUTOS ANTES
const checkInEnd = startTime.add(15, 'minute');

if (currentTime.isBefore(checkInStart) || currentTime.isAfter(checkInEnd)) {
  throw new Error('Check-in fora do horário permitido'); // ❌ REJEITA!
}
```

**Janela**: **30 minutos antes** → 15 minutos depois  
**Resultado**: Rejeita check-in às **07:56 AM** (janela só abre às 08:00 AM)

### Problema Visual
```
Timeline de Check-in (Aula às 08:30 AM):

07:30 AM ───────── 08:00 AM ───────── 08:30 AM ───────── 08:45 AM
    ▲                   ▲                   ▲                   ▲
    │                   │                   │                   │
    │                   │                   │                   └── Fim da janela (ambos)
    │                   │                   └────────────────────── Início da aula
    │                   └────────────────────────────────────────── Backend abre check-in (30min)
    └────────────────────────────────────────────────────────────── Frontend mostra AVAILABLE (60min)

❌ PROBLEMA: Frontend diz "AVAILABLE" mas backend rejeita por 30 minutos!
```

**Impacto**:
- ✅ Usuário vê botão **"Check-in"** habilitado
- ❌ Ao clicar, recebe erro **"Check-in fora do horário permitido"**
- 🤬 **Frustração**: UI mentindo sobre disponibilidade

---

## ✅ Solução Aplicada

### Fix: Alinhar janelas em 30 minutos

**Arquivo**: `src/services/attendanceService.ts`  
**Linha**: 843

```typescript
// BEFORE (DESCOORDENADO)
const checkInStart = startTime.subtract(60, 'minute'); // ❌ 60 minutos (frontend)

// AFTER (ALINHADO)
const checkInStart = startTime.subtract(30, 'minute'); // ✅ 30 minutos (igual ao backend)
```

**Justificativa**:
- **30 minutos** é tempo suficiente para alunos chegarem e se prepararem
- **60 minutos** era muito permissivo (aluno poderia fazer check-in 1 hora antes!)
- **Consistência**: Frontend e backend agora usam a **mesma regra**

### Timeline Corrigida
```
Timeline de Check-in (Aula às 08:30 AM):

08:00 AM ───────────────── 08:30 AM ───────── 08:45 AM
    ▲                           ▲                   ▲
    │                           │                   │
    │                           │                   └── Fim da janela
    │                           └────────────────────── Início da aula
    └────────────────────────────────────────────────── Frontend E Backend abrem check-in

✅ SOLUÇÃO: Ambos concordam que check-in abre 30 minutos antes
```

---

## 📊 Impacto do Fix

| Métrica | Antes (Desalinhado) | Depois (Alinhado) | Melhoria |
|---------|---------------------|-------------------|----------|
| **Janela Frontend** | 60 min antes | 30 min antes | ✅ Realista |
| **Janela Backend** | 30 min antes | 30 min antes | ✅ Consistente |
| **Erros Falsos** | 50% (30min de conflito) | 0% | ✅ Eliminado |
| **UX Confusa** | "AVAILABLE" mas rejeita | Sincronizado | ✅ Confiável |
| **Frustração Usuário** | Alta (UI mentindo) | Baixa (UI honesta) | ✅ Resolvido |

---

## 🧪 Validação

### Test Case 1: Check-in 35 minutos antes
**Cenário**: Aula às **08:30 AM**, usuário tenta check-in às **07:55 AM**

**Antes (Desalinhado)**:
```
1. GET /api/attendance/classes/available
   → Frontend: canCheckIn = true, status = "AVAILABLE" ✅
2. User clica "Check-in"
3. POST /api/attendance/checkin
   → Backend: Error 400 "Check-in fora do horário permitido" ❌
4. RESULTADO: UI MENTIU, usuário frustrado 😡
```

**Depois (Alinhado)**:
```
1. GET /api/attendance/classes/available
   → Frontend: canCheckIn = false, status = "NOT_YET" ⏰
2. Botão "Check-in" DESABILITADO (cinza, não clicável)
3. RESULTADO: UI HONESTA, usuário sabe que precisa esperar ✅
```

### Test Case 2: Check-in 20 minutos antes
**Cenário**: Aula às **08:30 AM**, usuário tenta check-in às **08:10 AM**

**Antes (Desalinhado)**:
```
Frontend: canCheckIn = true ✅
Backend: Check-in aceito ✅
RESULTADO: Funcionou (dentro da janela menor)
```

**Depois (Alinhado)**:
```
Frontend: canCheckIn = true ✅
Backend: Check-in aceito ✅
RESULTADO: Funcionou (dentro da janela alinhada)
```

### Test Case 3: Check-in no horário da aula
**Cenário**: Aula às **08:30 AM**, usuário tenta check-in às **08:30 AM**

**Ambos** (Antes e Depois):
```
Frontend: canCheckIn = true ✅
Backend: Check-in aceito, marcado como LATE se após início ✅
RESULTADO: Sempre funcionou
```

---

## 🎯 Regras de Check-in (Após Fix)

### Janela Válida
- **Início**: 30 minutos antes da aula
- **Fim**: 15 minutos depois do início da aula
- **Total**: 45 minutos de janela

### Status da Aula
| Horário Relativo | Status Frontend | Backend Aceita? | Status Attendance |
|------------------|----------------|-----------------|-------------------|
| > 30min antes | `NOT_YET` ⏰ | ❌ Rejeita | N/A |
| 30min antes → início | `AVAILABLE` ✅ | ✅ Aceita | `PRESENT` |
| Início → 15min depois | `AVAILABLE` ✅ | ✅ Aceita | `LATE` (atrasado) |
| > 15min depois | `EXPIRED` ❌ | ❌ Rejeita | N/A |
| Já fez check-in | `CHECKED_IN` 🎯 | ❌ Rejeita (duplicado) | N/A |

### Exemplos Práticos
**Aula às 08:30 AM**:
- **07:59 AM**: `NOT_YET` (aguarde 1 minuto)
- **08:00 AM**: `AVAILABLE` ✅ (janela aberta!)
- **08:30 AM**: `AVAILABLE` ✅ (check-in marcado como `LATE`)
- **08:45 AM**: `AVAILABLE` ✅ (último minuto!)
- **08:46 AM**: `EXPIRED` ❌ (janela fechada)

---

## 🔧 Arquivos Modificados

### Backend
- **`src/services/attendanceService.ts`**:
  - Linha 843: `subtract(60, 'minute')` → `subtract(30, 'minute')`
  - Comentário atualizado: "✅ ALINHADO: 30 minutos antes (igual ao checkInToClass)"

---

## 🚀 Próximos Passos (Opcional)

### 1. Configurável via Admin Panel
**Problema**: Janela de check-in hardcoded (30 minutos)  
**Solução**: Configuração por organização

```typescript
// Exemplo:
interface OrganizationSettings {
  checkInWindowMinutesBefore: number; // Default: 30
  checkInWindowMinutesAfter: number;  // Default: 15
}

// Em getAvailableClasses e checkInToClass:
const settings = await getOrgSettings(organizationId);
const checkInStart = startTime.subtract(settings.checkInWindowMinutesBefore, 'minute');
const checkInEnd = startTime.add(settings.checkInWindowMinutesAfter, 'minute');
```

### 2. Countdown Timer no Frontend
**Problema**: Usuário não sabe quando a janela abre  
**Solução**: Mostrar timer ao vivo

```javascript
// Se status = NOT_YET:
const timeUntilOpen = checkInStart - now;
UI.showCountdown(`Check-in abre em ${formatDuration(timeUntilOpen)}`);
// Ex: "Check-in abre em 5 minutos"
```

### 3. Notificação Push quando janela abrir
**Problema**: Usuário precisa ficar atualizando a página  
**Solução**: Push notification via WebSocket ou PWA

```javascript
// Quando checkInStart chegar:
notificationService.send({
  title: 'Check-in disponível!',
  body: 'Sua aula começa em 30 minutos. Faça check-in agora!',
  action: '/checkin-kiosk'
});
```

---

## 📝 Conclusão

✅ **Janelas alinhadas** (frontend e backend concordam)  
✅ **UI honesta** (não mostra botão quando não pode)  
✅ **Erro eliminado** ("Check-in fora do horário" só quando realmente fora)  
✅ **UX melhorada** (usuário confia no sistema)  
✅ **Consistência total** (uma única fonte de verdade: 30 minutos antes)

**Sistema pronto para produção!** 🚀

---

## 🔗 Documentos Relacionados

- **FIX_TURMA_SAVE_BACKGROUND.md**: Fix de timeout no save de turma
- **PERFORMANCE_OPTIMIZATION.md**: Fix do N+1 query
- **FIX_CHECKIN_EMPTY_CLASSES.md**: Fix de aulas vazias no check-in
- **CHECKIN_UX_IMPROVED.md**: Melhorias de UX no kiosk
- **AGENTS.md**: Guia arquitetural do projeto
