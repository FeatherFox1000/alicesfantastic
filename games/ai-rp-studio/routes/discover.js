const express = require('express');
const db = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS published_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('image','song','story')),
    title TEXT NOT NULL,
    content_url TEXT,
    cover_url TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

function optionalAuth(req, res, next) {
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (auth) {
    try { req.user = verifyToken(auth); } catch {}
  }
  next();
}

function requireAuth(req, res, next) {
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    req.user = verifyToken(auth);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// GET /api/discover — get all published items, newest first
router.get('/', (req, res) => {
  const items = db.prepare(
    'SELECT * FROM published_items ORDER BY created_at DESC LIMIT 100'
  ).all();
  res.json(items);
});

// POST /api/discover/publish — publish an item
router.post('/publish', requireAuth, (req, res) => {
  const { type, title, content_url, cover_url, description } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'type and title are required.' });

  // Look up username from site-auth users table
  let username = req.user.username;
  if (!username) {
    try {
      const siteDb = db; // same db
      const u = siteDb.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id);
      if (u) username = u.username;
    } catch {}
  }

  const result = db.prepare(
    'INSERT INTO published_items (user_id, username, type, title, content_url, cover_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, username || 'unknown', type, title.slice(0, 100), content_url || null, cover_url || null, description || null);

  res.json(db.prepare('SELECT * FROM published_items WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE /api/discover/publish/:id — unpublish (own items only)
router.delete('/publish/:id', requireAuth, (req, res) => {
  const item = db.prepare('SELECT * FROM published_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found.' });
  if (item.user_id !== req.user.id) return res.status(403).json({ error: 'Not yours.' });
  db.prepare('DELETE FROM published_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
