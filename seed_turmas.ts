
import 'dotenv/config';
import { prisma } from './src/utils/database';
import * as bcrypt from 'bcrypt';

const SCHEDULE_DATA = [
    // Tatame 1 (Jiu-Jitsu) - Ter & Qui
    {
        courseName: "Jiu-Jitsu",
        trainingAreaName: "Tatame 1",
        turmaName: "Jiu-Jitsu Adulto - Ter/Qui 12h",
        category: "ADULT",
        days: [2, 4],
        start: "12:00",
        end: "13:00"
    },
    {
        courseName: "Jiu-Jitsu",
        trainingAreaName: "Tatame 1",
        turmaName: "Jiu-Jitsu Kids 1 - Ter/Qui 16h30",
        category: "KIDS",
        days: [2, 4],
        start: "16:30",
        end: "17:00"
    },
    {
        courseName: "Jiu-Jitsu",
        trainingAreaName: "Tatame 1",
        turmaName: "Jiu-Jitsu Kids 2-3 - Ter/Qui 17h15",
        category: "KIDS",
        days: [2, 4],
        start: "17:15",
        end: "18:00"
    },
    {
        courseName: "Jiu-Jitsu",
        trainingAreaName: "Tatame 1",
        turmaName: "Jiu-Jitsu Adulto - Ter/Qui 19h",
        category: "ADULT",
        days: [2, 4],
        start: "19:00",
        end: "20:00"
    },
    // Tatame 2 (Defesa Pessoal) - Seg & Qua
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Kids 1 - Seg/Qua 16h30",
        category: "KIDS",
        days: [1, 3],
        start: "16:30",
        end: "17:00"
    },
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Kids 2-3 - Seg/Qua 18h15",
        category: "KIDS",
        days: [1, 3],
        start: "18:15",
        end: "19:00"
    },
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Adulto - Seg/Qua 19h",
        category: "ADULT",
        days: [1, 3],
        start: "19:00",
        end: "20:00"
    },
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Adulto - Seg/Qua 20h",
        category: "ADULT",
        days: [1, 3],
        start: "20:00",
        end: "21:00"
    },
    // Tatame 2 - Ter & Qui
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Adulto - Ter/Qui 07h",
        category: "ADULT",
        days: [2, 4],
        start: "07:00",
        end: "08:00"
    },
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Adulto - Ter/Qui 12h",
        category: "ADULT",
        days: [2, 4],
        start: "12:00",
        end: "13:00"
    },
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Adulto - Ter/Qui 18h",
        category: "ADULT",
        days: [2, 4],
        start: "18:00",
        end: "19:00"
    },
    {
        courseName: "Boxe",
        trainingAreaName: "Tatame 2",
        turmaName: "Boxe Adulto - Ter/Qui 19h",
        category: "ADULT",
        days: [2, 4],
        start: "19:00",
        end: "20:00"
    },
    {
        courseName: "Boxe",
        trainingAreaName: "Tatame 2",
        turmaName: "Boxe Adulto - Ter/Qui 20h",
        category: "ADULT",
        days: [2, 4],
        start: "20:00",
        end: "21:00"
    },
    // Sáb
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Kids 2-3 - Sab 09h45",
        category: "KIDS",
        days: [6], // Sat
        start: "09:45",
        end: "10:30"
    },
    {
        courseName: "Defesa Pessoal",
        trainingAreaName: "Tatame 2",
        turmaName: "Defesa Pessoal Adulto - Sab 10h30",
        category: "ADULT",
        days: [6],
        start: "10:30",
        end: "11:30"
    }
];

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Get/Create Organization
    let org = await prisma.organization.findFirst();
    if (!org) {
        org = await prisma.organization.create({
            data: { name: "Academia Smart Defence", slug: "smart-defence", country: "Brazil" }
        });
    }

    // 2. Get/Create Unit
    const unitName = "Unidade Santo Agostinho";
    let unit = await prisma.unit.findUnique({
        where: { organizationId_name: { organizationId: org.id, name: unitName } }
    });
    if (!unit) {
        unit = await prisma.unit.create({
            data: {
                organizationId: org.id,
                name: unitName,
                address: "Rua Juiz de Fora",
                city: "Belo Horizonte",
                state: "MG",
                zipCode: "30180-000",
            }
        });
    }

    // 3. Create Training Areas
    const areaNames = ["Tatame 1", "Tatame 2"];
    const areas: Record<string, any> = {};
    for (const areaName of areaNames) {
        let area = await prisma.trainingArea.findUnique({
            where: { unitId_name: { unitId: unit.id, name: areaName } }
        });
        if (!area) {
            area = await prisma.trainingArea.create({
                data: { unitId: unit.id, name: areaName, areaType: "MAT", equipment: "Tatames" }
            });
        }
        areas[areaName] = area;
    }

    // 4. Get/Create Instructor
    const instructorEmail = "instrutor@smartdefence.local";
    let user = await prisma.user.findFirst({ where: { email: instructorEmail, organizationId: org.id } });

    if (!user) {
        console.log("Creating user...");
        const hashedPassword = await bcrypt.hash("123456", 10);
        user = await prisma.user.create({
            data: {
                organizationId: org.id,
                email: instructorEmail,
                password: hashedPassword,
                firstName: "Instrutor",
                lastName: "Padrão",
                canApproveCategories: "",
                isActive: true
            }
        });
    }

    // Update role/instructor profile
    if (user) {
        if (user.role !== 'INSTRUCTOR') {
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'INSTRUCTOR' }
            });
        }

        let instructor = await prisma.instructor.findUnique({ where: { userId: user.id } });
        if (!instructor) {
            try {
                await prisma.instructor.create({
                    data: {
                        organizationId: org.id,
                        userId: user.id,
                        specializations: "Jiu-Jitsu, Krav Maga, Boxe",
                        certifications: "Faixa Preta",
                        martialArts: "Krav Maga",
                        preferredUnits: unit.id
                    }
                });
            } catch (e) { console.log("Instructor profile exists or error:", e); }
        }
    }

    // 5. Create Courses
    const courseNames = ["Jiu-Jitsu", "Defesa Pessoal", "Boxe"];
    const courses: Record<string, any> = {};
    for (const cName of courseNames) {
        let course = await prisma.course.findFirst({
            where: { organizationId: org.id, name: cName }
        });
        if (!course) {
            console.log(`Creating Course ${cName}...`);
            course = await prisma.course.create({
                data: {
                    organizationId: org.id,
                    name: cName,
                    description: cName,
                    level: "BEGINNER",
                    duration: 60,
                    totalClasses: 100,
                    category: "ADULT",
                    prerequisites: "-", // ADDED
                    objectives: "-", // ADDED
                    requirements: "-" // ADDED
                }
            });
        }
        courses[cName] = course;
    }

    // 6. Create Turmas
    for (const data of SCHEDULE_DATA) {
        if (!courses[data.courseName]) continue;

        const scheduleJson = JSON.stringify(data.days.map(d => ({
            dayOfWeek: d,
            startTime: data.start,
            endTime: data.end
        })));

        let turma = await prisma.turma.findFirst({
            where: { organizationId: org.id, name: data.turmaName }
        });

        if (!turma) {
            console.log(`Creating Turma: ${data.turmaName}`);
            await prisma.turma.create({
                data: {
                    organizationId: org.id,
                    courseId: courses[data.courseName].id,
                    name: data.turmaName,
                    classType: "COLLECTIVE",
                    status: "ACTIVE",
                    instructorId: user!.id,
                    maxStudents: 30,
                    startDate: new Date(),
                    schedule: scheduleJson,
                    unitId: unit.id,
                    room: areas[data.trainingAreaName]?.name || "Sala",
                    trainingAreaId: areas[data.trainingAreaName]?.id,
                    isActive: true
                }
            });
        }
    }

    console.log("🏁 Seed completed successfully!");
}

seed()
    .catch((e) => {
        console.error("Critical error in seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
