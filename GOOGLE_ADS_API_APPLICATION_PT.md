# 📋 Formulário Google Ads API - Versão em Português
## (Use a versão em inglês para enviar: GOOGLE_ADS_API_APPLICATION.md)

---

## ℹ️ Informações da Empresa

**Nome da Empresa:** Academia Krav Maga

**Tipo de Negócio:** Serviços de Treinamento e Educação em Artes Marciais

**Website:** [Site principal da academia]

**País:** Brasil

**Email de Contato:** [Seu email corporativo]

---

## 💼 Modelo de Negócio

Nossa empresa opera uma academia de treinamento em artes marciais especializada em Krav Maga, autodefesa e segurança pessoal. Gerenciamos múltiplas campanhas de marketing em diferentes canais para promover nossos programas de treinamento, aulas e ofertas especiais.

**Nossas Operações de Marketing:**
- Gerenciamos campanhas do Google Ads EXCLUSIVAMENTE para nossa própria academia
- Promovemos diversos programas de treinamento: cursos para iniciantes, treinamento avançado, sessões de personal training
- Anunciamos através de múltiplas landing pages e sites específicos de campanhas pertencentes à nossa academia
- NÃO gerenciamos publicidade para terceiros ou outros negócios
- Todas as campanhas de anúncios são para nossos próprios serviços educacionais

**Público-Alvo:**
- Adultos buscando treinamento em autodefesa
- Entusiastas de fitness procurando programas de artes marciais
- Indivíduos interessados em segurança pessoal e consciência tática
- Clientes corporativos buscando sessões de treinamento em grupo

---

## 🎯 Acesso e Uso da Ferramenta

**Usuários Principais:**
- Gerentes de marketing dentro da academia
- Administradores de CRM gerenciando geração de leads
- Instrutores da academia monitorando aquisição de alunos
- Proprietários do negócio acompanhando ROI e performance de campanhas

**Capacidades da Ferramenta:**
1. **Dashboard CRM:** Ferramenta interna para rastreamento de leads gerados por campanhas do Google Ads
2. **Relatórios de Performance:** Métricas em tempo real sobre performance de anúncios, qualidade de leads e taxas de conversão
3. **Gestão de Leads:** Workflows automatizados de captura e nutrição de leads
4. **Rastreamento de Conversão:** Monitorar matrículas de alunos a partir de campanhas de anúncios

**Controle de Acesso:**
- Ferramenta usada EXCLUSIVAMENTE por membros internos da equipe
- Nenhuma agência externa ou terceiros terão acesso direto à API
- Relatórios podem ser compartilhados com consultores de marketing via exportação em PDF (sem acesso direto à ferramenta)

**Funcionalidades de Automação:**
- Script de sincronização por hora para atualizar dados de leads do Google Ads
- Upload automatizado de conversão quando leads se tornam alunos matriculados
- Monitoramento de performance de campanha e alertas

---

## 🏗️ Design e Arquitetura da Ferramenta

**Implementação Técnica:**

1. **Fluxo de Dados:**
   ```
   API Google Ads → API Backend (Node.js/TypeScript)
   → Banco de Dados PostgreSQL → Dashboard Frontend
   ```

2. **Sincronização de Banco de Dados:**
   - Nosso banco de dados PostgreSQL interno sincroniza com a API do Google Ads a cada hora
   - Dados de leads são extraídos e combinados com registros do CRM
   - Eventos de conversão (matrículas de alunos) são enviados de volta ao Google Ads
   - Rastreamento via GCLID (Google Click ID) para atribuição precisa

3. **Interface do Usuário:**
   - Dashboard CRM baseado em web (JavaScript/CSS)
   - Visualização de pipeline de leads em tempo real
   - Analytics de funil de conversão
   - Cálculo de ROI e relatórios

4. **Pontos de Integração com API:**
   - Rastreamento e atribuição de leads via GCLID
   - Upload de conversão quando leads se tornam alunos
   - Recuperação de métricas de performance de campanha
   - Análise de custo e ROI

---

## 🔌 Serviços da API Que Usaremos

**Recursos da API do Google Ads:**

1. **Customer Resource (Relatórios)**
   - Extrair métricas de performance no nível da conta
   - Recuperar estatísticas de campanha
   - Monitorar custo por clique, custo por lead e custo por aquisição
   - Gerar relatórios por período (diário, semanal, mensal)

2. **GoogleAdsService (Conversões)**
   - Fazer upload de eventos de conversão offline quando leads se matriculam como alunos
   - Rastrear valores de conversão de matrícula para cálculo de ROI
   - Associar conversões com GCLID para atribuição precisa

3. **Recursos de Campaign e AdGroup (Somente Leitura)**
   - Sincronizar nomes e IDs de campanhas com CRM interno
   - Combinar performance de grupos de anúncios com fontes de leads
   - Monitorar orçamentos e gastos de campanhas

**Padrões de Uso da API:**
- **Sincronização por hora:** Script automatizado roda a cada hora para extrair dados recentes de campanhas
- **Conversões em tempo real:** Upload de eventos de conversão dentro de 24 horas da matrícula
- **Relatórios sob demanda:** Consultas de analytics acionadas por usuário via dashboard

---

## 🔒 Armazenamento de Dados e Privacidade

**Tratamento de Dados:**
- Todos os dados do Google Ads são armazenados em nosso banco de dados PostgreSQL seguro
- Dados são usados EXCLUSIVAMENTE para inteligência de negócios interna
- Cumprimos com a LGPD (Lei Geral de Proteção de Dados Brasileira)
- Dados de alunos são anonimizados em relatórios compartilhados externamente
- Nenhum dado é vendido ou compartilhado com terceiros

**Medidas de Segurança:**
- Autenticação OAuth2 para acesso à API
- Conexões criptografadas com banco de dados
- Controle de acesso baseado em funções no CRM
- Auditorias e atualizações regulares de segurança

---

## 📊 Mockup do Dashboard

**Visão Geral do Dashboard:**

```
┌─────────────────────────────────────────────────────────┐
│  Academia Krav Maga - Dashboard CRM                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Métricas de Performance de Campanha                 │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Total Leads  │ Conversões   │ Taxa Conv.   │        │
│  │     247      │      38      │    15.4%     │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  💰 Métricas Financeiras                                │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Gasto Ads    │ Receita      │ ROI          │        │
│  │  R$ 8.450    │  R$ 45.600   │   440%       │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  🎯 Pipeline de Leads (por Estágio)                     │
│  ┌─────────────────────────────────────────────┐       │
│  │ NOVO (58) → CONTATADO (42) → QUALIFICADO    │       │
│  │ (31) → EXPERIMENTAL (24) → MATRICULADO (38) │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
│  📈 Conversões Recentes                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │ Nome          Campanha Origem   Valor   Data   │    │
│  │ João Silva    Iniciantes 2024  R$ 1.200 01/10 │    │
│  │ Maria Santos  Autodefesa       R$ 1.200 01/10 │    │
│  │ Pedro Costa   Trein. Avançado  R$ 2.400 02/10 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [🔄 Sincronizar] [📤 Enviar Conversões]               │
└─────────────────────────────────────────────────────────┘
```

**Recursos Principais Ilustrados:**
1. Métricas em tempo real extraídas da API do Google Ads (recurso Customer)
2. Rastreamento de conversão com valores de receita
3. Visualização de pipeline de leads com atribuição do Google Ads
4. Detalhamento de performance de campanha por fonte
5. Botões acionáveis para interações com a API (sincronizar, enviar conversões)

---

## 📈 Volume Esperado de Chamadas à API

**Uso Mensal Estimado:**
- **Script de sincronização por hora:** ~720 chamadas à API/mês (24 horas × 30 dias)
- **Uploads de conversão:** ~40-60 chamadas/mês (conforme alunos se matriculam)
- **Consultas do dashboard:** ~500-1.000 chamadas/mês (interações de usuários)
- **Total estimado:** ~1.300-1.800 chamadas à API/mês

**Conformidade com Limite de Taxa:**
- Implementaremos backoff exponencial para tentativas repetidas
- Cache de requisições para minimizar chamadas redundantes
- Operações em lote onde possível para otimizar uso de quota

---

## ✅ Conformidade e Termos de Serviço

**Confirmamos que:**
- ✅ Nossa ferramenta é usada exclusivamente para gerenciar nossa própria conta do Google Ads
- ✅ NÃO revenderemos, redistribuiremos ou forneceremos acesso à API para terceiros
- ✅ Cumprimos com os Termos de Serviço da API do Google Ads
- ✅ Não faremos scraping, armazenamento ou uso indevido de dados de publicidade competitiva
- ✅ Todos os dados de usuários são tratados de acordo com a LGPD e melhores práticas de privacidade
- ✅ Nossa ferramenta é apenas para inteligência de negócios interna

**Caso de Uso Pretendido:**
Esta integração de API foi projetada para ajudar nossa academia a tomar decisões de marketing baseadas em dados, melhorar taxas de conversão de leads e otimizar nossos gastos com publicidade. Nosso objetivo é fornecer melhores serviços de treinamento aos nossos alunos entendendo quais campanhas atraem os aprendizes mais comprometidos.

---

## 📞 Informações de Contato

**Contato Principal:**
- Nome: [Seu Nome]
- Email: [Seu Email]
- Telefone: [Seu Telefone]

**Contato Técnico:**
- Nome: [Nome do Líder Técnico]
- Email: [Email Técnico]
- Telefone: [Telefone Técnico]

**Endereço da Empresa:**
[Endereço físico da sua academia]

---

## 📝 Declaração

Certificamos que todas as informações fornecidas nesta aplicação são precisas e completas. Entendemos que o uso indevido da API do Google Ads pode resultar em suspensão ou término do acesso à API. Comprometemo-nos a seguir todas as políticas e termos de serviço da API do Google Ads.

**Data:** 03 de outubro de 2025

**Assinatura do Solicitante:** _________________________

**Nome da Empresa:** Academia Krav Maga

---

## 🔄 Próximos Passos Após Criar Esta Aplicação

1. **Traduzir para Inglês** - Use o arquivo `GOOGLE_ADS_API_APPLICATION.md` (já está em inglês)
2. **Revisar Informações** - Preencha os campos [marcados entre colchetes]
3. **Adicionar Screenshots** - Se tiver prints do sistema, anexe
4. **Acessar API Center** - https://ads.google.com → Ferramentas → API Center
5. **Enviar Aplicação** - Copie/cole as seções do arquivo em inglês
6. **Aguardar Aprovação** - 1-3 dias úteis para Basic Access

---

## 📚 Arquivos Relacionados

- **GOOGLE_ADS_API_APPLICATION.md** - Versão em INGLÊS (usar para enviar)
- **GOOGLE_ADS_API_APPLICATION_PT.md** - Este arquivo (referência em português)
- **GOOGLE_ADS_API_SETUP.md** - Guia passo a passo completo
- **GOOGLE_ADS_WHY_TOKEN.md** - Por que o Developer Token é necessário
- **GOOGLE_ADS_QUICKSTART.md** - Resumo rápido

---

**⚠️ IMPORTANTE:** Este arquivo é apenas para sua referência e entendimento. Para enviar ao Google, use a versão em inglês: `GOOGLE_ADS_API_APPLICATION.md`
