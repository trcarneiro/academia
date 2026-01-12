
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
});

async function main() {
    const studentId = '7518e23c-92b9-42c0-bb16-400652f0ef50';

    console.log(`Attempting to delete student ${studentId}...`);

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                attendances: true,
                subscriptions: true,
                biometricData: true,
                user: true
            }
        });

        if (!student) {
            console.log('Student not found.');
            return;
        }

        console.log('Student loaded:', {
            id: student.id,
            name: student.user.firstName,
            attendances: student.attendances.length,
            subscriptions: student.subscriptions.length,
            biometricData: student.biometricData ? 'Present' : 'None'
        });

        if (student.attendances.length > 0 || student.subscriptions.length > 0) {
            console.log('Student has history, likely mapped to the "Check history" block in API.');
        }

        console.log('Starting transaction...');
        await prisma.$transaction(async (tx) => {
            // Replicating backend logic
            console.log('Deleting enrollments...');
            await tx.courseEnrollment.deleteMany({ where: { studentId } });

            console.log('Deleting subscriptions...');
            await tx.studentSubscription.deleteMany({ where: { studentId } });

            console.log('Deleting attendances...');
            await tx.attendance.deleteMany({ where: { studentId } });

            console.log('Deleting turma associations...');
            await tx.turmaStudent.deleteMany({ where: { studentId } });

            console.log('Deleting student...');
            await tx.student.delete({ where: { id: studentId } });
        });
        console.log('Transaction completed successfully.');

    } catch (error) {
        console.error('DELETE FAILED:', error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
