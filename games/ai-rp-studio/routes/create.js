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
// Body: { prompt, duration }
router.post('/song', async (req, res) => {
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'Replicate API not configured.' });

  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    // Step 1: Claude sharpens the prompt AND picks the best duration
    const enhanced = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: `You help generate music. Given a description, return JSON with two fields:
- "prompt": a vivid 1-sentence music prompt describing style, mood, instruments, and tempo. Be specific.
- "duration": the ideal length in seconds as a number. Rules: short energetic pieces 60-90s, standard songs 120s, epic/cinematic/ambient 150-180s. Pick what fits best.
Return ONLY valid JSON, nothing else. Example: {"prompt":"upbeat jazz piano trio","duration":120}`,
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    let musicPrompt, clampedDuration;
    try {
      const parsed = JSON.parse(enhanced.content[0].text.trim());
      musicPrompt = parsed.prompt || prompt.trim();
      clampedDuration = Math.min(180, Math.max(30, parseInt(parsed.duration) || 120));
    } catch {
      musicPrompt = enhanced.content[0].text.trim();
      clampedDuration = 120;
    }

    // Step 2: Generate with meta/musicgen on Replicate (Prefer: wait for sync)
    const response = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=10',
      },
      body: JSON.stringify({
        input: {
          prompt: musicPrompt,
          duration: clampedDuration,
          model_version: 'stereo-large',
          output_format: 'mp3',
          normalization_strategy: 'peak',
        },
      }),
    });

    const data = await response.json();

    // Synchronous response
    if (data.output) return res.json({ audioUrl: data.output, prompt: musicPrompt, duration: clampedDuration });

    // Poll — longer songs need more time (up to ~4 min)
    if (data.id) {
      for (let i = 0; i < 80; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
        });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded' && pollData.output) {
          return res.json({ audioUrl: pollData.output, prompt: musicPrompt, duration: clampedDuration });
        }
        if (pollData.status === 'failed') {
          return res.status(500).json({ error: 'Music generation failed.' });
        }
      }
      return res.status(500).json({ error: 'Timed out waiting for music.' });
    }

    res.status(500).json({ error: data.error || 'Music generation failed.' });
  } catch (err) {
    console.error('Song create error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
