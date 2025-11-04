import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testStudentCoursesQuery() {
    try {
        const studentId = 'daf64ff0-1c1f-4f10-8228-7e1bac509104'
        
        console.log('🔍 Testando a mesma query que o serviço usa...')
        
        const studentCourses = await prisma.studentCourse.findMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        duration: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        date: true,
                        startTime: true,
                        endTime: true,
                        status: true
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        })

        console.log(`📚 Resultado da query:`)
        console.log(JSON.stringify(studentCourses, null, 2))

    } catch (error) {
        console.error('❌ Erro na query:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testStudentCoursesQuery()
