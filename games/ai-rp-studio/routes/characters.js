const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// List characters for user
router.get('/', auth, (req, res) => {
  const characters = db.prepare('SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(characters);
});

// Get single character
router.get('/:id', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  res.json(character);
});

// Create character
router.post('/', auth, (req, res) => {
  const { name, world_name, world_description, character_description, appearance, personality, player_age, intro_text, image_gen } = req.body;
  if (!name || !world_name || !world_description || !character_description) {
    return res.status(400).json({ error: 'Name, world name, world description, and character description are required.' });
  }
  // Ensure columns exist
  try { db.prepare('ALTER TABLE characters ADD COLUMN intro_text TEXT DEFAULT ""').run(); } catch {}
  try { db.prepare('ALTER TABLE characters ADD COLUMN image_gen INTEGER DEFAULT 0').run(); } catch {}
  const result = db.prepare(`
    INSERT INTO characters (user_id, name, world_name, world_description, character_description, appearance, personality, player_age, intro_text, image_gen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, world_name, world_description, character_description, appearance || '', personality || '', player_age || '', intro_text || '', image_gen ? 1 : 0);
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(result.lastInsertRowid);
  res.json(character);
});

// Update character
router.put('/:id', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const { name, world_name, world_description, character_description, appearance, personality, player_age, intro_text, image_gen } = req.body;
  try { db.prepare('ALTER TABLE characters ADD COLUMN intro_text TEXT DEFAULT ""').run(); } catch {}
  try { db.prepare('ALTER TABLE characters ADD COLUMN image_gen INTEGER DEFAULT 0').run(); } catch {}
  db.prepare(`
    UPDATE characters SET name=?, world_name=?, world_description=?, character_description=?, appearance=?, personality=?, player_age=?, intro_text=?, image_gen=?
    WHERE id=?
  `).run(
    name || character.name,
    world_name || character.world_name,
    world_description || character.world_description,
    character_description || character.character_description,
    appearance !== undefined ? appearance : character.appearance,
    personality !== undefined ? personality : character.personality,
    player_age !== undefined ? player_age : character.player_age,
    intro_text !== undefined ? intro_text : (character.intro_text || ''),
    image_gen !== undefined ? (image_gen ? 1 : 0) : (character.image_gen || 0),
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete character
router.delete('/:id', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  // Delete related data
  const sessions = db.prepare('SELECT id FROM sessions WHERE character_id = ?').all(req.params.id);
  for (const s of sessions) {
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(s.id);
  }
  db.prepare('DELETE FROM sessions WHERE character_id = ?').run(req.params.id);
  db.prepare('DELETE FROM character_snapshots WHERE character_id = ?').run(req.params.id);
  db.prepare('DELETE FROM memories WHERE character_id = ?').run(req.params.id);
  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get memories for a character (optionally filtered by session)
router.get('/:id/memories', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const sessionId = req.query.session_id;
  let memories;
  if (sessionId) {
    memories = db.prepare('SELECT * FROM memories WHERE character_id = ? AND (session_id = ? OR session_id IS NULL) ORDER BY created_at DESC').all(req.params.id, sessionId);
  } else {
    memories = db.prepare('SELECT * FROM memories WHERE character_id = ? ORDER BY created_at DESC').all(req.params.id);
  }
  res.json(memories);
});

// Add a memory
router.post('/:id/memories', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const { content, category, session_id } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Memory content is required.' });
  const validCategories = ['character', 'story', 'friends', 'items'];
  const cat = validCategories.includes(category) ? category : 'story';
  const result = db.prepare('INSERT INTO memories (character_id, session_id, category, content) VALUES (?, ?, ?, ?)').run(req.params.id, session_id || null, cat, content.trim());
  const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(result.lastInsertRowid);
  res.json(memory);
});

// Delete a memory
router.delete('/:id/memories/:memoryId', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const memory = db.prepare('SELECT * FROM memories WHERE id = ? AND character_id = ?').get(req.params.memoryId, req.params.id);
  if (!memory) return res.status(404).json({ error: 'Memory not found.' });
  db.prepare('DELETE FROM memories WHERE id = ?').run(req.params.memoryId);
  res.json({ success: true });
});

// Clear all memories for a character
router.delete('/:id/memories', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  db.prepare('DELETE FROM memories WHERE character_id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get character snapshots (evolution history)
router.get('/:id/snapshots', auth, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const snapshots = db.prepare('SELECT * FROM character_snapshots WHERE character_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(snapshots);
});

module.exports = router;
module.exports.authMiddleware = auth;
