const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'bus_pass_db'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to Real MySQL Database');
});

// Auth Routes
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
    [username, password, role || 'student'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Registered', userId: result.insertId });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ user: results[0] });
    });
});

// App Routes
app.post('/api/apply', (req, res) => {
    const { userId, studentName, collegeId, route, fee } = req.body;
    db.query('INSERT INTO applications (user_id, student_name, college_id, route, fee) VALUES (?, ?, ?, ?, ?)',
    [userId, studentName, collegeId, route, fee], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Applied', applicationId: result.insertId });
    });
});

app.get('/api/applications/:userId', (req, res) => {
    db.query('SELECT * FROM applications WHERE user_id = ? ORDER BY applied_on DESC', [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/admin/applications', (req, res) => {
    db.query('SELECT * FROM applications ORDER BY applied_on DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/admin/approve/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status updated' });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
