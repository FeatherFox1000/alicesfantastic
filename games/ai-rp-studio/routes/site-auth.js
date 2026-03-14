const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const JWT_SECRET = process.env.SITE_JWT_SECRET || 'alicesfantastic-secret-change-in-prod';

// Site-wide auth uses its own database, separate from The Sandbox
const dataDir = fs.existsSync('/data') ? '/data' : path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const db = new Database(path.join(dataDir, 'site-auth.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_banned INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
try { db.exec(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`); } catch (e) {}

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

// Signup
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already taken.' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, password_hash);
  const user = { id: result.lastInsertRowid, username };
  res.json({ token: makeToken(user), username, email });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  if (user.is_banned) {
    return res.status(403).json({ error: 'Your account has been banned.' });
  }
  res.json({ token: makeToken(user), username: user.username, email: user.email, is_admin: user.is_admin });
});

// Verify token
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token.' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, is_banned, is_admin, created_at FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (user.is_banned) return res.status(403).json({ error: 'Your account has been banned.' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

module.exports = router;
