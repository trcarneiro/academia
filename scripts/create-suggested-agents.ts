import { config as loadEnv } from 'dotenv';
import { prisma } from '../src/utils/database';
import { AgentOrchestratorService, AgentType } from '../src/services/agentOrchestratorService';

loadEnv();

type SuggestedAgent = {
  name: string;
  type: string;
  description?: string;
  tools?: string[];
  status?: string;
};


const DEFAULT_ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

const ORGANIZATION_ID = process.env.DEV_ORG_ID || process.env.ORGANIZATION_ID || DEFAULT_ORG_ID;

const TYPE_MAPPING: Record<string, AgentType> = {
  marketing: AgentType.MARKETING,
  comercial: AgentType.COMERCIAL,
  pedagogico: AgentType.PEDAGOGICO,
  financeiro: AgentType.FINANCEIRO,
  atendimento: AgentType.ATENDIMENTO,
  orchestrator: AgentType.ORCHESTRATOR,
};

const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.MARKETING]: `Você é um agente de marketing especializado em academias de Krav Maga. Analise campanhas, leads e métricas de engajamento. Sugira ações com foco em aquisição e retenção de alunos. Priorize ideias que possam ser executadas com baixo custo e impacto rápido.`,
  [AgentType.COMERCIAL]: `Você é um agente comercial focado em conversão de matrículas. Analise leads, propostas e follow-ups. Sugira ações para reengajar leads frios, acelerar decisões e aumentar a taxa de fechamento. Sempre apresente próximos passos claros.`,
  [AgentType.PEDAGOGICO]: `Você é um agente pedagógico que garante excelência nos cursos e turmas. Analise frequência, progresso e feedbacks. Sugira ajustes em planos de aula, trilhas de aprendizado e estratégias de retenção de alunos.`,
  [AgentType.FINANCEIRO]: `Você é um agente financeiro especializado em academias. Monitore assinaturas, cobranças e inadimplência. Identifique riscos de churn e oportunidades de upsell. Sugira ações para melhorar fluxo de caixa e regularizar pagamentos.`,
  [AgentType.ATENDIMENTO]: `Você é um agente de atendimento e suporte. Monitore tickets, mensagens e feedbacks dos alunos. Sugira respostas e fluxos de comunicação para elevar a satisfação e reduzir o tempo de resolução.`,
  [AgentType.ORCHESTRATOR]: `Você é um agente orquestrador que coordena outros agentes. Analise dados globais e distribua tarefas. Identifique gargalos estratégicos e delegue ações para agentes especializados, sempre priorizando impacto.` ,
};

const TOOL_PRESETS: Record<AgentType, string[]> = {
  [AgentType.MARKETING]: ['database', 'reports', 'notifications'],
  [AgentType.COMERCIAL]: ['database', 'reports', 'notifications'],
  [AgentType.PEDAGOGICO]: ['database', 'reports'],
  [AgentType.FINANCEIRO]: ['database', 'reports', 'notifications'],
  [AgentType.ATENDIMENTO]: ['database', 'notifications'],
  [AgentType.ORCHESTRATOR]: ['database', 'reports', 'notifications'],
};

const SPECIALIZATION_MAPPING: Record<AgentType, 'pedagogical' | 'analytical' | 'support' | 'progression' | 'commercial' | 'curriculum'> = {
  [AgentType.MARKETING]: 'commercial',
  [AgentType.COMERCIAL]: 'commercial',
  [AgentType.PEDAGOGICO]: 'pedagogical',
  [AgentType.FINANCEIRO]: 'commercial',
  [AgentType.ATENDIMENTO]: 'support',
  [AgentType.ORCHESTRATOR]: 'analytical',
};

async function fetchSuggestedAgents(): Promise<SuggestedAgent[]> {
  console.log('🤖 Solicitando sugestões de agentes para a organização:', ORGANIZATION_ID);

  const result = await AgentOrchestratorService.suggestAgents(ORGANIZATION_ID);

  if (!result.success) {
    console.warn('⚠️ Falha ao obter sugestões do orquestrador. Utilizando fallback.');
    return [
      { name: 'Assistente Administrativo', type: 'financeiro', description: 'Monitora planos, pagamentos e inscrições; sugere ações e relatórios.', tools: ['database', 'reports', 'notifications'] },
      { name: 'Agente Pedagógico', type: 'pedagogico', description: 'Analisa cursos e planos de aula; sugere melhorias baseadas em dados.', tools: ['database', 'reports'] },
      { name: 'Agente de Marketing', type: 'marketing', description: 'Analisa leads e campanhas; propõe próximas ações comerciais.', tools: ['database', 'reports', 'notifications'] },
    ];
  }

  const data = (result.data || {}) as { suggestedAgents?: SuggestedAgent[]; allAgents?: SuggestedAgent[] };
  const suggested = (data.suggestedAgents || []).filter(agent => agent.status !== 'created');

  if (suggested.length === 0) {
    console.log('ℹ️ Nenhuma sugestão “nova” retornada pela IA. Utilizando fallback padrão.');
    return [
      { name: 'Assistente Administrativo', type: 'financeiro', description: 'Monitora planos, pagamentos e inscrições; sugere ações e relatórios.', tools: ['database', 'reports', 'notifications'] },
      { name: 'Agente Pedagógico', type: 'pedagogico', description: 'Analisa cursos e planos de aula; sugere melhorias baseadas em dados.', tools: ['database', 'reports'] },
      { name: 'Agente de Marketing', type: 'marketing', description: 'Analisa leads e campanhas; propõe próximas ações comerciais.', tools: ['database', 'reports', 'notifications'] },
    ];
  }

  console.log(`✅ Recebidas ${suggested.length} sugestões de agentes.`);
  return suggested;
}

async function ensureAgentExists(suggestion: SuggestedAgent): Promise<void> {
  const mappedType = TYPE_MAPPING[suggestion.type?.toLowerCase()] ?? AgentType.ATENDIMENTO;
  const tools = suggestion.tools && suggestion.tools.length > 0 ? suggestion.tools : TOOL_PRESETS[mappedType];
  const systemPrompt = SYSTEM_PROMPTS[mappedType] || SYSTEM_PROMPTS[AgentType.ATENDIMENTO];

  const existing = await prisma.aIAgent.findFirst({
    where: {
      organizationId: ORGANIZATION_ID,
      name: suggestion.name,
    },
  });

  if (existing) {
    console.log(`ℹ️ Agente “${suggestion.name}” já existe (ID: ${existing.id}). Pulando criação.`);
    return;
  }

  console.log(`🚀 Criando agente “${suggestion.name}” (${mappedType})...`);

  const specialization = SPECIALIZATION_MAPPING[mappedType] ?? 'support';

  const createdAgent = await prisma.aIAgent.create({
    data: {
      organization: { connect: { id: ORGANIZATION_ID } },
      name: suggestion.name,
      description: suggestion.description || 'Agente criado automaticamente a partir de sugestões.',
      specialization,
      systemPrompt,
      mcpTools: tools,
      ragSources: [],
      temperature: 0.7,
      maxTokens: 2048,
      model: 'gemini-2.5-flash',
      noCodeMode: true,
      isActive: true,
      isPublic: false,
    },
  });

  console.log(`✅ Agente criado com sucesso: ${createdAgent.name} (ID: ${createdAgent.id})`);

  console.log(`▶️ Executando análise inicial do agente “${createdAgent.name}”...`);
  const execution = await AgentOrchestratorService.executeAgent(
    createdAgent.id,
    'Realize uma análise inicial e gere as três principais ações recomendadas para hoje.',
    { organizationId: ORGANIZATION_ID }
  );

  if (execution.success) {
    console.log(`📬 Execução concluída para “${createdAgent.name}”.`);
    console.log(JSON.stringify(execution.data, null, 2));
  } else {
    console.warn(`⚠️ Execução inicial falhou para “${createdAgent.name}”:`, execution.error);
  }
}

async function main() {
  try {
    console.log('==============================================');
    console.log('🏁 Iniciando criação de agentes sugeridos');
    console.log('==============================================\n');

    const suggestions = await fetchSuggestedAgents();

    if (suggestions.length === 0) {
      console.log('Nenhuma sugestão disponível. Encerrando script.');
      return;
    }

    for (const suggestion of suggestions) {
      await ensureAgentExists(suggestion);
    }

    console.log('\n==============================================');
    console.log('🎉 Processo concluído!');
    console.log('==============================================');
  } catch (error) {
    console.error('💥 Erro fatal no script:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {
      /* ignore disconnect errors */
    });
  }
}

main();
