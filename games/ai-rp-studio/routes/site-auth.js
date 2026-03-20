const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const JWT_SECRET = process.env.SITE_JWT_SECRET || 'alicesfantastic-secret-change-in-prod';

// Site-wide auth uses its own database, separate from The Sandbox
// On Fly.io use /data (persistent volume), locally use server/data to share with visitor-tracker
const dataDir = fs.existsSync('/data') ? '/data' : path.join(__dirname, '..', '..', '..', 'server', 'data');
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
    is_child INTEGER DEFAULT 0,
    parent_email TEXT,
    parent_consent INTEGER DEFAULT 0,
    consent_token TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
try { db.exec(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN last_login TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN ban_pending INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN ban_requested_by TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_child INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN parent_email TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN parent_consent INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN consent_token TEXT`); } catch (e) {}

// Leaderboard scores table
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    game TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, game),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

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
      message: 'Account created! A parent or guardian needs to approve this account.',
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
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
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
    const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(user.id);
    res.json({ ...user, unread_notifications: unread.count });
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

// Delete account
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
  const users = db.prepare('SELECT id, username, email, is_banned, is_admin, is_child, parent_consent, ban_pending, ban_requested_by, last_login, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Get detailed info for a single user (admin)
router.get('/admin/user/:username', adminOnly, (req, res) => {
  const u = db.prepare('SELECT id, username, email, password_hash, is_banned, is_admin, is_child, parent_email, parent_consent, ban_pending, ban_requested_by, last_login, created_at FROM users WHERE username = ?').get(req.params.username);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  const scores = db.prepare('SELECT game, score, created_at FROM scores WHERE user_id = ? ORDER BY game').all(u.id);
  res.json({ ...u, scores });
});

// Ban a user — owner bans instantly, co-admins request a pending ban
router.post('/admin/ban/:username', adminOnly, (req, res) => {
  const caller = getUser(req);
  if (caller.username === 'warrior_cats') {
    // Owner can instant-ban
    const result = db.prepare('UPDATE users SET is_banned = 1, ban_pending = 0, ban_requested_by = NULL WHERE username = ?').run(req.params.username);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `${req.params.username} has been banned.` });
  } else {
    // Co-admin requests a pending ban
    const result = db.prepare('UPDATE users SET ban_pending = 1, ban_requested_by = ? WHERE username = ?').run(caller.username, req.params.username);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `Ban request for ${req.params.username} sent to owner for approval.`, pending: true });
  }
});

// Confirm a pending ban (owner only)
router.post('/admin/confirm-ban/:username', ownerOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET is_banned = 1, ban_pending = 0, ban_requested_by = NULL WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} has been banned.` });
});

// Deny a pending ban (owner only)
router.post('/admin/deny-ban/:username', ownerOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET ban_pending = 0, ban_requested_by = NULL WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `Ban request for ${req.params.username} has been denied.` });
});

// Unban a user (owner only)
router.post('/admin/unban/:username', ownerOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET is_banned = 0, ban_pending = 0, ban_requested_by = NULL WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} has been unbanned.` });
});

// Approve a child account (admin)
router.post('/admin/approve/:username', adminOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET parent_consent = 1 WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} has been approved.` });
});

// Owner-only middleware (only warrior_cats)
function ownerOnly(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token.' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(payload.id);
    if (!user || user.username !== 'warrior_cats') return res.status(403).json({ error: 'Only the owner can do this.' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

router.post('/admin/make-admin/:username', ownerOnly, (req, res) => {
  const result = db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} is now an admin.` });
});

router.post('/admin/remove-admin/:username', ownerOnly, (req, res) => {
  if (req.params.username === 'warrior_cats') return res.status(400).json({ error: 'Cannot remove owner admin.' });
  const result = db.prepare('UPDATE users SET is_admin = 0 WHERE username = ?').run(req.params.username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: `${req.params.username} is no longer an admin.` });
});

// --- Notifications ---
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Get my notifications
router.get('/notifications', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const notifs = db.prepare('SELECT id, message, read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(user.id);
  res.json(notifs);
});

// Mark notification as read
router.post('/notifications/:id/read', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, user.id);
  res.json({ ok: true });
});

// Send notification to a user (admin only)
router.post('/admin/notify/:username', adminOnly, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(target.id, message.trim());
  res.json({ message: `Notification sent to ${req.params.username}.` });
});

// --- Admin Chat ---
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Get chat messages (admin only)
router.get('/admin/chat', adminOnly, (req, res) => {
  const messages = db.prepare('SELECT id, username, message, created_at FROM admin_chat ORDER BY id DESC LIMIT 100').all();
  res.json(messages.reverse());
});

// Send a chat message (admin only)
router.post('/admin/chat', adminOnly, (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });
  const result = db.prepare('INSERT INTO admin_chat (user_id, username, message) VALUES (?, ?, ?)').run(user.id, user.username, message.trim());
  res.json({ id: result.lastInsertRowid, username: user.username, message: message.trim(), created_at: new Date().toISOString() });
});

// --- Leaderboard ---
const VALID_GAMES = ['jumping-penguin', 'penguin-runner', 'tomato-hunter-v2'];

router.post('/scores', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const { game, score } = req.body;
  if (!VALID_GAMES.includes(game)) return res.status(400).json({ error: 'Invalid game.' });
  if (!Number.isInteger(score) || score < 0) return res.status(400).json({ error: 'Invalid score.' });
  db.prepare(
    `INSERT INTO scores (user_id, username, game, score) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, game) DO UPDATE SET score = excluded.score, created_at = excluded.created_at
     WHERE excluded.score > scores.score`
  ).run(user.id, user.username, game, score);
  res.json({ message: 'Score saved!' });
});

router.get('/scores/:game', (req, res) => {
  if (!VALID_GAMES.includes(req.params.game)) return res.status(400).json({ error: 'Invalid game.' });
  const scores = db.prepare('SELECT username, score, created_at FROM scores WHERE game = ? ORDER BY score DESC LIMIT 20').all(req.params.game);
  res.json(scores);
});

// --- Per-User Admin Notes (admins discuss a user) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS user_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    about_username TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    author_username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users(id)
  )
`);

// Get admin notes about a user
router.get('/admin/user-notes/:username', adminOnly, (req, res) => {
  const notes = db.prepare('SELECT id, author_username, message, created_at FROM user_notes WHERE about_username = ? ORDER BY id ASC').all(req.params.username);
  res.json(notes);
});

// Add a note about a user
router.post('/admin/user-notes/:username', adminOnly, (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });
  const result = db.prepare('INSERT INTO user_notes (about_username, author_id, author_username, message) VALUES (?, ?, ?, ?)').run(req.params.username, user.id, user.username, message.trim());
  res.json({ id: result.lastInsertRowid, author_username: user.username, message: message.trim(), created_at: new Date().toISOString() });
});

module.exports = router;
