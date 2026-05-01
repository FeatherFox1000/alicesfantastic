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

  const { prompt, duration } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required.' });

  const clampedDuration = Math.min(30, Math.max(5, parseInt(duration) || 15));

  try {
    // Step 1: Claude sharpens the music prompt
    const enhanced = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: 'You write short music generation prompts. Given a description, write a vivid 1-sentence prompt describing the style, mood, instruments, and tempo. Be specific. Return ONLY the prompt, nothing else.',
      messages: [{ role: 'user', content: prompt.trim() }],
    });
    const musicPrompt = enhanced.content[0].text.trim();

    // Step 2: Generate with meta/musicgen on Replicate (Prefer: wait for sync)
    const response = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
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
    if (data.output) return res.json({ audioUrl: data.output, prompt: musicPrompt });

    // Poll if needed
    if (data.id) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
        });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded' && pollData.output) {
          return res.json({ audioUrl: pollData.output, prompt: musicPrompt });
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
