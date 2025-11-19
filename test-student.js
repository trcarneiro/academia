const {PrismaClient} = require('@prisma/client');
const mysql = require('mysql2/promise');

(async () => {
  const prisma = new PrismaClient();
  const conn = await mysql.createConnection({
    host: '67.205.159.161',
    user: '-WBA-Carneiro',
    password: 'Ojqemjeowt*a1',
    database: 'academia'
  });
  
  const [rows] = await conn.query('SELECT * FROM students LIMIT 1');
  const row = rows[0];
  
  const cleaned = {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    emergencyContact: row.emergencyContact,
    medicalConditions: row.medicalConditions,
    category: row.category,
    gender: row.gender,
    age: row.age,
    physicalCondition: row.physicalCondition,
    specialNeeds: JSON.parse(row.specialNeeds),
    totalXP: row.totalXP,
    globalLevel: row.globalLevel,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastCheckinDate: row.lastCheckinDate,
    preferredDays: JSON.parse(row.preferredDays),
    preferredTimes: JSON.parse(row.preferredTimes),
    notifications: Boolean(row.notifications),
    enrollmentDate: new Date(row.enrollmentDate),
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    financialResponsibleId: row.financialResponsibleId,
    registrationNumber: row.registrationNumber,
    financialResponsibleStudentId: row.financialResponsibleStudentId
  };
  
  try {
    await prisma.student.create({ data: cleaned });
    console.log('✅ SUCCESS');
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
  
  await conn.end();
  await prisma.$disconnect();
})();
