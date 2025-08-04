const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Define o caminho para a pasta 'public' na raiz do projeto
const publicDir = path.join(__dirname, '..', 'public');

// Serve arquivos estáticos da pasta public
app.use(express.static(publicDir));

// Middleware para log das requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rota principal - serve o dashboard consolidado
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Dashboard Server is running'
    });
});

// API mock endpoints
app.get('/api/organizations', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Elite Krav Maga Academy', status: 'active' }
        ]
    });
});

app.get('/api/students', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'João Santos', category: 'Adult', status: 'active', user: { isActive: true } },
            { id: 2, name: 'Maria Silva', category: 'Master 1', status: 'active', user: { isActive: true } },
            { id: 3, name: 'Pedro Costa', category: 'Adult', status: 'inactive', user: { isActive: false } }
        ]
    });
});

app.get('/api/techniques', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Guarda de Boxe', difficulty: 1, category: 'DEFENSE' },
            { id: 2, name: 'Defesa Lateral', difficulty: 3, category: 'DEFENSE' },
            { id: 3, name: 'Contra-Ataque', difficulty: 5, category: 'ATTACK' }
        ]
    });
});

app.get('/api/billing-plans', (req, res) => {
    res.json({
        success: true,
        data: [
            { 
                id: 1, 
                name: 'Plano Básico', 
                description: 'Plano básico com 2 aulas por semana',
                category: 'ADULT', 
                price: 150.00,
                billingType: 'MONTHLY',
                classesPerWeek: 2,
                isActive: true
            },
            { 
                id: 2, 
                name: 'Plano Premium', 
                description: 'Plano premium com aulas ilimitadas',
                category: 'ADULT', 
                price: 250.00,
                billingType: 'MONTHLY',
                classesPerWeek: 'unlimited',
                isActive: true
            },
            { 
                id: 3, 
                name: 'Plano Infantil', 
                description: 'Plano especial para crianças',
                category: 'CHILD', 
                price: 120.00,
                billingType: 'MONTHLY',
                classesPerWeek: 2,
                isActive: false
            }
        ]
    });
});

// Adicionando a API que faltava para o dashboard
app.get('/api/activities/recent', (req, res) => {
    res.json({
        success: true,
        data: [
            // Mock data, pode ser expandido
        ]
    });
});

// API endpoints for student management tabs
app.get('/api/students/:id/details', (req, res) => {
    res.json({
        success: true,
        data: {
            firstName: 'João',
            lastName: 'Santos',
            email: 'joao.santos@example.com',
            phone: '11999998888',
            cpf: '123.456.789-00',
            birthDate: '1990-05-15',
            category: 'ADULT',
            enrollmentDate: '2023-01-10'
        }
    });
});

app.get('/api/students/:id/subscription', (req, res) => {
    res.json({
        success: true,
        data: {
            planName: 'Plano Completo',
            status: 'Ativo',
            value: 'R$ 159,90',
            dueDate: '2025-08-10'
        }
    });
});

app.get('/api/students/:id/courses', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Krav Maga - Faixa Branca', progress: 75, startDate: '2023-01-10', status: 'active' },
            { id: 2, name: 'Defesa Pessoal Avançada', progress: 20, startDate: '2024-03-15', status: 'active' }
        ]
    });
});

app.get('/api/students/:id/attendance', (req, res) => {
    res.json({
        success: true,
        data: {
            totalClasses: 50,
            presentClasses: 45,
            rate: 90,
            recent: [
                { date: '2025-07-15', className: 'Turma das 19h', status: 'present' },
                { date: '2025-07-13', className: 'Turma das 19h', status: 'present' },
                { date: '2025-07-10', className: 'Turma das 19h', status: 'absent' },
            ]
        }
    });
});


// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        message: `Rota ${req.method} ${req.url} não existe`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Dashboard Server CONSOLIDADO iniciado!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🏠 Servindo arquivos de: ${publicDir}`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
    console.log('📊 Dashboard disponível em /');
});

module.exports = app;
