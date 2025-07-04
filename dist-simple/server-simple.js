"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const client_1 = require("@prisma/client");
// Initialize Prisma
const prisma = new client_1.PrismaClient();
// Initialize Fastify
const server = (0, fastify_1.default)({
    logger: {
        level: 'info'
    }
});
const start = async () => {
    try {
        // Register CORS
        await server.register(cors_1.default, {
            origin: ["http://localhost:3000", "http://localhost:3001"],
            credentials: true,
        });
        // Health check
        server.get('/health', async (request, reply) => {
            try {
                // Test database connection
                await prisma.$queryRaw `SELECT 1`;
                return {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    message: '🥋 Krav Maga Academy API is running!'
                };
            }
            catch (error) {
                reply.code(500);
                return {
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    database: 'disconnected',
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Students API
        server.get('/api/students', async (request, reply) => {
            try {
                const students = await prisma.student.findMany({
                    include: {
                        user: {
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    take: 10 // Limit for performance
                });
                return {
                    success: true,
                    data: students,
                    count: students.length,
                    message: 'Students retrieved successfully'
                };
            }
            catch (error) {
                reply.code(500);
                return {
                    success: false,
                    error: 'Failed to fetch students',
                    message: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Organizations API
        server.get('/api/organizations', async (request, reply) => {
            try {
                const organizations = await prisma.organization.findMany({
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        createdAt: true,
                        _count: {
                            select: {
                                students: true,
                                instructors: true,
                                classes: true
                            }
                        }
                    },
                    take: 10
                });
                return {
                    success: true,
                    data: organizations,
                    count: organizations.length,
                    message: 'Organizations retrieved successfully'
                };
            }
            catch (error) {
                reply.code(500);
                return {
                    success: false,
                    error: 'Failed to fetch organizations',
                    message: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Techniques API
        server.get('/api/techniques', async (request, reply) => {
            try {
                const techniques = await prisma.technique.findMany({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        difficulty: true,
                        createdAt: true
                    },
                    take: 20
                });
                return {
                    success: true,
                    data: techniques,
                    count: techniques.length,
                    message: 'Techniques retrieved successfully'
                };
            }
            catch (error) {
                reply.code(500);
                return {
                    success: false,
                    error: 'Failed to fetch techniques',
                    message: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Basic POST endpoint for students
        server.post('/api/students', async (request, reply) => {
            try {
                const body = request.body;
                // Basic validation
                if (!body.email || !body.firstName || !body.lastName) {
                    reply.code(400);
                    return {
                        success: false,
                        error: 'Missing required fields: email, firstName, lastName'
                    };
                }
                // For now, return success without actually creating
                // TODO: Implement full user creation logic
                return {
                    success: true,
                    message: 'Student creation endpoint ready (implementation pending)',
                    data: {
                        id: 'mock-id',
                        email: body.email,
                        firstName: body.firstName,
                        lastName: body.lastName
                    }
                };
            }
            catch (error) {
                reply.code(500);
                return {
                    success: false,
                    error: 'Failed to create student',
                    message: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Start server
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        const host = process.env.HOST || '0.0.0.0';
        await server.listen({ port, host });
        console.log('\n🚀 =====================================');
        console.log('🥋 KRAV MAGA ACADEMY API RUNNING!');
        console.log('🚀 =====================================');
        console.log(`🌐 Server: http://localhost:${port}`);
        console.log(`❤️  Health: http://localhost:${port}/health`);
        console.log(`👥 Students: http://localhost:${port}/api/students`);
        console.log(`🏢 Organizations: http://localhost:${port}/api/organizations`);
        console.log(`🥊 Techniques: http://localhost:${port}/api/techniques`);
        console.log('🔥 =====================================\n');
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    await server.close();
    process.exit(0);
});
start();
