import { useState } from 'react';
import { api } from './api';
import './AIRPStudio.css';


const EXAMPLES = [
  { emoji: '🐉', world: 'Dragon Kingdoms', char: 'A young dragon learning to fly', appearance: 'Shimmery purple scales with golden wings', personality: 'Curious and brave but a little clumsy' },
  { emoji: '🐱', world: 'The Magical Cat Realm', char: 'A clever cat with secret powers', appearance: 'Fluffy orange tabby with a silver tail', personality: 'Playful, sneaky, and super smart' },
  { emoji: '🐶', world: 'The Happy Dog Village', char: 'A friendly golden retriever pup', appearance: 'Fluffy golden fur with a big wagging tail', personality: 'Energetic, kind, and loves everyone' },
  { emoji: '🧚', world: 'Sparkle Forest', char: 'A tiny fairy who grants wishes', appearance: 'Lavender wings, glittery dress, sparkly wand', personality: 'Cheerful, magical, and always helpful' },
  { emoji: '🦄', world: 'Rainbow Meadows', char: 'A unicorn with rainbow magic', appearance: 'Snow white with a glowing rainbow horn', personality: 'Gentle, wise, and loves making friends' },
  { emoji: '🚀', world: 'Galaxy Adventure Academy', char: 'A junior space explorer', appearance: 'Space suit with star patches and a jetpack', personality: 'Bold, inventive, and loves discovery' },
];

export default function CreateCharacter({ onCreated, onBack, character }) {
  const isEditing = !!character;
  const [step, setStep] = useState(isEditing ? 1 : 0);
  const [form, setForm] = useState({
    name: character?.name || '',
    world_name: character?.world_name || '',
    world_description: character?.world_description || '',
    character_description: character?.character_description || '',
    appearance: character?.appearance || '',
    personality: character?.personality || '',
    player_age: character?.player_age || '8-10',
    intro_text: character?.intro_text || '',
    image_gen: character?.image_gen ? true : false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function useExample(ex) {
    setForm(f => ({
      ...f,
      world_name: ex.world,
      world_description: `A magical world called ${ex.world} full of wonder and adventure!`,
      character_description: ex.char,
      appearance: ex.appearance,
      personality: ex.personality,
    }));
    setStep(1);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.world_name || !form.world_description || !form.character_description) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const saved = isEditing
        ? await api.updateCharacter(character.id, form)
        : await api.createCharacter(form);
      onCreated(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="airp-create-page">
      <button className="airp-back-btn" onClick={onBack}>← Back</button>
      <h2>{isEditing ? `Edit ${character.name} ✏️` : 'Create Your Adventure! ✨'}</h2>
      <p className="airp-subtitle">{isEditing ? 'Change anything about your world or character' : 'Design your world and character — anything goes!'}</p>

      {step === 0 && (
        <>
          <h3 className="airp-section-label">Need inspiration? Pick a starter:</h3>
          <div className="airp-examples-grid">
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="airp-example-card" onClick={() => useExample(ex)}>
                <span className="airp-example-emoji">{ex.emoji}</span>
                <span className="airp-example-world">{ex.world}</span>
                <span className="airp-example-char">{ex.char}</span>
              </button>
            ))}
          </div>
          <div className="airp-or-divider">— or build from scratch —</div>
          <button className="airp-btn-primary" onClick={() => setStep(1)}>Start from Scratch 🌟</button>
        </>
      )}

      {step === 1 && (
        <form onSubmit={submit} className="airp-form airp-create-form">
          <div className="airp-form-section">
            <h3>🌍 Your World</h3>
            <label>
              World Name <span className="airp-required">*</span>
              <input
                type="text"
                value={form.world_name}
                onChange={e => set('world_name', e.target.value)}
                placeholder="e.g. Dragon Kingdoms, Happy Dog Village, Sparkle Forest..."
                required
                maxLength={100}
              />
            </label>
            <label>
              Describe Your World <span className="airp-required">*</span>
              <textarea
                value={form.world_description}
                onChange={e => set('world_description', e.target.value)}
                placeholder="What is your world like? What makes it special? Who lives there?"
                required
                rows={4}
                maxLength={1000}
              />
            </label>
            <label>
              Opening Scene <span className="airp-optional">(optional)</span>
              <textarea
                value={form.intro_text}
                onChange={e => set('intro_text', e.target.value)}
                placeholder="Set the scene! e.g. 'The sun rises over the Dragon Kingdoms as a young dragon wakes up in their cozy cave...'"
                rows={3}
                maxLength={500}
              />
            </label>
          </div>


          <div className="airp-form-section">
            <h3>🐾 Your Character</h3>
            <label>
              Character Name <span className="airp-required">*</span>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="What is your character's name?"
                required
                maxLength={60}
              />
            </label>
            <label>
              Who is your character? <span className="airp-required">*</span>
              <textarea
                value={form.character_description}
                onChange={e => set('character_description', e.target.value)}
                placeholder="What kind of character are they? A brave knight? A playful puppy? A young wizard?"
                required
                rows={3}
                maxLength={600}
              />
            </label>
            <label>
              What do they look like? <span className="airp-optional">(optional)</span>
              <input
                type="text"
                value={form.appearance}
                onChange={e => set('appearance', e.target.value)}
                placeholder="Describe their appearance..."
                maxLength={200}
              />
            </label>
            <label>
              What is their personality? <span className="airp-optional">(optional)</span>
              <input
                type="text"
                value={form.personality}
                onChange={e => set('personality', e.target.value)}
                placeholder="Are they funny, brave, shy, sneaky...?"
                maxLength={200}
              />
            </label>
          </div>

          <div className="airp-form-section airp-image-gen-section">
            <h3>🖼️ Scene Images <span className="airp-optional">(optional)</span></h3>
            <p className="airp-age-hint">When turned on, the AI will generate a picture to go with each story response. Images may take a few seconds to load.</p>
            <div className="airp-image-gen-toggle">
              <label className="airp-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.image_gen}
                  onChange={e => set('image_gen', e.target.checked)}
                />
                <span className="airp-toggle-slider"></span>
              </label>
              <span className="airp-toggle-text">
                {form.image_gen ? '🖼️ Images ON' : '🖼️ Images OFF'}
              </span>
            </div>
          </div>

          {error && <p className="airp-error">{error}</p>}

          <div className="airp-form-actions">
            {!isEditing && (
              <button type="button" className="airp-btn-ghost" onClick={() => setStep(0)}>← Examples</button>
            )}
            <button type="submit" className="airp-btn-primary" disabled={loading}>
              {loading
                ? '✨ Saving...'
                : isEditing ? '💾 Save Changes' : '🐾 Start My Adventure!'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
