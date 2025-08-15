// Simple server to serve the Ultimate Dashboard
const fastify = require('fastify')({ logger: true });
const path = require('path');

// Register static files
fastify.register(require('@fastify/static'), {
  root: __dirname,
  prefix: '/'
});

// Routes
fastify.get('/', async (request, reply) => {
  return reply.sendFile('public/index.html');
});

fastify.get('/ultimate', async (request, reply) => {
  return reply.sendFile('public/index.html');
});

fastify.get('/dashboard', async (request, reply) => {
  return reply.sendFile('dashboard.html');
});

fastify.get('/test', async (request, reply) => {
  return reply.sendFile('dashboard-test.html');
});

fastify.get('/health', async () => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Ultimate Dashboard Server Running!'
  };
});

// Routes for students and classes views
fastify.get('/views/students.html', async (request, reply) => {
  return reply.sendFile('public/views/students.html');
});

fastify.get('/views/classes.html', async (request, reply) => {
  return reply.sendFile('public/views/classes.html');
});

// Route for checkpoint check-in module
fastify.get('/checkpoint.html', async (request, reply) => {
  return reply.sendFile('public/checkpoint.html');
});

// Routes for checkpoint CSS and JS files
fastify.get('/css/checkpoint.css', async (request, reply) => {
  return reply.sendFile('public/css/checkpoint.css');
});

fastify.get('/js/checkpoint.js', async (request, reply) => {
  return reply.sendFile('public/js/checkpoint.js');
});

// Routes for missing JS files
fastify.get('/js/main.js', async (request, reply) => {
  return reply.code(200).type('application/javascript').send(`
// Main.js - Dashboard functionality
console.log('✅ Main.js loaded');

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard initializing...');
    initializeDashboard();
});

function initializeDashboard() {
    console.log('📊 Dashboard initialized');
}
`);
});

fastify.get('/js/ui.js', async (request, reply) => {
  return reply.code(200).type('application/javascript').send(`
// UI.js - User interface functions
console.log('✅ UI.js loaded');

// Export functions for ES6 modules
export function showToast(message, type = 'info') {
    console.log('🍞 Toast:', message, type);
}

export function showModal(modalId) {
    console.log('📱 Modal:', modalId);
}

export function hideModal(modalId) {
    console.log('❌ Hide Modal:', modalId);
}
`);
});

fastify.get('/js/attendance.js', async (request, reply) => {
  return reply.code(200).type('application/javascript').send(`
// Attendance.js - Attendance functionality
console.log('✅ Attendance.js loaded');

// Export functions for ES6 modules
export function checkIn(studentId, classId) {
    console.log('✅ Check-in:', studentId, classId);
    return fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, classId, present: true })
    });
}

export function getAttendance(date) {
    console.log('📊 Get Attendance:', date);
    return fetch('/api/attendance?date=' + date);
}

export function loadAttendance() {
    console.log('📋 Loading attendance data...');
    return fetch('/api/attendance').then(r => r.json());
}
`);
});

fastify.get('/js/settings.js', async (request, reply) => {
  return reply.code(200).type('application/javascript').send(`
// Settings.js - Settings functionality  
console.log('✅ Settings.js loaded');

// Export functions for ES6 modules
export function loadSettings() {
    console.log('⚙️ Loading settings...');
    return Promise.resolve({
        theme: 'dark',
        language: 'pt-BR',
        notifications: true
    });
}

export function saveSettings(settings) {
    console.log('💾 Saving settings:', settings);
    return Promise.resolve(true);
}

export function renderSettings() {
    console.log('🎨 Rendering settings UI...');
    return '<div>Settings UI rendered</div>';
}
`);
});

// Mock API endpoints for the dashboard
fastify.get('/api/students', async () => {
  return {
    success: true,
    data: [
      {
        id: '0b997817-3ce9-426b-9230-ab2a71e5b53a',
        name: 'João Santos',
        firstName: 'João',
        lastName: 'Santos',
        email: 'joao.santos@email.com',
        phone: '(11) 99999-9999',
        dateOfBirth: '1990-05-15',
        category: 'Adult',
        progress: 85,
        attendance: 92,
        belt: 'Faixa Branca',
        enrollmentDate: '2024-01-15',
        status: 'active',
        plan: {
          id: 1,
          name: 'Plano Mensal',
          price: 150
        },
        lastClass: '2025-07-12',
        nextClass: '2025-07-15'
      },
      {
        id: '1c886db7-44e1-4a2b-87c9-b3f4c8e9f0d1',
        name: 'Maria Silva',
        firstName: 'Maria',
        lastName: 'Silva', 
        email: 'maria.silva@email.com',
        phone: '(11) 88888-8888',
        dateOfBirth: '1985-03-22',
        category: 'Master 1',
        progress: 76,
        attendance: 88,
        belt: 'Faixa Amarela',
        enrollmentDate: '2023-11-20',
        status: 'active',
        plan: {
          id: 2,
          name: 'Plano Trimestral',
          price: 420
        },
        lastClass: '2025-07-13',
        nextClass: '2025-07-16'
      },
      {
        id: '2d9a7e8f-55b2-4c3d-98e0-c4f5d9e0a1b2',
        name: 'Carlos Oliveira',
        firstName: 'Carlos',
        lastName: 'Oliveira',
        email: 'carlos.oliveira@email.com',
        phone: '(11) 77777-7777',
        dateOfBirth: '1992-08-10',
        category: 'Adult',
        progress: 92,
        attendance: 95,
        belt: 'Faixa Verde',
        enrollmentDate: '2023-06-01',
        status: 'active',
        plan: {
          id: 1,
          name: 'Plano Mensal',
          price: 150
        },
        lastClass: '2025-07-14',
        nextClass: '2025-07-17'
      }
    ]
  };
});

fastify.get('/api/organizations', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Elite Krav Maga Academy',
        slug: 'elite-krav-maga',
        studentsCount: 156,
        isActive: true
      }
    ]
  };
});

fastify.get('/api/techniques', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Guarda de Boxe',
        category: 'DEFENSE',
        difficulty: 1,
        masteryRate: 95
      },
      {
        id: 2,
        name: 'Defesa Lateral',
        category: 'DEFENSE', 
        difficulty: 3,
        masteryRate: 67
      }
    ]
  };
});

// Mock classes/turmas endpoints
fastify.get('/api/classes', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Krav Maga Iniciante - Manhã',
        instructor: 'Professor João Silva',
        schedule: 'Segunda, Quarta e Sexta - 08:00 às 09:00',
        level: 'Iniciante',
        maxStudents: 20,
        currentStudents: 15,
        room: 'Sala 1',
        status: 'active',
        description: 'Turma para iniciantes focada em fundamentos básicos',
        startDate: '2025-01-15',
        endDate: '2025-06-15'
      },
      {
        id: 2,
        name: 'Krav Maga Avançado - Noite',
        instructor: 'Professor Maria Santos',
        schedule: 'Terça e Quinta - 19:00 às 20:30',
        level: 'Avançado',
        maxStudents: 15,
        currentStudents: 12,
        room: 'Sala 2',
        status: 'active',
        description: 'Turma avançada com técnicas de combate e defesa pessoal',
        startDate: '2025-02-01',
        endDate: '2025-07-01'
      },
      {
        id: 3,
        name: 'Krav Maga Kids - Tarde',
        instructor: 'Professor Carlos Lima',
        schedule: 'Sábado - 14:00 às 15:00',
        level: 'Infantil',
        maxStudents: 25,
        currentStudents: 18,
        room: 'Sala 3',
        status: 'active',
        description: 'Turma especial para crianças de 6 a 12 anos',
        startDate: '2025-01-20',
        endDate: '2025-12-20'
      }
    ]
  };
});

// Mock attendance endpoints
fastify.get('/api/attendance', async (request, reply) => {
  const { date, studentId } = request.query;
  
  // Mock attendance data
  const mockAttendance = [
    {
      id: '1',
      studentId: '0b997817-3ce9-426b-9230-ab2a71e5b53a',
      date: '2025-07-14',
      present: true,
      checkInTime: '2025-07-14T18:00:00Z',
      method: 'QUICK_CHECKIN'
    }
  ];
  
  let filteredData = mockAttendance;
  
  if (date) {
    filteredData = filteredData.filter(record => record.date === date);
  }
  
  if (studentId) {
    filteredData = filteredData.filter(record => record.studentId === studentId);
  }
  
  return {
    success: true,
    data: filteredData,
    pagination: {
      total: filteredData.length,
      limit: 100,
      offset: 0
    }
  };
});

fastify.post('/api/attendance', async (request, reply) => {
  const { studentId, date, present = true, method = 'MANUAL' } = request.body;
  
  if (!studentId) {
    reply.code(400);
    return {
      success: false,
      error: 'Student ID is required'
    };
  }
  
  // Simulate successful check-in
  const attendanceRecord = {
    id: 'att_' + Date.now(),
    studentId: studentId,
    date: date ? date.split('T')[0] : new Date().toISOString().split('T')[0],
    present: present,
    checkInTime: date || new Date().toISOString(),
    method: method,
    student: {
      user: {
        firstName: 'João',
        lastName: 'Santos'
      }
    }
  };
  
  console.log('✅ Check-in realizado:', attendanceRecord);
  
  return {
    success: true,
    data: attendanceRecord,
    message: `Check-in successful for ${attendanceRecord.student.user.firstName} ${attendanceRecord.student.user.lastName}`
  };
});

// API for billing plans
fastify.get('/api/billing-plans', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Plano Mensal',
        price: 150.00,
        description: 'Acesso mensal às aulas',
        active: true
      },
      {
        id: 2,
        name: 'Plano Trimestral', 
        price: 420.00,
        description: 'Acesso trimestral com desconto',
        active: true
      },
      {
        id: 3,
        name: 'Plano Anual',
        price: 1500.00,
        description: 'Acesso anual com maior desconto',
        active: true
      }
    ]
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('\n🚀 =================================');
    console.log('🥋 ULTIMATE DASHBOARD SERVER RUNNING!');
    console.log('🚀 =================================');
    console.log('🌐 URL: http://localhost:3000');
    console.log('🚀 ULTIMATE DASHBOARD: http://localhost:3000/ultimate');
    console.log('📊 BASIC DASHBOARD: http://localhost:3000/dashboard');
    console.log('❤️  HEALTH: http://localhost:3000/health');
    console.log('🔥 =================================\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();