# 🚀 Landing Page Builder - Arquitetura e Planejamento

**Data**: 30/11/2025  
**Versão**: 1.0.0  
**Status**: Planejamento

---

## 📋 RESUMO EXECUTIVO

### Objetivo
Criar um sistema de **Landing Pages integrado** que permita cada organização (academia) criar e gerenciar múltiplos sites de alta conversão, totalmente integrados com o CRM e sistema de gestão existente.

### Diferencial Competitivo
- **Integração nativa** com CRM, leads, alunos, planos e pagamentos
- **Templates otimizados** para artes marciais/defesa pessoal
- **Analytics integrado** com Google Ads e conversões
- **Multi-site por organização** (SmartDefence, Krav Maga BH, etc.)
- **Formulários de lead** que alimentam diretamente o funil de vendas

---

## 🏗️ DECISÃO: MONO-REPO vs MULTI-REPO

### ✅ RECOMENDAÇÃO: MONO-REPO (mesmo repositório)

**Justificativas:**

1. **Integração Profunda**
   - Landing pages precisam acessar: Organizations, Leads, BillingPlans, Courses, Instructors
   - Compartilhamento de tipos Prisma, utils, middlewares
   - Autenticação unificada (JWT)

2. **Deploy Simplificado**
   - Um único deploy para todo o sistema
   - Mesma infraestrutura (Supabase, Render)
   - Versionamento unificado

3. **DX (Developer Experience)**
   - Refatorações afetam ambos os sistemas automaticamente
   - Testes end-to-end mais simples
   - Menos overhead de configuração

4. **Custo-Benefício**
   - Não precisa de CORS entre sistemas
   - Não precisa duplicar autenticação
   - Aproveitamento máximo do código existente

### Estrutura Proposta (Mono-repo)

```
h:\projetos\academia\
├── src/
│   ├── routes/
│   │   ├── landing-pages.ts       # CRUD de landing pages
│   │   ├── landing-public.ts      # Rotas públicas (sem auth)
│   │   └── landing-forms.ts       # Webhooks de formulários
│   ├── services/
│   │   └── landingPageService.ts  # Lógica de negócio
│   └── controllers/
│       └── landingPageController.ts
│
├── public/
│   ├── js/modules/
│   │   └── landing-builder/       # Editor visual
│   │       ├── index.js           # Single-file module
│   │       ├── components/        # Componentes do editor
│   │       │   ├── BlockEditor.js
│   │       │   ├── StylePanel.js
│   │       │   └── PreviewFrame.js
│   │       └── templates/         # Templates pré-definidos
│   │           ├── defesa-pessoal.json
│   │           ├── krav-maga.json
│   │           └── fitness.json
│   ├── css/modules/
│   │   └── landing-builder.css
│   └── landing/                   # Arquivos estáticos para sites
│       └── [slug]/                # Gerados por organização/site
│
├── prisma/
│   └── schema.prisma              # + novos modelos
│
└── templates/
    └── landing/                   # Templates HTML renderizáveis
        ├── base.hbs
        └── sections/
            ├── hero.hbs
            ├── benefits.hbs
            ├── testimonials.hbs
            ├── pricing.hbs
            └── cta.hbs
```

---

## 📊 MODELOS DE DADOS (Prisma)

```prisma
// ============================================================================
// LANDING PAGE BUILDER
// ============================================================================

model LandingPage {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Identificação
  name            String              // "Site SmartDefence Principal"
  slug            String              // "smartdefence-principal" (único por org)
  domain          String?             // "smartdefence.com.br" (custom domain opcional)
  
  // Configurações visuais
  theme           Json                // { primaryColor, secondaryColor, font }
  faviconUrl      String?
  ogImageUrl      String?             // Open Graph image para social
  
  // SEO
  title           String              // <title> tag
  description     String?             // Meta description
  keywords        String[]            // Meta keywords
  
  // Conteúdo
  sections        Json                // Array de seções do site
  customCss       String?             // CSS customizado
  customJs        String?             // JS customizado (analytics, pixels)
  
  // Integrações
  googleAnalyticsId   String?         // GA4 ID
  facebookPixelId     String?         // Meta Pixel
  googleAdsConversionId String?       // Para tracking de conversões
  whatsappNumber      String?         // Número para CTA
  
  // Status
  status          LandingPageStatus   @default(DRAFT)
  publishedAt     DateTime?
  
  // Timestamps
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // Relations
  organization    Organization        @relation(fields: [organizationId], references: [id])
  forms           LandingForm[]
  pageViews       LandingPageView[]
  
  @@unique([organizationId, slug])
  @@index([organizationId, status])
  @@map("landing_pages")
}

enum LandingPageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model LandingForm {
  id              String   @id @default(uuid())
  landingPageId   String
  
  // Identificação
  name            String              // "Formulário Hero", "Formulário Footer"
  formType        LandingFormType     @default(LEAD_CAPTURE)
  
  // Configuração
  fields          Json                // Array de campos do form
  submitButtonText String            @default("Quero Começar!")
  successMessage  String             @default("Obrigado! Entraremos em contato.")
  
  // Integrações
  assignToUserId  String?            // Auto-assign lead a vendedor específico
  tagLeadWith     String[]           // Tags automáticas no lead
  leadTemperature LeadTemperature    @default(HOT)
  
  // Stats
  submissions     Int                @default(0)
  conversions     Int                @default(0)
  
  // Timestamps
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  // Relations
  landingPage     LandingPage        @relation(fields: [landingPageId], references: [id])
  
  @@map("landing_forms")
}

enum LandingFormType {
  LEAD_CAPTURE      // Captura de lead simples
  TRIAL_BOOKING     // Agendamento de aula experimental
  CONSULTATION      // Agendamento de consulta
  CONTACT           // Contato geral
}

model LandingPageView {
  id              String   @id @default(uuid())
  landingPageId   String
  
  // Dados da visita
  sessionId       String              // Para identificar visitante único
  userAgent       String?
  ipAddress       String?
  referrer        String?             // De onde veio
  utmSource       String?             // UTM tracking
  utmMedium       String?
  utmCampaign     String?
  utmContent      String?
  utmTerm         String?
  
  // Comportamento
  timeOnPage      Int?                // Segundos
  scrollDepth     Int?                // Porcentagem máxima scrollada
  
  // Timestamps
  visitedAt       DateTime            @default(now())
  
  // Relations
  landingPage     LandingPage         @relation(fields: [landingPageId], references: [id])
  
  @@index([landingPageId, visitedAt])
  @@index([sessionId])
  @@map("landing_page_views")
}
```

---

## 🎨 ESTRUTURA DE SEÇÕES (JSON Schema)

```typescript
interface LandingSection {
  id: string;           // UUID
  type: SectionType;    // Tipo da seção
  order: number;        // Ordem de exibição
  visible: boolean;     // Visível ou oculto
  settings: Record<string, any>;  // Configurações específicas do tipo
  content: Record<string, any>;   // Conteúdo editável
  styles: {
    backgroundColor?: string;
    backgroundImage?: string;
    padding?: string;
    margin?: string;
    customClasses?: string;
  };
}

type SectionType = 
  | 'hero'              // Banner principal com CTA
  | 'benefits'          // Lista de benefícios (icons + texto)
  | 'features'          // Features em grid
  | 'testimonials'      // Depoimentos de alunos
  | 'instructors'       // Equipe de instrutores
  | 'pricing'           // Tabela de preços/planos
  | 'gallery'           // Galeria de fotos
  | 'video'             // Vídeo embed (YouTube/Vimeo)
  | 'faq'               // Perguntas frequentes
  | 'cta'               // Call to action standalone
  | 'contact'           // Informações de contato + mapa
  | 'form'              // Formulário de captura
  | 'countdown'         // Timer para promoções
  | 'social-proof'      // Números (alunos, anos, etc)
  | 'custom-html';      // HTML customizado
```

---

## 🔌 API ENDPOINTS

### Gerenciamento (Autenticado)
```
POST   /api/landing-pages                    # Criar nova landing page
GET    /api/landing-pages                    # Listar por organização
GET    /api/landing-pages/:id                # Detalhes de uma página
PUT    /api/landing-pages/:id                # Atualizar página
DELETE /api/landing-pages/:id                # Excluir página
POST   /api/landing-pages/:id/publish        # Publicar página
POST   /api/landing-pages/:id/unpublish      # Despublicar
POST   /api/landing-pages/:id/duplicate      # Duplicar página
GET    /api/landing-pages/:id/analytics      # Métricas da página
```

### Formulários (Autenticado)
```
POST   /api/landing-forms                    # Criar formulário
GET    /api/landing-forms/:pageId            # Listar forms de uma página
PUT    /api/landing-forms/:id                # Atualizar formulário
DELETE /api/landing-forms/:id                # Excluir formulário
```

### Público (Sem auth)
```
GET    /lp/:orgSlug/:pageSlug                # Renderizar landing page
POST   /api/lp/:pageId/submit                # Submeter formulário (cria Lead)
POST   /api/lp/:pageId/view                  # Registrar pageview
```

---

## 🛠️ IMPLEMENTAÇÃO - FASES

### Fase 1: Fundação (1-2 semanas)
- [ ] Adicionar modelos Prisma
- [ ] Criar rotas CRUD básicas
- [ ] Endpoint público de renderização
- [ ] Submissão de formulário → Lead
- [ ] Módulo frontend básico (listagem + criação)

### Fase 2: Editor Visual (2-3 semanas)
- [ ] Interface drag-and-drop de seções
- [ ] Panel de configuração de cada seção
- [ ] Preview em tempo real
- [ ] Integração com dados da organização (instrutores, planos)
- [ ] Templates pré-prontos (3-5 iniciais)

### Fase 3: Publicação & Analytics (1 semana)
- [ ] Sistema de publicação (draft → published)
- [ ] Custom domain support (CNAME)
- [ ] Tracking de pageviews
- [ ] Dashboard de métricas
- [ ] Integração Google Analytics/Pixel

### Fase 4: Otimizações (ongoing)
- [ ] A/B testing de seções
- [ ] Heatmaps (integração Hotjar/Clarity)
- [ ] PWA para landing pages
- [ ] AMP pages para mobile
- [ ] CDN para assets

---

## 🎯 TEMPLATES INICIAIS

### 1. **SmartDefence - Defesa Pessoal**
- Foco em segurança feminina
- Cores escuras + amarelo de alerta
- Vídeo de demonstração
- Depoimentos de alunas

### 2. **Krav Maga Tradicional**
- Estética israelense
- Foco em técnica e tradição
- Graduações e história

### 3. **Fitness Combat**
- Energia alta, cores vibrantes
- Foco em resultados físicos
- Antes/depois, métricas

### 4. **Kids Training**
- Cores alegres
- Foco em disciplina + diversão
- Fotos de crianças, segurança

### 5. **Corporate/Empresas**
- Profissional, clean
- Foco em team building
- Métricas de produtividade

---

## 🔐 SEGURANÇA

1. **Sanitização de HTML** - Prevenir XSS em custom HTML
2. **Rate Limiting** - Em formulários públicos
3. **CAPTCHA** - hCaptcha/reCAPTCHA em forms
4. **Validação de domínio** - Verificar ownership de custom domains
5. **CSP Headers** - Content Security Policy

---

## 📊 MÉTRICAS DE SUCESSO

- **Taxa de conversão**: Forms submetidos / Pageviews
- **Bounce rate**: Saídas sem interação
- **Time on page**: Tempo médio de engajamento
- **Scroll depth**: Quanto do conteúdo foi visto
- **Lead quality**: Leads que convertem em alunos

---

## 🚀 PRÓXIMOS PASSOS

1. **Aprovar arquitetura** com stakeholders
2. **Criar migration** Prisma
3. **Implementar Fase 1** (fundação)
4. **Deploy SmartDefence** como piloto
5. **Coletar feedback** e iterar

---

## 📝 NOTAS

- Usar **Handlebars** para templates (já existe no projeto)
- Considerar **TailwindCSS** para classes utilitárias nas landing pages
- Integrar com **Asaas** para pagamentos inline (futuro)
- Suporte a **multi-idioma** (pt-BR, en, es) via i18n

