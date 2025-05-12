const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Require the 'cors' middleware

const app = express();
const port = 3000;

app.use(express.json()); // for parsing application/json
app.use(cors()); // Use the cors middleware

const API_URL = 'https://3000-idx-academia-1746368626858.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev/';

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// Connect to the database
const db = new sqlite3.Database('academia.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Read and execute the database schema
    const schema = fs.readFileSync(path.join(__dirname, '../database/database.sql'), 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error creating tables:', err.message);
      } else {
        console.log('Database tables created or already exist.');
      }
    });
  }
});

// API Endpoints

// Student Endpoints
app.post('/students', (req, res) => {
  const { name, matricula, email, phone, date_of_birth, notes } = req.body;
  const sql = `INSERT INTO Students (name, matricula, email, phone, date_of_birth, notes) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [name, matricula, email, phone, date_of_birth, notes], function(err) {
    if (err) {
      console.error('Error inserting student:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Student added successfully', student_id: this.lastID });
  });
});

app.get('/students', (req, res) => {
  const sql = `SELECT * FROM Students`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching students:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ students: rows });
  });
});

app.put('/students/:id', (req, res) => {
  const { name, matricula, email, phone, date_of_birth, notes } = req.body;
  const { id } = req.params;
  const sql = `UPDATE Students SET name = ?, matricula = ?, email = ?, phone = ?, date_of_birth = ?, notes = ? WHERE student_id = ?`;
  db.run(sql, [name, matricula, email, phone, date_of_birth, notes, id], function(err) {
    if (err) {
      console.error('Error updating student:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Student updated successfully', changes: this.changes });
  });
});

app.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM Students WHERE student_id = ?`;
  db.run(sql, id, function(err) {
    if (err) {
      console.error('Error deleting student:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Student deleted successfully', changes: this.changes });
  });
});

// Sign-in Endpoint
app.post('/signin', (req, res) => {
  const { identifier } = req.body; // 'identifier' can be matricula or name

  const findStudentSql = `SELECT student_id FROM Students WHERE matricula = ? OR name = ?`;
  db.get(findStudentSql, [identifier, identifier], (err, row) => {
    if (err) {
      console.error('Error finding student:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(404).json({ message: 'Student not found. Please see the administrator.' });
      return;
    }

    const studentId = row.student_id;
    // For now, we'll just record attendance without linking to a specific schedule.
    // We'll refine this later to find the current class schedule.
    const recordAttendanceSql = `INSERT INTO Attendance (student_id, date, sign_in_time) VALUES (?, ?, ?)`;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    db.run(recordAttendanceSql, [studentId, date, time], function(err) {
      if (err) {
        console.error('Error recording attendance:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Successfully signed in.', attendance_id: this.lastID });
    });
  });
});

