# Relatório de Auditoria: Módulo de Frequência (Frequency)

**Data**: 19/11/2025
**Status**: ⚠️ Crítico (Inconsistência de Dados)

## 1. Visão Geral
O módulo de Frequência está em um estado híbrido entre o modelo de dados legado (`Class`/`Attendance`) e o novo modelo v2.0 (`TurmaLesson`/`TurmaAttendance`). Isso está causando inconsistências graves, onde check-ins realizados não aparecem no histórico.

## 2. Diagnóstico Técnico

### 2.1. Dashboard (✅ Funcional)
- **Frontend**: `DashboardView.js`
- **Backend**: `FrequencyStatsService.getDashboardStats`
- **Dados**: Consulta corretamente a tabela nova `TurmaAttendance`.
- **Status**: Funciona e reflete os dados reais.

### 2.2. Check-in (✅ Funcional)
- **Frontend**: `CheckinView.js`
- **Backend**: `AttendanceService.checkInToClass`
- **Dados**: Escreve corretamente na tabela nova `TurmaAttendance` quando a aula é do tipo `TurmaLesson`.
- **Status**: O check-in é gravado com sucesso no banco de dados correto.

### 2.3. Histórico (❌ QUEBRADO)
- **Frontend**: `HistoryView.js`
- **Backend**: `AttendanceService.getAttendanceHistory`
- **Problema**: O serviço consulta **apenas** a tabela legada `Attendance`.
- **Consequência**: Check-ins realizados nas novas turmas (`TurmaAttendance`) **não aparecem** na listagem de histórico. O usuário vê uma lista vazia ou incompleta.

### 2.4. Edição de Participantes (❌ AUSENTE)
- **Requisito**: "Lista das aulas com detalhe de edição de quem participou".
- **Estado Atual**: A `HistoryView` apenas lista quem estava presente (baseado no histórico quebrado). Não há funcionalidade para:
  - Ver lista completa de alunos matriculados na turma.
  - Marcar alunos como "Ausente" ou "Justificado".
  - Adicionar check-in manual retroativo para um aluno específico na lista.
- **Backend**: Falta um endpoint `GET /api/attendance/class/:id/roll` que retorne a lista de chamada completa (Matriculados + Status Presença).

## 3. Plano de Correção (Roadmap)

### Fase 1: Correção do Histórico (Imediato)
1.  **Refatorar `AttendanceService.getAttendanceHistory`**:
    - Alterar para consultar `TurmaAttendance` e `TurmaLesson`.
    - Manter compatibilidade com `Attendance` legado se necessário (union) ou migrar totalmente.
    - Garantir que os filtros (data, aluno, turma) funcionem com o novo modelo.

### Fase 2: Gestão de Chamada (Edição)
1.  **Novo Endpoint**: `GET /api/attendance/lesson/:id/roll`
    - Retorna: Dados da aula + Lista de alunos matriculados (`TurmaStudent`) + Status de presença (`TurmaAttendance`).
2.  **Novo Endpoint**: `PUT /api/attendance/lesson/:id/roll`
    - Recebe: Lista de alterações (ex: `[{ studentId: "...", status: "PRESENT" }]`).
    - Atualiza/Cria registros em `TurmaAttendance`.
3.  **Frontend**: Atualizar `HistoryView` para permitir clicar em uma aula e abrir um "Editor de Chamada" (modal ou nova view) com a lista de todos os alunos.

### Fase 3: Relatórios
1.  Implementar exportação de dados baseada em `TurmaAttendance`.

## 4. Conclusão
O módulo precisa de intervenção urgente no serviço de histórico (`AttendanceService`) para alinhar com o novo modelo de dados. A funcionalidade de edição de chamada precisa ser construída do zero, pois não existe no backend atual.
