import { prisma } from '../src/utils/database';

type AgentRow = {
  id: string;
  name: string;
  specialization: string;
  model: string;
  isActive: boolean;
  organizationId: string;
  organization: { name: string | null; slug: string | null } | null;
  mcpTools: string[];
  ragSources: string[];
  createdAt: Date;
  updatedAt: Date;
  temperature: number;
  maxTokens: number;
  noCodeMode: boolean;
  isPublic: boolean;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatSpecialization(value: string): string {
  const map: Record<string, string> = {
    pedagogical: 'Pedagógico',
    analytical: 'Analítico',
    support: 'Suporte',
    progression: 'Progressão',
    commercial: 'Comercial',
    curriculum: 'Currículo',
  };
  return map[value] || value;
}

async function listAgents(): Promise<void> {
  const agents = (await prisma.aIAgent.findMany({
    select: {
      id: true,
      name: true,
      specialization: true,
      model: true,
      isActive: true,
      organizationId: true,
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
      mcpTools: true,
      ragSources: true,
      createdAt: true,
      updatedAt: true,
      temperature: true,
      maxTokens: true,
      noCodeMode: true,
      isPublic: true,
    },
    orderBy: [
      { organizationId: 'asc' },
      { createdAt: 'asc' },
    ],
  })) as AgentRow[];

  if (agents.length === 0) {
    console.log('ℹ️  Nenhum agente cadastrado na base de dados.');
    return;
  }

  console.log('🤖 Lista de Agentes de IA\n');

  let currentOrg: string | null = null;
  for (const agent of agents) {
    const orgLabel =
      agent.organization?.name ??
      agent.organization?.slug ??
      agent.organizationId;

    if (orgLabel !== currentOrg) {
      currentOrg = orgLabel;
      console.log(`🏢 Organização: ${orgLabel}`);
      console.log('----------------------------------------');
    }

    console.log(`• ${agent.name}`);
    console.log(
      `  ID: ${agent.id}\n` +
        `  Especialização: ${formatSpecialization(agent.specialization)}\n` +
        `  Modelo: ${agent.model}\n` +
        `  Status: ${agent.isActive ? 'Ativo' : 'Inativo'}\n` +
        `  Público: ${agent.isPublic ? 'Sim' : 'Não'}\n` +
        `  No-Code Mode: ${agent.noCodeMode ? 'Habilitado' : 'Desabilitado'}\n` +
        `  Temperatura: ${agent.temperature.toFixed(2)} | maxTokens: ${agent.maxTokens}\n` +
        `  MCP Tools: ${agent.mcpTools.length > 0 ? agent.mcpTools.join(', ') : '—'}\n` +
        `  RAG Sources: ${agent.ragSources.length > 0 ? agent.ragSources.join(', ') : '—'}\n` +
        `  Criado em: ${formatDate(agent.createdAt)}\n` +
        `  Atualizado em: ${formatDate(agent.updatedAt)}\n`
    );
  }
}

async function main(): Promise<void> {
  try {
    await listAgents();
  } catch (error) {
    console.error('❌ Erro ao listar agentes:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {
      // Ignorar erros ao finalizar conexão
    });
  }
}

void main();
