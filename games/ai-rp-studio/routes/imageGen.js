const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate an image prompt from story text using Claude, then generate the image with Replicate FLUX Schnell
async function generateSceneImage(worldName, storyText) {
  if (!process.env.REPLICATE_API_TOKEN) return null;

  try {
    // Step 1: Ask Claude to write a short visual prompt
    const imgPromptRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: `You write short image prompts for a children's fantasy illustration. Given a story scene, write a vivid 1-sentence visual description. Focus on setting, characters, and mood. Child-friendly and colourful. No text or words in the image. Return ONLY the prompt text, nothing else.`,
      messages: [{ role: 'user', content: `World: ${worldName}. Scene: ${storyText.slice(0, 400)}` }]
    });
    const rawPrompt = imgPromptRes.content[0].text.trim().replace(/['"—–]/g, '').slice(0, 250);
    const fullPrompt = rawPrompt + ', digital art, children\'s fantasy illustration, vibrant colours, cute, painterly, no text';

    // Step 2: Generate image with Replicate FLUX Schnell (synchronous with Prefer: wait)
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
        }
      })
    });

    const data = await response.json();

    // Synchronous response — output is ready immediately
    if (data.output && data.output[0]) return data.output[0];

    // If not ready yet (shouldn't happen with Prefer:wait), poll
    if (data.id) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
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
