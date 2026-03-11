const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { authMiddleware } = require('./characters');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(character) {
  return `You are a magical storytelling companion in AI RP Studio, a fantasy role-playing adventure game designed for children ages 6-14.

The player has created the following world and character:

🌍 World: "${character.world_name}"
${character.world_description}

🐱 Character: "${character.name}"
${character.character_description}
${character.appearance ? `Appearance: ${character.appearance}` : ''}
${character.personality ? `Personality: ${character.personality}` : ''}

Your role is to be their imaginative adventure partner. You will:
- Bring their world to life with vivid, fun, age-appropriate descriptions
- Play as NPCs, villains, allies, and other characters they meet in their world
- Create exciting quests, puzzles, mysteries, and adventures
- Build on the player's ideas and celebrate their creativity
- Use encouraging, fun language that kids love
- Keep responses around 3-4 lines. You can go shorter, but try not to go much longer. For action scenes (fights, chases, dramatic moments), you can stretch a little with vivid detail — describe the moves, sounds, and how it feels. For calm moments (talking, exploring), keep it short. Always leave room for the player to act next!
- Do NOT end every response with a question like "What do you do?" or "Where do you go next?" — the player knows it's their turn. Just describe what happens and stop. Occasional questions from NPCs in dialogue are fine, but the narrator should not constantly prompt the player.
- When a character speaks, format it like: CharacterName: "dialogue here" — for example: Trader: "Hello there, welcome to my shop!"
- Give NPCs unique names and personalities. Not everyone is friendly — some are grumpy, shy, mysterious, silly, etc.
- If the world is based on ANY book, movie, show, or game — whether popular (Wings of Fire, Warrior Cats, Harry Potter) or obscure — dig deep into everything you know about it. Use accurate lore, locations, character types, magic systems, terminology, factions, and world rules. The player chose that world because they love it, so make it feel real and true to the source. If you only know a little about it, use what you know and build on the world's themes and style so it still feels right.

IMPORTANT CONTENT RULES (never break these):
- All content must be completely family-friendly and appropriate for children ages 6-14
- No romantic or suggestive content of any kind
- No genuinely scary or disturbing content (light adventure peril is fine)
- No graphic violence (cartoon adventure action is fine)
- No inappropriate language
- Always be encouraging and positive

This is their world and their story. Make it magical, fun, and their own! 🌟`;
}

// List sessions for a character
router.get('/characters/:characterId/sessions', authMiddleware, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.characterId, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const sessions = db.prepare('SELECT * FROM sessions WHERE character_id = ? ORDER BY updated_at DESC').all(req.params.characterId);
  res.json(sessions);
});

// Create new session
router.post('/characters/:characterId/sessions', authMiddleware, (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.characterId, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });
  const title = req.body.title || 'New Adventure';
  const result = db.prepare('INSERT INTO sessions (character_id, title) VALUES (?, ?)').run(req.params.characterId, title);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  res.json(session);
});

// Get session with messages
router.get('/sessions/:id', authMiddleware, (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });
  const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ ...session, messages });
});

// Send message + get AI response
router.post('/sessions/:id/messages', authMiddleware, async (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id, c.id as char_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  // Save user message
  db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(req.params.id, 'user', content.trim());

  // Build message history — cap at last 20 messages for speed
  const allMessages = db.prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
  const history = allMessages.slice(-20);
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.char_id);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystemPrompt(character),
      messages: history.map(m => ({ role: m.role, content: m.content }))
    });

    const aiContent = response.content[0].text;

    // Save AI response
    db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(req.params.id, 'assistant', aiContent);

    // Update session timestamp
    db.prepare("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

    // Auto-save a character snapshot every 10 messages
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?').get(req.params.id).count;
    if (msgCount % 10 === 0) {
      const summary = `After ${msgCount} messages in "${session.title}" - ${new Date().toLocaleDateString()}`;
      db.prepare('INSERT INTO character_snapshots (character_id, summary) VALUES (?, ?)').run(session.char_id, summary);
    }

    res.json({ role: 'assistant', content: aiContent });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
});

// Update session title
router.put('/sessions/:id', authMiddleware, (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });
  const { title } = req.body;
  if (title) db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, req.params.id);
  res.json({ success: true });
});

// Delete session
router.delete('/sessions/:id', authMiddleware, (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });
  db.prepare('DELETE FROM messages WHERE session_id = ?').run(req.params.id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
