# 🥋 Krav Maga Academy - Kiosk & Asaas Integration

## 📟 Sistema de Kiosk Público

### **Visão Geral**
Sistema separado para check-in público dos alunos na academia, rodando independentemente do sistema administrativo principal.

### **Características**
- ✅ **Endpoint público** - Sem autenticação necessária
- ✅ **Interface standalone** - HTML puro para kiosk/tablet
- ✅ **3 métodos de check-in** - Matrícula, visual, QR code
- ✅ **Tempo real** - Atualizações automáticas
- ✅ **Responsivo** - Funciona em tablet/desktop

---

## 🚀 **Instalação e Configuração**

### **1. Instalar Dependências**
```bash
npm install express cors @supabase/supabase-js dotenv
```

### **2. Configurar Variáveis de Ambiente**
Copie o arquivo de exemplo:
```bash
cp env.example .env
```

Edite o `.env` com suas credenciais:
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Asaas
ASAAS_API_KEY=your-asaas-api-key
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3

# Configurações
KIOSK_PORT=3001
```

### **3. Executar Sistemas**

#### **Sistema Principal (porta 3000)**
```bash
npm run dev:simple
```

#### **Kiosk Público (porta 3001)**
```bash
npm run kiosk
```

#### **Desenvolvimento com Auto-reload**
```bash
npm run kiosk:dev
```

---

## 📱 **Usando o Kiosk**

### **URLs de Acesso**
- **Sistema Admin:** `http://localhost:3000`
- **Kiosk Público:** `http://localhost:3001/kiosk`
- **API Kiosk:** `http://localhost:3001/api/kiosk/`

### **Interface do Kiosk**
1. **Check-in Rápido:**
   - Digite matrícula/email/nome
   - Pressione Enter ou clique em "Marcar Presença"

2. **Seleção Visual:**
   - Clique na foto/card do aluno
   - Check-in automático em 2 segundos

3. **Scanner QR:**
   - Clique "Scanner QR Code"
   - Aponte câmera para QR do aluno

### **API Endpoints Públicos**
```
GET  /api/kiosk/students         - Lista alunos
POST /api/kiosk/checkin          - Marca presença
GET  /api/kiosk/attendance/today - Presenças de hoje
GET  /api/kiosk/student/search   - Busca alunos
```

---

## 💰 **Importação de Clientes do Asaas**

### **Comando Básico**
```bash
npm run asaas:import
```

### **Opções Disponíveis**
```bash
# Importar apenas 10 clientes
npm run asaas:import:limit

# Dry run (simular sem importar)
npm run asaas:import:dry

# Comando personalizado
node asaas-import.js --limit=50 --dry-run
```

### **Opções da CLI**
- `--limit=N` - Importar máximo N clientes (padrão: 100)
- `--dry-run` - Simular importação sem salvar
- `--no-enroll` - Não matricular automaticamente no curso
- `--help` - Mostrar ajuda

### **Processo de Importação**
1. **Busca clientes** na API do Asaas
2. **Verifica duplicatas** por email
3. **Cria usuário** no sistema
4. **Cria registro de aluno**
5. **Matricula no curso** Krav Maga (Turma 1)
6. **Relatório final** com estatísticas

---

## 🔧 **Configuração do Asaas**

### **1. Obter API Key**
1. Login no [Asaas](https://www.asaas.com/)
2. Vá em **Configurações > API**
3. Gere sua **API Key**
4. Use ambiente **Sandbox** para testes

### **2. Configurar Webhook (Opcional)**
Para receber notificações de pagamento:
```
URL: https://your-domain.com/webhook/asaas
Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED
```

### **3. Estrutura de Dados**
O script importa os seguintes campos do Asaas:
- **Nome** → firstName + lastName
- **Email** → email do usuário
- **Telefone** → phone
- **CPF/CNPJ** → cpf
- **ID Asaas** → asaasCustomerId (para link)

---

## 📊 **Estrutura de Arquivos**

```
/academia/
├── kiosk-server.js          # Servidor público do kiosk
├── asaas-import.js          # Script de importação
├── public/
│   └── kiosk.html          # Interface do kiosk
├── server-simple.js         # Sistema principal
└── package.json            # Scripts atualizados
```

---

## 🛠️ **Desenvolvimento**

### **Adicionando Novos Métodos de Check-in**
1. **Backend:** Adicione endpoint em `kiosk-server.js`
2. **Frontend:** Adicione interface em `kiosk.html`
3. **Teste:** Use `npm run kiosk:dev` para desenvolvimento

### **Customizando Importação**
Edite `asaas-import.js` para:
- Adicionar campos personalizados
- Mudar lógica de categorização
- Configurar turmas específicas

### **Logs e Debugging**
```bash
# Ver logs do kiosk
DEBUG=kiosk* npm run kiosk

# Ver logs da importação
DEBUG=asaas* npm run asaas:import:dry
```

---

## 🔒 **Segurança**

### **Kiosk Público**
- ❌ **Sem autenticação** - Por design
- ✅ **Rate limiting** - Previne spam
- ✅ **Validação** - Dados sanitizados
- ✅ **CORS** - Configurado para domínio

### **Importação Asaas**
- ✅ **API Key** - Armazenada em .env
- ✅ **Service Key** - Para operações admin
- ✅ **Validation** - Campos obrigatórios
- ✅ **Error Handling** - Logs detalhados

---

## 📈 **Monitoramento**

### **Métricas Importantes**
- **Check-ins por dia** - Frequência de uso
- **Métodos preferidos** - Visual vs QR vs manual
- **Erros de importação** - Dados inconsistentes
- **Performance** - Tempo de resposta

### **Health Checks**
```bash
# Kiosk
curl http://localhost:3001/health

# Sistema principal
curl http://localhost:3000/health
```

---

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **Kiosk não carrega alunos**
- ✅ Verificar conexão com Supabase
- ✅ Conferir SUPABASE_URL e chaves
- ✅ Validar IDs de curso e turma

#### **Importação do Asaas falha**
- ✅ Verificar ASAAS_API_KEY
- ✅ Conferir URL da API (sandbox vs produção)
- ✅ Validar permissões do service key

#### **Check-in não funciona**
- ✅ Verificar console do navegador
- ✅ Testar endpoints da API
- ✅ Confirmar IDs no banco de dados

### **Comandos de Diagnóstico**
```bash
# Testar conexão Asaas
curl -H "access_token: $ASAAS_API_KEY" https://sandbox.asaas.com/api/v3/customers

# Testar API kiosk
curl http://localhost:3001/api/kiosk/students

# Ver logs detalhados
npm run kiosk 2>&1 | grep ERROR
```

---

## 📞 **Suporte**

Para problemas ou dúvidas:
1. **Verificar logs** do servidor
2. **Testar endpoints** manualmente
3. **Validar configuração** do .env
4. **Conferir documentação** da API

**Desenvolvido para Krav Maga Academy** 🥋