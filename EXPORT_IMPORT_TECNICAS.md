# 📥📤 Sistema de Exportação e Importação de Técnicas

## 🎯 **Visão Geral**

Sistema que permite exportar técnicas do módulo de Atividades e importá-las no módulo de Cursos, criando um fluxo completo de reutilização de conteúdo.

## 📤 **Exportação de Técnicas**

### **Como Exportar:**

1. **Acesse o módulo Atividades** (`#/activities`)
2. **Clique no botão "Exportar Técnicas"** (verde, ícone de download)
3. **O arquivo será baixado automaticamente** como `tecnicas-krav-maga-YYYY-MM-DD.json`

### **O que é Exportado:**

- ✅ **Apenas atividades do tipo "TECHNIQUE"**
- ✅ **Dados convertidos** para formato compatível com importação
- ✅ **Metadados** para rastreabilidade
- ✅ **Repetições, duração, precisão** mantidos
- ✅ **Equipamentos e tags** preservados

### **Formato do Arquivo:**

```json
{
  "techniques": [
    {
      "nome": "Defesa contra Estrangulamento por Frente",
      "descricao": "Técnica de defesa quando o agressor...",
      "categoria": "Defesas",
      "nivel_dificuldade": 2,
      "repeticoes": {
        "Adulto Masculino": 15,
        "Adulto Feminino": 12
      },
      "duracao": "3 minutos",
      "precisao": "alta",
      "tags": ["defesa", "estrangulamento"],
      "equipamentos": ["Tatame"],
      "_metadata": {
        "exportedAt": "2025-08-26T...",
        "sourceId": "chute-reto",
        "sourceSystem": "Academia Krav Maga v2.0"
      }
    }
  ],
  "metadata": {
    "exportedAt": "2025-08-26T...",
    "version": "2.0",
    "totalTechniques": 45,
    "source": "Academia Krav Maga - Módulo de Atividades"
  }
}
```

## 📥 **Importação no Módulo de Cursos**

### **Como Importar:**

1. **Navegue para o módulo "Cursos"** (`#/courses`)
2. **Clique em "Importar Técnicas"**
3. **Selecione o arquivo JSON** exportado
4. **Confirme a importação**
5. **As técnicas serão convertidas** automaticamente para atividades do curso

### **Endpoint Usado:**

```
POST /api/courses/import-techniques
Content-Type: application/json
```

### **Processamento:**

- ✅ **Validação Zod** dos dados recebidos
- ✅ **TechniqueImportService** processa as técnicas
- ✅ **RAG Integration** para busca inteligente
- ✅ **Activity Creation** automática
- ✅ **Duplicate Prevention** baseado em título

## 🔄 **Fluxo Completo**

```mermaid
graph LR
    A[Atividades] -->|Exportar| B[JSON File]
    B -->|Importar| C[Cursos]
    C -->|Processa| D[TechniqueImportService]
    D -->|Cria| E[Activities do Curso]
```

## 🛠️ **Recursos Técnicos**

### **Modal de Sucesso:**
- 📊 **Estatísticas** da exportação
- 📋 **Instruções passo-a-passo** para importação
- 🔗 **Link direto** para módulo de cursos
- ✨ **Interface premium** com Guidelines.MD

### **Conversão de Dados:**
```javascript
// Atividade → Técnica
{
  nome: activity.title,
  descricao: activity.description,
  categoria: activity.category,
  nivel_dificuldade: activity.difficulty,
  repeticoes: parseRepetitions(activity.repetitions),
  duracao: activity.duration,
  precisao: activity.precision
}
```

### **Filtros Aplicados:**
- 🎯 **Tipo**: Apenas `type === 'TECHNIQUE'`
- 📊 **Limite**: Até 1000 técnicas por exportação
- 🔍 **Metadados**: Rastreabilidade completa

## 🎨 **Interface e UX**

### **Botão de Exportação:**
- 🟢 **Cor verde** para indicar ação de download
- 📥 **Ícone de download** (`fas fa-download`)
- 📍 **Posição**: Header actions, ao lado de "Nova Atividade"

### **CSS Classes:**
```css
.btn-success-form {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
}
```

## 🚀 **Casos de Uso**

1. **Backup de Técnicas**: Exportar para backup local
2. **Migração de Dados**: Mover técnicas entre ambientes
3. **Reutilização**: Usar técnicas em múltiplos cursos
4. **Compartilhamento**: Distribuir técnicas entre instrutores
5. **Versionamento**: Manter histórico de técnicas

## 🔧 **Configuração**

### **Dependências:**
- ✅ **API Client** configurado
- ✅ **TechniqueImportService** ativo
- ✅ **Módulo de Cursos** funcionando
- ✅ **Endpoint** `/api/courses/import-techniques`

### **Permissões:**
- 📝 **Leitura**: Atividades do tipo TECHNIQUE
- 💾 **Download**: Geração de arquivo JSON
- 📤 **Upload**: No módulo de cursos

## 📈 **Benefícios**

1. **🔄 Interoperabilidade**: Conecta módulos Atividades ↔ Cursos
2. **⚡ Eficiência**: Reutiliza técnicas sem recriar
3. **🎯 Precisão**: Mantém metadados e formatação
4. **🛡️ Rastreabilidade**: Sistema de metadados completo
5. **🎨 UX Premium**: Interface intuitiva e profissional

---

**Status**: ✅ **Implementado e Funcionando**  
**Versão**: 2.0  
**Data**: 26 de agosto de 2025
