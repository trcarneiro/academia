# 📚 Índice: Documentação Google Ads API

## 🎯 Começar Aqui

Se você está com pressa e quer saber o essencial:
- **Português:** Leia [`GOOGLE_ADS_QUICKSTART.md`](./GOOGLE_ADS_QUICKSTART.md) (5 minutos)
- **English:** Read [`GOOGLE_ADS_API_SETUP.md`](./GOOGLE_ADS_API_SETUP.md) (10 minutes)

---

## 📂 Estrutura da Documentação

### 🇧🇷 **Documentos em Português**

| Arquivo | Propósito | Tempo de Leitura |
|---------|-----------|------------------|
| **GOOGLE_ADS_QUICKSTART.md** | Resumo ultra-rápido com checklist | 5 min ⚡ |
| **GOOGLE_ADS_WHY_TOKEN.md** | Explicação detalhada sobre Developer Token | 10 min 📖 |
| **GOOGLE_ADS_API_APPLICATION_PT.md** | Formulário traduzido (referência) | 15 min 📋 |

### 🇺🇸 **Documentos em Inglês** (Para Enviar ao Google)

| Arquivo | Propósito | Tempo de Leitura |
|---------|-----------|------------------|
| **GOOGLE_ADS_API_APPLICATION.md** | Formulário completo para copiar/colar | 20 min 📝 |
| **GOOGLE_ADS_API_SETUP.md** | Guia passo a passo detalhado | 20 min 🛠️ |

### 🔧 **Documentos Técnicos**

| Arquivo | Propósito | Tempo de Leitura |
|---------|-----------|------------------|
| **CRON_SETUP.md** | Configurar sincronização automática | 15 min ⚙️ |
| **ecosystem.config.js** | Config PM2 para automação | - 💻 |
| **scripts/sync-google-ads.ts** | Script de sincronização | - 💻 |
| **scripts/setup-google-ads-cron.ps1** | Windows scheduler | - 💻 |

---

## 🗺️ Fluxo de Trabalho Recomendado

```
┌─────────────────────────────────────────────────────────┐
│ 1️⃣ ENTENDER (5-10 min)                                  │
│    └─ Leia: GOOGLE_ADS_QUICKSTART.md                   │
│       ou GOOGLE_ADS_WHY_TOKEN.md                        │
├─────────────────────────────────────────────────────────┤
│ 2️⃣ SOLICITAR TOKEN (15 min)                             │
│    ├─ Abra: GOOGLE_ADS_API_APPLICATION.md              │
│    ├─ Acesse: ads.google.com → API Center              │
│    ├─ Copie/cole informações do arquivo                │
│    └─ Envie solicitação                                │
├─────────────────────────────────────────────────────────┤
│ 3️⃣ AGUARDAR (1-3 dias)                                  │
│    └─ Google analisa e aprova                          │
├─────────────────────────────────────────────────────────┤
│ 4️⃣ CONFIGURAR (10 min)                                  │
│    ├─ Copie token do API Center                        │
│    ├─ Cole no arquivo .env                             │
│    └─ Teste: npm run test:google-ads-auth              │
├─────────────────────────────────────────────────────────┤
│ 5️⃣ AUTOMATIZAR (Opcional, 15 min)                       │
│    ├─ Leia: CRON_SETUP.md                              │
│    └─ Configure sync automático                        │
├─────────────────────────────────────────────────────────┤
│ 6️⃣ USAR! 🎉                                             │
│    └─ Sistema 100% funcional                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Por Perfil de Usuário

### 👨‍💼 **Gestor/Proprietário** (Apenas quer entender)
1. Leia: `GOOGLE_ADS_WHY_TOKEN.md` (em português)
2. Entenda: Por que é necessário e quanto custa (R$ 0)
3. Decida: Aprovar ou não a solicitação

### 👨‍💻 **Desenvolvedor** (Vai implementar)
1. Leia: `GOOGLE_ADS_API_SETUP.md` (em inglês, mais técnico)
2. Configure: OAuth2 + Developer Token
3. Teste: Endpoints da API
4. Implemente: Automação com `CRON_SETUP.md`

### 📊 **Marketing/CRM** (Vai usar o sistema)
1. Leia: `GOOGLE_ADS_QUICKSTART.md` (resumo rápido)
2. Aguarde: Configuração técnica
3. Use: Dashboard CRM quando estiver pronto

### 🔧 **DevOps/Infra** (Vai manter funcionando)
1. Configure: Cron job com `CRON_SETUP.md`
2. Monitore: Logs e quotas da API
3. Alerte: Erros de autenticação

---

## 📖 Conteúdo Detalhado por Arquivo

### **GOOGLE_ADS_QUICKSTART.md** 🇧🇷 ⚡
**Para quem:** Todos (começar aqui!)
**Conteúdo:**
- TL;DR (resumo de 30 segundos)
- Checklist de 5 minutos
- Textos prontos para copiar/colar
- Links úteis
- Timeline esperado

### **GOOGLE_ADS_WHY_TOKEN.md** 🇧🇷 📖
**Para quem:** Quem quer entender em profundidade
**Conteúdo:**
- O que é Developer Token
- Por que é obrigatório
- Hierarquia de autenticação (Token + OAuth2 + Customer ID)
- Como as 3 credenciais trabalham juntas
- Analogias práticas
- Nosso caso de uso (Academia Krav Maga)

### **GOOGLE_ADS_API_APPLICATION.md** 🇺🇸 📝
**Para quem:** Quem vai solicitar o token
**Conteúdo:**
- Formulário completo em inglês
- Company Information
- Business Model
- Tool Access and Usage
- Tool Design and Architecture
- API Services Called
- Dashboard Mockup
- Expected API Call Volume
- Compliance Declaration

### **GOOGLE_ADS_API_APPLICATION_PT.md** 🇧🇷 📋
**Para quem:** Referência em português (NÃO enviar ao Google)
**Conteúdo:**
- Mesma estrutura do arquivo em inglês
- Traduzido para português
- Use para entender o que está enviando
- Envie a versão em inglês ao Google

### **GOOGLE_ADS_API_SETUP.md** 🇺🇸 🛠️
**Para quem:** Desenvolvedores e técnicos
**Conteúdo:**
- Pré-requisitos detalhados
- Passo a passo completo
- Tipos de Developer Token
- Tempo de aprovação
- Verificar status da solicitação
- Onde usar o token (código)
- Motivos comuns de recusa
- Dicas para aprovação rápida
- O que fazer após aprovação

### **CRON_SETUP.md** 🛠️ ⚙️
**Para quem:** DevOps e desenvolvedores
**Conteúdo:**
- Configurar sincronização automática
- Linux/Mac: cron tradicional
- PM2: processo gerenciado
- Windows: Task Scheduler
- Logs e monitoramento

---

## 🔑 Informações Críticas

### **O Que Você Precisa Ter ANTES de Solicitar**

✅ **Obrigatório:**
- [ ] Conta Google Ads ativa
- [ ] Projeto no Google Cloud Console
- [ ] Google Ads API habilitada no projeto
- [ ] OAuth2 Credentials (Client ID + Secret)

⚠️ **Recomendado:**
- [ ] Manager Account (MCC) configurado
- [ ] Screenshots ou mockups do sistema
- [ ] Email corporativo (@suaempresa.com)

### **O Que Você Vai Receber**

Após aprovação (1-3 dias):
```
Developer Token: abcdefghijklmnopqrstuvwx
Access Level: Basic
Daily Limit: 15,000 operations
```

### **Onde Usar o Token**

1. **Arquivo `.env`:**
```bash
GOOGLE_ADS_DEVELOPER_TOKEN=abcdefghijklmnopqrstuvwx
```

2. **Código Backend:**
```typescript
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
```

---

## 🚨 Problemas e Soluções

| Problema | Arquivo de Ajuda | Seção |
|----------|------------------|-------|
| Não entendo para que serve | `GOOGLE_ADS_WHY_TOKEN.md` | "O Que É o Developer Token?" |
| Não sei como solicitar | `GOOGLE_ADS_QUICKSTART.md` | "Checklist de 5 Minutos" |
| Preciso de texto para enviar | `GOOGLE_ADS_API_APPLICATION.md` | (Arquivo completo) |
| Foi negado | `GOOGLE_ADS_API_SETUP.md` | "Motivos Comuns de Recusa" |
| Não sei onde colar o token | `GOOGLE_ADS_API_SETUP.md` | "Onde Usar o Developer Token" |
| Quero automatizar sync | `CRON_SETUP.md` | (Arquivo completo) |

---

## 📞 Links Úteis

| Recurso | URL |
|---------|-----|
| **Google Ads** | https://ads.google.com |
| **API Center** | https://ads.google.com → Ferramentas → Setup → API Center |
| **Google Cloud Console** | https://console.cloud.google.com |
| **Docs Oficiais** | https://developers.google.com/google-ads/api |
| **Forum Suporte** | https://groups.google.com/g/adwords-api |
| **Stack Overflow** | https://stackoverflow.com/questions/tagged/google-ads-api |

---

## 🎓 Glossário Rápido

| Termo | Significado |
|-------|-------------|
| **Developer Token** | Chave de acesso à API do Google Ads |
| **OAuth2** | Sistema de autenticação do usuário |
| **Client ID** | Identificador público da aplicação |
| **Client Secret** | Senha secreta da aplicação |
| **Customer ID** | Número da conta Google Ads (xxx-xxx-xxxx) |
| **GCLID** | Google Click ID (rastreamento) |
| **MCC** | Manager Account (conta gerenciadora) |
| **Conversion** | Ação valiosa (ex: matrícula de aluno) |
| **API Center** | Painel do Google Ads para gerenciar API |

---

## ✅ Status dos Documentos

| Arquivo | Status | Versão | Data |
|---------|--------|--------|------|
| GOOGLE_ADS_QUICKSTART.md | ✅ Pronto | 1.0 | 03/10/2025 |
| GOOGLE_ADS_WHY_TOKEN.md | ✅ Pronto | 1.0 | 03/10/2025 |
| GOOGLE_ADS_API_APPLICATION.md | ✅ Pronto | 1.0 | 03/10/2025 |
| GOOGLE_ADS_API_APPLICATION_PT.md | ✅ Pronto | 1.0 | 03/10/2025 |
| GOOGLE_ADS_API_SETUP.md | ✅ Pronto | 1.0 | 03/10/2025 |
| GOOGLE_ADS_INDEX.md | ✅ Pronto | 1.0 | 03/10/2025 |
| CRON_SETUP.md | ✅ Pronto | 1.0 | 02/10/2025 |

---

## 🚀 Ação Imediata

**Se você quer começar AGORA:**

1. Abra: [`GOOGLE_ADS_QUICKSTART.md`](./GOOGLE_ADS_QUICKSTART.md)
2. Siga a checklist de 5 minutos
3. Envie a solicitação
4. Aguarde 1-3 dias
5. Pronto! 🎉

**Precisa de mais contexto?**
- Português: [`GOOGLE_ADS_WHY_TOKEN.md`](./GOOGLE_ADS_WHY_TOKEN.md)
- English: [`GOOGLE_ADS_API_SETUP.md`](./GOOGLE_ADS_API_SETUP.md)

---

**Última atualização:** 03 de outubro de 2025
**Mantido por:** Equipe de Desenvolvimento Academia Krav Maga
**Versão:** 1.0
