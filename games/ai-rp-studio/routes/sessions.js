const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { authMiddleware } = require('./characters');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STYLE_INSTRUCTIONS = {
  standard: '',
  saga: `\n\nSTYLE: SAGA MODE — Write longer, richly detailed responses with deep world-building. Paint the full picture of each scene — describe the environment, the history, the lore. Build up a grand, sweeping narrative like an epic novel. You may write 5-8 lines when the moment calls for it.`,
  epic: `\n\nSTYLE: EPIC MODE — Write with dramatic flair! Big battles, heroic moments, powerful emotions. Use vivid action words, describe epic moves and clashes. Make everything feel grand and legendary. Lean into longer descriptions for action scenes.`,
  tale: `\n\nSTYLE: TALE MODE — Write longer, more detailed responses like a classic storybook. Take your time describing scenes, characters, and events. Include rich sensory details and paint vivid pictures with words. You may write 5-7 lines per response.`,
  cozy: `\n\nSTYLE: COZY MODE — Write with warmth and gentleness. Focus on peaceful moments, friendly conversations, beautiful scenery, and comfy vibes. Keep things calm and happy. Describe cozy details like warm fires, soft grass, and friendly smiles.`,
  silly: `\n\nSTYLE: SILLY MODE — Be funny and goofy! Add unexpected humor, silly character reactions, absurd situations, and playful chaos. Use funny sound effects and exaggerated descriptions. Make the player laugh!`,
  mysterious: `\n\nSTYLE: MYSTERIOUS MODE — Write with suspense and intrigue. Add secrets, hidden clues, eerie atmospheres, and unexpected twists. Use mysterious descriptions — shadows, whispers, glowing eyes, ancient riddles. Keep the player guessing.`,
  poetic: `\n\nSTYLE: POETIC MODE — Write with beautiful, lyrical language. Use flowing descriptions, metaphors, and dreamy imagery. Make every scene feel magical and painterly. Focus on sensory details — colors, sounds, textures, and feelings.`,
  quick: `\n\nSTYLE: QUICK MODE — Keep responses SHORT — 1-2 lines max. Be punchy and fast-paced. No long descriptions. Just the action, the reaction, and move on. Perfect for rapid back-and-forth.`,
  dramatic: `\n\nSTYLE: DRAMATIC MODE — Crank up the emotions! Big reveals, shocking twists, intense character moments. NPCs should have strong feelings and reactions. Create tension, suspense, and emotional payoffs. Make the player feel like they're in a movie.`,
  spooky: `\n\nSTYLE: SPOOKY MODE — Add creepy, eerie vibes to everything. Shadows move on their own, strange sounds echo, things aren't what they seem. Use suspenseful pacing — build dread slowly. Keep it fun-scary, not actually terrifying (remember the audience is kids).`,
  romance: `\n\nSTYLE: FRIENDSHIP MODE — Focus on bonds, loyalty, and heartfelt connections between characters. NPCs should feel like real friends with deep personalities. Emphasize teamwork, trust, heartfelt conversations, and the power of friendship. Make emotional moments land.`,
};

function buildSystemPrompt(character, style) {
  const memories = db.prepare('SELECT category, content FROM memories WHERE character_id = ? ORDER BY created_at ASC').all(character.id);
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
${character.personality ? `Personality: ${character.personality}` : ''}${memoriesBlock}

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
- All content must be completely family-friendly and appropriate for children ages 6-14
- No romantic or suggestive content of any kind
- No genuinely scary or disturbing content (light adventure peril is fine)
- No graphic violence (cartoon adventure action is fine)
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
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.char_id);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystemPrompt(character, style),
      messages: history.map(m => ({ role: m.role, content: m.content }))
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

    // Save AI response (without memory tags)
    db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(req.params.id, 'assistant', aiContent);

    // Save extracted memories
    const savedMemories = [];
    for (const mem of newMemories) {
      const existing = db.prepare('SELECT id FROM memories WHERE character_id = ? AND content = ?').get(session.char_id, mem.content);
      if (!existing) {
        const result = db.prepare('INSERT INTO memories (character_id, category, content) VALUES (?, ?, ?)').run(session.char_id, mem.category, mem.content);
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

    res.json({ role: 'assistant', content: aiContent, newMemories: savedMemories });
  } catch (err) {
    console.error('Claude API error:', err.message);
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

module.exports = router;
