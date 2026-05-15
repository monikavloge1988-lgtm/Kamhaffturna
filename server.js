import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise'; // Use promise wrapper
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Connect to MySQL database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'yaarwinn_kff2',
    password: 'your_database_password_here',
    database: 'yaarwinn_kff2',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// === API ROUTES ===

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running correctly.' });
});

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password_hash = ?', [email, password]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
        res.json({ success: true, user: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { firstName, lastName, username, email, password, referralCode } = req.body;
    const uid = 'USR' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const joinedAt = Date.now();
    const myRefCode = 'REF' + uid.substring(3, 9);
    
    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email or Username already exists' });
        
        let initialBal = 0;
        let refBy = null;
        
        if (referralCode) {
            const [refRows] = await pool.query('SELECT uid FROM users WHERE referralCode = ?', [referralCode]);
            if (refRows.length > 0) {
                refBy = refRows[0].uid;
                initialBal = 50;
                await pool.query('UPDATE users SET balance = balance + 50, referralCount = referralCount + 1, referralEarned = referralEarned + 50 WHERE uid = ?', [refBy]);
            }
        }
        
        await pool.query(
            'INSERT INTO users (uid, firstName, lastName, username, email, displayName, password_hash, balance, referralCode, referredBy, joinedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [uid, firstName, lastName, username, email, `${firstName} ${lastName}`, password, initialBal, myRefCode, refBy, joinedAt]
        );
        
        const [newUser] = await pool.query('SELECT * FROM users WHERE uid = ?', [uid]);
        res.json({ success: true, user: newUser[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- USER DATA ---
app.get('/api/users/:uid', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE uid = ?', [req.params.uid]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TOURNAMENTS ---
app.get('/api/tournaments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tournaments ORDER BY created_at DESC');
        res.json({ success: true, tournaments: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tournaments/join', async (req, res) => {
    const { uid, tournamentId, gameName, gameId, seatNumber } = req.body;
    try {
        const [tourns] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
        if (tourns.length === 0) return res.status(404).json({ error: 'Tournament not found' });
        const tourn = tourns[0];
        
        const [users] = await pool.query('SELECT balance FROM users WHERE uid = ?', [uid]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = users[0];
        
        if (user.balance < tourn.entry_fee) return res.status(400).json({ error: 'Insufficient balance' });
        
        await pool.query('UPDATE users SET balance = balance - ? WHERE uid = ?', [tourn.entry_fee, uid]);
        await pool.query(
            'INSERT INTO tournament_participants (tournament_id, uid, gameName, gameId, seatNumber, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
            [tournamentId, uid, gameName, gameId, seatNumber, Date.now()]
        );
        await pool.query(
            'INSERT INTO transactions (uid, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
            [uid, 'tournament_join', -tourn.entry_fee, tourn.name, Date.now()]
        );
        
        res.json({ success: true, newBalance: user.balance - tourn.entry_fee });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WALLET & TRANSACTIONS ---
app.get('/api/transactions/:uid', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM transactions WHERE uid = ? ORDER BY created_at DESC LIMIT 20', [req.params.uid]);
        res.json({ success: true, transactions: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wallet/add-money', async (req, res) => {
    const { uid, username, email, amount, payApp } = req.body;
    try {
        await pool.query(
            'INSERT INTO add_money_requests (uid, username, email, amount, payApp, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", ?)',
            [uid, username, email, amount, payApp, Date.now()]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wallet/withdraw', async (req, res) => {
    const { uid, username, email, amount, upiId } = req.body;
    try {
        const [users] = await pool.query('SELECT balance FROM users WHERE uid = ?', [uid]);
        if (users.length === 0 || users[0].balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
        
        await pool.query(
            'INSERT INTO withdrawal_requests (uid, username, email, amount, upi_id, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", ?)',
            [uid, username, email, amount, upiId, Date.now()]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN API ---
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'mukeshadmin@gmail.com' && password === 'mukeshadmin') {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
    }
});

// Fallback logic
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
