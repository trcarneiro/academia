# 🔧 CONFIGURAÇÃO DE APIS DE PRODUÇÃO
# ====================================
# Arquivo de configuração para eliminar necessidade de fallback
# Data: 06/07/2025

# 🎯 OBJETIVO: Configurar APIs backend para funcionamento 100% sem fallback

# ==========================================
# 1. VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS
# ==========================================

# Database
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# Server
PORT=3000
NODE_ENV=production

# Asaas (Opcional - sistema funciona sem)
ASAAS_API_KEY=""
ASAAS_SANDBOX=true

# ==========================================
# 2. CHECKLIST APIS FUNCIONAIS
# ==========================================

## ✅ API Principal: POST /api/financial/subscriptions
- [✅] Rota implementada em src/routes/financial.ts:212
- [✅] Schema de validação configurado
- [✅] FinancialService.createSubscription() funcionando
- [✅] Suporte a criação sem Asaas configurado
- [✅] Erro handling apropriado

## ✅ API Alternativa: POST /api/students/:id/subscription  
- [✅] Rota implementada em src/routes/students.ts:392
- [✅] Schema de validação configurado
- [✅] Usa o mesmo FinancialService.createSubscription()
- [✅] Import FinancialService corrigido
- [✅] TypeScript errors corrigidos

# ==========================================
# 3. TESTE DE FUNCIONALIDADE
# ==========================================

# Usar test-api-endpoints.js para validar:
node test-api-endpoints.js

# Testes esperados:
# - ✅ GET /health → 200 OK
# - ✅ GET /api/financial/plans → 200 OK (mesmo vazio)
# - ✅ GET /api/students → 200 OK 
# - ⚠️ POST /api/financial/subscriptions → 500 ou 400 (IDs inválidos, mas rota funciona)
# - ⚠️ POST /api/students/:id/subscription → 500 ou 400 (IDs inválidos, mas rota funciona)

# ==========================================
# 4. CONFIGURAÇÃO DO BANCO DE DADOS
# ==========================================

# Executar migrations se necessário:
# npx prisma migrate deploy
# npx prisma generate

# ==========================================
# 5. MELHORIAS IMPLEMENTADAS
# ==========================================

## 🔧 FinancialService Robusto:
- ✅ Funciona sem Asaas configurado
- ✅ Criação de subscription sempre funciona
- ✅ Payment creation é opcional
- ✅ Error handling não bloqueia operação principal
- ✅ Logs informativos para debug

## 🛡️ Validação de Dados:
- ✅ Schemas Zod para type safety
- ✅ Schemas Fastify para API validation
- ✅ Error responses padronizados
- ✅ Status codes corretos

## 📊 Response Format Consistente:
```json
{
  "success": true|false,
  "data": {...},
  "message": "Human readable message",
  "error": "Error type" // apenas em caso de erro
}
```

# ==========================================
# 6. COMANDOS PARA PRODUÇÃO
# ==========================================

# Build e start:
npm run build
node dist/server-simple.js

# Verificar health:
curl http://localhost:3000/health

# Teste rápido das APIs:
curl -X POST http://localhost:3000/api/financial/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"studentId":"test","planId":"test"}'

curl -X POST http://localhost:3000/api/students/test/subscription \
  -H "Content-Type: application/json" \
  -d '{"planId":"test"}'

# ==========================================
# 7. MONITORAMENTO E LOGS
# ==========================================

# Logs importantes para monitorar:
# - ✅ "Asaas customer creation failed, continuing without"
# - ✅ "Payment creation failed, subscription created without payment"
# - ❌ "Student not found" 
# - ❌ "Plan not found"
# - ❌ Database connection errors

# ==========================================
# 8. CONTINGÊNCIA E ROLLBACK
# ==========================================

# Se algo quebrar:
git checkout HEAD~1  # Voltar commit anterior
npm run build
node dist/server-simple.js

# Ou usar version manager:
node version-manager.js rollback [ID_VERSAO_ESTAVEL]

# ==========================================
# 9. STATUS FINAL
# ==========================================

# ✅ IMPLEMENTADO:
- Rota principal: POST /api/financial/subscriptions
- Rota alternativa: POST /api/students/:id/subscription  
- FinancialService robusto sem dependência do Asaas
- Error handling apropriado
- TypeScript compilation ✅
- Schemas de validação funcionais

# 🎯 RESULTADO ESPERADO:
# Frontend não precisará mais usar fallback localStorage!
# Ambas as APIs funcionarão mesmo sem Asaas configurado.
