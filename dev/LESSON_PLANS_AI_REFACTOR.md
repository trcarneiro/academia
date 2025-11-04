# Refatoração: Geração de Planos de Aula com IA

**Data**: 01/10/2025  
**Status**: 🚧 Em Planejamento  
**Prioridade**: ALTA  

## 📋 Contexto

Atualmente, a funcionalidade de geração de planos de aula com IA está **dispersa** no módulo AI (`public/js/modules/ai.js`), que tem **4.450 linhas** e múltiplas responsabilidades.

**Problemas atuais**:
- ❌ Geração de planos misturada com RAG, Agents e outras funcionalidades
- ❌ UX confusa: usuário precisa ir no módulo AI para gerar planos
- ❌ Difícil manutenção: código gigante e não modular
- ❌ Falta integração com Course Editor

## 🎯 Objetivo da Refatoração

**Mover** a funcionalidade de geração de planos de aula **DO** módulo AI **PARA** o módulo Lesson Plans, criando uma arquitetura mais coesa e user-friendly.

### Benefícios Esperados:
1. ✅ **UX Melhor**: Gerar planos dentro do próprio módulo de Lesson Plans
2. ✅ **Integração**: Botão "Gerar Todos os Planos" no Course Editor
3. ✅ **Manutenibilidade**: Redução de 30-40% do tamanho do ai.js
4. ✅ **Coesão**: Cada módulo tem uma responsabilidade clara

## 🏗️ Arquitetura Proposta

### **Módulo Lesson Plans** (Nova estrutura com tabs)

```
📁 /public/js/modules/lesson-plans/
├── 📄 index.js (entry point - 150 linhas)
├── 📄 lesson-plans.js (main logic - 800 linhas)
├── 📁 controllers/
│   ├── list-controller.js (listagem - 300 linhas)
│   ├── editor-controller.js (edição - 400 linhas)
│   └── ai-generator-controller.js 🆕 (geração IA - 500 linhas)
└── 📁 services/
    └── ai-generation-service.js 🆕 (API calls - 300 linhas)
```

### **Nova Interface com Tabs**

```
┌─────────────────────────────────────────────────────┐
│ 📚 Planos de Aula                                    │
├─────────────────────────────────────────────────────┤
│ [📋 Listagem] [✏️ Editor] [🤖 Gerar com IA] 🆕       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  TAB: 🤖 Gerar com IA                                │
│  ┌──────────────────────────────────────────────┐  │
│  │ 📊 Stats:                                     │  │
│  │  • 7 cursos disponíveis                       │  │
│  │  • 15 planos já criados                       │  │
│  │  • 42 planos faltando                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🎓 Selecione o Curso                          │  │
│  │ [Dropdown com cursos]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 📚 Planos do Curso: Krav Maga - Faixa Branca │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ✅ Aula 1 - Introdução (já existe)            │  │
│  │ ✅ Aula 2 - Técnicas Básicas (já existe)      │  │
│  │ ❌ Aula 3 - Defesas contra Soco [Gerar] 🆕    │  │
│  │ ❌ Aula 4 - Defesas contra Chave [Gerar] 🆕   │  │
│  │ ...                                            │  │
│  │                                                │  │
│  │ [🤖 Gerar Todos os Planos Faltantes] 🆕       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ⚙️ Configurações de Geração                   │  │
│  │ • Provedor IA: [Gemini ▼]                     │  │
│  │ • Usar RAG: [✓]                               │  │
│  │ • Incluir Variações: [ ]                      │  │
│  │ • Incluir Adaptações: [✓]                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### **Integração com Course Editor**

```
┌─────────────────────────────────────────────────────┐
│ ✏️ Editar Curso: Krav Maga - Faixa Branca           │
├─────────────────────────────────────────────────────┤
│ [ℹ️ Informações] [📚 Aulas] [🎓 Técnicas]            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📝 Nome: Krav Maga - Faixa Branca                   │
│  📊 Total de Aulas: 24                               │
│  ⏱️ Duração Total: 12 semanas                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🤖 Geração Automática com IA 🆕               │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Gerar automaticamente TODOS os 24 planos de  │  │
│  │ aula deste curso usando IA                    │  │
│  │                                                │  │
│  │ Provedor: [Gemini ▼]  RAG: [✓]                │  │
│  │                                                │  │
│  │ [🚀 Gerar Todos os Planos de Aula] 🆕         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [💾 Salvar Curso]  [❌ Cancelar]                    │
└─────────────────────────────────────────────────────┘
```

## 📦 Código a Ser Movido

### **Do módulo AI → Lesson Plans**

**Funções principais (linhas 2700-3200 do ai.js)**:
```javascript
// 1. Geração individual
async function generateSinglePlan(courseId, lessonNumber)

// 2. Geração em lote
async function generateAllMissingPlans()

// 3. Análise de planos existentes
async function analyzePlans(existingPlans, courseId)

// 4. Interface de progresso
function showGenerationProgress(totalPlans)
function updateGenerationProgress(current, total, message)
function completeGenerationProgress(successCount, failCount, newActivitiesCount)

// 5. Configuração
function getGenerationOptions()
function saveConfiguration()
function loadConfiguration()
```

**Services e helpers**:
```javascript
class EnhancedCourseService {
  async generateContent(type)
  async displayResults(type, data)
  async loadCourseDetails(courseId)
  async loadCoursePlansAnalysis(courseId)
}
```

## 🔧 Implementação - Fase 1: Nova Aba no Lesson Plans

### **1.1. Atualizar lesson-plans.html**

Adicionar sistema de tabs:

```html
<!-- Nova estrutura com tabs -->
<div class="module-tabs-premium">
  <button class="tab-btn active" data-tab="list">📋 Listagem</button>
  <button class="tab-btn" data-tab="editor">✏️ Editor</button>
  <button class="tab-btn" data-tab="ai-generator">🤖 Gerar com IA</button> <!-- NOVO -->
</div>

<div class="tab-content-area">
  <!-- Aba 1: Listagem (existente) -->
  <div id="list-tab" class="tab-content active">
    <!-- Conteúdo atual de listagem -->
  </div>
  
  <!-- Aba 2: Editor (existente) -->
  <div id="editor-tab" class="tab-content">
    <!-- Conteúdo atual de edição -->
  </div>
  
  <!-- Aba 3: Gerador IA (NOVO) -->
  <div id="ai-generator-tab" class="tab-content">
    <!-- Novo conteúdo de geração IA -->
  </div>
</div>
```

### **1.2. Criar ai-generator-controller.js**

```javascript
// public/js/modules/lesson-plans/controllers/ai-generator-controller.js

class AIGeneratorController {
  constructor(moduleAPI) {
    this.moduleAPI = moduleAPI;
    this.currentCourse = null;
    this.existingPlans = [];
    this.missingPlans = [];
  }
  
  async init(container) {
    this.container = container;
    await this.render();
    this.setupEvents();
    await this.loadCourses();
  }
  
  async render() {
    this.container.innerHTML = `
      <div class="ai-generator-interface">
        <!-- Stats Cards -->
        <div class="stats-grid">...</div>
        
        <!-- Course Selector -->
        <div class="course-selector">...</div>
        
        <!-- Plans Analysis -->
        <div class="plans-analysis">
          <div class="existing-plans">...</div>
          <div class="missing-plans">...</div>
        </div>
        
        <!-- Generation Config -->
        <div class="generation-config">...</div>
        
        <!-- Progress Monitor -->
        <div class="generation-progress">...</div>
      </div>
    `;
  }
  
  async generateSinglePlan(courseId, lessonNumber) {
    // Lógica movida do ai.js
  }
  
  async generateAllMissingPlans() {
    // Lógica movida do ai.js
  }
}

export default AIGeneratorController;
```

### **1.3. Criar ai-generation-service.js**

```javascript
// public/js/modules/lesson-plans/services/ai-generation-service.js

class AIGenerationService {
  constructor(moduleAPI) {
    this.api = moduleAPI;
  }
  
  async generateSingleLesson(courseId, lessonNumber, options = {}) {
    return await this.api.request('/api/ai/generate-single-lesson', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        lessonNumber,
        provider: options.provider || 'gemini',
        useRag: options.useRag !== false
      })
    });
  }
  
  async generateBatchLessons(courseId, lessonNumbers, options = {}) {
    // Gera múltiplos planos sequencialmente
    const results = [];
    for (const lessonNumber of lessonNumbers) {
      const result = await this.generateSingleLesson(courseId, lessonNumber, options);
      results.push(result);
      await this.delay(1000); // Delay entre requisições
    }
    return results;
  }
  
  async getCoursePlansAnalysis(courseId) {
    return await this.api.request(`/api/lesson-plans/analysis/${courseId}`);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AIGenerationService;
```

## 🔧 Implementação - Fase 2: Integração com Course Editor

### **2.1. Atualizar course-editor.html**

Adicionar seção de geração IA:

```html
<!-- Na página do course editor -->
<div class="data-card-premium ai-generation-section">
  <div class="card-header">
    <h3>🤖 Geração Automática de Planos de Aula</h3>
    <p>Gere todos os planos de aula deste curso automaticamente usando IA</p>
  </div>
  <div class="card-body">
    <div class="ai-generation-config">
      <div class="form-group">
        <label>Provedor de IA</label>
        <select id="course-ai-provider">
          <option value="gemini">Gemini</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI (GPT-4)</option>
        </select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="course-use-rag" checked>
          Usar base de conhecimento RAG
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="course-include-adaptations" checked>
          Incluir adaptações de nível
        </label>
      </div>
    </div>
    <button 
      class="btn btn-primary btn-large" 
      id="generate-all-course-plans"
      onclick="courseEditor.generateAllPlans()">
      🚀 Gerar Todos os ${totalLessons} Planos de Aula
    </button>
    <div id="generation-status" class="generation-status" style="display:none;">
      <!-- Progress bar e logs -->
    </div>
  </div>
</div>
```

### **2.2. Atualizar course editor controller**

```javascript
// public/js/modules/courses/controllers/course-details-controller.js

class CourseDetailsController {
  // ... código existente ...
  
  async generateAllPlans() {
    if (!this.currentCourse) return;
    
    const confirmed = confirm(
      `Gerar ${this.currentCourse.totalLessons} planos de aula automaticamente?\n\n` +
      `Isso pode levar vários minutos.`
    );
    
    if (!confirmed) return;
    
    try {
      // Usar o serviço de geração do módulo lesson-plans
      const aiService = new AIGenerationService(this.moduleAPI);
      
      // Mostrar progresso
      this.showGenerationProgress(this.currentCourse.totalLessons);
      
      // Gerar todos os planos
      const lessonNumbers = Array.from(
        { length: this.currentCourse.totalLessons }, 
        (_, i) => i + 1
      );
      
      const results = await aiService.generateBatchLessons(
        this.currentCourse.id,
        lessonNumbers,
        {
          provider: document.getElementById('course-ai-provider').value,
          useRag: document.getElementById('course-use-rag').checked,
          includeAdaptations: document.getElementById('course-include-adaptations').checked
        }
      );
      
      // Mostrar resultados
      this.showGenerationResults(results);
      
    } catch (error) {
      console.error('Error generating plans:', error);
      alert('Erro ao gerar planos: ' + error.message);
    }
  }
  
  showGenerationProgress(total) {
    const statusDiv = document.getElementById('generation-status');
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="course-progress-fill"></div>
      </div>
      <div class="progress-info">
        <span id="course-progress-text">Iniciando geração...</span>
        <span id="course-progress-percent">0%</span>
      </div>
      <div class="generation-log" id="course-generation-log"></div>
    `;
  }
  
  showGenerationResults(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    alert(
      `Geração concluída!\n\n` +
      `✅ ${successCount} planos criados com sucesso\n` +
      `❌ ${failCount} falhas\n\n` +
      `Acesse o módulo Planos de Aula para visualizar.`
    );
  }
}
```

## 📊 Estimativa de Impacto

### **Redução de Complexidade**

| Módulo | Antes | Depois | Redução |
|--------|-------|--------|---------|
| ai.js | 4.450 linhas | ~3.000 linhas | **-33%** |
| lesson-plans.js | 1.958 linhas | ~2.500 linhas | +28% |
| **Total** | 6.408 linhas | 5.500 linhas | **-14%** |

### **Benefícios Qualitativos**

1. ✅ **Coesão**: Cada módulo tem responsabilidade única
2. ✅ **UX**: Geração de planos onde o usuário espera
3. ✅ **Manutenibilidade**: Código mais organizado
4. ✅ **Reusabilidade**: Serviços podem ser reutilizados
5. ✅ **Testabilidade**: Controllers menores e focados

## 🗺️ Roadmap de Implementação

### **Sprint 1 (Semana 1)** ✅
- [x] Documento de planejamento
- [ ] Nova aba "Gerar com IA" no Lesson Plans
- [ ] ai-generator-controller.js (estrutura básica)
- [ ] ai-generation-service.js (APIs básicas)

### **Sprint 2 (Semana 2)**
- [ ] Mover lógica de geração do ai.js
- [ ] Implementar geração individual
- [ ] Implementar análise de planos existentes
- [ ] Testes básicos

### **Sprint 3 (Semana 3)**
- [ ] Implementar geração em lote
- [ ] Progress monitoring e logs
- [ ] Integração com RAG
- [ ] Testes avançados

### **Sprint 4 (Semana 4)**
- [ ] Integração com Course Editor
- [ ] Botão "Gerar Todos os Planos"
- [ ] Configurações persistentes
- [ ] Documentação completa

### **Sprint 5 (Semana 5)**
- [ ] Testes end-to-end
- [ ] Ajustes de UX
- [ ] Performance optimization
- [ ] Deploy para produção

## 🔍 Referências

- **Arquitetura atual**: `/public/js/modules/ai.js` (linhas 2700-3200)
- **Destino**: `/public/js/modules/lesson-plans/`
- **Templates**: Instructors (single-file) e Activities (multi-file)
- **Documentação**: `/dev/MODULE_STANDARDS.md`

## 💡 Decisões de Design

### **Por que Tab no Lesson Plans?**
- ✅ Usuário está no contexto certo (gerenciando planos)
- ✅ Evita navegação entre módulos
- ✅ Padrão já usado em Students (multi-tab interface)

### **Por que Course Editor também?**
- ✅ Workflow: Criar curso → Gerar todos os planos de uma vez
- ✅ Eficiência: 1 clique vs 24 cliques individuais
- ✅ UX premium: Automação inteligente

### **Por que não Single-file?**
- ❌ Lesson Plans já é complexo (1.958 linhas)
- ✅ Multi-file permite melhor separação
- ✅ AI generator é um submódulo natural

## 🎯 Success Metrics

**Objetivos mensuráveis**:
1. ✅ Redução de 30%+ no tamanho do ai.js
2. ✅ 100% de funcionalidades movidas sem quebras
3. ✅ 0 regressões em testes
4. ✅ Feedback positivo dos usuários

**KPIs de UX**:
- Tempo para gerar 1 plano: <10 segundos
- Tempo para gerar 24 planos: <5 minutos
- Taxa de sucesso: >95%
- Satisfação do usuário: >4.5/5

---

**Status**: 🚧 Aguardando aprovação para implementação  
**Responsável**: GitHub Copilot Agent  
**Revisão**: Pendente
