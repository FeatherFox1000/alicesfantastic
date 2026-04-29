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

// Set a user's password (owner only)
router.post('/admin/set-password/:username', ownerOnly, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user.id);
  res.json({ message: `Password updated for ${req.params.username}.` });
});

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

// Get all notifications sent to a user (admin only)
router.get('/admin/notifications/:username', adminOnly, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  const notifs = db.prepare('SELECT id, message, read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC').all(target.id);
  res.json(notifs);
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

// Owner only: set/update a user's score
router.post('/admin/scores/:username', ownerOnly, (req, res) => {
  const { game, score } = req.body;
  if (!VALID_GAMES.includes(game)) return res.status(400).json({ error: 'Invalid game.' });
  if (!Number.isInteger(score) || score < 0) return res.status(400).json({ error: 'Invalid score.' });
  const target = db.prepare('SELECT id, username FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  db.prepare(
    `INSERT INTO scores (user_id, username, game, score) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, game) DO UPDATE SET score = excluded.score, created_at = datetime('now')`
  ).run(target.id, target.username, game, score);
  res.json({ success: true, game, score });
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

// --- Feedback & Reviews ---
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 10),
    title TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'comment',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
// One review per user — they can update it
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS feedback_user_unique ON feedback(user_id)`); } catch {}

try { db.exec(`ALTER TABLE feedback ADD COLUMN title TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE feedback ADD COLUMN type TEXT NOT NULL DEFAULT 'comment'`); } catch {}
try { db.exec(`ALTER TABLE feedback ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`); } catch {}

// Get all feedback (public) — pinned first, then newest
router.get('/feedback', (req, res) => {
  const rows = db.prepare('SELECT id, username, rating, title, comment, type, pinned, created_at FROM feedback ORDER BY pinned DESC, id DESC').all();
  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : null;
  res.json({ feedback: rows, average: avg, count: rows.length });
});

// Get my own feedback
router.get('/feedback/mine', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const row = db.prepare('SELECT id, rating, title, comment, type, pinned, created_at FROM feedback WHERE user_id = ?').get(user.id);
  res.json(row || null);
});

// Submit or update my feedback
router.post('/feedback', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const { rating, title, comment, type } = req.body;
  if (!rating || rating < 1 || rating > 10) return res.status(400).json({ error: 'Rating must be between 1 and 10.' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required.' });
  if (title.length > 100) return res.status(400).json({ error: 'Title too long (max 100 characters).' });
  if (!comment || !comment.trim()) return res.status(400).json({ error: 'Comment is required.' });
  if (comment.length > 1000) return res.status(400).json({ error: 'Comment too long (max 1000 characters).' });
  const postType = type === 'bug' ? 'bug' : 'comment';
  db.prepare(`
    INSERT INTO feedback (user_id, username, rating, title, comment, type)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET rating = excluded.rating, title = excluded.title, comment = excluded.comment, type = excluded.type, created_at = datetime('now')
  `).run(user.id, user.username, rating, title.trim(), comment.trim(), postType);
  res.json({ ok: true });
});

// Delete my feedback
router.delete('/feedback', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  db.prepare('DELETE FROM feedback WHERE user_id = ?').run(user.id);
  res.json({ ok: true });
});

// Admin: delete any feedback
router.delete('/admin/feedback/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM feedback WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Admin: pin/unpin feedback
router.post('/admin/feedback/:id/pin', adminOnly, (req, res) => {
  const row = db.prepare('SELECT pinned FROM feedback WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found.' });
  const newPinned = row.pinned ? 0 : 1;
  db.prepare('UPDATE feedback SET pinned = ? WHERE id = ?').run(newPinned, req.params.id);
  res.json({ pinned: newPinned });
});

// --- Buddies (Friend System) ---

function makeBuddyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = Math.random() < 0.5 ? 5 : 6;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS buddy_codes (
    user_id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(requester_id, addressee_id),
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS friend_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Get existing buddy code, or create one if none exists
router.get('/buddies/code', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  let row = db.prepare('SELECT code FROM buddy_codes WHERE user_id = ?').get(user.id);
  if (!row) {
    const code = makeBuddyCode();
    db.prepare("INSERT INTO buddy_codes (user_id, code, created_at) VALUES (?, ?, datetime('now'))").run(user.id, code);
    row = { code };
  }
  res.json({ code: row.code });
});

// Generate a brand new buddy code (only when user clicks the refresh button)
router.post('/buddies/code', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const code = makeBuddyCode();
  db.prepare("INSERT OR REPLACE INTO buddy_codes (user_id, code, created_at) VALUES (?, ?, datetime('now'))").run(user.id, code);
  res.json({ code });
});

// Search for users by username — tries progressively shorter prefixes so
// e.g. "warriors" still matches "warrior_cats"
router.get('/buddies/search', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const q = (req.query.q || '').trim();
  if (q.length < 1) return res.json([]);
  const search = db.prepare(
    `SELECT username FROM users WHERE username LIKE ? AND username != ? AND is_banned = 0 LIMIT 10`
  );
  for (let len = q.length; len >= 1; len--) {
    const results = search.all(`${q.slice(0, len)}%`, user.username);
    if (results.length > 0) return res.json(results.map(r => r.username));
  }
  res.json([]);
});

// Send a friend request (requires target's current buddy code)
router.post('/buddies/request', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const { username, code } = req.body;
  if (!username || !code) return res.status(400).json({ error: 'Username and buddy code are required.' });
  const target = db.prepare('SELECT id, username FROM users WHERE username = ? AND is_banned = 0').get(username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.id === user.id) return res.status(400).json({ error: "You can't add yourself as a buddy!" });

  const codeRow = db.prepare('SELECT code FROM buddy_codes WHERE user_id = ?').get(target.id);
  if (!codeRow || codeRow.code !== code.toUpperCase().trim()) {
    return res.status(400).json({ error: 'Wrong buddy code! Ask your friend for their current code from their Buddies page.' });
  }

  const existing = db.prepare(
    'SELECT id, status FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)'
  ).get(user.id, target.id, target.id, user.id);
  if (existing) {
    if (existing.status === 'accepted') return res.status(400).json({ error: 'You are already buddies!' });
    return res.status(400).json({ error: 'A buddy request already exists.' });
  }

  db.prepare("INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')").run(user.id, target.id);
  res.json({ message: `Buddy request sent to ${username}! They need to approve it.` });
});

// Get my incoming pending requests
router.get('/buddies/requests', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const requests = db.prepare(
    `SELECT f.id, u.username as from_username, f.created_at
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`
  ).all(user.id);
  res.json(requests);
});

// Approve a buddy request
router.post('/buddies/requests/:id/approve', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const request = db.prepare("SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = 'pending'").get(req.params.id, user.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(request.id);
  const requester = db.prepare('SELECT username FROM users WHERE id = ?').get(request.requester_id);
  res.json({ message: `You and ${requester.username} are now buddies!` });
});

// Deny a buddy request
router.post('/buddies/requests/:id/deny', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const request = db.prepare("SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = 'pending'").get(req.params.id, user.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  db.prepare('DELETE FROM friendships WHERE id = ?').run(request.id);
  res.json({ message: 'Request declined.' });
});

// Get my friends list
router.get('/buddies', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const rows = db.prepare(
    `SELECT u1.id as rid, u1.username as requester, u2.id as aid, u2.username as addressee
     FROM friendships f
     JOIN users u1 ON u1.id = f.requester_id
     JOIN users u2 ON u2.id = f.addressee_id
     WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'`
  ).all(user.id, user.id);
  const friends = rows.map(row => {
    const friendUsername = row.rid === user.id ? row.addressee : row.requester;
    const friendId = row.rid === user.id ? row.aid : row.rid;
    const unread = db.prepare(
      'SELECT COUNT(*) as count FROM friend_messages WHERE sender_id = ? AND receiver_id = ? AND read = 0'
    ).get(friendId, user.id).count;
    return { username: friendUsername, unread };
  });
  friends.sort((a, b) => a.username.localeCompare(b.username));
  res.json(friends);
});

// Remove a buddy
router.delete('/buddies/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  db.prepare(
    'DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)'
  ).run(user.id, target.id, target.id, user.id);
  res.json({ message: `${req.params.username} removed from buddies.` });
});

// Get messages with a specific friend
router.get('/buddies/messages/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!friend) return res.status(404).json({ error: 'User not found.' });

  const friendship = db.prepare(
    `SELECT id FROM friendships WHERE ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) AND status = 'accepted'`
  ).get(user.id, friend.id, friend.id, user.id);
  if (!friendship) return res.status(403).json({ error: 'You are not buddies with this user.' });

  db.prepare('UPDATE friend_messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?').run(friend.id, user.id);

  const messages = db.prepare(
    `SELECT fm.id, u.username as sender, fm.content, fm.read, fm.created_at
     FROM friend_messages fm
     JOIN users u ON u.id = fm.sender_id
     WHERE (fm.sender_id = ? AND fm.receiver_id = ?) OR (fm.sender_id = ? AND fm.receiver_id = ?)
     ORDER BY fm.created_at DESC LIMIT 50`
  ).all(user.id, friend.id, friend.id, user.id);
  res.json(messages.reverse());
});

// Send a message to a friend
router.post('/buddies/messages/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!friend) return res.status(404).json({ error: 'User not found.' });

  const friendship = db.prepare(
    `SELECT id FROM friendships WHERE ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) AND status = 'accepted'`
  ).get(user.id, friend.id, friend.id, user.id);
  if (!friendship) return res.status(403).json({ error: 'You are not buddies with this user.' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
  if (content.length > 500) return res.status(400).json({ error: 'Message too long (max 500 characters).' });

  const result = db.prepare('INSERT INTO friend_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(user.id, friend.id, content.trim());
  res.json({
    id: result.lastInsertRowid,
    sender: user.username,
    content: content.trim(),
    read: 0,
    created_at: new Date().toISOString(),
  });
});

module.exports = router;
