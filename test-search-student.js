// Test student search
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
  const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  const search = '068';
  
  try {
    console.log('Testing search with:', search);
    
    const where = { organizationId };
    
    if (search && search.length >= 2) {
      const searchClean = search.replace(/\D/g, '');
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
      
      if (searchClean.length >= 3) {
        where.OR.push({ user: { cpf: { contains: searchClean, mode: 'insensitive' } } });
      }
    }
    
    console.log('Where clause:', JSON.stringify(where, null, 2));
    
    const students = await prisma.student.findMany({
      where,
      include: {
        user: true,
        biometricData: {
          select: { photoUrl: true }
        },
        _count: {
          select: {
            attendances: true,
            subscriptions: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      },
      orderBy: [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
        { createdAt: 'desc' }
      ],
    });
    
    console.log('✅ Success! Found', students.length, 'students');
    students.forEach(s => {
      console.log('-', s.user.firstName, s.user.lastName, s.user.cpf);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();
