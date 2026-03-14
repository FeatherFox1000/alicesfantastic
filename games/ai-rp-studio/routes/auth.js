const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ai-rp-studio-secret-change-in-prod';
const SITE_JWT_SECRET = process.env.SITE_JWT_SECRET || 'alicesfantastic-secret-change-in-prod';

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

// Try to verify a token with the sandbox secret first, then the site secret.
// If it's a site token, auto-create a sandbox user for that username.
function verifyToken(token) {
  // Try sandbox secret first
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch {}
  // Try site-wide secret
  const payload = jwt.verify(token, SITE_JWT_SECRET);
  // Auto-create sandbox user if they don't have one yet
  let user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(payload.username);
  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(payload.username, payload.username + '@site', 'site-auth-user');
    user = { id: result.lastInsertRowid, username: payload.username };
  }
  // Return payload with the sandbox user id
  return { id: user.id, username: user.username };
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
  res.json({ token: makeToken(user), username: user.username, email: user.email });
});

// Verify token — accepts both sandbox and site-wide tokens
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token.' });
  try {
    const payload = verifyToken(auth.replace('Bearer ', ''));
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
