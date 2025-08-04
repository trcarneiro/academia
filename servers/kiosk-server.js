const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001; // Porta separada do sistema principal

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection (usando a mesma do sistema principal)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// KIOSK PUBLIC ENDPOINTS
// ==========================================

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Krav Maga Academy - Kiosk', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Get students for check-in (public endpoint)
app.get('/api/kiosk/students', async (req, res) => {
    try {
        const { data: students, error } = await supabase
            .from('StudentCourse')
            .select(`
                student:Student(
                    id,
                    user:User(
                        firstName,
                        lastName,
                        email
                    )
                )
            `)
            .eq('courseId', '750273f9-7508-4fbf-affb-8efe189f2875') // Krav Maga course
            .eq('status', 'ACTIVE');

        if (error) throw error;

        res.json({
            success: true,
            data: students || [],
            message: 'Students loaded for kiosk'
        });

    } catch (error) {
        console.error('Error loading students for kiosk:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading students',
            error: error.message
        });
    }
});

// Public check-in endpoint
app.post('/api/kiosk/checkin', async (req, res) => {
    try {
        const { studentId, method = 'KIOSK' } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Check if student exists
        const { data: student, error: studentError } = await supabase
            .from('Student')
            .select('id, user:User(firstName, lastName)')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Create attendance record
        const attendanceData = {
            studentId: studentId,
            classId: '2e47c8b1-5d4c-4a9b-8f3e-1b2c3d4e5f60', // Turma 1
            courseId: '750273f9-7508-4fbf-affb-8efe189f2875', // Krav Maga course
            lessonNumber: 15,
            date: new Date().toISOString(),
            present: true,
            arrived_late: false,
            left_early: false,
            method: method,
            notes: `Check-in via kiosk at ${new Date().toLocaleTimeString('pt-BR')}`
        };

        const { data: attendance, error: attendanceError } = await supabase
            .from('Attendance')
            .upsert(attendanceData, {
                onConflict: 'studentId,classId,lessonNumber',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (attendanceError) throw attendanceError;

        res.json({
            success: true,
            data: {
                attendance,
                student: {
                    id: student.id,
                    name: `${student.user.firstName} ${student.user.lastName}`
                }
            },
            message: `Check-in successful for ${student.user.firstName} ${student.user.lastName}`
        });

    } catch (error) {
        console.error('Error in kiosk check-in:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing check-in',
            error: error.message
        });
    }
});

// Get today's attendance for kiosk display
app.get('/api/kiosk/attendance/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: attendance, error } = await supabase
            .from('Attendance')
            .select(`
                id,
                studentId,
                present,
                date,
                student:Student(
                    user:User(
                        firstName,
                        lastName
                    )
                )
            `)
            .eq('classId', '2e47c8b1-5d4c-4a9b-8f3e-1b2c3d4e5f60')
            .eq('lessonNumber', 15)
            .gte('date', today)
            .eq('present', true)
            .order('date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: attendance || [],
            message: 'Today\'s attendance loaded'
        });

    } catch (error) {
        console.error('Error loading today\'s attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading attendance',
            error: error.message
        });
    }
});

// Search student (for quick check-in)
app.get('/api/kiosk/student/search', async (req, res) => {
    try {
        const { q } = req.query; // query parameter

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: [],
                message: 'Query too short'
            });
        }

        const { data: students, error } = await supabase
            .from('StudentCourse')
            .select(`
                student:Student(
                    id,
                    user:User(
                        firstName,
                        lastName,
                        email
                    )
                )
            `)
            .eq('courseId', '750273f9-7508-4fbf-affb-8efe189f2875')
            .eq('status', 'ACTIVE')
            .or(`student.user.firstName.ilike.%${q}%,student.user.lastName.ilike.%${q}%,student.user.email.ilike.%${q}%,student.id.ilike.%${q}%`);

        if (error) throw error;

        res.json({
            success: true,
            data: students || [],
            message: 'Search results'
        });

    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching students',
            error: error.message
        });
    }
});

// ==========================================
// ASAAS INTEGRATION
// ==========================================

// Import customers from Asaas
app.post('/api/asaas/import-customers', async (req, res) => {
    try {
        const asaasApiKey = process.env.ASAAS_API_KEY;
        
        if (!asaasApiKey) {
            return res.status(400).json({
                success: false,
                message: 'Asaas API key not configured'
            });
        }

        // Fetch customers from Asaas
        const asaasResponse = await fetch('https://sandbox.asaas.com/api/v3/customers', {
            headers: {
                'access_token': asaasApiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!asaasResponse.ok) {
            throw new Error(`Asaas API error: ${asaasResponse.status}`);
        }

        const asaasData = await asaasResponse.json();
        const customers = asaasData.data || [];

        let importedCount = 0;
        let skippedCount = 0;
        const errors = [];

        for (const customer of customers) {
            try {
                // Check if user already exists
                const { data: existingUser } = await supabase
                    .from('User')
                    .select('id')
                    .eq('email', customer.email)
                    .single();

                if (existingUser) {
                    skippedCount++;
                    continue;
                }

                // Create user
                const userData = {
                    firstName: customer.name.split(' ')[0] || customer.name,
                    lastName: customer.name.split(' ').slice(1).join(' ') || '',
                    email: customer.email,
                    phone: customer.phone || '',
                    cpf: customer.cpfCnpj || '',
                    role: 'STUDENT',
                    isActive: true
                };

                const { data: newUser, error: userError } = await supabase
                    .from('User')
                    .insert(userData)
                    .select()
                    .single();

                if (userError) throw userError;

                // Create student
                const studentData = {
                    userId: newUser.id,
                    birthDate: null, // Not available in Asaas
                    category: 'ADULT',
                    gender: 'MASCULINO', // Default - should be updated manually
                    specialNeeds: [],
                    emergencyContact: customer.phone || '',
                    medicalConditions: '',
                    asaasCustomerId: customer.id // Link to Asaas
                };

                const { data: newStudent, error: studentError } = await supabase
                    .from('Student')
                    .insert(studentData)
                    .select()
                    .single();

                if (studentError) throw studentError;

                // Enroll in Krav Maga course
                const enrollmentData = {
                    studentId: newStudent.id,
                    courseId: '750273f9-7508-4fbf-affb-8efe189f2875',
                    classId: '2e47c8b1-5d4c-4a9b-8f3e-1b2c3d4e5f60', // Turma 1
                    enrollmentDate: new Date().toISOString(),
                    status: 'ACTIVE'
                };

                await supabase
                    .from('StudentCourse')
                    .insert(enrollmentData);

                importedCount++;

            } catch (error) {
                errors.push({
                    customer: customer.name,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                total: customers.length,
                imported: importedCount,
                skipped: skippedCount,
                errors: errors
            },
            message: `Import completed: ${importedCount} customers imported, ${skippedCount} skipped`
        });

    } catch (error) {
        console.error('Error importing from Asaas:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing customers from Asaas',
            error: error.message
        });
    }
});

// ==========================================
// STATIC FILES & KIOSK PAGE
// ==========================================

// Serve kiosk page
app.get('/kiosk', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

// Default route
app.get('/', (req, res) => {
    res.json({
        service: 'Krav Maga Academy - Public Kiosk API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            students: 'GET /api/kiosk/students',
            checkin: 'POST /api/kiosk/checkin',
            attendance: 'GET /api/kiosk/attendance/today',
            search: 'GET /api/kiosk/student/search?q=query',
            kiosk: 'GET /kiosk',
            asaas_import: 'POST /api/asaas/import-customers'
        },
        note: 'This is a public API for kiosk check-in functionality'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Kiosk server running on http://localhost:${PORT}`);
    console.log(`📟 Kiosk interface: http://localhost:${PORT}/kiosk`);
    console.log(`🔗 API endpoints: http://localhost:${PORT}/`);
});

module.exports = app;