import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Curriculum Agent
 * 
 * Cria um agente educador especialista em artes marciais pré-configurado
 * com todas as ferramentas MCP e sistema de prompts otimizado
 */
async function seedCurriculumAgent() {
  console.log('🥋 Starting Curriculum Agent seed...');

  try {
    // Buscar organização principal
    const organization = await prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!organization) {
      throw new Error('No organization found. Please create an organization first.');
    }

    console.log(`📍 Using organization: ${organization.name} (${organization.id})`);

    // Verificar se já existe agente curriculum
    const existingAgent = await prisma.aIAgent.findFirst({
      where: {
        organizationId: organization.id,
        specialization: 'curriculum'
      }
    });

    if (existingAgent) {
      console.log('⚠️  Curriculum agent already exists. Updating...');
      
      const updatedAgent = await prisma.aIAgent.update({
        where: { id: existingAgent.id },
        data: {
          name: 'Professor Virtual de Artes Marciais',
          description: 'Educador físico especialista em preparação física e artes marciais (Krav Maga e Jiu Jitsu). Cria e avalia planos de curso e planos de aula baseados em dados reais da academia.',
          model: 'gemini-1.5-pro',
          systemPrompt: CURRICULUM_SYSTEM_PROMPT,
          ragSources: [
            'courses',
            'lesson_plans',
            'techniques',
            'activity_categories',
            'graduation_levels',
            'student_progress'
          ],
          mcpTools: [
            'getCourseData',
            'getTechniques',
            'getLessonPlans',
            'getActivityExecutionStats',
            'getActivityCategories',
            'getGraduationSystem',
            'getStudentProgress',
            'executeCustomQuery'
          ],
          temperature: 0.7,
          maxTokens: 4096,
          noCodeMode: true,
          isActive: true,
          isPublic: false
        }
      });

      console.log(`✅ Curriculum agent updated: ${updatedAgent.id}`);
      return updatedAgent;
    }

    // Criar novo agente
    const newAgent = await prisma.aIAgent.create({
      data: {
        organizationId: organization.id,
        name: 'Professor Virtual de Artes Marciais',
        description: 'Educador físico especialista em preparação física e artes marciais (Krav Maga e Jiu Jitsu). Cria e avalia planos de curso e planos de aula baseados em dados reais da academia.',
        specialization: 'curriculum',
        model: 'gemini-1.5-pro',
        systemPrompt: CURRICULUM_SYSTEM_PROMPT,
        ragSources: [
          'courses',
          'lesson_plans',
          'techniques',
          'activity_categories',
          'graduation_levels',
          'student_progress'
        ],
        mcpTools: [
          'getCourseData',
          'getTechniques',
          'getLessonPlans',
          'getActivityExecutionStats',
          'getActivityCategories',
          'getGraduationSystem',
          'getStudentProgress',
          'executeCustomQuery'
        ],
        temperature: 0.7,
        maxTokens: 4096,
        noCodeMode: true,
        isActive: true,
        isPublic: false
      }
    });

    console.log(`✅ Curriculum agent created: ${newAgent.id}`);
    
    // Criar conversa de exemplo
    const exampleConversation = await prisma.agentConversation.create({
      data: {
        agentId: newAgent.id,
        messages: [
          {
            role: 'user',
            content: 'Analise o curso de Krav Maga Faixa Branca e me dê feedback pedagógico.',
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: '🥋 Olá! Sou o Professor Virtual especialista em artes marciais. Vou analisar o curso de Krav Maga Faixa Branca para você.\n\nPara fazer uma análise completa, preciso do ID do curso. Você pode fornecer?',
            timestamp: new Date().toISOString(),
            mcpToolsUsed: [],
            ragSourcesUsed: []
          }
        ],
        rating: null,
        feedback: null,
        metadata: {
          purpose: 'example_conversation',
          createdBy: 'seed_script'
        }
      }
    });

    console.log(`✅ Example conversation created: ${exampleConversation.id}`);

    return newAgent;

  } catch (error) {
    console.error('❌ Error seeding curriculum agent:', error);
    throw error;
  }
}

// System Prompt detalhado
const CURRICULUM_SYSTEM_PROMPT = `Você é um educador físico especialista em preparação física e artes marciais, com profundo conhecimento em:

🥋 **Especialidades**:
- Krav Maga (defesa pessoal israelense)
- Jiu Jitsu Brasileiro (arte suave)
- Preparação física para atletas de combate
- Pedagogia esportiva e progressão técnica
- Fisiologia do exercício aplicada a artes marciais

👨‍🏫 **Sua Função**:
Você analisa e cria planos de curso e planos de aula otimizados, garantindo:
1. **Progressão Segura**: Evolução gradual respeitando capacidades físicas
2. **Equilíbrio Técnico**: Balanceamento entre posturas, golpes, defesas e condicionamento
3. **Periodização**: Distribuição adequada de intensidade e volume ao longo do tempo
4. **Especificidade**: Adaptação ao nível (faixa) e objetivos dos alunos
5. **Recuperação**: Intervalos adequados entre sessões intensas

📊 **Critérios de Avaliação**:
- Variedade de categorias de atividades (evitar monotonia)
- Repetições adequadas por técnica (mínimo para consolidação neuromuscular)
- Intensidade progressiva sem sobrecarga
- Checkpoints de avaliação bem distribuídos
- Alinhamento com sistema de graduação (graus e faixas)

🔍 **Análise Baseada em Dados**:
Você tem acesso aos dados reais da academia via ferramentas MCP:
- **getCourseData**: Busca dados completos de um curso
- **getTechniques**: Lista técnicas disponíveis por categoria
- **getLessonPlans**: Busca planos de aula de um curso
- **getActivityExecutionStats**: Estatísticas de execução por alunos
- **getActivityCategories**: Categorias e requisitos mínimos
- **getGraduationSystem**: Sistema de graduação e faixas
- **getStudentProgress**: Progresso individual dos alunos
- **executeCustomQuery**: Queries SQL customizadas (somente leitura)

💡 **Estilo de Resposta**:
- Técnico porém didático
- Use emojis para facilitar visualização
- Forneça justificativas baseadas em princípios de treinamento esportivo
- Seja específico com números (repetições, séries, duração)
- Sugira ajustes incrementais ao invés de mudanças radicais

⚠️ **Restrições**:
- NUNCA sugira exercícios perigosos sem supervisão
- Sempre considere aquecimento e volta à calma
- Respeite limitações físicas e progressão gradual
- Mantenha foco nas modalidades Krav Maga e Jiu Jitsu

🎯 **Exemplos de Análise**:

**Quando analisar um curso:**
- Avalie distribuição de categorias (posturas, socos, chutes, defesas, quedas, combinações)
- Verifique carga total de repetições
- Analise progressão de intensidade ao longo das aulas
- Identifique gaps ou sobrecarga em categorias específicas
- Sugira ajustes baseados em dados de execução dos alunos

**Quando criar plano de aula:**
- Considere aulas anteriores para manter coerência
- Varie categorias para desenvolvimento equilibrado
- Defina repetições baseadas em consolidação motora (mínimo 15-20 por técnica)
- Inclua aquecimento (5-10min) e volta à calma (5min)
- Distribua intensidade: começar BAIXA, pico ALTA no meio, finalizar MÉDIA

**Quando avaliar plano de aula:**
- Score de 0-100 baseado em: variedade (30pts), equilíbrio (30pts), quantidade adequada (20pts), duração (20pts)
- Feedback específico por categoria
- Sugestões de melhorias incrementais
- Comparação com dados de execução real (se disponíveis)`;

// Executar seed
seedCurriculumAgent()
  .then(() => {
    console.log('🎉 Curriculum agent seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Curriculum agent seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
