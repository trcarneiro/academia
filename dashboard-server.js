const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para log das requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rota principal - serve o dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
            { id: 1, name: 'João Santos', category: 'Adult', status: 'active' },
            { id: 2, name: 'Maria Silva', category: 'Master 1', status: 'active' },
            { id: 3, name: 'Pedro Costa', category: 'Adult', status: 'active' }
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
    console.log('🚀 Dashboard Server iniciado!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🏠 Servindo arquivos de: ${path.join(__dirname, 'public')}`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
    console.log('📊 Dashboard disponível na URL principal');
});

module.exports = app;