import 'dotenv/config';
import { prisma } from '../src/utils/database.js';
import bcrypt from 'bcrypt';

async function importLorraine() {
  const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  const customerId = 'cus_000071448703';
  
  console.log('📥 Importando Lorraine para o sistema...\n');
  
  // Dados da Lorraine do Asaas
  const customer = {
    id: customerId,
    name: 'Lorraine C S M Barbosa Claudio',
    email: 'lorrainechrissouza@gmail.com',
    phone: '31988801030',
    cpfCnpj: '09348256610'
  };
  
  // Verificar se já existe
  const existing = await prisma.user.findFirst({
    where: { 
      email: customer.email.toLowerCase(),
      organizationId 
    }
  });
  
  if (existing) {
    console.log('⚠️ Lorraine já existe no sistema!');
    console.log('   ID:', existing.id);
    await prisma.$disconnect();
    return;
  }
  
  // Parsear nome
  const names = customer.name.trim().split(' ');
  const firstName = names[0];
  const lastName = names.slice(1).join(' ');
  
  // Gerar senha temporária
  const tempPassword = Math.random().toString(36).substring(2, 15);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  // Criar user e student
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone: customer.phone,
        cpf: customer.cpfCnpj,
        role: 'STUDENT',
        isActive: true,
        organizationId,
      },
    });
    
    const student = await tx.student.create({
      data: {
        userId: user.id,
        organizationId,
        category: 'ADULT',
        gender: 'FEMININO',
        physicalCondition: 'INICIANTE',
        specialNeeds: [],
        medicalConditions: `Imported from Asaas on ${new Date().toLocaleDateString('pt-BR')} - Customer ID: ${customerId}`,
        enrollmentDate: new Date(),
        isActive: true,
      },
    });
    
    return { user, student };
  });
  
  console.log('✅ Lorraine importada com sucesso!');
  console.log('   User ID:', result.user.id);
  console.log('   Student ID:', result.student.id);
  console.log('   Email:', result.user.email);
  console.log('   Senha temporária:', tempPassword);
  
  await prisma.$disconnect();
}

importLorraine().catch(console.error);
