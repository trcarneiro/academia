import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createClasses() {
    try {
        const organizationId = 'd961f738-9552-4385-8c1d-e10d8b1047e5'
        
        // Primeiro, vamos verificar se há instrutores
        const instructors = await prisma.instructor.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        })

        if (instructors.length === 0) {
            console.log('📝 Criando usuário e instrutor padrão...')
            
            // Criar usuário primeiro
            const user = await prisma.user.create({
                data: {
                    organizationId,
                    firstName: 'Professor',
                    lastName: 'Marcus',
                    email: 'marcus@academia.com',
                    password: 'temp123',
                    phone: '(11) 99999-9999',
                    role: 'INSTRUCTOR',
                    isActive: true
                }
            })

            // Criar instrutor
            await prisma.instructor.create({
                data: {
                    organizationId,
                    userId: user.id,
                    specializations: ['Krav Maga'],
                    certifications: ['Faixa Preta'],
                    martialArts: ['Krav Maga'],
                    isActive: true
                }
            })
        }

        const instructor = await prisma.instructor.findFirst({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })

        console.log('👨‍🏫 Instrutor encontrado:', `${instructor?.user.firstName} ${instructor?.user.lastName}`)

        // Criar turmas para os cursos
        const courses = [
            {
                id: '3f54b982-09f2-4795-a164-aecbd52340da',
                name: 'Krav Maga Iniciante'
            },
            {
                id: '55b98765-eca8-4022-83fd-bfe108370c22', 
                name: 'Krav Maga Intermediário'
            }
        ]

        console.log('🏫 Criando turmas...')

        for (const course of courses) {
            // Turma da manhã
            await prisma.class.create({
                data: {
                    organizationId,
                    instructorId: instructor!.id,
                    courseId: course.id,
                    title: `${course.name} - Manhã`,
                    description: `Turma matinal de ${course.name}`,
                    date: new Date('2025-09-05'),
                    startTime: new Date('2025-09-05T09:00:00'),
                    endTime: new Date('2025-09-05T10:00:00'),
                    status: 'SCHEDULED',
                    maxStudents: 20,
                    actualStudents: 0
                }
            })

            // Turma da noite
            await prisma.class.create({
                data: {
                    organizationId,
                    instructorId: instructor!.id,
                    courseId: course.id,
                    title: `${course.name} - Noite`,
                    description: `Turma noturna de ${course.name}`,
                    date: new Date('2025-09-05'),
                    startTime: new Date('2025-09-05T19:00:00'),
                    endTime: new Date('2025-09-05T20:00:00'),
                    status: 'SCHEDULED',
                    maxStudents: 20,
                    actualStudents: 0
                }
            })
        }

        console.log('✅ Turmas criadas com sucesso!')

        // Listar turmas criadas
        const classes = await prisma.class.findMany({
            where: { organizationId },
            include: {
                course: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        })

        console.log('🕐 Turmas disponíveis:')
        classes.forEach(cls => {
            console.log(`  - ${cls.title} (${cls.course.name}) - ${cls.startTime.toLocaleTimeString()}`)
        })

    } catch (error) {
        console.error('❌ Erro ao criar turmas:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createClasses()
