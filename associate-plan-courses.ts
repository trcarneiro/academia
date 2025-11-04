import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function associatePlanCourses() {
    try {
        // Associar plano "Pacote 4 Aulas Mensais" com cursos de Krav Maga
        const planId = 'b068adaa-8774-40a9-af68-51dd33f4be43'
        const courseIds = [
            '3f54b982-09f2-4795-a164-aecbd52340da', // Krav Maga Iniciante
            '55b98765-eca8-4022-83fd-bfe108370c22'  // Krav Maga Intermediário
        ]

        console.log('🔗 Associando plano com cursos...')

        for (const courseId of courseIds) {
            await prisma.planCourse.upsert({
                where: {
                    planId_courseId: {
                        planId,
                        courseId
                    }
                },
                update: {},
                create: {
                    planId,
                    courseId
                }
            })
        }

        console.log('✅ Associações criadas com sucesso!')

        // Verificar as associações criadas
        const associations = await prisma.planCourse.findMany({
            where: {
                planId
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        level: true
                    }
                }
            }
        })

        console.log('📚 Cursos associados ao plano:')
        associations.forEach(assoc => {
            console.log(`  - ${assoc.course.name} (${assoc.course.level})`)
        })

    } catch (error) {
        console.error('❌ Erro ao associar plano com cursos:', error)
    } finally {
        await prisma.$disconnect()
    }
}

associatePlanCourses()
