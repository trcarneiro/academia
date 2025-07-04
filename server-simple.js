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
        // Mock API responses
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: [],
            message: 'Mock API response'
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