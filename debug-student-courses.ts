import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugStudentCourses() {
    try {
        const studentId = 'daf64ff0-1c1f-4f10-8228-7e1bac509104'
        
        console.log('🔍 Verificando StudentCourses...')
        
        const studentCourses = await prisma.studentCourse.findMany({
            where: {
                studentId
            },
            include: {
                course: true,
                class: true
            }
        })

        console.log(`📚 Encontradas ${studentCourses.length} relações StudentCourse:`)
        
        studentCourses.forEach((sc, index) => {
            console.log(`\n${index + 1}. StudentCourse ID: ${sc.id}`)
            console.log(`   Status: ${sc.status}`)
            console.log(`   Course: ${sc.course?.name || 'NULL'} (${sc.courseId})`)
            console.log(`   Class: ${sc.class?.title || 'NULL'} (${sc.classId})`)
            console.log(`   Start Date: ${sc.startDate}`)
        })

        // Verificar se os cursos existem
        console.log('\n🎓 Verificando cursos:')
        const courses = await prisma.course.findMany({
            where: {
                id: {
                    in: studentCourses.map(sc => sc.courseId)
                }
            }
        })
        courses.forEach(course => {
            console.log(`  - ${course.name} (${course.id})`)
        })

        // Verificar se as classes existem  
        console.log('\n🏫 Verificando classes:')
        const classes = await prisma.class.findMany({
            where: {
                id: {
                    in: studentCourses.map(sc => sc.classId)
                }
            }
        })
        classes.forEach(cls => {
            console.log(`  - ${cls.title} (${cls.id})`)
        })

    } catch (error) {
        console.error('❌ Erro:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugStudentCourses()
