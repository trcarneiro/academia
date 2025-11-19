import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicateStudents() {
  console.log('🔍 Verificando alunos duplicados...\n');
  
  // 1. Buscar todos os alunos
  const students = await prisma.student.findMany({
    include: {
      user: true
    },
    orderBy: [
      { user: { firstName: 'asc' } },
      { user: { lastName: 'asc' } }
    ]
  });
  
  console.log(`📊 Total de alunos: ${students.length}\n`);
  
  // 2. Agrupar por email/nome
  const emailGroups = new Map<string, any[]>();
  const nameGroups = new Map<string, any[]>();
  
  students.forEach(student => {
    const email = student.user.email.toLowerCase();
    const fullName = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
    
    // Agrupar por email
    if (!emailGroups.has(email)) {
      emailGroups.set(email, []);
    }
    emailGroups.get(email)!.push(student);
    
    // Agrupar por nome
    if (!nameGroups.has(fullName)) {
      nameGroups.set(fullName, []);
    }
    nameGroups.get(fullName)!.push(student);
  });
  
  // 3. Encontrar duplicatas por email
  console.log('📧 DUPLICATAS POR EMAIL:\n');
  let emailDuplicates = 0;
  emailGroups.forEach((group, email) => {
    if (group.length > 1) {
      emailDuplicates++;
      console.log(`❌ Email: ${email}`);
      group.forEach(s => {
        console.log(`   - ID: ${s.id} | Nome: ${s.user.firstName} ${s.user.lastName} | Criado: ${s.createdAt}`);
      });
      console.log('');
    }
  });
  
  if (emailDuplicates === 0) {
    console.log('✅ Nenhuma duplicata por email\n');
  } else {
    console.log(`⚠️  Total: ${emailDuplicates} emails duplicados\n`);
  }
  
  // 4. Encontrar duplicatas por nome
  console.log('👤 DUPLICATAS POR NOME:\n');
  let nameDuplicates = 0;
  nameGroups.forEach((group, name) => {
    if (group.length > 1) {
      nameDuplicates++;
      console.log(`❌ Nome: ${name}`);
      group.forEach(s => {
        console.log(`   - ID: ${s.id} | Email: ${s.user.email} | Criado: ${s.createdAt}`);
      });
      console.log('');
    }
  });
  
  if (nameDuplicates === 0) {
    console.log('✅ Nenhuma duplicata por nome\n');
  } else {
    console.log(`⚠️  Total: ${nameDuplicates} nomes duplicados\n`);
  }
  
  // 5. Verificar users sem students
  const allUsers = await prisma.user.findMany({
    include: {
      student: true
    }
  });
  
  const usersWithMultipleStudents = allUsers.filter(u => u.student && u.student.length > 1);
  
  console.log('🔗 USERS COM MÚLTIPLOS STUDENTS:\n');
  if (usersWithMultipleStudents.length > 0) {
    usersWithMultipleStudents.forEach(user => {
      console.log(`❌ User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   IDs dos students: ${user.student.map(s => s.id).join(', ')}\n`);
    });
  } else {
    console.log('✅ Nenhum user com múltiplos students\n');
  }
  
  // 6. Resumo
  console.log('📋 RESUMO:');
  console.log(`   Total de alunos: ${students.length}`);
  console.log(`   Emails únicos: ${emailGroups.size}`);
  console.log(`   Nomes únicos: ${nameGroups.size}`);
  console.log(`   Duplicatas por email: ${emailDuplicates}`);
  console.log(`   Duplicatas por nome: ${nameDuplicates}`);
  console.log(`   Users com múltiplos students: ${usersWithMultipleStudents.length}`);
  
  await prisma.$disconnect();
}

checkDuplicateStudents().catch(console.error);
