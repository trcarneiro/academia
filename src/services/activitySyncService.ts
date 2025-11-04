import { PrismaClient, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Activity Sync Service - Sincroniza técnicas com atividades
 * 
 * Este serviço garante que todas as técnicas tenham atividades correspondentes
 * e gerencia diferentes tipos de atividades (TECHNIQUE, STRETCH, DRILL, etc.)
 */
export class ActivitySyncService {
  
  /**
   * Sincronizar todas as técnicas como atividades do tipo TECHNIQUE
   */
  static async syncTechniquesToActivities(organizationId: string, options = { 
    createMissing: true, 
    updateExisting: false,
    dryRun: false 
  }) {
    console.log('🔄 Iniciando sincronização de técnicas para atividades...');
    
    const stats = {
      techniquesFound: 0,
      activitiesCreated: 0,
      activitiesUpdated: 0,
      activitiesExisting: 0,
      errors: [] as string[]
    };

    try {
      // 1. Buscar todas as técnicas
      const techniques = await prisma.technique.findMany({
        where: { 
          martialArt: { organizationId }
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          complexity: true,
          durationMin: true,
          durationMax: true,
          objectives: true,
          resources: true,
          risksMitigation: true
        }
      });

      stats.techniquesFound = techniques.length;
      console.log(`📚 Encontradas ${techniques.length} técnicas`);

      // 2. Verificar quais técnicas já têm atividades
      const existingActivities = await prisma.activity.findMany({
        where: {
          organizationId,
          type: 'TECHNIQUE',
          refTechniqueId: { in: techniques.map(t => t.id) }
        },
        select: { refTechniqueId: true, id: true, title: true }
      });

      const existingTechniqueIds = new Set(
        existingActivities.map(a => a.refTechniqueId).filter(Boolean)
      );
      
      stats.activitiesExisting = existingActivities.length;
      console.log(`✅ ${existingActivities.length} atividades já existem`);

      // 3. Criar atividades para técnicas que não têm
      const techniquesNeedingActivities = techniques.filter(
        tech => !existingTechniqueIds.has(tech.id)
      );

      console.log(`➕ ${techniquesNeedingActivities.length} técnicas precisam de atividades`);

      if (options.createMissing && !options.dryRun) {
        for (const technique of techniquesNeedingActivities) {
          try {
            const activity = await this.createActivityFromTechnique(technique, organizationId);
            stats.activitiesCreated++;
            console.log(`✅ Criada atividade: ${activity.title}`);
          } catch (error) {
            console.error(`❌ Erro ao criar atividade para ${technique.name}:`, error);
            stats.errors.push(`${technique.name}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // 4. Atualizar atividades existentes se solicitado
      if (options.updateExisting && !options.dryRun) {
        for (const existingActivity of existingActivities) {
          const technique = techniques.find(t => t.id === existingActivity.refTechniqueId);
          if (technique) {
            try {
              await this.updateActivityFromTechnique(existingActivity.id, technique);
              stats.activitiesUpdated++;
              console.log(`🔄 Atualizada atividade: ${existingActivity.title}`);
            } catch (error) {
              console.error(`❌ Erro ao atualizar atividade ${existingActivity.title}:`, error);
              stats.errors.push(`${existingActivity.title}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }

      console.log('\n📊 Resultado da sincronização:');
      console.log(`📚 Técnicas encontradas: ${stats.techniquesFound}`);
      console.log(`✅ Atividades já existentes: ${stats.activitiesExisting}`);
      console.log(`➕ Atividades criadas: ${stats.activitiesCreated}`);
      console.log(`🔄 Atividades atualizadas: ${stats.activitiesUpdated}`);
      
      if (stats.errors.length > 0) {
        console.log(`❌ Erros: ${stats.errors.length}`);
        stats.errors.forEach(error => console.log(`  - ${error}`));
      }

      if (options.dryRun) {
        console.log('\n🧪 MODO DRY RUN - Nenhuma alteração foi feita no banco');
      }

      return stats;

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Criar atividade a partir de uma técnica
   */
  private static async createActivityFromTechnique(technique: any, organizationId: string) {
    const activityData = {
      organizationId,
      type: 'TECHNIQUE' as ActivityType,
      title: technique.name,
      description: technique.description || `Prática da técnica: ${technique.name}`,
      equipment: technique.resources || [],
      safety: technique.risksMitigation?.length > 0 
        ? technique.risksMitigation.join('; ') 
        : 'Usar equipamentos de proteção adequados',
      difficulty: this.mapComplexityToDifficulty(technique.complexity),
      refTechniqueId: technique.id,
      defaultParams: {
        duration: technique.durationMin || 15,
        maxDuration: technique.durationMax || 30,
        objectives: technique.objectives || [],
        category: technique.category || 'Técnica Geral'
      }
    };

    return await prisma.activity.create({ data: activityData });
  }

  /**
   * Atualizar atividade existente com dados da técnica
   */
  private static async updateActivityFromTechnique(activityId: string, technique: any) {
    const updateData = {
      title: technique.name,
      description: technique.description || `Prática da técnica: ${technique.name}`,
      equipment: technique.resources || [],
      safety: technique.risksMitigation?.length > 0 
        ? technique.risksMitigation.join('; ') 
        : 'Usar equipamentos de proteção adequados',
      difficulty: this.mapComplexityToDifficulty(technique.complexity),
      defaultParams: {
        duration: technique.durationMin || 15,
        maxDuration: technique.durationMax || 30,
        objectives: technique.objectives || [],
        category: technique.category || 'Técnica Geral'
      }
    };

    return await prisma.activity.update({ 
      where: { id: activityId },
      data: updateData 
    });
  }

  /**
   * Mapear complexidade da técnica para dificuldade numérica
   */
  private static mapComplexityToDifficulty(complexity?: string): number {
    const mapping: { [key: string]: number } = {
      'Iniciante': 1,
      'Básico': 2,
      'Intermediário': 3,
      'Avançado': 4,
      'Expert': 5
    };
    
    return mapping[complexity || 'Iniciante'] || 1;
  }

  /**
   * Verificar se uma atividade existe para um item do cronograma
   */
  static async findOrCreateActivity(
    scheduleItem: any, 
    organizationId: string, 
    options = { createIfMissing: true }
  ) {
    // Se for um objeto com ID, é uma técnica
    if (typeof scheduleItem === 'object' && scheduleItem.id) {
      return await this.findOrCreateTechniqueActivity(scheduleItem, organizationId, options);
    }
    
    // Se for string, é um tipo de atividade (STRETCH, DRILL, etc.)
    if (typeof scheduleItem === 'string') {
      return await this.findOrCreateGenericActivity(scheduleItem, organizationId, options);
    }

    throw new Error(`Tipo de item do cronograma não reconhecido: ${typeof scheduleItem}`);
  }

  /**
   * Encontrar ou criar atividade para uma técnica específica
   */
  private static async findOrCreateTechniqueActivity(
    techniqueRef: any, 
    organizationId: string, 
    options: any
  ) {
    // Primeiro, tentar encontrar atividade existente
    let activity = await prisma.activity.findFirst({
      where: {
        organizationId,
        type: 'TECHNIQUE',
        refTechniqueId: techniqueRef.id
      }
    });

    if (activity) {
      return { activity, created: false };
    }

    // Se não encontrou e deve criar
    if (options.createIfMissing) {
      // Verificar se a técnica existe
      const technique = await prisma.technique.findUnique({
        where: { id: techniqueRef.id }
      });

      if (!technique) {
        // Criar técnica se não existir (caso de importação)
        const newTechnique = await this.createTechniqueFromRef(techniqueRef, organizationId);
        activity = await this.createActivityFromTechnique(newTechnique, organizationId);
        return { activity, created: true, techniqueCreated: true };
      } else {
        // Criar apenas a atividade
        activity = await this.createActivityFromTechnique(technique, organizationId);
        return { activity, created: true, techniqueCreated: false };
      }
    }

    return { activity: null, created: false };
  }

  /**
   * Encontrar ou criar atividade genérica (STRETCH, DRILL, etc.)
   */
  private static async findOrCreateGenericActivity(
    activityType: string, 
    organizationId: string, 
    options: any
  ) {
    const typeMapping: { [key: string]: ActivityType } = {
      'STRETCH': 'STRETCH',
      'DRILL': 'DRILL', 
      'EXERCISE': 'EXERCISE',
      'CHALLENGE': 'CHALLENGE',
      'ASSESSMENT': 'ASSESSMENT',
      'GAME': 'GAME',
      // Mapear atividades específicas do cronograma
      'alongamento-dinamico': 'STRETCH',
      'aquecimento-cardiovascular': 'EXERCISE',
      'exercicios-coordenacao': 'EXERCISE',
      'fortalecimento-funcional': 'EXERCISE',
      'flexibilidade-ativa': 'STRETCH',
      'relaxamento-muscular': 'STRETCH',
      'respiracao-controlada': 'EXERCISE',
      'visualizacao-mental': 'EXERCISE',
      'autoavaliacao-progresso': 'ASSESSMENT'
    };

    const mappedType = typeMapping[activityType];
    if (!mappedType) {
      throw new Error(`Tipo de atividade não reconhecido: ${activityType}`);
    }

    // Procurar atividade genérica existente
    let activity = await prisma.activity.findFirst({
      where: {
        organizationId,
        type: mappedType,
        refTechniqueId: null, // Atividades genéricas não têm técnica associada
        title: { contains: this.getGenericActivityTitle(activityType) }
      }
    });

    if (activity) {
      return { activity, created: false };
    }

    // Criar atividade genérica se não existir
    if (options.createIfMissing) {
      activity = await prisma.activity.create({
        data: {
          organizationId,
          type: mappedType,
          title: this.getGenericActivityTitle(activityType),
          description: this.getGenericActivityDescription(activityType),
          equipment: this.getGenericActivityEquipment(activityType),
          safety: this.getGenericActivitySafety(activityType),
          difficulty: 1,
          defaultParams: {
            duration: this.getGenericActivityDuration(activityType),
            type: activityType
          }
        }
      });

      return { activity, created: true };
    }

    return { activity: null, created: false };
  }

  /**
   * Criar técnica a partir de referência (para casos de importação)
   */
  private static async createTechniqueFromRef(techniqueRef: any, organizationId: string) {
    // Buscar martial art padrão da organização
    const martialArt = await prisma.martialArt.findFirst({
      where: { organizationId }
    });

    if (!martialArt) {
      throw new Error('Nenhuma arte marcial encontrada para a organização');
    }

    const techniqueData = {
      id: techniqueRef.id,
      martialArtId: martialArt.id,
      name: this.formatTechniqueName(techniqueRef.name),
      slug: techniqueRef.name,
      description: `Técnica importada: ${this.formatTechniqueName(techniqueRef.name)}`,
      category: this.inferTechniqueCategory(techniqueRef.name),
      complexity: 'Iniciante',
      durationMin: 10,
      durationMax: 20,
      objectives: [`Executar ${this.formatTechniqueName(techniqueRef.name)} corretamente`],
      resources: ['Tatame', 'Equipamentos de proteção'],
      risksMitigation: ['Execução supervisionada', 'Aquecimento adequado', 'Progressão gradual'],
      tags: this.generateTechniqueTags(techniqueRef.name),
      assessmentCriteria: ['Execução correta da técnica', 'Timing adequado', 'Precisão dos movimentos'],
      references: ['Manual técnico de Krav Maga', 'Guias de segurança']
    };

    return await prisma.technique.create({ data: techniqueData });
  }

  // Métodos auxiliares para atividades genéricas
  private static getGenericActivityTitle(type: string): string {
    const titles: { [key: string]: string } = {
      'STRETCH': 'Alongamento',
      'DRILL': 'Exercício de Repetição',
      'EXERCISE': 'Exercício Físico',
      'CHALLENGE': 'Desafio',
      'ASSESSMENT': 'Avaliação',
      'GAME': 'Jogo/Dinâmica'
    };
    return titles[type] || type;
  }

  private static getGenericActivityDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'STRETCH': 'Exercícios de alongamento para preparação ou recuperação muscular',
      'DRILL': 'Repetições específicas para fixação de movimentos e técnicas',
      'EXERCISE': 'Exercícios físicos para condicionamento e preparação',
      'CHALLENGE': 'Desafio prático para testar habilidades desenvolvidas',
      'ASSESSMENT': 'Avaliação de conhecimentos e habilidades práticas',
      'GAME': 'Atividade lúdica para engajamento e prática de conceitos'
    };
    return descriptions[type] || `Atividade do tipo ${type}`;
  }

  private static getGenericActivityEquipment(type: string): string[] {
    const equipment: { [key: string]: string[] } = {
      'STRETCH': ['Tapete', 'Roupa confortável'],
      'DRILL': ['Equipamentos específicos conforme técnica'],
      'EXERCISE': ['Tatame', 'Equipamentos de proteção'],
      'CHALLENGE': ['Equipamentos conforme desafio'],
      'ASSESSMENT': ['Material de avaliação'],
      'GAME': ['Material lúdico']
    };
    return equipment[type] || [];
  }

  private static getGenericActivitySafety(type: string): string {
    const safety: { [key: string]: string } = {
      'STRETCH': 'Executar movimentos suaves, respeitar limites corporais',
      'DRILL': 'Manter concentração, usar equipamentos adequados',
      'EXERCISE': 'Hidratação adequada, equipamentos de proteção',
      'CHALLENGE': 'Supervisão constante, equipamentos de segurança',
      'ASSESSMENT': 'Ambiente controlado, instruções claras',
      'GAME': 'Supervisão adequada, regras claras de segurança'
    };
    return safety[type] || 'Seguir orientações de segurança padrão';
  }

  private static getGenericActivityDuration(type: string): number {
    const durations: { [key: string]: number } = {
      'STRETCH': 10,
      'DRILL': 15,
      'EXERCISE': 20,
      'CHALLENGE': 30,
      'ASSESSMENT': 45,
      'GAME': 15
    };
    return durations[type] || 15;
  }

  // Métodos auxiliares para técnicas
  private static formatTechniqueName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static inferTechniqueCategory(name: string): string {
    if (name.includes('soco') || name.includes('jab') || name.includes('direto') || name.includes('gancho')) {
      return 'Socos';
    }
    if (name.includes('chute') || name.includes('joelhada')) {
      return 'Chutes';
    }
    if (name.includes('cotovelada')) {
      return 'Cotoveladas';
    }
    if (name.includes('defesa')) {
      return 'Defesas';
    }
    if (name.includes('postura') || name.includes('guarda')) {
      return 'Posturas';
    }
    if (name.includes('queda') || name.includes('rolamento')) {
      return 'Quedas e Rolamentos';
    }
    return 'Técnica Geral';
  }

  private static generateTechniqueTags(name: string): string[] {
    const tags: string[] = [];
    const category = this.inferTechniqueCategory(name);
    tags.push(category.toLowerCase());
    
    if (name.includes('frontal') || name.includes('frente')) tags.push('frontal');
    if (name.includes('posterior') || name.includes('tras')) tags.push('posterior');
    if (name.includes('lateral')) tags.push('lateral');
    if (name.includes('defesa')) tags.push('defesa');
    if (name.includes('ataque')) tags.push('ataque');
    
    return tags;
  }
}

export default ActivitySyncService;
