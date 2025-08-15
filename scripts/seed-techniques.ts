/**
 * Seed 12 Techniques (Banco de Técnicas) com taxonomias, BNCC, metadados
 * - Compatível com colunas adicionadas nas migrations reconciliadas
 * - Usa Prisma Client direto; requer DATABASE_URL configurado
 *
 * Execução:
 *  npx ts-node scripts/seed-techniques.ts
 * ou
 *  ts-node scripts/seed-techniques.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type BNCC = { code: string; description?: string };
type Step = { title: string; description: string; minutes?: number; resources?: string[]; notes?: string };

function nowIso() {
  return new Date().toISOString();
}

function t(
  {
    name,
    slug,
    shortDescription,
    objectives,
    category,
    subcategory,
    modality,
    complexity,
    durationMin,
    durationMax,
    groupSizeMin,
    groupSizeMax,
    ageRangeMin,
    ageRangeMax,
    resources,
    stepByStep,
    assessmentCriteria,
    risksMitigation,
    bnccCompetencies,
    skills,
    references,
    tags,
  }: {
    name: string;
    slug: string;
    shortDescription: string;
    objectives: string[];
    category: string;
    subcategory?: string;
    modality: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO';
    complexity: 'BASICA' | 'INTERMEDIARIA' | 'AVANCADA';
    durationMin: number;
    durationMax: number;
    groupSizeMin: number;
    groupSizeMax: number;
    ageRangeMin: number;
    ageRangeMax: number;
    resources: string[];
    stepByStep: Step[];
    assessmentCriteria: string[];
    risksMitigation: string[];
    bnccCompetencies: BNCC[];
    skills: string[];
    references: string[];
    tags: string[];
  }
) {
  return {
    name,
    slug,
    shortDescription,
    objectives,
    category,
    subcategory: subcategory ?? null,
    modality,
    complexity,
    durationMin,
    durationMax,
    groupSizeMin,
    groupSizeMax,
    ageRangeMin,
    ageRangeMax,
    resources,
    stepByStep,
    assessmentCriteria,
    risksMitigation,
    bnccCompetencies,
    bnccCompetenciesText: bnccCompetencies.map(b => `${b.code} ${b.description ?? ''}`).join(' | '),
    skills,
    references,
    tags,
  };
}

// 12 técnicas variadas cobrindo contextos EF/EM/Superior/Corporativo/EAD
const techniques = [
  t({
    name: 'Instrução por Pares (Peer Instruction)',
    slug: 'peer-instruction',
    shortDescription: 'Estratégia ativa com questionários conceituais, discussão entre pares e voto.',
    objectives: [
      'Promover compreensão conceitual profunda',
      'Estimular argumentação e pensamento crítico',
    ],
    category: 'ATIVA',
    subcategory: 'PEER_INSTRUCTION',
    modality: 'PRESENCIAL',
    complexity: 'INTERMEDIARIA',
    durationMin: 30,
    durationMax: 50,
    groupSizeMin: 10,
    groupSizeMax: 100,
    ageRangeMin: 12,
    ageRangeMax: 80,
    resources: ['Projetor', 'Sistema de votação', 'Quadro'],
    stepByStep: [
      { title: 'Pergunta conceitual', description: 'Apresente uma questão conceitual aos alunos por 2-3 min.' },
      { title: 'Voto individual', description: 'Cada aluno vota em uma alternativa.', minutes: 5 },
      { title: 'Discussão em pares', description: 'Alunos discutem suas respostas com colegas.', minutes: 8 },
      { title: 'Novo voto', description: 'Recolha novo voto e debata a resposta correta.', minutes: 10 },
    ],
    assessmentCriteria: ['Justificativa consistente', 'Melhora no segundo voto', 'Participação ativa'],
    risksMitigation: ['Garantir tempo suficiente de discussão', 'Perguntas bem calibradas'],
    bnccCompetencies: [{ code: 'EMIFCG01', description: 'Competência geral argumentação' }],
    skills: ['Comunicação', 'Argumentação', 'Raciocínio lógico'],
    references: ['https://en.wikipedia.org/wiki/Peer_instruction'],
    tags: ['ensino-medio', 'superior', 'ciencias', 'matematica'],
  }),
  t({
    name: 'Estudo de Caso',
    slug: 'estudo-de-caso',
    shortDescription: 'Análise estruturada de situação real para tomada de decisão.',
    objectives: ['Aplicar teoria na prática', 'Desenvolver tomada de decisão'],
    category: 'ATIVA',
    subcategory: 'STUDY_CASE',
    modality: 'HIBRIDO',
    complexity: 'INTERMEDIARIA',
    durationMin: 40,
    durationMax: 90,
    groupSizeMin: 4,
    groupSizeMax: 30,
    ageRangeMin: 14,
    ageRangeMax: 80,
    resources: ['Documento do caso', 'Quadro', 'Sala em grupos'],
    stepByStep: [
      { title: 'Leitura do caso', description: 'Distribua o caso, leitura individual.', minutes: 10 },
      { title: 'Discussão em grupo', description: 'Debate guiado por perguntas norteadoras.', minutes: 20 },
      { title: 'Solução e justificativa', description: 'Grupos apresentam suas decisões.', minutes: 20 },
    ],
    assessmentCriteria: ['Coerência da solução', 'Uso de evidências', 'Clareza na apresentação'],
    risksMitigation: ['Casos alinhados ao nível', 'Tempo de leitura adequado'],
    bnccCompetencies: [{ code: 'EF09LP03', description: 'Leitura crítica' }],
    skills: ['Resolução de problemas', 'Trabalho em equipe'],
    references: ['https://hbsp.harvard.edu/cases/'],
    tags: ['ensino-medio', 'superior', 'humanas', 'gestao'],
  }),
  t({
    name: 'Sala de Aula Invertida',
    slug: 'sala-de-aula-invertida',
    shortDescription: 'Conteúdo estudado em casa, aula focada em aplicação e dúvidas.',
    objectives: ['Autonomia de estudo', 'Aprofundar aplicação prática'],
    category: 'DIGITAL',
    subcategory: 'SALA_DE_AULA_INVERTIDA',
    modality: 'ONLINE',
    complexity: 'BASICA',
    durationMin: 20,
    durationMax: 60,
    groupSizeMin: 5,
    groupSizeMax: 40,
    ageRangeMin: 10,
    ageRangeMax: 80,
    resources: ['Vídeos', 'Leituras', 'LMS'],
    stepByStep: [
      { title: 'Pré-aula', description: 'Aluno estuda vídeo/leituras antes da aula.' },
      { title: 'Checagem de compreensão', description: 'Quiz diagnóstico.', minutes: 10 },
      { title: 'Atividades em sala', description: 'Aplicação em grupos e resolução de dúvidas.', minutes: 30 },
    ],
    assessmentCriteria: ['Engajamento prévio', 'Desempenho no quiz', 'Entrega da atividade'],
    risksMitigation: ['Materiais curtos e objetivos', 'Feedback frequente'],
    bnccCompetencies: [{ code: 'EF07LP24' }],
    skills: ['Autogestão', 'Colaboração'],
    references: ['https://flippedlearning.org/'],
    tags: ['ead', 'ensino-fundamental', 'ensino-medio'],
  }),
  t({
    name: 'Debate Regrado',
    slug: 'debate-regrado',
    shortDescription: 'Debate estruturado com papéis definidos e tempos controlados.',
    objectives: ['Desenvolver argumentação', 'Respeitar turnos e regras'],
    category: 'COLABORATIVA',
    subcategory: 'DEBATE',
    modality: 'PRESENCIAL',
    complexity: 'INTERMEDIARIA',
    durationMin: 30,
    durationMax: 60,
    groupSizeMin: 6,
    groupSizeMax: 30,
    ageRangeMin: 12,
    ageRangeMax: 80,
    resources: ['Cronômetro', 'Regras impressas', 'Moderador'],
    stepByStep: [
      { title: 'Definir tema e regras', description: 'Apresente o formato e tempos.' },
      { title: 'Rodadas de fala', description: 'Equipes expõem, replicam e concluem.' },
      { title: 'Síntese e feedback', description: 'Moderador sintetiza pontos-chave.' },
    ],
    assessmentCriteria: ['Clareza de argumentos', 'Evidências', 'Respeito às regras'],
    risksMitigation: ['Treinar regras', 'Garantir neutralidade do moderador'],
    bnccCompetencies: [{ code: 'EMIFCG02' }],
    skills: ['Comunicação', 'Pensamento crítico'],
    references: [],
    tags: ['linguagens', 'humanas'],
  }),
  t({
    name: 'Mapa Mental',
    slug: 'mapa-mental',
    shortDescription: 'Organização visual de conceitos e relações.',
    objectives: ['Sintetizar conteúdo', 'Estabelecer conexões'],
    category: 'EXPOSITIVA',
    subcategory: 'MAPA_MENTAL',
    modality: 'HIBRIDO',
    complexity: 'BASICA',
    durationMin: 20,
    durationMax: 45,
    groupSizeMin: 1,
    groupSizeMax: 30,
    ageRangeMin: 8,
    ageRangeMax: 80,
    resources: ['Papel/Aplicativo de mapas', 'Marcadores'],
    stepByStep: [
      { title: 'Tema central', description: 'Definir o tema no centro.' },
      { title: 'Ramos principais', description: 'Adicionar tópicos e sub-tópicos.' },
      { title: 'Refinar e compartilhar', description: 'Rever, colorir e apresentar.' },
    ],
    assessmentCriteria: ['Coerência', 'Cobertura de tópicos', 'Clareza visual'],
    risksMitigation: ['Modelos prontos para iniciantes'],
    bnccCompetencies: [{ code: 'EF06LP01' }],
    skills: ['Organização', 'Síntese'],
    references: [],
    tags: ['fundamental', 'estudo', 'organizacao'],
  }),
  t({
    name: 'Jigsaw (Quebra-cabeça)',
    slug: 'jigsaw',
    shortDescription: 'Grupos expertos e base para ensino colaborativo por partes.',
    objectives: ['Ensino pelos pares', 'Responsabilidade compartilhada'],
    category: 'COLABORATIVA',
    subcategory: 'JIGSAW',
    modality: 'PRESENCIAL',
    complexity: 'INTERMEDIARIA',
    durationMin: 40,
    durationMax: 80,
    groupSizeMin: 8,
    groupSizeMax: 36,
    ageRangeMin: 10,
    ageRangeMax: 80,
    resources: ['Textos divididos', 'Quadro'],
    stepByStep: [
      { title: 'Formar grupos base', description: 'Tópicos divididos entre membros.' },
      { title: 'Grupos de expertos', description: 'Aprofundamento por tópico.' },
      { title: 'Retorno ao grupo base', description: 'Cada membro ensina seu tópico.' },
    ],
    assessmentCriteria: ['Coesão do ensino', 'Cobertura de tópicos', 'Engajamento'],
    risksMitigation: ['Instruções claras por etapa'],
    bnccCompetencies: [{ code: 'EF08LP13' }],
    skills: ['Colaboração', 'Comunicação'],
    references: [],
    tags: ['fundamental', 'medio', 'colaborativo'],
  }),
  t({
    name: 'Role Play (Simulação de Papéis)',
    slug: 'role-play',
    shortDescription: 'Simulação de situações com papéis atribuídos.',
    objectives: ['Empatia', 'Aplicação prática'],
    category: 'PRATICA',
    subcategory: 'ROLE_PLAY',
    modality: 'PRESENCIAL',
    complexity: 'INTERMEDIARIA',
    durationMin: 30,
    durationMax: 60,
    groupSizeMin: 4,
    groupSizeMax: 20,
    ageRangeMin: 12,
    ageRangeMax: 80,
    resources: ['Roteiros', 'Espaço livre'],
    stepByStep: [
      { title: 'Briefing', description: 'Definir cenário e papéis.' },
      { title: 'Encenação', description: 'Executar a simulação.', minutes: 20 },
      { title: 'Debriefing', description: 'Reflexão guiada sobre decisões.' },
    ],
    assessmentCriteria: ['Consistência do papel', 'Aprendizagens extraídas'],
    risksMitigation: ['Preparar debriefing seguro'],
    bnccCompetencies: [{ code: 'EF09EF06' }],
    skills: ['Comunicação', 'Tomada de decisão'],
    references: [],
    tags: ['socioemocional', 'praticas'],
  }),
  t({
    name: 'Design Thinking Sprint',
    slug: 'design-thinking-sprint',
    shortDescription: 'Ciclo rápido de empatia, ideação, prototipagem e teste.',
    objectives: ['Resolver problemas complexos', 'Criatividade aplicada'],
    category: 'ATIVA',
    subcategory: 'DESIGN_THINKING',
    modality: 'HIBRIDO',
    complexity: 'AVANCADA',
    durationMin: 120,
    durationMax: 240,
    groupSizeMin: 6,
    groupSizeMax: 24,
    ageRangeMin: 15,
    ageRangeMax: 80,
    resources: ['Post-its', 'Materiais de protótipo', 'Sala ampla'],
    stepByStep: [
      { title: 'Empatia', description: 'Entrevistas/observação do usuário.' },
      { title: 'Definição', description: 'Mapear problema e necessidades.' },
      { title: 'Ideação', description: 'Gerar alternativas.', minutes: 30 },
      { title: 'Prototipagem', description: 'Criar protótipo funcional.', minutes: 60 },
      { title: 'Teste', description: 'Coletar feedback e iterar.', minutes: 30 },
    ],
    assessmentCriteria: ['Aderência ao problema', 'Qualidade do protótipo', 'Validação com usuário'],
    risksMitigation: ['Tempo bem controlado', 'Critérios claros'],
    bnccCompetencies: [{ code: 'EMIFCG05' }],
    skills: ['Criatividade', 'Resolução de problemas'],
    references: ['https://www.designkit.org/'],
    tags: ['projeto', 'inovacao', 'corporativo'],
  }),
  t({
    name: 'Quiz Formativo Rápido',
    slug: 'quiz-formativo',
    shortDescription: 'Avaliação diagnóstica breve com feedback imediato.',
    objectives: ['Verificar compreensão', 'Ajustar andamento da aula'],
    category: 'AVALIACAO',
    subcategory: 'QUIZ_FORMATIVO',
    modality: 'ONLINE',
    complexity: 'BASICA',
    durationMin: 5,
    durationMax: 15,
    groupSizeMin: 1,
    groupSizeMax: 100,
    ageRangeMin: 8,
    ageRangeMax: 80,
    resources: ['Plataforma de quiz', 'Projetor'],
    stepByStep: [
      { title: 'Perguntas chave', description: 'Prepare 3-5 questões essenciais.' },
      { title: 'Aplicação', description: 'Respostas em tempo real.' },
      { title: 'Feedback', description: 'Comente respostas e corrija rotas.' },
    ],
    assessmentCriteria: ['Cobertura dos objetivos', 'Feedback útil'],
    risksMitigation: ['Evitar perguntas ambíguas'],
    bnccCompetencies: [{ code: 'EF05MA10' }],
    skills: ['Autogestão', 'Metacognição'],
    references: [],
    tags: ['avaliacao', 'edtech'],
  }),
  t({
    name: 'Projeto Colaborativo',
    slug: 'projeto-colaborativo',
    shortDescription: 'Elaboração de projeto com entregas e papéis definidos.',
    objectives: ['Planejamento', 'Entrega orientada a objetivos'],
    category: 'COLABORATIVA',
    subcategory: 'PROJETO',
    modality: 'HIBRIDO',
    complexity: 'INTERMEDIARIA',
    durationMin: 120,
    durationMax: 1440,
    groupSizeMin: 3,
    groupSizeMax: 20,
    ageRangeMin: 12,
    ageRangeMax: 80,
    resources: ['Ferramentas de gestão', 'Templates'],
    stepByStep: [
      { title: 'Kickoff', description: 'Objetivos, papéis e cronograma.' },
      { title: 'Execução', description: 'Sprints e checkpoints.' },
      { title: 'Entrega', description: 'Apresentação e retrospectiva.' },
    ],
    assessmentCriteria: ['Cumprimento de requisitos', 'Qualidade e colaboração'],
    risksMitigation: ['Checkpoints frequentes', 'Critérios objetivos'],
    bnccCompetencies: [{ code: 'EMIFCG06' }],
    skills: ['Gestão do tempo', 'Colaboração'],
    references: [],
    tags: ['projetos', 'gestao', 'interdisciplinar'],
  }),
  t({
    name: 'Gamificação de Conteúdo',
    slug: 'gamificacao-conteudo',
    shortDescription: 'Uso de pontos, badges e desafios para engajar aprendizagem.',
    objectives: ['Engajamento', 'Reforço positivo'],
    category: 'DIGITAL',
    subcategory: 'GAMIFICACAO',
    modality: 'ONLINE',
    complexity: 'INTERMEDIARIA',
    durationMin: 20,
    durationMax: 120,
    groupSizeMin: 1,
    groupSizeMax: 50,
    ageRangeMin: 10,
    ageRangeMax: 80,
    resources: ['Plataforma gamificada', 'Banco de desafios'],
    stepByStep: [
      { title: 'Definir mecânicas', description: 'Pontos, níveis, badges.' },
      { title: 'Mapear desafios', description: 'Alinhar com objetivos.' },
      { title: 'Feedback e ranking', description: 'Transparência de progressão.' },
    ],
    assessmentCriteria: ['Alinhamento pedagógico', 'Engajamento sustentado'],
    risksMitigation: ['Evitar foco só em recompensa extrínseca'],
    bnccCompetencies: [{ code: 'EF67CI17' }],
    skills: ['Motivação', 'Persistência'],
    references: [],
    tags: ['edtech', 'engajamento'],
  }),
  t({
    name: 'Seminário Orientado',
    slug: 'seminario-orientado',
    shortDescription: 'Apresentações guiadas com roteiro e rubrica.',
    objectives: ['Comunicação oral', 'Estruturação de ideias'],
    category: 'EXPOSITIVA',
    subcategory: 'SEMINARIO',
    modality: 'PRESENCIAL',
    complexity: 'BASICA',
    durationMin: 30,
    durationMax: 90,
    groupSizeMin: 5,
    groupSizeMax: 40,
    ageRangeMin: 12,
    ageRangeMax: 80,
    resources: ['Projetor', 'Rubrica de avaliação'],
    stepByStep: [
      { title: 'Planejamento', description: 'Distribuir temas e prazos.' },
      { title: 'Ensaios', description: 'Feedback formativo do professor.' },
      { title: 'Apresentação', description: 'Aplicar rubrica e devolutiva.' },
    ],
    assessmentCriteria: ['Clareza', 'Tempo', 'Fontes'],
    risksMitigation: ['Modelos e exemplos'],
    bnccCompetencies: [{ code: 'EF08LP18' }],
    skills: ['Comunicação', 'Planejamento'],
    references: [],
    tags: ['apresentacao', 'rubrica'],
  }),
  t({
    name: 'Laboratório Prático Guiado',
    slug: 'laboratorio-pratico',
    shortDescription: 'Execução de protocolo prático com segurança e checklist.',
    objectives: ['Habilidades técnicas', 'Procedimentos seguros'],
    category: 'PRATICA',
    subcategory: 'LABORATORIO',
    modality: 'PRESENCIAL',
    complexity: 'INTERMEDIARIA',
    durationMin: 45,
    durationMax: 90,
    groupSizeMin: 2,
    groupSizeMax: 16,
    ageRangeMin: 12,
    ageRangeMax: 80,
    resources: ['Materiais do protocolo', 'EPIs'],
    stepByStep: [
      { title: 'Briefing de segurança', description: 'Revisar EPIs e riscos.' },
      { title: 'Execução', description: 'Seguir protocolo.', minutes: 40 },
      { title: 'Registro', description: 'Checklist e discussão de resultados.' },
    ],
    assessmentCriteria: ['Conformidade', 'Precisão', 'Segurança'],
    risksMitigation: ['Treinamento prévio', 'Supervisão'],
    bnccCompetencies: [{ code: 'EF09CI13' }],
    skills: ['Técnica', 'Segurança'],
    references: [],
    tags: ['ciencias', 'pratica', 'laboratorio'],
  }),
];

async function main() {
  console.log(`[seed-techniques] Starting at ${nowIso()}`);

  for (const item of techniques) {
    // upsert por slug para idempotência
    await prisma.$executeRawUnsafe(
      `INSERT INTO techniques
        (id, name, slug, shortDescription, category, subcategory, modality, complexity,
         durationMin, durationMax, groupSizeMin, groupSizeMax, ageRangeMin, ageRangeMax,
         objectives, resources, stepByStep, assessmentCriteria, risksMitigation,
         bnccCompetencies, bnccCompetenciesText, skills, "references", tags, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
               $8, $9, $10, $11, $12, $13,
               $14::text[], $15::text[], $16::jsonb, $17::text[], $18::text[],
               $19::jsonb, $20, $21::text[], $22::text[], $23::text[], now(), now())
       ON CONFLICT (slug) DO UPDATE SET
         "name" = EXCLUDED."name",
         "shortDescription" = EXCLUDED."shortDescription",
         "category" = EXCLUDED."category",
         "subcategory" = EXCLUDED."subcategory",
         "modality" = EXCLUDED."modality",
         "complexity" = EXCLUDED."complexity",
         "durationMin" = EXCLUDED."durationMin",
         "durationMax" = EXCLUDED."durationMax",
         "groupSizeMin" = EXCLUDED."groupSizeMin",
         "groupSizeMax" = EXCLUDED."groupSizeMax",
         "ageRangeMin" = EXCLUDED."ageRangeMin",
         "ageRangeMax" = EXCLUDED."ageRangeMax",
         "objectives" = EXCLUDED."objectives",
         "resources" = EXCLUDED."resources",
         "stepByStep" = EXCLUDED."stepByStep",
         "assessmentCriteria" = EXCLUDED."assessmentCriteria",
         "risksMitigation" = EXCLUDED."risksMitigation",
         "bnccCompetencies" = EXCLUDED."bnccCompetencies",
         "bnccCompetenciesText" = EXCLUDED."bnccCompetenciesText",
         "skills" = EXCLUDED."skills",
         "references" = EXCLUDED."references",
         "tags" = EXCLUDED."tags",
         "updatedAt" = now()`,
      item.name,
      item.slug,
      item.shortDescription,
      item.category,
      item.subcategory,
      item.modality,
      item.complexity,
      item.durationMin,
      item.durationMax,
      item.groupSizeMin,
      item.groupSizeMax,
      item.ageRangeMin,
      item.ageRangeMax,
      JSON.stringify(item.objectives),
      JSON.stringify(item.resources),
      JSON.stringify(item.stepByStep),
      JSON.stringify(item.assessmentCriteria),
      JSON.stringify(item.risksMitigation),
      JSON.stringify(item.bnccCompetencies),
      item.bnccCompetenciesText,
      JSON.stringify(item.skills),
      JSON.stringify(item.references),
      JSON.stringify(item.tags),
    );
  }

  console.log(`[seed-techniques] Completed at ${nowIso()}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('[seed-techniques] Error', e);
    await prisma.$disconnect();
    process.exit(1);
  });