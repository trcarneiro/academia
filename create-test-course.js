/**
 * Script para criar um curso de teste padrão no banco de dados.
 * Uso: node create-test-course.js
 * 
 * Este script é destinado apenas para fins de desenvolvimento e teste,
 * especificamente para o módulo de planos onde é necessário ter cursos
 * disponíveis para associação.
 */

// Importa o Prisma Client
const { PrismaClient } = require('@prisma/client');

// Inicializa o Prisma Client
const prisma = new PrismaClient();

// Função assíncrona para criar o curso
async function createTestCourse() {
  try {
    console.log('🔍 Buscando organização padrão...');
    
    // Busca a primeira organização ativa (assumindo que exista uma para testes)
    const organization = await prisma.organization.findFirst({
      where: { isActive: true }
    });

    if (!organization) {
      throw new Error('❌ Nenhuma organização ativa encontrada. Crie uma organização primeiro.');
    }

    console.log(`✅ Organização encontrada: ${organization.name} (${organization.id})`);

    // Verifica se o curso de teste já existe para evitar erros
    const existingCourse = await prisma.course.findFirst({
        where: {
            organizationId: organization.id,
            name: 'Curso de Teste Padrão'
        }
    });

    if (existingCourse) {
        console.log(`⚠️ Curso 'Curso de Teste Padrão' já existe para a organização '${organization.name}'.`);
        console.log(`   ID: ${existingCourse.id}`);
        return;
    }

    console.log('➕ Criando curso de teste...');
    
    // Cria o curso de teste
    const testCourse = await prisma.course.create({
      data: {
        organizationId: organization.id,
        name: 'Curso de Teste Padrão',
        description: 'Curso criado para testes do módulo de planos.',
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
    console.log(`   Organização: ${organization.name}`);

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
console.log('🚀 Iniciando script de criação de curso de teste...');
createTestCourse();