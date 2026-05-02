const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { authMiddleware } = require('./characters');
const { generateSceneImage } = require('./imageGen');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Add image_gen column if it doesn't exist (existing characters default to 0 = off)
try { db.prepare('ALTER TABLE characters ADD COLUMN image_gen INTEGER DEFAULT 0').run(); } catch {}

const STYLE_INSTRUCTIONS = {
  standard: '',
  saga: `\n\nSTYLE: SAGA MODE — Write longer, richly detailed responses with deep world-building. Paint the full picture of each scene — describe the environment, the history, the lore. Build up a grand, sweeping narrative like an epic novel. You may write 5-8 lines when the moment calls for it.`,
  epic: `\n\nSTYLE: EPIC MODE — Write with dramatic flair! Big battles, heroic moments, powerful emotions. Use vivid action words, describe epic moves and clashes. Make everything feel grand and legendary. Lean into longer descriptions for action scenes.`,
  tale: `\n\nSTYLE: TALE MODE — Write longer, more detailed responses like a classic storybook. Take your time describing scenes, characters, and events. Include rich sensory details and paint vivid pictures with words. You may write 5-7 lines per response.`,
  cozy: `\n\nSTYLE: COZY MODE — Write with warmth and gentleness. Focus on peaceful moments, friendly conversations, beautiful scenery, and comfy vibes. Keep things calm and happy. Describe cozy details like warm fires, soft grass, and friendly smiles.`,
  silly: `\n\nSTYLE: SILLY MODE — Be funny and goofy! Add unexpected humor, silly character reactions, absurd situations, and playful chaos. Use funny sound effects and exaggerated descriptions. Make the player laugh!`,
  mysterious: `\n\nSTYLE: MYSTERIOUS MODE — Write with suspense and intrigue. Add secrets, hidden clues, eerie atmospheres, and unexpected twists. Use mysterious descriptions — shadows, whispers, glowing eyes, ancient riddles. Keep the player guessing.`,
  poetic: `\n\nSTYLE: POETIC MODE — Write with beautiful, lyrical language. Use flowing descriptions, metaphors, and dreamy imagery. Make every scene feel magical and painterly. Focus on sensory details — colors, sounds, textures, and feelings.`,
  quick: `\n\nSTYLE: QUICK MODE — Keep responses SHORT — 1-2 lines most of the time. Be punchy and fast-paced. No long descriptions. Just the action, the reaction, and move on. EXCEPTION: When a brand new character enters the scene or the story moves to a new setting/location, you may use 3-4 lines to set the scene or introduce them with flair — but keep it snappy and exciting, not slow. Then go right back to 1-2 lines. Perfect for rapid back-and-forth.`,
  dramatic: `\n\nSTYLE: DRAMATIC MODE — Crank up the emotions! Big reveals, shocking twists, intense character moments. NPCs should have strong feelings and reactions. Create tension, suspense, and emotional payoffs. Make the player feel like they're in a movie.`,
  spooky: `\n\nSTYLE: SPOOKY MODE — Add creepy, eerie vibes to everything. Shadows move on their own, strange sounds echo, things aren't what they seem. Use suspenseful pacing — build dread slowly. Keep it fun-scary, not actually terrifying (remember the audience is kids).`,
  romance: `\n\nSTYLE: FRIENDSHIP MODE — Focus on bonds, loyalty, and heartfelt connections between characters. NPCs should feel like real friends with deep personalities. Emphasize teamwork, trust, heartfelt conversations, and the power of friendship. Make emotional moments land.`,
};

function buildSystemPrompt(character, style, sessionId) {
  // Load memories for this session (or old memories with no session_id for backward compat)
  const memories = db.prepare(
    'SELECT category, content FROM memories WHERE character_id = ? AND (session_id = ? OR session_id IS NULL) ORDER BY created_at ASC'
  ).all(character.id, sessionId);
  let memoriesBlock = '';
  if (memories.length > 0) {
    const labels = { character: '🐱 Character Facts', story: '📖 Story Events', friends: '👥 Friends & NPCs', items: '🎒 Items & Abilities' };
    const grouped = {};
    for (const m of memories) {
      const cat = m.category || 'story';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m.content);
    }
    memoriesBlock = '\n\n📝 Memory Book (important things to remember):\n' +
      Object.entries(grouped).map(([cat, items]) =>
        `${labels[cat] || cat}:\n${items.map(c => `- ${c}`).join('\n')}`
      ).join('\n');
  }

  return `You are a magical storytelling companion in The Sandbox, a fantasy role-playing adventure game designed for children ages 6-14.

The player has created the following world and character:

🌍 World: "${character.world_name}"
${character.world_description}

🐱 Character: "${character.name}"
${character.character_description}
${character.appearance ? `Appearance: ${character.appearance}` : ''}
${character.personality ? `Personality: ${character.personality}` : ''}
${character.intro_text ? `\n📜 Opening Scene: "${character.intro_text}"\nUse this to set the tone for the start of the adventure.` : ''}${memoriesBlock}

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
- NEVER speak, act, think, or make decisions for the player's character "${character.name}". You control NPCs and the world — the player controls their own character. Do not write dialogue or actions for them. The only exception is if the player just told you what they said or did — then you can briefly reference it to keep the story flowing (e.g. if they say "I ask about the map" you can write 'You ask about the map and the merchant responds...').
- If the world is based on ANY book, movie, show, or game — whether popular (Wings of Fire, Warrior Cats, Harry Potter) or obscure — dig deep into everything you know about it. Use accurate lore, locations, character types, magic systems, terminology, factions, and world rules. The player chose that world because they love it, so make it feel real and true to the source. If you only know a little about it, use what you know and build on the world's themes and style so it still feels right.

MEMORY SYSTEM:
After your story response, if something important happened that's worth remembering, add memory tags on new lines at the very end. Use this format:
[MEMORY:category:short description]

Categories: character (facts about the player's character), story (key events), friends (NPCs met), items (items found or abilities gained)

Examples:
[MEMORY:friends:Met a grumpy blacksmith named Grog who sells enchanted weapons]
[MEMORY:items:Found a glowing blue crystal in the cave]
[MEMORY:story:Defeated the shadow wolves and saved the village]
[MEMORY:character:Discovered they can breathe underwater]

Rules for memories:
- Only add memories for genuinely important/memorable things — NOT every small action
- 0-2 memory tags per response (usually 0). Most responses need NO memories.
- Keep descriptions short (under 15 words)
- Don't duplicate things already in the Memory Book above
- New NPCs with names are always worth remembering as friends

IMPORTANT CONTENT RULES (never break these):
${character.player_age === 'under-8' ? `- The player is UNDER 8 years old. Keep everything very gentle, sweet, and simple.
- Use easy words and short sentences. No scary stuff at all — keep it happy and magical!
- ABSOLUTELY NO battles, fighting, or combat of any kind. Nobody gets hurt — not even villains. No scratches, no bumps, nothing.
- No villains doing mean things. If there's a "bad guy," they're just grumpy or confused and need a hug or a friend.
- All conflicts must be solved with kindness, sharing, talking it out, or friendship. Never with force.
- No danger, no peril, no scary moments. Everything should feel safe and warm.
- Think of it like a bedtime story — warm, cozy, and full of wonder. Like a cartoon for little kids.` :
character.player_age === '8-10' ? `- The player is 8-10 years old. Keep content fun and age-appropriate.
- Light adventure peril is fine (getting lost, needing to solve puzzles, mild danger from villains).
- Characters can get minor injuries — scratches, small cuts, scrapes, bumps, bruises — but nothing serious. No broken bones, no heavy bleeding, no one gets badly hurt.
- Cartoon-level action is great (bonking, slapstick, zapping with magic, tumbling, getting knocked back).
- Villains can be threatening but should not be truly scary or cruel. They can be defeated but don't need to die.
- Focus on teamwork, bravery, and clever solutions.` :
character.player_age === '11-14' ? `- The player is 11+ years old. You can write with real intensity and complexity.
- Battle scenes should be DETAILED and exciting — describe every sword clash, spell blast, arrow dodge, and dramatic move. Make fights feel cinematic and thrilling.
- Enemies and villains CAN be defeated, hurt, or even killed in battle. Bad guys can get what they deserve. A dragon can be slain, a villain can fall, monsters can be destroyed. This is part of epic storytelling.
- Villains can be genuinely menacing, cruel, and dangerous. They can threaten, scheme, and do bad things.
- Emotional stakes can be high — betrayal, sacrifice, loss, tough moral choices, characters getting wounded.
- Describe injuries in battle — cuts, bruises, getting knocked down, pain — but keep it adventure-style, not gory or gratuitous.
- Think of the intensity of Lord of the Rings, Percy Jackson, Wings of Fire, or Warrior Cats — real danger, real consequences.
- Still no torture, no real-world violence, no extremely graphic gore.` :
`- All content must be completely family-friendly and appropriate for children ages 6-14`}
- No romantic or suggestive content of any kind
- No inappropriate language
- Always be encouraging and positive

This is their world and their story. Make it magical, fun, and their own! 🌟${STYLE_INSTRUCTIONS[style] || ''}`;
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
  const newSessionId = result.lastInsertRowid;
  // If intro text provided, save it as the first assistant message
  if (req.body.intro_text) {
    db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(newSessionId, 'assistant', req.body.intro_text);
  }
  // Copy memories from a previous session if requested
  if (req.body.copy_memories_from) {
    const oldMemories = db.prepare(
      'SELECT category, content FROM memories WHERE character_id = ? AND (session_id = ? OR session_id IS NULL)'
    ).all(req.params.characterId, req.body.copy_memories_from);
    const insert = db.prepare('INSERT INTO memories (character_id, session_id, category, content) VALUES (?, ?, ?, ?)');
    for (const m of oldMemories) {
      insert.run(req.params.characterId, newSessionId, m.category, m.content);
    }
  }
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(newSessionId);
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
  try { db.prepare('ALTER TABLE messages ADD COLUMN image_url TEXT').run(); } catch {}
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

  const { content, style } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  // Save user message
  db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(req.params.id, 'user', content.trim());

  // Build message history — cap at last 20 messages for speed
  const allMessages = db.prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
  const history = allMessages.slice(-20);

  // Fix consecutive same-role messages (can happen if AI failed on a previous try)
  // Merge consecutive user messages and ensure alternating roles
  const cleanHistory = [];
  for (const msg of history) {
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === msg.role) {
      // Merge with previous message of same role
      cleanHistory[cleanHistory.length - 1].content += '\n' + msg.content;
    } else {
      cleanHistory.push({ role: msg.role, content: msg.content });
    }
  }
  // Ensure first message is from user
  if (cleanHistory.length > 0 && cleanHistory[0].role !== 'user') {
    cleanHistory.shift();
  }

  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.char_id);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystemPrompt(character, style, session.id),
      messages: cleanHistory
    });

    const rawContent = response.content[0].text;

    // Parse and extract memory tags
    const memoryRegex = /\[MEMORY:(character|story|friends|items):(.+?)\]/g;
    const newMemories = [];
    let match;
    while ((match = memoryRegex.exec(rawContent)) !== null) {
      newMemories.push({ category: match[1], content: match[2].trim() });
    }

    // Strip memory tags from the visible response
    const aiContent = rawContent.replace(/\n*\[MEMORY:[^\]]+\]/g, '').trim();

    // Ensure image_url column exists
    try { db.prepare('ALTER TABLE messages ADD COLUMN image_url TEXT').run(); } catch {}

    // Only generate an image if this character has images enabled
    let imageUrl = null;
    if (character.image_gen) {
      const prevMsgs = db.prepare('SELECT content FROM messages WHERE session_id = ? AND role = ? ORDER BY id DESC LIMIT 3').all(req.params.id, 'assistant');
      const previousTexts = prevMsgs.map(m => m.content).reverse();
      imageUrl = await generateSceneImage({
        worldName: character.world_name,
        worldDescription: character.world_description,
        characterName: character.name,
        characterAppearance: character.appearance,
        storyText: aiContent,
        previousTexts,
        artStyle: character.art_style || '3d',
      });
    }

    // Save AI response with image URL
    db.prepare('INSERT INTO messages (session_id, role, content, image_url) VALUES (?, ?, ?, ?)').run(req.params.id, 'assistant', aiContent, imageUrl);

    // Save extracted memories
    const savedMemories = [];
    for (const mem of newMemories) {
      const existing = db.prepare('SELECT id FROM memories WHERE character_id = ? AND session_id = ? AND content = ?').get(session.char_id, session.id, mem.content);
      if (!existing) {
        const result = db.prepare('INSERT INTO memories (character_id, session_id, category, content) VALUES (?, ?, ?, ?)').run(session.char_id, session.id, mem.category, mem.content);
        savedMemories.push(db.prepare('SELECT * FROM memories WHERE id = ?').get(result.lastInsertRowid));
      }
    }

    // Update session timestamp
    db.prepare("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

    // Auto-save a character snapshot every 10 messages
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?').get(req.params.id).count;
    if (msgCount % 10 === 0) {
      const summary = `After ${msgCount} messages in "${session.title}" - ${new Date().toLocaleDateString()}`;
      db.prepare('INSERT INTO character_snapshots (character_id, summary) VALUES (?, ?)').run(session.char_id, summary);
    }

    const savedMsg = db.prepare('SELECT id FROM messages WHERE session_id = ? AND role = ? ORDER BY id DESC LIMIT 1').get(req.params.id, 'assistant');
    res.json({ id: savedMsg?.id, role: 'assistant', content: aiContent, newMemories: savedMemories, imageUrl, imageGenEnabled: !!character.image_gen });
  } catch (err) {
    console.error('Claude API error:', err.message, err.status, JSON.stringify(err.error || {}));
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
});

// Generate inspiration replies
router.post('/sessions/:id/inspirations', authMiddleware, async (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id, c.id as char_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
  }

  const allMessages = db.prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
  const lastMessages = allMessages.slice(-6);
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.char_id);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `You help a player come up with fun actions for their character "${character.name}" in the world "${character.world_name}". Based on the recent conversation, suggest 4 short actions the player could take next. Each should be different — one exploring, one social, one action/adventure, one creative/funny. Write them in first person as things the character would do. Keep each under 12 words. Return ONLY a JSON array of 4 strings, no other text.`,
      messages: [
        ...lastMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: 'Give me 4 inspiration options for what to do next.' }
      ]
    });

    const text = response.content[0].text.trim();
    const ideas = JSON.parse(text);
    res.json(ideas);
  } catch (err) {
    console.error('Inspiration error:', err.message);
    res.status(500).json({ error: 'Could not generate ideas.' });
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

// Regenerate image for a specific message
router.post('/sessions/:sessionId/messages/:msgId/regenerate-image', authMiddleware, async (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id, c.id as char_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.sessionId);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });

  const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND session_id = ?').get(req.params.msgId, req.params.sessionId);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.char_id);

  // Get nearby messages for location/style context
  const prevMsgs = db.prepare('SELECT content FROM messages WHERE session_id = ? AND role = ? AND id < ? ORDER BY id DESC LIMIT 3').all(req.params.sessionId, 'assistant', msg.id);
  const previousTexts = prevMsgs.map(m => m.content).reverse();

  const imageUrl = await generateSceneImage({
    worldName: character.world_name,
    worldDescription: character.world_description,
    characterName: character.name,
    characterAppearance: character.appearance,
    storyText: msg.content,
    previousTexts,
    artStyle: character.art_style || '3d',
  });
  if (imageUrl) {
    db.prepare('UPDATE messages SET image_url = ? WHERE id = ?').run(imageUrl, msg.id);
  }
  res.json({ imageUrl });
});

// Backfill images for all assistant messages in a session that have no image
router.post('/sessions/:id/backfill-images', authMiddleware, async (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.user_id, c.id as char_id FROM sessions s
    JOIN characters c ON c.id = s.character_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Session not found.' });

  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.char_id);
  const msgs = db.prepare('SELECT * FROM messages WHERE session_id = ? AND role = ? AND (image_url IS NULL OR image_url = \'\') ORDER BY id ASC').all(req.params.id, 'assistant');

  // Process up to 5 at a time (limits response time to ~20s max)
  const batch = msgs.slice(0, 5);
  const results = {};
  for (const msg of batch) {
    // Get preceding assistant messages for location/style context
    const prevMsgs = db.prepare('SELECT content FROM messages WHERE session_id = ? AND role = ? AND id < ? ORDER BY id DESC LIMIT 3').all(req.params.id, 'assistant', msg.id);
    const previousTexts = prevMsgs.map(m => m.content).reverse();

    const imageUrl = await generateSceneImage({
      worldName: character.world_name,
      worldDescription: character.world_description,
      characterName: character.name,
      characterAppearance: character.appearance,
      storyText: msg.content,
      previousTexts,
      artStyle: character.art_style || '3d',
    });
    if (imageUrl) {
      db.prepare('UPDATE messages SET image_url = ? WHERE id = ?').run(imageUrl, msg.id);
      results[msg.id] = imageUrl;
    }
  }
  res.json({ updated: results, remaining: Math.max(0, msgs.length - batch.length) });
});

module.exports = router;
