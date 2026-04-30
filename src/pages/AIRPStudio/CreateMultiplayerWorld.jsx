import { useState, useEffect } from 'react';
import { api } from './api';
import { API_BASE } from '../../context/AuthContext';

export default function CreateMultiplayerWorld({ username, onCreated, onBack }) {
  const [step, setStep] = useState(0); // 0=world, 1=settings, 2=buddies, 3=shared-char
  const [form, setForm] = useState({
    world_name: '',
    world_description: '',
    opening_scene: '',
    player_age: '8-10',
    character_mode: 'own', // own | shared
    ai_response_mode: 'each',
    image_gen: false,
    shared_char_name: '',
    shared_char_description: '',
    shared_char_appearance: '',
    shared_char_personality: '',
  });
  const [friends, setFriends] = useState([]);
  const [selectedBuddies, setSelectedBuddies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    try {
      const token = localStorage.getItem('site_token');
      const res = await fetch(API_BASE + '/buddies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setFriends(data.map(f => f.username));
    } catch {}
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function toggleBuddy(username) {
    setSelectedBuddies(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  }

  async function submit() {
    if (selectedBuddies.length === 0) { setError('Pick at least one buddy to invite!'); return; }
    if (form.character_mode === 'shared' && (!form.shared_char_name || !form.shared_char_description)) {
      setError('Fill in the shared character name and description.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.mp.createWorld({ ...form, buddies: selectedBuddies });
      onCreated(data.id);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="mp-create-page">
      <button className="airp-back-btn" onClick={onBack}>← Back</button>
      <h2>✨ Create a Multiplayer World</h2>

      {/* Step indicator */}
      <div className="mp-steps">
        {['World', 'Settings', 'Buddies', ...(form.character_mode === 'shared' ? ['Character'] : [])].map((label, i) => (
          <div key={i} className={`mp-step ${step === i ? 'mp-step-active' : step > i ? 'mp-step-done' : ''}`}>
            <div className="mp-step-dot">{step > i ? '✓' : i + 1}</div>
            <div className="mp-step-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Step 0 — World */}
      {step === 0 && (
        <div className="mp-form-section">
          <h3>🌍 Your World</h3>
          <label className="mp-label">
            World Name *
            <input className="mp-input" type="text" value={form.world_name} onChange={e => set('world_name', e.target.value)} placeholder="e.g. Warrior Cats Forest, Dragon Kingdom..." maxLength={100} />
          </label>
          <label className="mp-label">
            Describe your world *
            <textarea className="mp-textarea" value={form.world_description} onChange={e => set('world_description', e.target.value)} placeholder="What is this world like? Who lives here? What makes it special?" rows={4} maxLength={1000} />
          </label>
          <label className="mp-label">
            Opening scene <span className="airp-optional">(optional)</span>
            <textarea className="mp-textarea" value={form.opening_scene} onChange={e => set('opening_scene', e.target.value)} placeholder="Set the scene for everyone when the game starts..." rows={3} maxLength={500} />
          </label>
          {error && <p className="mp-error">{error}</p>}
          <button className="mp-btn-primary" disabled={!form.world_name || !form.world_description} onClick={() => { if (!form.world_name || !form.world_description) { setError('Fill in the world name and description!'); return; } setStep(1); }}>
            Next →
          </button>
        </div>
      )}

      {/* Step 1 — Settings */}
      {step === 1 && (
        <div className="mp-form-section">
          <h3>⚙️ Game Settings</h3>

          <div className="mp-setting-group">
            <div className="mp-setting-label">Age level</div>
            <div className="airp-age-picker">
              {[
                { value: 'under-8', emoji: '🧸', label: 'Under 8', desc: 'Gentle & sweet' },
                { value: '8-10', emoji: '⚡', label: '8–10', desc: 'Fun & adventurous' },
                { value: '11-14', emoji: '⚔️', label: '11+', desc: 'Epic & exciting' },
              ].map(opt => (
                <button key={opt.value} type="button" className={`airp-age-option${form.player_age === opt.value ? ' active' : ''}`} onClick={() => set('player_age', opt.value)}>
                  <span className="airp-age-emoji">{opt.emoji}</span>
                  <span className="airp-age-label">{opt.label}</span>
                  <span className="airp-age-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mp-setting-group">
            <div className="mp-setting-label">Characters</div>
            <div className="mp-option-cards">
              <button className={`mp-option-card ${form.character_mode === 'own' ? 'mp-option-selected' : ''}`} onClick={() => set('character_mode', 'own')}>
                <span className="mp-option-icon">🐾</span>
                <span className="mp-option-title">Everyone makes their own</span>
                <span className="mp-option-desc">Each player creates their own character for this world</span>
              </button>
              <button className={`mp-option-card ${form.character_mode === 'shared' ? 'mp-option-selected' : ''}`} onClick={() => set('character_mode', 'shared')}>
                <span className="mp-option-icon">👥</span>
                <span className="mp-option-title">One shared character</span>
                <span className="mp-option-desc">You create one character and everyone takes turns playing as them</span>
              </button>
            </div>
          </div>

          <div className="mp-setting-group">
            <div className="mp-setting-label">AI responds...</div>
            <div className="mp-option-cards">
              <button className={`mp-option-card ${form.ai_response_mode === 'each' ? 'mp-option-selected' : ''}`} onClick={() => set('ai_response_mode', 'each')}>
                <span className="mp-option-icon">⚡</span>
                <span className="mp-option-title">After each player</span>
                <span className="mp-option-desc">AI responds to every turn — faster paced</span>
              </button>
              <button className={`mp-option-card ${form.ai_response_mode === 'round' ? 'mp-option-selected' : ''}`} onClick={() => set('ai_response_mode', 'round')}>
                <span className="mp-option-icon">🔄</span>
                <span className="mp-option-title">After a full round</span>
                <span className="mp-option-desc">AI waits for all players to go, then responds once</span>
              </button>
            </div>
          </div>

          <div className="mp-setting-group">
            <div className="mp-setting-label">🖼️ Scene Images</div>
            <p className="mp-hint" style={{marginBottom: '8px'}}>When on, the AI generates a picture with each story response.</p>
            <div className="airp-image-gen-toggle">
              <label className="airp-toggle-switch">
                <input type="checkbox" checked={form.image_gen} onChange={e => set('image_gen', e.target.checked)} />
                <span className="airp-toggle-slider"></span>
              </label>
              <span className="airp-toggle-text">{form.image_gen ? '🖼️ Images ON' : '🖼️ Images OFF'}</span>
            </div>
          </div>

          <div className="mp-form-nav">
            <button className="mp-btn-ghost" onClick={() => setStep(0)}>← Back</button>
            <button className="mp-btn-primary" onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 2 — Invite buddies */}
      {step === 2 && (
        <div className="mp-form-section">
          <h3>👫 Invite Buddies</h3>
          <p className="mp-hint">Pick which buddies to invite to this world:</p>

          {friends.length === 0 ? (
            <div className="mp-no-friends">
              <p>You don't have any buddies yet!</p>
              <p>Go to the Buddies page to add some friends first.</p>
            </div>
          ) : (
            <div className="mp-buddy-list">
              {friends.map(f => (
                <button key={f} className={`mp-buddy-item ${selectedBuddies.includes(f) ? 'mp-buddy-selected' : ''}`} onClick={() => toggleBuddy(f)}>
                  <span className="mp-buddy-avatar">🐾</span>
                  <span className="mp-buddy-name">{f}</span>
                  <span className="mp-buddy-check">{selectedBuddies.includes(f) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          )}

          {error && <p className="mp-error">{error}</p>}

          <div className="mp-form-nav">
            <button className="mp-btn-ghost" onClick={() => setStep(1)}>← Back</button>
            {form.character_mode === 'shared' ? (
              <button className="mp-btn-primary" disabled={selectedBuddies.length === 0} onClick={() => { if (selectedBuddies.length === 0) { setError('Pick at least one buddy!'); return; } setStep(3); }}>Next →</button>
            ) : (
              <button className="mp-btn-primary" disabled={loading || selectedBuddies.length === 0} onClick={submit}>
                {loading ? 'Creating...' : '🌍 Create World!'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — Shared character (only if mode=shared) */}
      {step === 3 && form.character_mode === 'shared' && (
        <div className="mp-form-section">
          <h3>🐾 Shared Character</h3>
          <p className="mp-hint">Everyone will take turns playing as this character:</p>

          <label className="mp-label">
            Character Name *
            <input className="mp-input" type="text" value={form.shared_char_name} onChange={e => set('shared_char_name', e.target.value)} placeholder="What is their name?" maxLength={60} />
          </label>
          <label className="mp-label">
            Who are they? *
            <textarea className="mp-textarea" value={form.shared_char_description} onChange={e => set('shared_char_description', e.target.value)} placeholder="What kind of character are they?" rows={3} maxLength={600} />
          </label>
          <label className="mp-label">
            Appearance <span className="airp-optional">(optional)</span>
            <input className="mp-input" type="text" value={form.shared_char_appearance} onChange={e => set('shared_char_appearance', e.target.value)} placeholder="What do they look like?" maxLength={200} />
          </label>
          <label className="mp-label">
            Personality <span className="airp-optional">(optional)</span>
            <input className="mp-input" type="text" value={form.shared_char_personality} onChange={e => set('shared_char_personality', e.target.value)} placeholder="What is their personality?" maxLength={200} />
          </label>

          {error && <p className="mp-error">{error}</p>}

          <div className="mp-form-nav">
            <button className="mp-btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="mp-btn-primary" disabled={loading} onClick={submit}>
              {loading ? 'Creating...' : '🌍 Create World!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
