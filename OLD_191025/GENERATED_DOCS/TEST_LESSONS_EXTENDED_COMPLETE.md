# ✅ Aulas de Teste Criadas - Horários Truncados

**Data de criação**: 11/01/2025  
**Total de aulas**: 20  
**Turma ID**: `44c93476-bffd-4701-9570-80074a5a913a`  
**Student ID para testes**: `922ebf87-9ce1-4ea9-be9e-85cdc95d9296`

## 📋 Resumo das Aulas Criadas

| # | Horário | Duração | Horário Fim | Lesson ID |
|---|---------|---------|-------------|-----------|
| 69 | 06:15 | 45min | 07:00 | 77ae739c-6030-409c-b66d-846fb9347f9a |
| 70 | 07:30 | 60min | 08:30 | aee30a56-5fbe-4688-ba36-c72749f9de73 |
| 71 | 08:45 | 45min | 09:30 | de5ef5fe-b0f1-4737-963f-b79053243aeb |
| 72 | 09:20 | 50min | 10:10 | 6cd8bea7-7e96-4dea-a440-4edd0fc5991e |
| 73 | 10:10 | 60min | 11:10 | d12f6e5f-cffb-471f-86ea-76b54c606416 |
| 74 | 11:40 | 70min | 12:50 | e5bc41a6-fd66-4990-b0f5-c3f9312eb363 |
| 75 | 12:25 | 45min | 13:10 | 9f7a8cdb-0607-4738-ad62-8da650dadc97 |
| 76 | 13:15 | 60min | 14:15 | c0d9f890-229f-41d1-b135-dbe596ac41bd |
| 77 | 14:35 | 55min | 15:30 | a7133c1c-b967-4e34-81fa-8f8f57213fa6 |
| 78 | 15:50 | 45min | 16:35 | 544b9f3e-161e-46e7-81a6-c5a797a83fa7 |
| 79 | 16:20 | 60min | 17:20 | 7b3d5044-5b9f-4ecb-ae56-81137cf5d845 |
| 80 | 17:05 | 50min | 17:55 | 873f9953-4f71-4810-a13d-be19059985f8 |
| 81 | 18:45 | 75min | 20:00 | 90c9451d-a2c9-4691-b881-e57a99a18037 |
| 82 | 19:15 | 60min | 20:15 | 465dfad1-8d8e-4787-a806-c74c328f96ee |
| 83 | 20:30 | 45min | 21:15 | 9e76e61e-5259-4a78-84af-737acf05381f |
| 84 | 21:40 | 55min | 22:35 | 33cd26fa-13a4-4205-8ee8-791300c8f913 |
| 85 | 22:10 | 50min | 23:00 | 38272f65-fd44-4d36-bde0-6e009ad06f80 |
| 86 | 23:25 | 60min | 00:25 | 32b6537a-108a-4b20-9cc6-53e1273753e8 |
| 87 | 00:15 | 45min | 01:00 | 33352080-779f-4cce-a177-57e84339581a |
| 88 | 01:00 | 60min | 02:00 | e8031e0c-711f-42b8-a84e-a57b295d93dc |

## ⚠️ Cenários de Sobreposição Detectados

### 🔴 SOBREPOSIÇÃO CRÍTICA #1
**Aula 71 (08:45-09:30) SOBREPÕE Aula 72 (09:20-10:10)**
- Aula 71 termina às 09:30
- Aula 72 começa às 09:20
- **Overlap**: 10 minutos (09:20 - 09:30)
- **Teste esperado**: Check-in na aula 72 deve ser BLOQUEADO

### 🔴 SOBREPOSIÇÃO CRÍTICA #2
**Aula 72 (09:20-10:10) SOBREPÕE Aula 73 (10:10-11:10)**
- Aula 72 termina às 10:10
- Aula 73 começa às 10:10
- **Overlap**: Exatamente no mesmo horário (edge case)
- **Teste esperado**: Check-in na aula 73 deve ser BLOQUEADO (horário exato conta como overlap)

### 🔴 SOBREPOSIÇÃO CRÍTICA #3
**Aula 74 (11:40-12:50) SOBREPÕE Aula 75 (12:25-13:10)**
- Aula 74 termina às 12:50
- Aula 75 começa às 12:25
- **Overlap**: 25 minutos (12:25 - 12:50)
- **Teste esperado**: Check-in na aula 75 deve ser BLOQUEADO

### 🔴 SOBREPOSIÇÃO CRÍTICA #4
**Aula 75 (12:25-13:10) SOBREPÕE Aula 76 (13:15-14:15)**
- Aula 75 termina às 13:10
- Aula 76 começa às 13:15
- **SEM OVERLAP** (5 minutos de intervalo)
- **Teste esperado**: Check-in na aula 76 deve ser PERMITIDO ✅

### 🔴 SOBREPOSIÇÃO CRÍTICA #5
**Aula 78 (15:50-16:35) SOBREPÕE Aula 79 (16:20-17:20)**
- Aula 78 termina às 16:35
- Aula 79 começa às 16:20
- **Overlap**: 15 minutos (16:20 - 16:35)
- **Teste esperado**: Check-in na aula 79 deve ser BLOQUEADO

### 🔴 SOBREPOSIÇÃO CRÍTICA #6
**Aula 79 (16:20-17:20) SOBREPÕE Aula 80 (17:05-17:55)**
- Aula 79 termina às 17:20
- Aula 80 começa às 17:05
- **Overlap**: 15 minutos (17:05 - 17:20)
- **Teste esperado**: Check-in na aula 80 deve ser BLOQUEADO

### 🔴 SOBREPOSIÇÃO CRÍTICA #7 (MAIS LONGA)
**Aula 81 (18:45-20:00) SOBREPÕE Aula 82 (19:15-20:15)**
- Aula 81 termina às 20:00
- Aula 82 começa às 19:15
- **Overlap**: 45 minutos (19:15 - 20:00)
- **Teste esperado**: Check-in na aula 82 deve ser BLOQUEADO
- **Nota**: Este é o overlap mais longo detectado

### 🔴 SOBREPOSIÇÃO CRÍTICA #8
**Aula 86 (23:25-00:25) SOBREPÕE Aula 87 (00:15-01:00)**
- Aula 86 termina às 00:25 (dia seguinte)
- Aula 87 começa às 00:15 (dia seguinte)
- **Overlap**: 10 minutos (00:15 - 00:25)
- **Teste esperado**: Check-in na aula 87 deve ser BLOQUEADO
- **Nota**: Teste de overlap atravessando meia-noite

### 🔴 SOBREPOSIÇÃO CRÍTICA #9
**Aula 87 (00:15-01:00) SOBREPÕE Aula 88 (01:00-02:00)**
- Aula 87 termina às 01:00
- Aula 88 começa às 01:00
- **Overlap**: Exatamente no mesmo horário (edge case)
- **Teste esperado**: Check-in na aula 88 deve ser BLOQUEADO

## 🧪 Plano de Testes

### Teste 1: Overlap Longo (45 minutos)
1. Acesse: http://localhost:3000/views/checkin-kiosk.html
2. Passe cartão do aluno ID `922ebf87-9ce1-4ea9-be9e-85cdc95d9296`
3. Faça check-in na **Aula 81** (18:45 - 75min)
4. Tente check-in na **Aula 82** (19:15 - 60min)
5. **Resultado esperado**: ❌ Mensagem "Você já tem check-in em outra aula neste horário (Aula 81: 18:45 - 20:00)"

### Teste 2: Overlap Médio (25 minutos)
1. Faça check-in na **Aula 74** (11:40 - 70min)
2. Tente check-in na **Aula 75** (12:25 - 45min)
3. **Resultado esperado**: ❌ Bloqueado (overlap de 25 minutos)

### Teste 3: Overlap Curto (10 minutos)
1. Faça check-in na **Aula 71** (08:45 - 45min)
2. Tente check-in na **Aula 72** (09:20 - 50min)
3. **Resultado esperado**: ❌ Bloqueado (overlap de 10 minutos)

### Teste 4: Edge Case - Mesmo Horário Exato
1. Faça check-in na **Aula 72** (09:20 - 50min, termina 10:10)
2. Tente check-in na **Aula 73** (10:10 - 60min, começa 10:10)
3. **Resultado esperado**: ❌ Bloqueado (horário final = horário inicial)

### Teste 5: SEM Overlap (Permitido)
1. Faça check-in na **Aula 75** (12:25 - 45min, termina 13:10)
2. Tente check-in na **Aula 76** (13:15 - 60min)
3. **Resultado esperado**: ✅ PERMITIDO (5 minutos de intervalo)

### Teste 6: Overlap Atravessando Meia-noite
1. Faça check-in na **Aula 86** (23:25 - 60min, termina 00:25)
2. Tente check-in na **Aula 87** (00:15 - 45min)
3. **Resultado esperado**: ❌ Bloqueado (overlap de 10 minutos)

## 📊 Estatísticas dos Testes

- **Total de aulas**: 20
- **Aulas com overlap**: 9 pares detectados
- **Overlap mais longo**: 45 minutos (Aula 81 → 82)
- **Overlap mais curto**: 10 minutos (Aula 71 → 72, Aula 86 → 87)
- **Edge cases**: 2 (horário exato: Aula 72 → 73, Aula 87 → 88)
- **Casos permitidos**: 1 (Aula 75 → 76, 5min intervalo)

## 🔍 Validação Backend

Para verificar os horários no banco de dados:

```sql
SELECT 
  "lessonNumber",
  "scheduledDate",
  "duration",
  "scheduledDate" + INTERVAL '1 minute' * "duration" AS "endTime"
FROM "TurmaLesson"
WHERE "turmaId" = '44c93476-bffd-4701-9570-80074a5a913a'
  AND "lessonNumber" >= 69
  AND "lessonNumber" <= 88
ORDER BY "scheduledDate";
```

## 📝 Notas Técnicas

- **Schema usado**: `TurmaLesson` (novo modelo normalizado)
- **Campos válidos**: turmaId, lessonNumber, scheduledDate, duration, title, objectives
- **Campos removidos**: courseId, instructorId, topic, lessonType (existem apenas no modelo legado Class)
- **Cálculo de overlap**: `endTime1 > startTime2` (implementado em `src/services/attendanceService.ts`)
- **Timezone**: Todos os horários em UTC-3 (Brasil)

## ✅ Status

- [x] Script corrigido após múltiplas tentativas (courseId/instructorId removidos)
- [x] 20 aulas criadas com sucesso
- [x] Horários truncados de 06:15 até 01:00 (19 horas de coverage)
- [x] 9 cenários de overlap identificados
- [x] Documentação completa gerada
- [ ] Testes manuais via Kiosk (pendente)
- [ ] Validação das mensagens de erro (pendente)

## 📚 Próximos Passos

1. Executar os 6 testes planejados no Kiosk
2. Validar mensagens de erro exibidas
3. Documentar resultados reais vs esperados
4. Criar script de limpeza (delete lessons 69-88) se necessário
5. Adicionar testes automatizados E2E baseados nestes cenários
