const express = require("express");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Mock students data
const students = [
    {
        id: "1",
        name: "João Silva",
        email: "joao@email.com",
        phone: "(11) 99999-9999",
        birthDate: "1990-05-15",
        status: "ACTIVE",
        notes: "Aluno dedicado, boa evolução técnica"
    },
    {
        id: "2", 
        name: "Maria Santos",
        email: "maria@email.com",
        phone: "(11) 88888-8888",
        birthDate: "1985-03-20",
        status: "ACTIVE",
        notes: "Excelente coordenação motora"
    },
    {
        id: "3",
        name: "Pedro Costa",
        email: "pedro@email.com", 
        phone: "(11) 77777-7777",
        birthDate: "1995-12-10",
        status: "INACTIVE",
        notes: "Parou por motivos pessoais"
    },
    {
        id: "d61ae58e-8db6-4d96-a909-887df891ce08",
        name: "Ana Oliveira",
        email: "ana@email.com",
        phone: "(11) 66666-6666",
        birthDate: "1992-08-25",
        status: "ACTIVE",
        notes: "Aluna muito dedicada"
    },
    {
        id: "b8c72f41-2d91-4e85-9f3a-123456789abc",
        name: "Carlos Pereira",
        email: "carlos@email.com",
        phone: "(11) 55555-5555",
        birthDate: "1988-11-30",
        status: "ACTIVE",
        notes: "Boa progressão técnica"
    },
    {
        id: "f9d83a52-1e42-4b96-8a6d-987654321def",
        name: "Fernanda Lima",
        email: "fernanda@email.com",
        phone: "(11) 44444-4444",
        birthDate: "1993-04-12",
        status: "ACTIVE",
        notes: "Excelente disciplina"
    }
];

// Students API endpoints
app.get("/api/students", (req, res) => {
    console.log("📊 GET /api/students");
    res.json({
        success: true,
        data: students
    });
});

app.get("/api/students/:id", (req, res) => {
    const { id } = req.params;
    console.log("📊 GET /api/students/" + id);
    console.log("📋 Available student IDs:", students.map(s => s.id));
    
    const student = students.find(s => s.id === id);
    
    if (student) {
        console.log("✅ Student found:", student.name);
        res.json({
            success: true,
            data: student
        });
    } else {
        console.log("❌ Student not found for ID:", id);
        res.status(404).json({
            success: false,
            error: "Aluno não encontrado"
        });
    }
});

app.post("/api/students", (req, res) => {
    console.log("➕ POST /api/students", req.body);
    
    const newStudent = {
        id: String(students.length + 1),
        ...req.body,
        status: req.body.status || "ACTIVE"
    };
    
    students.push(newStudent);
    
    res.json({
        success: true,
        data: newStudent
    });
});

app.put("/api/students/:id", (req, res) => {
    const { id } = req.params;
    console.log("💾 PUT /api/students/" + id, req.body);
    
    const index = students.findIndex(s => s.id === id);
    
    if (index !== -1) {
        students[index] = { ...students[index], ...req.body };
        res.json({
            success: true,
            data: students[index]
        });
    } else {
        res.status(404).json({
            success: false,
            error: "Aluno não encontrado"
        });
    }
});

// Billing plans endpoint (for compatibility)
app.get("/api/billing-plans", (req, res) => {
    res.json({
        success: true,
        data: [{
            id: "1",
            name: "Plano Básico",
            price: 99.90,
            billingType: "MONTHLY",
            classesPerWeek: 2,
            isActive: true
        }]
    });
});

// Courses endpoints (basic)
app.get("/api/courses", (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: "1",
                name: "Krav Maga Faixa Branca",
                description: "Curso básico de Krav Maga",
                level: "INICIANTE",
                status: "ACTIVE",
                duration: 16
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log("🥋 Academy Server running at http://localhost:" + PORT);
    console.log("📚 Students API available at /api/students");
});
