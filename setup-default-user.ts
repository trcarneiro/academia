import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDefaultUserAndOrganization() {
  try {
    console.log('🔧 Verificando organizações existentes...');
    
    // Verificar organizações
    const organizations = await prisma.organization.findMany();
    console.log(`📊 Organizações encontradas: ${organizations.length}`);
    
    let defaultOrg;
    
    if (organizations.length === 0) {
      // Criar organização padrão
      console.log('🏢 Criando organização padrão...');
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Academia Krav Maga',
          slug: 'academia-krav-maga',
          email: 'contato@academiakravmaga.com.br',
          phone: '(11) 99999-9999',
          address: 'Rua das Artes Marciais, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          isActive: true
        }
      });
      console.log('✅ Organização criada:', defaultOrg.name);
    } else {
      defaultOrg = organizations[0];
      console.log('✅ Usando organização existente:', defaultOrg.name);
    }
    
    // Verificar usuários
    const users = await prisma.user.findMany();
    console.log(`👥 Usuários encontrados: ${users.length}`);
    
    let adminUser;
    
    if (users.length === 0) {
      // Criar usuário administrador
      console.log('👤 Criando usuário administrador...');
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@academiakravmaga.com.br',
          firstName: 'Administrador',
          lastName: 'Sistema',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'ADMIN',
          organizationId: defaultOrg.id,
          isActive: true
        }
      });
      console.log('✅ Usuário administrador criado:', adminUser.email);
    } else {
      adminUser = users[0];
      console.log('✅ Usando usuário existente:', adminUser.email);
      
      // Verificar se o usuário tem organização
      if (!adminUser.organizationId) {
        console.log('🔗 Vinculando usuário à organização...');
        adminUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { organizationId: defaultOrg.id }
        });
        console.log('✅ Usuário vinculado à organização');
      }
    }
    
    // Verificar unidades
    const units = await prisma.unit.findMany();
    console.log(`🏢 Unidades encontradas: ${units.length}`);
    
    if (units.length === 0) {
      // Criar unidade padrão
      console.log('🏢 Criando unidade padrão...');
      const defaultUnit = await prisma.unit.create({
        data: {
          name: 'Unidade Principal',
          address: 'Rua das Artes Marciais, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          organizationId: defaultOrg.id,
          capacity: 100,
          totalMats: 2,
          isActive: true
        }
      });
      console.log('✅ Unidade criada:', defaultUnit.name);
      
      // Criar área de treino padrão
      console.log('🏃 Criando área de treino padrão...');
      const defaultTrainingArea = await prisma.trainingArea.create({
        data: {
          name: 'Dojo Principal',
          description: 'Área principal de treino',
          unitId: defaultUnit.id,
          areaType: 'DOJO',
          capacity: 30,
          flooring: 'TATAMI',
          dimensions: '10m x 10m',
          equipment: ['Tatames', 'Luvas de treino', 'Focos'],
          isActive: true
        }
      });
      console.log('✅ Área de treino criada:', defaultTrainingArea.name);
    }
    
    // Criar instrutor padrão se não existir
    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' }
    });
    
    if (instructors.length === 0) {
      console.log('👨‍🏫 Criando instrutor padrão...');
      
      const defaultInstructor = await prisma.user.create({
        data: {
          email: 'instrutor@academiakravmaga.com.br',
          firstName: 'Professor',
          lastName: 'Marcus',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'INSTRUCTOR',
          organizationId: defaultOrg.id,
          isActive: true
        }
      });
      console.log('✅ Instrutor criado:', `${defaultInstructor.firstName} ${defaultInstructor.lastName}`);
    }
    
    console.log('\n🎉 Setup completo!');
    console.log('📋 Resumo:');
    console.log(`   Organização: ${defaultOrg.name} (ID: ${defaultOrg.id})`);
    console.log(`   Usuário Admin: ${adminUser.email}`);
    console.log(`   Senha Admin: password`);
    console.log('   Todos os registros serão automaticamente vinculados a esta organização.');
    
    return {
      organization: defaultOrg,
      user: adminUser
    };
    
  } catch (error) {
    console.error('❌ Erro no setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar setup
setupDefaultUserAndOrganization()
  .then((result) => {
    console.log('\n✅ Setup finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha no setup:', error);
    process.exit(1);
  });
