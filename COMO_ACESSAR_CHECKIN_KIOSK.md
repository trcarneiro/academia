# 🚀 Como Acessar o Check-in Kiosk - Guia Prático

**Status Atual**: ⏳ **Fase de Integração de Menu** (Task 9)

---

## 🔴 ⚠️ IMPORTANTE: Está Faltando Uma Coisa!

O Check-in Kiosk **ainda não está no menu** da aplicação. Precisa adicionar 1 arquivo HTML e 2 linhas no menu para ficar acessível.

**Tempo para liberar**: ~30 minutos

---

## 📋 Opções de Acesso

### ✅ Opção 1: Acesso Direto via URL (FUNCIONA AGORA)

Se o servidor está rodando em **http://localhost:3000**, você pode acessar diretamente:

```
http://localhost:3000/checkin-kiosk
```

**Para testar**:
1. Abra um novo terminal
2. Execute: `npm run dev` (se servidor não está rodando)
3. Aguarde a mensagem: `✓ Server running on http://localhost:3000`
4. Abra no navegador: **http://localhost:3000/checkin-kiosk**

---

### ⏳ Opção 2: Via Menu da Aplicação (NÃO DISPONÍVEL AINDA)

**Como ficará após Task 9**:
1. Abra http://localhost:3000
2. Clique no menu lateral esquerdo
3. Procure por **"📸 Check-in Kiosk"** (após "Frequência")
4. Clique e pronto!

**Status**: ⏳ Será habilitado quando integrarmos o menu

---

## 🛠️ Checklist para Liberar Acesso via Menu (Task 9)

Se você quer **habilitar o menu agora**, siga estes passos:

### Passo 1: Adicionar Link no Menu

**Arquivo**: `public/index.html`

Localize a seção `<!-- Sidebar Navigation -->` e procure por este trecho:

```html
<li>
  <a href="#frequency" onclick="window.app.navigate('frequency'); return false;">
    📋 Frequência
  </a>
</li>
```

Adicione **logo após**:

```html
<li>
  <a href="#checkin-kiosk" onclick="window.app.navigate('checkin-kiosk'); return false;">
    📸 Check-in Kiosk
  </a>
</li>
```

**Salve o arquivo** ✅

---

### Passo 2: Criar Página HTML do Kiosk

**Arquivo**: `public/views/checkin-kiosk.html` (criar novo)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check-in Kiosk - Academia Krav Maga</title>
    <link rel="stylesheet" href="/css/modules/checkin-kiosk.css">
</head>
<body>
    <div id="checkin-kiosk-root" class="kiosk-container"></div>

    <!-- face-api.js Library -->
    <script async src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>

    <!-- Check-in Kiosk Module -->
    <script src="/js/modules/checkin-kiosk/services/FaceRecognitionService.js"></script>
    <script src="/js/modules/checkin-kiosk/services/CameraService.js"></script>
    <script src="/js/modules/checkin-kiosk/services/BiometricService.js"></script>
    <script src="/js/modules/checkin-kiosk/services/AttendanceService.js"></script>
    <script src="/js/modules/checkin-kiosk/views/CameraView.js"></script>
    <script src="/js/modules/checkin-kiosk/views/ConfirmationView.js"></script>
    <script src="/js/modules/checkin-kiosk/views/SuccessView.js"></script>
    <script src="/js/modules/checkin-kiosk/controllers/CheckinController.js"></script>
    <script src="/js/modules/checkin-kiosk/index.js"></script>

    <script>
        // Aguarde o app estar pronto
        if (window.app) {
            window.CheckinKiosk.init('checkin-kiosk-root');
        } else {
            document.addEventListener('app:ready', () => {
                window.CheckinKiosk.init('checkin-kiosk-root');
            });
        }
    </script>
</body>
</html>
```

**Salve o arquivo** ✅

---

### Passo 3: Registrar Módulo no AcademyApp

**Arquivo**: `public/js/core/app.js`

Procure pela função `loadModules()` e localize este código:

```javascript
loadModules() {
    const moduleList = [
        'students',
        'instructors',
        'activities',
        'frequency',
        // ... outros módulos
    ];
```

Adicione `'checkin-kiosk'` à lista:

```javascript
loadModules() {
    const moduleList = [
        'students',
        'instructors',
        'activities',
        'frequency',
        'checkin-kiosk',  // 👈 Adicione esta linha
        // ... outros módulos
    ];
```

**Salve o arquivo** ✅

---

### Passo 4: Recarregue o Navegador

1. Abra http://localhost:3000
2. Pressione **F5** ou **Ctrl+Shift+R** (hard refresh)
3. Procure pelo item **"📸 Check-in Kiosk"** no menu lateral
4. Clique e pronto! ✅

---

## ✅ Como Verificar se Está Funcionando

### 1️⃣ Verifique o Servidor

```bash
# Terminal
npm run dev

# Aguarde a mensagem:
# ✓ Biometric routes registered successfully (7 endpoints)
# ✓ Server running on http://localhost:3000
```

### 2️⃣ Teste um Endpoint

```bash
# Em outro terminal, teste se o backend está respondendo:
curl -X GET http://localhost:3000/api/biometric/check-rate-limit/test-student-id \
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb"

# Resposta esperada (sucesso):
# {"success":true,"data":{"allowed":true,"message":"Rate limit check passed"}}
```

### 3️⃣ Verifique Console do Navegador

Após acessar http://localhost:3000/checkin-kiosk:

1. Pressione **F12** (Dev Tools)
2. Vá para aba **"Console"**
3. Procure por mensagens como:
   ```
   ✓ CheckinKiosk Module Initialized
   ✓ FaceRecognitionService initialized
   ✓ CameraService initialized
   ✓ Camera permission granted
   ✓ Face detection started
   ```

Se vir ✅ **verde**, está funcionando!

Se vir ❌ **erro vermelho**, anote e me avise.

---

## 🎬 Fluxo de Uso (Após Integração)

### Para o Usuário:
1. ✅ Abrir http://localhost:3000
2. ✅ Clicar em "📸 Check-in Kiosk" no menu
3. ✅ Permitir acesso à câmera
4. ✅ Posicionar rosto na câmera
5. ✅ Sistema detecta rosto e encontra aluno
6. ✅ Selecionar curso (aula)
7. ✅ Confirmar presença
8. ✅ Ver tela de sucesso

### Para o Técnico (Debug):
1. Abrir DevTools (F12)
2. Clicar em tab "Network"
3. Fazer check-in
4. Ver requisições:
   - `POST /api/biometric/match` → encontra aluno
   - `POST /api/biometric/attempts` → registra tentativa
   - Pode ver status (200 = sucesso, 400/500 = erro)

---

## 🔴 Se Não Funcionar...

### ❌ Erro: "Module not found"
**Solução**: Verifique se os arquivos existem em:
```
/public/js/modules/checkin-kiosk/
├── index.js ✓
├── controllers/CheckinController.js ✓
├── services/*.js ✓
└── views/*.js ✓
```

**Comando para verificar**:
```bash
ls -la H:\projetos\academia\public\js\modules\checkin-kiosk\
```

---

### ❌ Erro: "Camera access denied"
**Causas Possíveis**:
1. Navegador não tem permissão (Check permissões do browser)
2. HTTPS não está configurado (localhost HTTP é OK em dev)
3. Câmera está em uso por outro app

**Solução**:
- Chrome: Settings → Privacy → Permissions → Camera → Allow localhost:3000
- Firefox: about:preferences → Privacy → Permissions → Camera

---

### ❌ Erro: "Face detection not working"
**Possível causa**: face-api.js não carregou

**Debug**:
```javascript
// Cole isso no console do navegador (F12):
console.log(faceapi); // Deve mostrar um objeto, não undefined
```

---

### ❌ Erro: "API 400 Bad Request"
**Possível causa**: Organization ID inválida nos headers

**Solução**: Verifique em `/public/js/shared/api-client.js` que a organization ID está correta:
```javascript
const ORGANIZATION_ID = '452c0b35-1822-4890-851e-922356c812fb';
```

---

## 📞 Informações Técnicas

### Versão do Check-in Kiosk
- **Versão**: 2.0 (Foundation)
- **Status**: ⏳ 95% Completo (faltam Tasks 9 e 10)
- **Última Atualização**: 17 de outubro de 2025

### Arquivos Críticos
```
Frontend:
├── /public/js/modules/checkin-kiosk/
├── /public/css/modules/checkin-kiosk.css
└── /public/views/checkin-kiosk.html

Backend:
├── /src/services/biometricService.ts
├── /src/controllers/biometricController.ts
└── /src/routes/biometric.ts

Database:
└── Prisma: BiometricData, BiometricAttempt models
```

### API Endpoints (Backend)
```
POST   /api/biometric/students/:studentId/face-embedding
GET    /api/biometric/students/:studentId
POST   /api/biometric/match
POST   /api/biometric/attempts
GET    /api/biometric/attempts/:studentId
DELETE /api/biometric/students/:studentId (GDPR)
GET    /api/biometric/check-rate-limit/:studentId
```

---

## 🚀 Próximos Passos (Task 9 - 30 minutos)

Se você quer **realmente liberar agora**:

1. ✅ Execute os passos 1-3 acima (adicionar menu + criar HTML)
2. ✅ Recarregue o navegador
3. ✅ Teste acessando via menu
4. ✅ Teste acesso direto: http://localhost:3000/checkin-kiosk

**Tempo estimado**: 30 minutos

Depois disso, só faltarão **testes** (Task 10, ~1-2 horas) para estar 100% em produção!

---

## 📚 Documentação Relacionada

- **Fase 1 Completa**: `CHECKIN_KIOSK_FASE1_COMPLETA.md`
- **Task 8 (Backend)**: `CHECKIN_KIOSK_TASK8_BACKEND_COMPLETE.md`
- **Task 9 (Menu)**: `CHECKIN_KIOSK_TASK9_MENU_INTEGRATION.md`
- **Task 10 (Testes)**: `CHECKIN_KIOSK_TASK10_TESTING_COMPLETE.md`
- **Arquitetura**: `CHECKIN_KIOSK_ARCHITECTURE.md`
- **Quick Summary**: `CHECKIN_KIOSK_QUICK_SUMMARY.md`

---

## ✨ Resumo Rápido

| O que | Como | Status |
|------|------|--------|
| **Acessar agora** | URL direta: `http://localhost:3000/checkin-kiosk` | ✅ FUNCIONA |
| **Acessar via menu** | Execute Steps 1-4 acima | ⏳ 30 min |
| **Habilitar produção** | Execute Task 10 (testes) | ⏳ 1-2 horas |

---

**Precisa de ajuda? Chame-me! Estou aqui para guiar.** 🚀

*Atualizado: 17 de outubro de 2025*
