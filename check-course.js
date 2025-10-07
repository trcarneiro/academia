const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourse() {
    try {
        const courseId = '5f241bc5-62d6-4f83-9dad-02ca019dbd94';
        
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                name: true,
                isActive: true,
                organizationId: true,
                _count: {
                    select: {
                        lessonPlans: true
                    }
                }
            }
        });
        
        if (course) {
            console.log('✅ Curso encontrado:');
            console.log(JSON.stringify(course, null, 2));
        } else {
            console.log('❌ Curso NÃO encontrado com ID:', courseId);
            
            // Listar todos os cursos
            const allCourses = await prisma.course.findMany({
                select: {
                    id: true,
                    name: true,
                    isActive: true
                }
            });
            
            console.log('\n📚 Cursos disponíveis no banco:');
            console.log(JSON.stringify(allCourses, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkCourse();
