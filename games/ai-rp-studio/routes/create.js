const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { generateSceneImage } = require('./imageGen');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/create/image
// Body: { prompt, art_style }
router.post('/image', async (req, res) => {
  const { prompt, art_style } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    const imageUrl = await generateSceneImage({
      worldName: 'Image Creator',
      storyText: prompt.trim(),
      artStyle: art_style || '3d',
    });
    if (!imageUrl) return res.status(500).json({ error: 'Image generation failed. Please try again.' });
    res.json({ imageUrl });
  } catch (err) {
    console.error('Image create error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// POST /api/create/song
// Body: { prompt }
router.post('/song', async (req, res) => {
  const MUSIC_TOKEN = process.env.REPLICATE_MUSIC_TOKEN || process.env.REPLICATE_API_TOKEN;
  if (!MUSIC_TOKEN) return res.status(500).json({ error: 'Replicate API not configured.' });

  const MUSICGEN_VERSION = '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';

  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    // Step 1: Claude picks title, sharpens music prompt, and picks duration — all in one call
    const enhanced = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: `You help generate music. Given a description, return JSON with three fields:
- "title": a creative short song title (2-5 words, no quotes)
- "prompt": a vivid 1-sentence music prompt describing style, mood, instruments, and tempo. Be specific.
- "duration": ideal length in seconds. Rules: short energetic pieces 60-90s, standard songs 120s, epic/cinematic/ambient 150-180s.
Return ONLY valid JSON. Example: {"title":"Clash of the Clans","prompt":"epic orchestral battle music with drums and strings","duration":120}`,
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    let title, musicPrompt, clampedDuration;
    try {
      const raw = enhanced.content[0].text.trim().replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      title = parsed.title || prompt.slice(0, 30);
      musicPrompt = parsed.prompt || prompt.trim();
      clampedDuration = Math.min(180, Math.max(30, parseInt(parsed.duration) || 120));
    } catch {
      title = prompt.slice(0, 30);
      musicPrompt = prompt.trim();
      clampedDuration = 120;
    }

    // Step 2: Generate cover image and music in parallel
    const [coverUrl, musicRes] = await Promise.all([
      // Cover image via FLUX Schnell
      generateSceneImage({
        worldName: 'Music Lab',
        storyText: `Album cover art for a song called "${title}". ${musicPrompt}`,
        artStyle: 'abstract',
      }).catch(() => null),

      // Music via meta/musicgen (versioned endpoint)
      fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${MUSIC_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=10',
        },
        body: JSON.stringify({
          version: MUSICGEN_VERSION,
          input: {
            prompt: musicPrompt,
            duration: clampedDuration,
            model_version: 'stereo-large',
            output_format: 'mp3',
            normalization_strategy: 'peak',
          },
        }),
      }).then(r => r.json()),
    ]);

    // Handle musicgen response — poll if not immediately ready
    async function resolveMusic(data) {
      if (data.output) return data.output;
      if (data.error) throw new Error(data.error);
      if (data.id) {
        for (let i = 0; i < 80; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
            headers: { 'Authorization': `Token ${MUSIC_TOKEN}` },
          });
          const p = await poll.json();
          if (p.status === 'succeeded' && p.output) return p.output;
          if (p.status === 'failed') throw new Error('Music generation failed.');
        }
        throw new Error('Timed out waiting for music.');
      }
      throw new Error(data.detail || 'Music generation failed.');
    }

    const audioUrl = await resolveMusic(musicRes);
    res.json({ audioUrl, title, prompt: musicPrompt, duration: clampedDuration, coverUrl });
  } catch (err) {
    console.error('Song create error:', err.message);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
});

module.exports = router;
