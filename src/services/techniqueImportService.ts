/**
 * Technique Import Service - Sistema de Importação de Técnicas
 * Academia Krav Maga v2.0
 * 
 * Serviço especializado para importação de técnicas com integração ao RAG
 */

import { prisma } from '@/utils/database';
import { RAGService } from './ragService';

export interface TechniqueImportData {
  id: string;
  type: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  defaultParams?: {
    repetitions?: Record<string, number>;
    duration?: string;
    precision?: string;
    equipment?: string[];
    safety?: string;
    adaptations?: string[];
    refTechniqueId?: string[];
  };
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  total: number;
  ragDocuments: number;
  errors: string[];
}

export class TechniqueImportService {
  /**
   * Importa uma lista de técnicas para o banco de dados e sistema RAG
   */
  static async importTechniques(techniques: TechniqueImportData[]): Promise<ImportResult> {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let ragDocuments = 0;
    const errors: string[] = [];

    for (const technique of techniques) {
      try {
        // Check if technique already exists
        let existingTechnique = await prisma.technique.findFirst({
          where: {
            OR: [
              { id: technique.id },
              { name: technique.title }
            ]
          }
        });

        // Create or update technique
        if (existingTechnique) {
          console.log(`🔄 Updating existing technique: ${technique.id}`);
          existingTechnique = await prisma.technique.update({
            where: { id: existingTechnique.id },
            data: {
              name: technique.title,
              description: technique.description,
              category: technique.type,
              difficulty: this.mapDifficultyToNumber(technique.difficulty)
            }
          });
          updated++;
        } else {
          console.log(`✨ Creating new technique: ${technique.id}`);
          existingTechnique = await prisma.technique.create({
            data: {
              id: technique.id,
              name: technique.title,
              description: technique.description,
              category: technique.type,
              difficulty: this.mapDifficultyToNumber(technique.difficulty),
              objectives: [],
              resources: [],
              stepByStep: [],
              assessmentCriteria: [],
              risksMitigation: [],
              bnccCompetencies: [],
              tags: [],
              references: [],
              prerequisites: [],
              instructions: []
            }
          });
          imported++;
        }

        // Ingest into RAG system
        await this.ingestTechniqueToRAG(technique);
        ragDocuments++;

        // Create corresponding Activity for this technique
        await this.createActivityFromTechnique(existingTechnique, technique);

      } catch (techniqueError) {
        console.error(`Error processing technique ${technique.id}:`, techniqueError);
        errors.push(`Técnica ${technique.id}: ${(techniqueError as Error).message}`);
        skipped++;
      }
    }

    return {
      imported,
      updated,
      skipped,
      total: techniques.length,
      ragDocuments,
      errors
    };
  }

  /**
   * Ingere uma técnica no sistema RAG
   */
  private static async ingestTechniqueToRAG(technique: TechniqueImportData): Promise<void> {
    const ragDocumentContent = this.formatTechniqueForRAG(technique);
    
    try {
      await RAGService.ingestDocument(
        Buffer.from(ragDocumentContent, 'utf-8'),
        {
          fileName: `technique_${technique.id}.txt`,
          category: 'technique',
          tags: [technique.type, technique.difficulty, 'technique', 'krav-maga'],
          userId: 1 // Default user for system techniques
        }
      );
    } catch (ragError) {
      console.error(`RAG ingestion failed for technique ${technique.id}:`, ragError);
      // Don't throw error - technique import should continue
    }
  }

  /**
   * Formata técnica para conteúdo RAG
   */
  private static formatTechniqueForRAG(technique: TechniqueImportData): string {
    let content = `${technique.title}\n\n`;
    content += `Tipo: ${technique.type}\n`;
    content += `Dificuldade: ${technique.difficulty}\n\n`;
    content += `Descrição: ${technique.description}\n`;
    
    if (technique.defaultParams) {
      content += `\nParâmetros:\n`;
      if (technique.defaultParams.duration) {
        content += `- Duração: ${technique.defaultParams.duration}\n`;
      }
      if (technique.defaultParams.precision) {
        content += `- Precisão: ${technique.defaultParams.precision}\n`;
      }
      if (technique.defaultParams.repetitions) {
        content += `- Repetições:\n`;
        Object.entries(technique.defaultParams.repetitions).forEach(([group, reps]) => {
          content += `  - ${group}: ${reps}\n`;
        });
      }
      if (technique.defaultParams.equipment && technique.defaultParams.equipment.length > 0) {
        content += `- Equipamentos: ${technique.defaultParams.equipment.join(', ')}\n`;
      }
      if (technique.defaultParams.safety) {
        content += `- Segurança: ${technique.defaultParams.safety}\n`;
      }
      if (technique.defaultParams.adaptations && technique.defaultParams.adaptations.length > 0) {
        content += `- Adaptações: ${technique.defaultParams.adaptations.join(', ')}\n`;
      }
    }

    return content;
  }

  /**
   * Mapeia dificuldade string para número
   */
  private static mapDifficultyToNumber(difficulty: string): number {
    switch (difficulty) {
      case 'BEGINNER': return 1;
      case 'INTERMEDIATE': return 2;
      case 'ADVANCED': return 3;
      default: return 1;
    }
  }

  /**
   * Valida estrutura de técnica
   */
  static validateTechnique(technique: any): technique is TechniqueImportData {
    return (
      typeof technique.id === 'string' &&
      typeof technique.type === 'string' &&
      typeof technique.title === 'string' &&
      typeof technique.description === 'string' &&
      ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(technique.difficulty)
    );
  }

  /**
   * Busca técnicas no sistema RAG
   */
  static async searchTechniquesInRAG(query: string): Promise<any[]> {
    try {
      return await RAGService.searchRelevantDocuments(query, 1, 10);
    } catch (error) {
      console.error('Error searching techniques in RAG:', error);
      return [];
    }
  }

  /**
   * Cria uma atividade correspondente a partir de uma técnica importada
   */
  private static async createActivityFromTechnique(
    savedTechnique: any, 
    techniqueData: TechniqueImportData
  ): Promise<void> {
    try {
      // Get organization ID
      const organization = await prisma.organization.findFirst();
      if (!organization) {
        throw new Error('No organization found');
      }

      // Check if activity already exists for this technique
      const existingActivity = await prisma.activity.findFirst({
        where: {
          organizationId: organization.id,
          refTechniqueId: savedTechnique.id
        }
      });

      if (existingActivity) {
        console.log(`⏭️ Activity already exists for technique: ${techniqueData.id}`);
        return;
      }

      // Create activity data
      const activityData = {
        organizationId: organization.id,
        type: 'TECHNIQUE' as const,
        title: techniqueData.title,
        description: techniqueData.description,
        equipment: techniqueData.defaultParams?.equipment || [],
        safety: techniqueData.defaultParams?.safety || null,
        adaptations: techniqueData.defaultParams?.adaptations || [],
        difficulty: this.mapDifficultyToNumber(techniqueData.difficulty),
        refTechniqueId: savedTechnique.id,
        defaultParams: techniqueData.defaultParams || {}
      };

      // Create the activity
      const activity = await prisma.activity.create({
        data: activityData
      });

      console.log(`✅ Activity created for technique: ${techniqueData.id} -> ${activity.id}`);

    } catch (activityError) {
      console.error(`Error creating activity for technique ${techniqueData.id}:`, activityError);
      // Don't throw error - technique import should continue even if activity creation fails
    }
  }
}
