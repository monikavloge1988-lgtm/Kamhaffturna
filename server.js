import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Connect to MySQL database
// User specified: username, password, and database are all "yaarwinn_kff2"
// MySQL default port is 3306
const db = mysql.createPool({
    host: 'localhost',
    user: 'yaarwinn_kff2',
    password: 'yaarwinn_kff2',
    database: 'yaarwinn_kff2',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        console.error('Make sure your MySQL server is running and the credentials are correct.');
    } else {
        console.log('Successfully connected to the MySQL database (yaarwinn_kff2).');
        connection.release();
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// === API ROUTES ===

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running correctly.' });
});

// Add your API endpoints here, replacing Firebase logic in the frontend
// Example: fetching tournaments
app.get('/api/tournaments', (req, res) => {
    db.query('SELECT * FROM tournaments ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, tournaments: results });
    });
});

// Fallback logic
app.get('*', (req, res) => {
    res.send(`
        <html>
            <title>Tournament Backend API</title>
            <body style="font-family: sans-serif; padding: 20px;">
                <h2>Tournament Backend Server Running ⚡</h2>
                <p>The Express and MySQL Node.js server is up and running.</p>
                <p>To use your provided HTML files:</p>
                <ol>
                    <li>Create a folder named <strong>public</strong> in the root directory.</li>
                    <li>Save your User HTML code as <strong>public/index.html</strong></li>
                    <li>Save your Admin HTML code as <strong>public/admin.html</strong></li>
                </ol>
            </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
