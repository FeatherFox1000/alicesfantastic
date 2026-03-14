import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.SITE_JWT_SECRET || 'alicesfantastic-secret-change-in-prod';

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
  } catch {
    return null;
  }
}

// Signup — COPPA compliant
router.post('/signup', (req, res) => {
  const { username, email, password, is_child, parent_email } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (is_child && !parent_email) {
    return res.status(400).json({ error: 'A parent or guardian email is required for users under 13.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already taken.' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const consent_token = is_child ? crypto.randomBytes(32).toString('hex') : null;
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, is_child, parent_email, parent_consent, consent_token) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(username, email, password_hash, is_child ? 1 : 0, parent_email || null, is_child ? 0 : 1, consent_token);
  const user = { id: result.lastInsertRowid, username };

  if (is_child) {
    return res.json({
      pending_consent: true,
      message: 'Account created! A parent or guardian needs to approve this account. Please ask them to check their email or visit the consent page.',
      consent_token,
      username
    });
  }

  res.json({ token: makeToken(user), username, email });
});

// Parental consent verification
router.get('/consent/:token', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE consent_token = ?').get(req.params.token);
  if (!user) return res.status(404).json({ error: 'Invalid or expired consent link.' });
  if (user.parent_consent) return res.json({ message: 'This account has already been approved.', username: user.username });
  res.json({ username: user.username, parent_email: user.parent_email, pending: true });
});

router.post('/consent/:token', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE consent_token = ?').get(req.params.token);
  if (!user) return res.status(404).json({ error: 'Invalid or expired consent link.' });
  db.prepare('UPDATE users SET parent_consent = 1 WHERE id = ?').run(user.id);
  res.json({ message: `Account "${user.username}" has been approved!`, username: user.username });
});

// Parental consent denial — deletes the child's account
router.post('/consent/:token/deny', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE consent_token = ?').get(req.params.token);
  if (!user) return res.status(404).json({ error: 'Invalid or expired consent link.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.json({ message: 'Account has been removed.' });
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
  if (user.is_child && !user.parent_consent) {
    return res.status(403).json({ error: 'This account is waiting for parent/guardian approval. Please ask your parent to approve your account.' });
  }
  res.json({ token: makeToken(user), username: user.username, email: user.email, is_admin: user.is_admin });
});

// Verify token
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token.' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, is_banned, is_admin, is_child, created_at FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (user.is_banned) return res.status(403).json({ error: 'Your account has been banned.' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

// Delete account (user can delete their own, or parent can request deletion)
router.delete('/account', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.json({ message: 'Your account and all data have been deleted.' });
});

// Admin middleware
function adminOnly(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token.' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(payload.id);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Not authorized.' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// List all users (admin)
router.get('/admin/users', adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, username, email, is_banned, is_admin, is_child, parent_consent, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Ban a user (admin)
router.post('/admin/ban/:username', adminOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET is_banned = 1 WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} has been banned.` });
});

// Unban a user (admin)
router.post('/admin/unban/:username', adminOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET is_banned = 0 WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} has been unbanned.` });
});

export default router;
