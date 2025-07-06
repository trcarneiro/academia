const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    let filePath = './public/index.html';
    
    // Route handling
    if (req.url === '/' || req.url === '/ultimate') {
        filePath = './public/index.html';
    } else if (req.url === '/dashboard') {
        filePath = './dashboard.html';
    } else if (req.url === '/test') {
        filePath = './dashboard-test.html';
    } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            message: 'Dashboard Server Running!'
        }));
        return;
    } else if (req.url.includes('/api/')) {
        // Enhanced Mock API responses
        const method = req.method;
        const url = req.url;
        
        console.log(`📡 API Call: ${method} ${url}`);
        
        // Students API
        if (url === '/api/students') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: [
                    {
                        id: '0b997817-3ce9-426b-9230-ab2a71e5b53a',
                        matricula: 'KMA0001',
                        user: {
                            firstName: 'Maria',
                            lastName: 'Silva',
                            email: 'maria.silva@email.com'
                        },
                        category: 'ADULT',
                        birthDate: '1990-05-15',
                        phone: '11999887766',
                        emergencyContact: '11888776655',
                        createdAt: '2025-01-15T10:00:00Z'
                    },
                    {
                        id: '2c997817-3ce9-426b-9230-ab2a71e5b53b',
                        matricula: 'KMA0002',
                        user: {
                            firstName: 'João',
                            lastName: 'Santos',
                            email: 'joao.santos@email.com'
                        },
                        category: 'ADULT',
                        birthDate: '1985-08-22',
                        phone: '11777665544',
                        emergencyContact: '11666554433',
                        createdAt: '2025-01-20T14:30:00Z'
                    },
                    {
                        id: '3d997817-3ce9-426b-9230-ab2a71e5b53c',
                        matricula: 'KMA0003',
                        user: {
                            firstName: 'Ana',
                            lastName: 'Costa',
                            email: 'ana.costa@email.com'
                        },
                        category: 'FEMALE',
                        birthDate: '1992-12-03',
                        phone: '11555443322',
                        emergencyContact: '11444332211',
                        createdAt: '2025-02-01T09:15:00Z'
                    },
                    {
                        id: '4e997817-3ce9-426b-9230-ab2a71e5b53d',
                        matricula: 'KMA0004',
                        user: {
                            firstName: 'Pedro',
                            lastName: 'Oliveira',
                            email: 'pedro.oliveira@email.com'
                        },
                        category: 'ADULT',
                        birthDate: '1988-03-18',
                        phone: '11333221100',
                        emergencyContact: '11222110099',
                        createdAt: '2025-02-10T16:45:00Z'
                    },
                    {
                        id: '5f997817-3ce9-426b-9230-ab2a71e5b53e',
                        matricula: 'KMA0005',
                        user: {
                            firstName: 'Lucas',
                            lastName: 'Ferreira',
                            email: 'lucas.ferreira@email.com'
                        },
                        category: 'CHILD',
                        birthDate: '2015-07-12',
                        phone: '11111009988',
                        emergencyContact: '11000998877',
                        createdAt: '2025-02-15T11:20:00Z'
                    }
                ],
                count: 5,
                message: 'Students retrieved successfully'
            }));
            return;
        }

        // Billing Plans API
        if (url === '/api/billing-plans') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: [
                    {
                        id: 'plan-1',
                        name: 'Plano Básico Adulto',
                        description: 'Ideal para iniciantes - 2 aulas por semana',
                        category: 'ADULT',
                        price: '150.00',
                        billingType: 'MONTHLY',
                        classesPerWeek: 2,
                        isActive: true
                    },
                    {
                        id: 'plan-2', 
                        name: 'Plano Premium Adulto',
                        description: 'Acesso ilimitado com benefícios extras',
                        category: 'ADULT',
                        price: '280.00',
                        billingType: 'MONTHLY',
                        classesPerWeek: 0,
                        isActive: true
                    },
                    {
                        id: 'plan-3',
                        name: 'Plano Infantil',
                        description: 'Krav Maga Kids - 2 aulas por semana',
                        category: 'CHILD',
                        price: '120.00',
                        billingType: 'MONTHLY', 
                        classesPerWeek: 2,
                        isActive: true
                    }
                ],
                message: 'Mock billing plans retrieved'
            }));
            return;
        }
        
        // Student Subscription API (GET)
        if (url.match(/^\/api\/students\/[^\/]+\/subscription$/) && method === 'GET') {
            // Mock: Return 404 for students without subscription (this is expected)
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Nenhuma assinatura encontrada para este aluno'
            }));
            return;
        }
        
        // Student Subscription API (PUT - Create/Update subscription)
        if (url.match(/^\/api\/students\/[^\/]+\/subscription$/) && method === 'PUT') {
            // Read request body
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const subscriptionData = JSON.parse(body);
                    console.log('📝 Creating subscription:', subscriptionData);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        data: {
                            id: 'subscription-' + Date.now(),
                            studentId: url.split('/')[3],
                            planId: subscriptionData.planId,
                            plan: {
                                id: subscriptionData.planId,
                                name: 'Plano Assinado',
                                price: '180.00',
                                category: 'ADULT'
                            },
                            status: 'ACTIVE',
                            startDate: new Date().toISOString(),
                            endDate: null
                        },
                        message: 'Assinatura criada com sucesso'
                    }));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Dados inválidos: ' + error.message
                    }));
                }
            });
            return;
        }
        
        // Student Subscription API (DELETE - Cancel subscription)
        if (url.match(/^\/api\/students\/[^\/]+\/subscription$/) && method === 'DELETE') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Assinatura cancelada com sucesso'
            }));
            return;
        }
        
        // Default API response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: [],
            message: 'Mock API response for: ' + url
        }));
        return;
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <h1>404 - File Not Found</h1>
            <p>Requested: ${req.url}</p>
            <p>Looking for: ${filePath}</p>
            <p>Available files:</p>
            <ul>
                <li><a href="/">Dashboard Principal (index.html)</a></li>
                <li><a href="/ultimate">Ultimate Dashboard</a></li>
                <li><a href="/dashboard">Dashboard Básico</a></li>
                <li><a href="/test">Dashboard Teste</a></li>
                <li><a href="/health">Health Check</a></li>
            </ul>
        `);
        return;
    }
    
    // Serve file
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json'
    }[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end(`Error reading file: ${err.message}`);
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('\n🚀 ================================');
    console.log('🥋 DASHBOARD SERVER RUNNING!');
    console.log('🚀 ================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🚀 Ultimate Dashboard: http://localhost:${PORT}/ultimate`);
    console.log(`📊 Basic Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🧪 Test Dashboard: http://localhost:${PORT}/test`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log('🔥 ================================\n');
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});