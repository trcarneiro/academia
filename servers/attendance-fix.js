// POST /api/attendance - Create attendance record (check-in) - FIXED VERSION
app.post('/api/attendance', async (req, res) => {
    try {
        const { studentId, date, present = true, method = 'MANUAL' } = req.body;
        
        console.log('📍 Recebendo check-in:', { studentId, date, present, method });
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }
        
        // Check if student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        // Get organization
        const org = await prisma.organization.findFirst();
        if (!org) {
            return res.status(500).json({
                success: false,
                error: 'No organization found'
            });
        }
        
        // Get or create a default class
        let defaultClass = await prisma.class.findFirst({
            where: {
                organizationId: org.id,
                isActive: true
            }
        });
        
        // Create a default class if none exists
        if (!defaultClass) {
            console.log('🏫 Criando classe padrão...');
            try {
                defaultClass = await prisma.class.create({
                    data: {
                        organizationId: org.id,
                        name: 'Classe Geral',
                        description: 'Classe padrão para check-ins',
                        isActive: true,
                        maxStudents: 100,
                        duration: 60,
                        level: 'BEGINNER'
                    }
                });
            } catch (classError) {
                console.error('❌ Erro ao criar classe:', classError);
                // Try to get existing class again in case of race condition
                defaultClass = await prisma.class.findFirst({
                    where: {
                        organizationId: org.id,
                        isActive: true
                    }
                });
                if (!defaultClass) {
                    throw new Error('Não foi possível criar ou encontrar uma classe padrão');
                }
            }
        }
        
        // Check if attendance already exists for today
        const today = date ? new Date(date) : new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                studentId: studentId,
                classId: defaultClass.id,
                checkInTime: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        
        if (existingAttendance) {
            return res.json({
                success: true,
                data: existingAttendance,
                message: `Check-in já realizado hoje para ${student.user?.firstName} ${student.user?.lastName}`
            });
        }
        
        // Create new attendance record
        const attendanceRecord = await prisma.attendance.create({
            data: {
                organizationId: org.id,
                studentId: studentId,
                classId: defaultClass.id,
                status: present ? 'PRESENT' : 'ABSENT',
                checkInTime: date ? new Date(date) : new Date(),
                checkInMethod: method === 'QUICK_CHECKIN' ? 'QR_CODE' : 'MANUAL'
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Check-in realizado com sucesso:', attendanceRecord.id);
        
        res.json({
            success: true,
            data: attendanceRecord,
            message: `Check-in realizado para ${student.user?.firstName} ${student.user?.lastName}`
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar registro de presença:', error);
        
        // Detailed error logging
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});