/**
 * Script para criar um curso de teste padrão no banco de dados,
 * associado à organização correta para ser visível pela API.
 * Uso: node create-test-course-for-api.js
 * 
 * Este script é destinado apenas para fins de desenvolvimento e teste,
 * especificamente para o módulo de planos onde é necessário ter cursos
 * disponíveis para associação. Ele usa o organizationId hardcoded
 * que a API espera.
 */

// Importa o Prisma Client
const { PrismaClient } = require('@prisma/client');

// Inicializa o Prisma Client
const prisma = new PrismaClient();

// ID da organização usado pela API (hardcoded em courseController.ts)
const ORGANIZATION_ID_FOR_API = '1e053e35-a3a8-4d29-a51e-1b78346a4b66';

// Função assíncrona para criar o curso
async function createTestCourseForApi() {
  try {
    console.log('🔍 Verificando organização esperada pela API...');
    
    // Verifica se a organização existe
    const organization = await prisma.organization.findUnique({
      where: { id: ORGANIZATION_ID_FOR_API }
    });

    if (!organization) {
      throw new Error(`❌ Organização com ID ${ORGANIZATION_ID_FOR_API} não encontrada. Ela é requerida pela API.`);
    }

    console.log(`✅ Organização encontrada: ${organization.name} (${organization.id})`);

    // Verifica se o curso de teste já existe para evitar erros
    const existingCourse = await prisma.course.findFirst({
        where: {
            organizationId: ORGANIZATION_ID_FOR_API,
            name: 'Curso de Teste Padrão (API)'
        }
    });

    if (existingCourse) {
        console.log(`⚠️ Curso 'Curso de Teste Padrão (API)' já existe para a organização '${organization.name}'.`);
        console.log(`   ID: ${existingCourse.id}`);
        return;
    }

    console.log('➕ Criando curso de teste associado à organização correta...');
    
    // Cria o curso de teste
    const testCourse = await prisma.course.create({
      data: {
        organizationId: ORGANIZATION_ID_FOR_API,
        name: 'Curso de Teste Padrão (API)',
        description: 'Curso criado para testes do módulo de planos, visível pela API.',
        level: 'BEGINNER', // Usando um valor do enum CourseLevel
        duration: 30, // 30 dias
        classesPerWeek: 2,
        totalClasses: 8,
        minAge: 16,
        category: 'ADULT', // Usando um valor do enum StudentCategory
        orderIndex: 999, // Colocar no final da lista
        isActive: true
      }
    });

    console.log(`✅ Curso de teste criado com sucesso!`);
    console.log(`   ID: ${testCourse.id}`);
    console.log(`   Nome: ${testCourse.name}`);
    console.log(`   Organização ID: ${testCourse.organizationId} (${organization.name})`);

  } catch (error) {
    console.error('❌ Erro ao criar curso de teste:', error.message);
    if (error.code) {
      console.error(`   Código do erro: ${error.code}`);
    }
    process.exit(1); // Sai com código de erro
  } finally {
    // Fecha a conexão com o banco de dados
    await prisma.$disconnect();
  }
}

// Executa a função principal
console.log('🚀 Iniciando script de criação de curso de teste (para API)...');
createTestCourseForApi();