const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate a scene image with full context for consistency.
 *
 * ctx = {
 *   worldName:          string   — world/story name
 *   worldDescription:   string?  — world setting description
 *   characterName:      string?  — player character name
 *   characterAppearance: string? — player character appearance
 *   storyText:          string   — the AI scene text to illustrate
 *   previousTexts:      string[] — last 2-3 AI scene texts (oldest first), for location continuity
 *   artStyle:           string?  — '3d' | 'chibi' | 'abstract'
 * }
 */
async function generateSceneImage(ctx) {
  if (!process.env.REPLICATE_API_TOKEN) return null;

  // Support legacy callers that pass (worldName, storyText) as two strings
  if (typeof ctx === 'string') {
    ctx = { worldName: ctx, storyText: arguments[1] };
  }

  const { worldName, worldDescription, characterName, characterAppearance, storyText, previousTexts, artStyle } = ctx;

  const styleMap = {
    '3d':       '3D render, Pixar-style, smooth glossy surfaces, subsurface scattering, cinematic 3D lighting, detailed 3D characters',
    chibi:      'chibi anime style, cute oversized heads, kawaii, pastel colors, big sparkly eyes, soft outlines, adorable',
    abstract:   'abstract digital art, bold geometric shapes, vibrant color blocks, stylized impressionistic, painterly brushstrokes, dreamy',
  };
  const styleSuffix = styleMap[artStyle] || styleMap['3d'];

  try {
    // Build context block for Claude
    const worldBlock = worldDescription
      ? `World: "${worldName}" — ${worldDescription.slice(0, 200)}`
      : `World: "${worldName}"`;

    const charBlock = characterName
      ? `Main character: ${characterName}${characterAppearance ? ` — ${characterAppearance}` : ''}.`
      : '';

    const prevBlock = previousTexts && previousTexts.length > 0
      ? `Previous scenes (for location & style reference):\n${previousTexts.slice(-3).map((t, i) => `${i + 1}. ${t.slice(0, 250)}`).join('\n')}`
      : '';

    const styleDesc = artStyle === 'chibi' ? 'chibi anime, kawaii, cute oversized heads' :
                      artStyle === 'abstract' ? 'abstract geometric, bold colors, stylized' :
                      '3D render, Pixar-style, smooth glossy surfaces';

    const systemPrompt = `You write short image prompts for a children's fantasy illustration series. Art style: ${styleDesc}. Every image must feel like it belongs in the same storybook.

Rules:
- CONSISTENT ART STYLE: always use ${styleDesc}. Never switch to a different art style.
- CONSISTENT CHARACTERS: if the main character appears, always describe them with the exact same appearance every time.
- CONSISTENT LOCATION: if the scene hasn't moved somewhere new, describe the same location. Only describe a new location if the story text clearly shows the characters moved there.
- Focus on the most visually interesting moment in the scene.
- Child-friendly. No scary gore, no text in the image.
- Return ONLY the image prompt, nothing else. One sentence, under 200 characters.`;

    const userMsg = [worldBlock, charBlock, prevBlock, `New scene to illustrate: ${storyText.slice(0, 400)}`]
      .filter(Boolean)
      .join('\n\n');

    // Step 1: Claude generates a precise, context-aware image prompt
    const imgPromptRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    });

    const rawPrompt = imgPromptRes.content[0].text.trim().replace(/['"—–]/g, '').slice(0, 250);
    const fullPrompt = rawPrompt + `, ${styleSuffix}, vibrant colours, children's fantasy, no text, no watermark`;

    // Step 2: Replicate FLUX Schnell — synchronous with Prefer: wait
    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          num_outputs: 1,
          aspect_ratio: '16:9',
          output_format: 'webp',
          num_inference_steps: 4,
        },
      }),
    });

    const data = await response.json();

    if (data.output && data.output[0]) return data.output[0];

    // Poll if not immediately ready
    if (data.id) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
        });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded' && pollData.output) return pollData.output[0];
        if (pollData.status === 'failed') return null;
      }
    }

    return null;
  } catch (err) {
    console.error('Image generation error:', err.message);
    return null;
  }
}

module.exports = { generateSceneImage };
