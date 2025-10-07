# 🚀 Quick Start: Google Ads API Access

## ⚡ TL;DR (Resumo Ultra-Rápido)

**1. O que é?**
Developer Token = Chave que libera acesso à API do Google Ads

**2. É obrigatório?**
✅ SIM! Sem ele, nada funciona.

**3. Como conseguir?**
Google Ads → Ferramentas → API Center → Apply for Access

**4. Quanto tempo?**
1-3 dias úteis (Basic Access)

**5. O que enviar?**
Copie/cole texto do arquivo `GOOGLE_ADS_API_APPLICATION.md`

---

## 📋 Checklist de 5 Minutos

```
┌─────────────────────────────────────────────────────┐
│ ☐ 1. Abrir GOOGLE_ADS_API_APPLICATION.md           │
│ ☐ 2. Acessar ads.google.com → API Center           │
│ ☐ 3. Clicar "Apply for Access"                     │
│ ☐ 4. Copiar/colar informações do arquivo           │
│ ☐ 5. Enviar solicitação                            │
│ ☐ 6. Aguardar email de aprovação (1-3 dias)        │
│ ☐ 7. Copiar token do API Center                    │
│ ☐ 8. Colar no arquivo .env                         │
│ ☐ 9. Testar: npm run test:google-ads-auth          │
│ ☐ 10. Pronto! 🎉                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 O Que Copiar/Colar no Formulário

### **Business Model**
```
Our company operates a martial arts training academy specializing 
in Krav Maga. We manage Google Ads campaigns exclusively for our 
own academy to promote training programs. We do NOT manage 
advertising for third parties.
```

### **Tool Access/Use**
```
Internal marketing managers and CRM administrators use our tool to:
- Track leads from Google Ads campaigns
- Monitor campaign performance and ROI
- Upload conversion events when students enroll
- Automated hourly sync of campaign data
```

### **Tool Design**
```
We pull campaign metrics from Google Ads API into our PostgreSQL 
database. Our dashboard displays lead pipeline, conversion rates, 
and ROI. We upload offline conversions via GCLID tracking when 
leads become enrolled students.
```

### **API Services Called**
```
- Customer Resource: Pull account performance reports
- GoogleAdsService: Upload offline conversion events
- Campaign/AdGroup Resources: Sync campaign data (read-only)
```

---

## 📞 Links Úteis

| O Que | Onde |
|-------|------|
| **Solicitar Token** | https://ads.google.com → API Center |
| **Documentação Completa** | `GOOGLE_ADS_API_APPLICATION.md` |
| **Guia Passo a Passo** | `GOOGLE_ADS_API_SETUP.md` |
| **Explicação em PT-BR** | `GOOGLE_ADS_WHY_TOKEN.md` |
| **Docs Google** | https://developers.google.com/google-ads/api |

---

## ✅ Após Aprovação

**1. Copiar token do API Center:**
```
Developer Token: abcdefghijklmnopqrstuvwx
```

**2. Adicionar no `.env`:**
```bash
GOOGLE_ADS_DEVELOPER_TOKEN=abcdefghijklmnopqrstuvwx
```

**3. Testar:**
```bash
npm run test:google-ads-auth
# ou
curl http://localhost:3000/api/google-ads/auth/status
```

**4. Verificar resposta:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "enabled": true,
    "customerId": "123-456-7890"
  }
}
```

---

## 🚨 Problemas Comuns

| Erro | Solução |
|------|---------|
| "Developer token missing" | Adicionar no `.env` |
| "Invalid developer token" | Copiar novamente (sem espaços) |
| "Test account only" | Solicitar Basic Access |
| "Access denied" | Verificar se foi aprovado |

---

## 🎓 Arquivos de Referência

```
h:\projetos\academia\
├── GOOGLE_ADS_API_APPLICATION.md  ← Formulário completo (EN)
├── GOOGLE_ADS_API_SETUP.md        ← Guia detalhado (EN)
├── GOOGLE_ADS_WHY_TOKEN.md        ← Explicação completa (PT-BR)
├── GOOGLE_ADS_QUICKSTART.md       ← Este arquivo (resumo)
├── CRON_SETUP.md                  ← Automação
└── .env                           ← Adicionar token aqui
```

---

## ⏱️ Timeline Esperado

```
Dia 1 (Hoje):
  09:00 - Preencher formulário (5 min)
  09:05 - Enviar solicitação
  09:06 - Receber email de confirmação

Dia 2-4:
  - Google analisa aplicação
  - Pode solicitar informações adicionais

Dia 3-5:
  - Email de aprovação!
  - Token aparece no API Center

Dia 5:
  - Configurar token no sistema
  - Testar integração
  - Sistema 100% funcional! 🎉
```

---

## 💰 Custos

| Item | Custo |
|------|-------|
| Developer Token | **GRÁTIS** ✅ |
| Google Ads API | **GRÁTIS** ✅ |
| Cliques nos anúncios | Você define o orçamento |

---

## 📧 Exemplo de Email de Aprovação

```
De: Google Ads API Team <noreply@google.com>
Para: seu-email@academia.com
Assunto: Your Google Ads API Developer Token is Approved

Hello,

Your application for Google Ads API access has been approved.

Developer Token: abcdefghijklmnopqrstuvwx
Access Level: Basic
Daily Operations Limit: 15,000

You can now use this token to access the Google Ads API.

Best regards,
Google Ads API Team
```

---

## 🎯 Ação Imediata (Agora!)

**Se você tem 5 minutos AGORA:**

1. Abrir: https://ads.google.com
2. Clicar: Ferramentas (🔧) → Setup → API Center
3. Clicar: "Apply for Access"
4. Abrir: `GOOGLE_ADS_API_APPLICATION.md`
5. Copiar/colar as seções no formulário
6. Enviar!

**Feito! Em 1-3 dias você tem o token! 🚀**

---

**Precisa de mais detalhes?**
- Português: Leia `GOOGLE_ADS_WHY_TOKEN.md`
- Inglês: Leia `GOOGLE_ADS_API_SETUP.md`
- Formulário: Use `GOOGLE_ADS_API_APPLICATION.md`

**Dúvidas?**
- Google Ads API Forum: https://groups.google.com/g/adwords-api
- Stack Overflow: Tag `google-ads-api`
- Docs: https://developers.google.com/google-ads/api

---

**Versão:** 1.0
**Data:** 03/10/2025
**Status:** Pronto para uso! ✅
