const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('./auth');
const { generateSceneImage } = require('./imageGen');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Use site JWT (same as site-auth.js) so site-logged-in users can access this
const SITE_JWT_SECRET = process.env.SITE_JWT_SECRET || 'alicesfantastic-secret-change-in-prod';

function getSiteUser(req) {
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth) return null;
  try {
    // Try site token first (username-based)
    const payload = jwt.verify(auth, SITE_JWT_SECRET);
    if (payload.username) return { id: payload.id, username: payload.username };
  } catch {}
  try {
    // Fall back to sandbox token
    const payload = verifyToken(auth);
    return { id: payload.id, username: payload.username };
  } catch {}
  return null;
}

function requireUser(req, res, next) {
  const user = getSiteUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  req.mpUser = user;
  next();
}

// --- DB setup ---
db.exec(`
  CREATE TABLE IF NOT EXISTS mp_worlds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_username TEXT NOT NULL,
    world_name TEXT NOT NULL,
    world_description TEXT NOT NULL,
    opening_scene TEXT DEFAULT '',
    player_age TEXT DEFAULT '8-10',
    character_mode TEXT NOT NULL DEFAULT 'own',
    ai_response_mode TEXT NOT NULL DEFAULT 'each',
    status TEXT NOT NULL DEFAULT 'waiting',
    current_turn_username TEXT,
    turn_started_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS mp_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'invited',
    joined_at TEXT,
    UNIQUE(world_id, username),
    FOREIGN KEY (world_id) REFERENCES mp_worlds(id) ON DELETE CASCADE
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS mp_characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    character_description TEXT NOT NULL,
    appearance TEXT DEFAULT '',
    personality TEXT DEFAULT '',
    UNIQUE(world_id, username),
    FOREIGN KEY (world_id) REFERENCES mp_worlds(id) ON DELETE CASCADE
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS mp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id INTEGER NOT NULL,
    sender TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (world_id) REFERENCES mp_worlds(id) ON DELETE CASCADE
  );
`);
try { db.exec(`ALTER TABLE mp_messages ADD COLUMN image_url TEXT`); } catch {}
try { db.exec(`ALTER TABLE mp_worlds ADD COLUMN image_gen INTEGER DEFAULT 0`); } catch {}

// Make sure shared_character columns exist
try { db.exec(`ALTER TABLE mp_worlds ADD COLUMN shared_char_name TEXT`); } catch {}
try { db.exec(`ALTER TABLE mp_worlds ADD COLUMN shared_char_description TEXT`); } catch {}
try { db.exec(`ALTER TABLE mp_worlds ADD COLUMN shared_char_appearance TEXT`); } catch {}
try { db.exec(`ALTER TABLE mp_worlds ADD COLUMN shared_char_personality TEXT`); } catch {}

function getActivePlayers(worldId) {
  return db.prepare(
    `SELECT username FROM mp_players WHERE world_id = ? AND status = 'joined' ORDER BY id ASC`
  ).all(worldId).map(r => r.username);
}

function nextTurn(world) {
  const players = [world.host_username, ...getActivePlayers(world.id).filter(u => u !== world.host_username)];
  const idx = players.indexOf(world.current_turn_username);
  return players[(idx + 1) % players.length];
}

function buildMpSystemPrompt(world) {
  const players = [world.host_username, ...getActivePlayers(world.id).filter(u => u !== world.host_username)];
  let charBlock = '';
  if (world.character_mode === 'shared') {
    charBlock = `\n🐾 Shared Character: "${world.shared_char_name}"\n${world.shared_char_description}`;
    if (world.shared_char_appearance) charBlock += `\nAppearance: ${world.shared_char_appearance}`;
    if (world.shared_char_personality) charBlock += `\nPersonality: ${world.shared_char_personality}`;
    charBlock += `\nAll players take turns playing as ${world.shared_char_name}.`;
  } else {
    const chars = db.prepare('SELECT * FROM mp_characters WHERE world_id = ?').all(world.id);
    charBlock = '\n🐾 Characters:\n' + players.map(username => {
      const c = chars.find(ch => ch.username === username);
      return c ? `- ${username} plays as ${c.name}: ${c.character_description}` : `- ${username} (no character yet)`;
    }).join('\n');
  }

  const ageRule = world.player_age === 'under-8'
    ? `- Players are UNDER 8. Keep everything gentle, sweet, and simple. No scary content, no combat. Conflicts solved with kindness.`
    : world.player_age === '8-10'
    ? `- Players are 8-10. Light adventure peril is fine. Minor cartoon injuries okay. Focus on teamwork and bravery.`
    : `- Players are 11+. Real intensity and complexity. Epic battles, genuine danger, emotional stakes. Think Warrior Cats / Percy Jackson intensity.`;

  return `You are a magical storytelling companion in The Sandbox MULTIPLAYER mode — a fantasy role-playing adventure game for children.

This is a MULTIPLAYER game with ${players.length} players taking turns. Players take turns writing what their character does, and you respond to each one and advance the story.

🌍 World: "${world.world_name}"
${world.world_description}
${world.opening_scene ? `\n📜 Opening Scene: "${world.opening_scene}"` : ''}
${charBlock}

Players (in turn order): ${players.join(' → ')}

Your role:
- Respond to whichever player just took their turn
- Address their action and advance the story
- Keep responses 3-4 lines — vivid but not too long
- You control NPCs and the world — NEVER speak or act for any player's character
- When a character speaks, format: CharacterName: "dialogue"
- Make the story feel connected — remember what earlier players did each round
- Keep it fun for all players simultaneously!

CONTENT RULES:
${ageRule}
- No romantic or suggestive content
- No inappropriate language
- Always encouraging and positive`;
}

// --- Create a new multiplayer world ---
router.post('/worlds', requireUser, (req, res) => {
  const { world_name, world_description, opening_scene, player_age, character_mode, ai_response_mode, buddies, shared_char_name, shared_char_description, shared_char_appearance, shared_char_personality, image_gen } = req.body;
  if (!world_name || !world_description) return res.status(400).json({ error: 'World name and description are required.' });
  if (!buddies || buddies.length === 0) return res.status(400).json({ error: 'Invite at least one buddy.' });

  const result = db.prepare(`
    INSERT INTO mp_worlds (host_username, world_name, world_description, opening_scene, player_age, character_mode, ai_response_mode, status, current_turn_username, turn_started_at, shared_char_name, shared_char_description, shared_char_appearance, shared_char_personality, image_gen)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?, datetime('now'), ?, ?, ?, ?, ?)
  `).run(
    req.mpUser.username, world_name, world_description, opening_scene || '', player_age || '8-10',
    character_mode || 'own', ai_response_mode || 'each', req.mpUser.username,
    shared_char_name || null, shared_char_description || null, shared_char_appearance || null, shared_char_personality || null,
    image_gen ? 1 : 0
  );
  const worldId = result.lastInsertRowid;

  // Host is automatically joined
  db.prepare(`INSERT INTO mp_players (world_id, username, status, joined_at) VALUES (?, ?, 'joined', datetime('now'))`).run(worldId, req.mpUser.username);

  // Invite buddies
  for (const buddy of buddies) {
    db.prepare(`INSERT OR IGNORE INTO mp_players (world_id, username, status) VALUES (?, ?, 'invited')`).run(worldId, buddy);
  }

  // If opening scene, add as first AI message
  if (opening_scene) {
    db.prepare(`INSERT INTO mp_messages (world_id, sender, role, content) VALUES (?, 'system', 'assistant', ?)`).run(worldId, opening_scene);
  }

  res.json({ id: worldId });
});

// --- Get worlds I'm part of (as host or player) ---
router.get('/worlds', requireUser, (req, res) => {
  const username = req.mpUser.username;
  const worlds = db.prepare(`
    SELECT w.*, p.status as my_status
    FROM mp_worlds w
    JOIN mp_players p ON p.world_id = w.id AND p.username = ?
    ORDER BY w.created_at DESC
  `).all(username);
  res.json(worlds);
});

// --- Get a single world ---
router.get('/worlds/:id', requireUser, (req, res) => {
  const world = db.prepare('SELECT * FROM mp_worlds WHERE id = ?').get(req.params.id);
  if (!world) return res.status(404).json({ error: 'World not found.' });
  const player = db.prepare('SELECT * FROM mp_players WHERE world_id = ? AND username = ?').get(world.id, req.mpUser.username);
  if (!player) return res.status(403).json({ error: 'You are not in this world.' });

  const players = db.prepare('SELECT username, status FROM mp_players WHERE world_id = ? ORDER BY id ASC').all(world.id);
  const characters = db.prepare('SELECT * FROM mp_characters WHERE world_id = ?').all(world.id);
  const messages = db.prepare('SELECT * FROM mp_messages WHERE world_id = ? ORDER BY id ASC').all(world.id);

  res.json({ ...world, players, characters, messages, my_status: player.status });
});

// --- Accept invite ---
router.post('/worlds/:id/join', requireUser, (req, res) => {
  const world = db.prepare('SELECT * FROM mp_worlds WHERE id = ?').get(req.params.id);
  if (!world) return res.status(404).json({ error: 'World not found.' });
  const player = db.prepare(`SELECT * FROM mp_players WHERE world_id = ? AND username = ?`).get(world.id, req.mpUser.username);
  if (!player) return res.status(403).json({ error: 'You were not invited to this world.' });
  db.prepare(`UPDATE mp_players SET status = 'joined', joined_at = datetime('now') WHERE world_id = ? AND username = ?`).run(world.id, req.mpUser.username);
  res.json({ ok: true });
});

// --- Decline invite ---
router.post('/worlds/:id/decline', requireUser, (req, res) => {
  db.prepare(`UPDATE mp_players SET status = 'declined' WHERE world_id = ? AND username = ?`).run(req.params.id, req.mpUser.username);
  res.json({ ok: true });
});

// --- Save/update my character ---
router.post('/worlds/:id/character', requireUser, (req, res) => {
  const { name, character_description, appearance, personality } = req.body;
  if (!name || !character_description) return res.status(400).json({ error: 'Name and description required.' });
  db.prepare(`
    INSERT INTO mp_characters (world_id, username, name, character_description, appearance, personality)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(world_id, username) DO UPDATE SET name=excluded.name, character_description=excluded.character_description, appearance=excluded.appearance, personality=excluded.personality
  `).run(req.params.id, req.mpUser.username, name, character_description, appearance || '', personality || '');
  res.json({ ok: true });
});

// --- Start the game (host only) ---
router.post('/worlds/:id/start', requireUser, (req, res) => {
  const world = db.prepare('SELECT * FROM mp_worlds WHERE id = ?').get(req.params.id);
  if (!world) return res.status(404).json({ error: 'World not found.' });
  if (world.host_username !== req.mpUser.username) return res.status(403).json({ error: 'Only the host can start the game.' });
  db.prepare(`UPDATE mp_worlds SET status = 'active', current_turn_username = ?, turn_started_at = datetime('now') WHERE id = ?`).run(world.host_username, world.id);
  res.json({ ok: true });
});

// --- Post a turn message ---
router.post('/worlds/:id/turn', requireUser, (req, res) => {
  const world = db.prepare('SELECT * FROM mp_worlds WHERE id = ?').get(req.params.id);
  if (!world) return res.status(404).json({ error: 'World not found.' });
  if (world.status !== 'active') return res.status(400).json({ error: 'Game is not active.' });

  // Check for timeout — if 60s elapsed and this isn't the current player, auto-advance
  const turnAge = (Date.now() - new Date(world.turn_started_at + 'Z').getTime()) / 1000;
  const isCurrentTurn = world.current_turn_username === req.mpUser.username;
  if (!isCurrentTurn && turnAge < 60) {
    return res.status(400).json({ error: `It's ${world.current_turn_username}'s turn!` });
  }

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

  // Save player message
  db.prepare(`INSERT INTO mp_messages (world_id, sender, role, content) VALUES (?, ?, 'user', ?)`).run(world.id, req.mpUser.username, content.trim());

  // Advance turn pointer first
  const nextPlayer = nextTurn(world);
  db.prepare(`UPDATE mp_worlds SET current_turn_username = ?, turn_started_at = datetime('now') WHERE id = ?`).run(nextPlayer, world.id);

  // Decide whether to call AI now
  const activePlayers = [world.host_username, ...getActivePlayers(world.id).filter(u => u !== world.host_username)];
  let shouldCallAI = false;

  if (world.ai_response_mode === 'round') {
    // Only call AI after every player has gone once since the last AI message
    const lastAIMsg = db.prepare(
      `SELECT id FROM mp_messages WHERE world_id = ? AND sender = 'ai' ORDER BY id DESC LIMIT 1`
    ).get(world.id);
    const sinceId = lastAIMsg ? lastAIMsg.id : 0;
    const playerMsgsSinceAI = db.prepare(
      `SELECT DISTINCT sender FROM mp_messages WHERE world_id = ? AND id > ? AND role = 'user'`
    ).all(world.id, sinceId).map(r => r.sender);
    // All active players must have posted since the last AI message
    shouldCallAI = activePlayers.every(p => playerMsgsSinceAI.includes(p));
  } else {
    // 'each' mode — always call AI
    shouldCallAI = true;
  }

  if (shouldCallAI) {
    const allMessages = db.prepare('SELECT * FROM mp_messages WHERE world_id = ? ORDER BY id ASC').all(world.id);
    const aiHistory = allMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.role === 'user' ? `[${m.sender}]: ${m.content}` : m.content,
    }));
    const systemPrompt = buildMpSystemPrompt(world);
    anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: aiHistory,
    }).then(async response => {
      const aiText = response.content[0].text;
      let imageUrl = null;
      if (world.image_gen) {
        const prevMsgs = db.prepare('SELECT content FROM mp_messages WHERE world_id = ? AND role = ? ORDER BY id DESC LIMIT 3').all(world.id, 'assistant');
        const previousTexts = prevMsgs.map(m => m.content).reverse();
        imageUrl = await generateSceneImage({
          worldName: world.world_name,
          worldDescription: world.world_description,
          storyText: aiText,
          previousTexts,
        });
      }
      db.prepare(`INSERT INTO mp_messages (world_id, sender, role, content, image_url) VALUES (?, 'ai', 'assistant', ?, ?)`).run(world.id, aiText, imageUrl);
    }).catch(err => {
      console.error('AI error in multiplayer:', err);
    });
  }

  // Return immediately — client polls for AI response
  res.json({ ok: true });
});

// --- Skip turn (host only, or timeout auto-skip) ---
router.post('/worlds/:id/skip', requireUser, (req, res) => {
  const world = db.prepare('SELECT * FROM mp_worlds WHERE id = ?').get(req.params.id);
  if (!world) return res.status(404).json({ error: 'World not found.' });
  if (world.status !== 'active') return res.status(400).json({ error: 'Game is not active.' });

  const isHost = world.host_username === req.mpUser.username;
  const isCurrentPlayer = world.current_turn_username === req.mpUser.username;
  const turnAge = (Date.now() - new Date(world.turn_started_at + 'Z').getTime()) / 1000;
  const timedOut = turnAge >= 60;

  if (!isHost && !isCurrentPlayer && !timedOut) {
    return res.status(403).json({ error: 'Only the host can skip turns.' });
  }

  const nextPlayer = nextTurn(world);
  db.prepare(`UPDATE mp_worlds SET current_turn_username = ?, turn_started_at = datetime('now') WHERE id = ?`).run(nextPlayer, world.id);
  db.prepare(`INSERT INTO mp_messages (world_id, sender, role, content) VALUES (?, 'system', 'assistant', ?)`).run(world.id, `⏭️ ${world.current_turn_username}'s turn was skipped.`);
  res.json({ ok: true, next_turn: nextPlayer });
});

// --- Poll for updates (returns messages since a given id) ---
router.get('/worlds/:id/poll', requireUser, (req, res) => {
  const world = db.prepare('SELECT * FROM mp_worlds WHERE id = ?').get(req.params.id);
  if (!world) return res.status(404).json({ error: 'World not found.' });
  const player = db.prepare('SELECT * FROM mp_players WHERE world_id = ? AND username = ?').get(world.id, req.mpUser.username);
  if (!player) return res.status(403).json({ error: 'Not in this world.' });

  const since = parseInt(req.query.since || '0');
  const newMessages = db.prepare('SELECT * FROM mp_messages WHERE world_id = ? AND id > ? ORDER BY id ASC').all(world.id, since);
  const turnAge = (Date.now() - new Date(world.turn_started_at + 'Z').getTime()) / 1000;

  res.json({
    status: world.status,
    current_turn_username: world.current_turn_username,
    turn_age_seconds: Math.floor(turnAge),
    new_messages: newMessages,
  });
});

module.exports = router;
