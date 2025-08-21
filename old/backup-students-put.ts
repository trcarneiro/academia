// Backup do endpoint PUT original que precisa ser corrigido
// O problema é que Student model não tem firstName, lastName, email, phone
// Esses campos estão no User model relacionado

// Código original problemático:
const student = await prisma.student.update({
  where: { id },
  data: {
    firstName: body.firstName,      // ❌ ERRO: não existe em Student
    lastName: body.lastName,        // ❌ ERRO: não existe em Student  
    email: body.email,              // ❌ ERRO: não existe em Student
    phone: body.phone,              // ❌ ERRO: não existe em Student
    category: body.category,        // ✅ OK: existe em Student
    emergencyContact: body.emergencyContact,  // ✅ OK: existe em Student
    medicalConditions: body.medicalConditions, // ✅ OK: existe em Student
    isActive: body.isActive         // ✅ OK: existe em Student
  } as any
});

// Código correto que deve ser aplicado:
// 1. Buscar o student para acessar o userId
// 2. Atualizar campos do User separadamente
// 3. Atualizar campos do Student separadamente
