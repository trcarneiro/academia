/**
 * Complete Server - Servidor com todas as funcionalidades
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { addServerExtensions } from './server-extensions.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper MIME types
app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Middleware to handle missing CSS files
import fs from 'fs';
app.use('/css', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'public', 'css', req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/css');
        res.sendFile(filePath);
    } else {
        // Return empty CSS for missing files
        res.setHeader('Content-Type', 'text/css');
        res.send('/* CSS file not found - serving empty CSS */');
    }
});

// Checkpoint module routes
app.get('/checkpoint.html', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    
    res.sendFile(path.join(__dirname, '..', 'public', 'checkpoint.html'));
});

app.get('/css/checkpoint.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'public', 'css', 'checkpoint.css'));
});

app.get('/js/checkpoint.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'public', 'js', 'checkpoint.js'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: '🥋 Complete Krav Maga Academy Server Running!',
        database: 'connected'
    });
});

// General stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        console.log('📊 Fetching general stats...');
        
        // Get students count
        const studentsCount = await prisma.student.count({
            where: { isActive: true }
        });
        
        // Get courses count
        const coursesCount = await prisma.course.count();
        
        // Get attendance today (using createdAt field)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const attendanceToday = await prisma.attendance.count({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        
        // Calculate monthly revenue (mock data for now)
        const monthlyRevenue = studentsCount * 150; // R$ 150 per student average
        
        const stats = {
            students: studentsCount,
            classes: coursesCount,
            revenue: monthlyRevenue,
            attendanceToday: attendanceToday
        };
        
        console.log('✅ Stats fetched successfully:', stats);
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats',
            message: error.message
        });
    }
});

// Import and use existing server logic from working-server.js
import { PrismaClient } from '@prisma/client';
import { FinancialService } from './financialService';

if (!global.prisma) {
    global.prisma = new PrismaClient();
    await global.prisma.$connect();
}
const prisma = global.prisma;

// Prisma client already initialized above

// Add server extensions
(async () => {
    await addServerExtensions(app);
})();

// ========================================
// STUDENTS ENDPOINTS
// ========================================

// GET /api/students - List all students (optimized)
app.get('/api/students', async (req, res) => {
    try {
        const { limit = 50, offset = 0, category, isActive } = req.query;
        
        // Cache organization ID lookup
        const orgId = process.env.ORG_ID || (await prisma.organization.findFirst()).id;
        if (!orgId) {
            throw new Error('No organization found');
        }
        
        const whereClause = {
            organizationId: orgId
        };
        
        if (category) whereClause.category = category;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';
        
        const students = await prisma.student.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        phone: true,
                        isActive: true
                    }
                },
                financialResponsible: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                _count: {
                    select: {
                        attendances: true,
                        evaluations: true,
                        progressions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        const totalCount = await prisma.student.count({ where: whereClause });

        res.json({
            success: true,
            data: students,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ GET /api/students error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students',
            message: error.message
        });
    }
});

// GET /api/students/:id - Get specific student (optimized)
app.get('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Add cache control headers
        res.set('Cache-Control', 'public, max-age=60');
        
        console.log('📥 GET /api/students/:id - Fetching student:', id);
        
        // Find student by ID
        const student = await prisma.student.findUnique({
            where: { id: String(id) },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found',
                message: `No student found with ID: ${id}`
            });
        }
        
        // Transform data for response
        const transformedStudent = {
            id: student.id,
            organizationId: student.organizationId,
            userId: student.userId,
            firstName: student.user?.firstName || student.firstName || '',
            lastName: student.user?.lastName || student.lastName || '',
            email: student.user?.email || student.email || '',
            phone: student.phone || '',
            cpf: student.cpf || '',
            birthDate: student.birthDate,
            category: student.category || 'ADULT',
            gender: student.gender || 'MASCULINO',
            physicalCondition: student.physicalCondition || 'INICIANTE',
            enrollmentDate: student.enrollmentDate || student.createdAt,
            medicalConditions: student.medicalConditions || '',
            emergencyContact: student.emergencyContact || '',
            specialNeeds: student.specialNeeds || [],
            totalXP: student.totalXP || 0,
            globalLevel: student.globalLevel || 1,
            currentStreak: student.currentStreak || 0,
            lastCheckinDate: student.lastCheckinDate,
            status: student.status || 'active',
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
        };
        
        res.json({
            success: true,
            data: transformedStudent
        });
        
    } catch (error) {
        console.error('❌ GET /api/students/:id error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student',
            message: error.message
        });
    }
});

// POST /api/students - Create new student
app.post('/api/students', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone = '',
            category = 'ADULT',
            gender = 'MASCULINO',
            cpf = ''
        } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'firstName, lastName, and email are required'
            });
        }

        // Get organization ID
        const org = await prisma.organization.findFirst();
        if (!org) {
            throw new Error('No organization found');
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    password: tempPassword, // In production, this should be hashed
                    organizationId: org.id,
                    role: 'STUDENT'
                }
            });

            // Create student
            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    organizationId: org.id,
                    category,
                    gender,
                    physicalCondition: 'INICIANTE',
                    specialNeeds: [],
                    enrollmentDate: new Date()
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatarUrl: true,
                            phone: true,
                            isActive: true
                        }
                    },
                    financialResponsible: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    _count: {
                        select: {
                            attendances: true,
                            evaluations: true,
                            progressions: true
                        }
                    }
                }
            });

            return student;
        });

        res.json({
            success: true,
            data: result,
            message: 'Student created successfully'
        });
    } catch (error) {
        console.error('❌ POST /api/students error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create student',
            message极抱歉，由于文件内容过长，我无法一次性处理整个文件。让我尝试另一种方法 - 我将只提取并修改订阅相关的部分，然后我们可以逐步应用这些更改。

<thinking>
我将专注于修改订阅端点部分，这是用户要求修复的内容。我将：

1. 添加缺失的订阅端点
2. 确保它们与FinancialService正确集成
3. 保持现有功能不变
</thinking>

<replace_in_file>
<path>servers/server-complete.js</path>
<diff>
------- SEARCH
// ========================================
// SUBSCRIPTION ENDPOINTS
// ========================================

// Initialize FinancialService with organization ID
let financialService;
(async () => {
    const org = await prisma.organization.findFirst();
    if (!org) {
        throw new Error('No organization found');
    }
    financialService = new FinancialService(org.id);
})();

// POST /api/subscriptions - Create new subscription
app.post('/api/subscriptions', async (req, res) => {
    try {
        const { studentId, planId, startDate, customPrice } = req.body;

        if (!studentId || !planId) {
            return res.status(400).json({
                success: false,
                error: 'studentId and planId are required'
            });
        }

        const subscription = await financialService.createSubscription({
            studentId,
            planId,
            startDate: startDate ? new Date(startDate) : undefined,
            customPrice
        });

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('❌ Error creating subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create subscription',
            message: error.message
        });
    }
});

// PUT /api/subscriptions/:id - Update subscription
app.put('/api/subscriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, status, customPrice } = req.body;

        const subscription = await financialService.updateSubscription(id, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
            customPrice
        });

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('❌ Error updating subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update subscription',
            message: error.message
        });
    }
});

// GET /api/students/:id/subscriptions - List student subscriptions
app.get('/api/students/:id/subscriptions', async (req, res) => {
    try {
        const { id } = req.params;
        const subscriptions = await financialService.getStudentSubscriptions(id);
        
        res.json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error('❌ Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscriptions',
            message: error.message
        });
    }
});

// GET /api/students/:id/subscriptions/:subscriptionId - Get specific subscription
=======
// ========================================
// SUBSCRIPTION ENDPOINTS
// ========================================

// Initialize FinancialService with organization ID
let financialService;
(async () => {
    const org = await prisma.organization.findFirst();
    if (!org) {
        throw new Error('No organization found');
    }
    financialService = new FinancialService(org.id);
})();

// POST /api/subscriptions - Create new subscription
app.post('/api/subscriptions', async (req, res) => {
    try {
        const { studentId, planId, startDate, customPrice } = req.body;

        if (!studentId || !planId) {
            return res.status(400).json({
                success: false,
                error: 'studentId and planId are required'
            });
        }

        const subscription = await financialService.createSubscription({
            studentId,
            planId,
            startDate: startDate ? new Date(startDate) : undefined,
            customPrice
        });

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('❌ Error creating subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create subscription',
            message: error.message
        });
    }
});

// PUT /api/subscriptions/:id - Update subscription
app.put('/api/subscriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, status, customPrice } = req.body;

        const subscription = await financialService.updateSubscription(id, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
            customPrice
        });

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('❌ Error updating subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update subscription',
            message: error.message
        });
    }
});

// GET /api/students/:id/subscriptions - List student subscriptions
app.get('/api/students/:id/subscriptions', async (req, res) => {
    try {
        const { id } = req.params;
        const subscriptions = await financialService.getStudentSubscriptions(id);
        
        res.json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error('❌ Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscriptions',
            message: error.message
        });
    }
});

// GET /api/students/:id/subscriptions/:subscriptionId - Get specific subscription
+++++++ REPLACE
</diff>
</replace_in_file>
