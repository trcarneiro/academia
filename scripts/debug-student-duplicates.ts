
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const cpf = '08928030617';
    const namePart = 'Ana Paula';

    console.log(`Searching for students with CPF includes '${cpf}' or Name includes '${namePart}'...`);

    const students = await prisma.student.findMany({
        where: {
            OR: [
                {
                    user: {
                        cpf: { contains: cpf }
                    }
                },
                {
                    user: {
                        firstName: { contains: namePart }
                    }
                }
            ]
        },
        include: {
            user: true,
            _count: {
                select: {
                    attendances: true,
                    subscriptions: true,
                    enrollments: true
                }
            }
        }
    });

    console.log(`Found ${students.length} students.`);

    students.forEach(s => {
        console.log('------------------------------------------------');
        console.log(`ID: ${s.id}`);
        console.log(`Name: ${s.user.firstName} ${s.user.lastName}`);
        console.log(`CPF: ${s.user.cpf}`);
        console.log(`Email: ${s.user.email}`);
        console.log(`Active: ${s.isActive}`);
        console.log(`Created At: ${s.createdAt}`);
        console.log(`Asaas ID: ${s.asaasCustomerId}`);
        console.log(`Counts: Attendances=${s._count.attendances}, Subs=${s._count.subscriptions}, Enrollments=${s._count.enrollments}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
