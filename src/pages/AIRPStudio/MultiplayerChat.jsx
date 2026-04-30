import { useState, useEffect, useRef } from 'react';
import { api } from './api';

function SceneImage({ url }) {
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [imgSrc, setImgSrc] = useState(url + '&_a=0');
  const MAX_ATTEMPTS = 10;
  const timerRef = useRef(null);

  function scheduleRetry(currentAttempt) {
    if (currentAttempt >= MAX_ATTEMPTS) { setStatus('failed'); return; }
    timerRef.current = setTimeout(() => {
      const next = currentAttempt + 1;
      setAttempt(next);
      setImgSrc(url + '&_a=' + next);
      setStatus('loading');
    }, 30000);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="airp-scene-image-wrap">
      {status === 'loading' && (
        <div className="airp-scene-image-loading">
          {attempt > 0 ? `🖼️ Retrying... (${attempt + 1}/${MAX_ATTEMPTS + 1})` : '🖼️ Generating image...'}
        </div>
      )}
      {status === 'failed' && <div className="airp-scene-image-error">🖼️ Image could not be generated</div>}
      <img
        className="airp-scene-image"
        src={imgSrc}
        alt="Scene illustration"
        style={status !== 'loaded' ? { display: 'none' } : {}}
        onLoad={() => { clearTimeout(timerRef.current); setStatus('loaded'); }}
        onError={() => scheduleRetry(attempt)}
      />
    </div>
  );
}

export default function MultiplayerChat({ worldId, username, onBack }) {
  const [world, setWorld] = useState(null);
  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [myChar, setMyChar] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [turnAge, setTurnAge] = useState(0);
  const [showCharForm, setShowCharForm] = useState(false);
  const [charForm, setCharForm] = useState({ name: '', character_description: '', appearance: '', personality: '' });
  const [charSaving, setCharSaving] = useState(false);
  const lastMsgId = useRef(0);
  const pollRef = useRef(null);
  const turnTimerRef = useRef(null);

  useEffect(() => {
    loadWorld();
  }, []);

  useEffect(() => {
    if (!world) return;
    // Poll for updates
    pollRef.current = setInterval(poll, 3000);
    // Tick the turn timer every second
    turnTimerRef.current = setInterval(() => setTurnAge(a => a + 1), 1000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(turnTimerRef.current);
    };
  }, [world?.id]);

  async function loadWorld() {
    try {
      const data = await api.mp.getWorld(worldId);
      setWorld(data);
      setMessages(data.messages);
      setPlayers(data.players);
      if (data.messages.length > 0) lastMsgId.current = data.messages[data.messages.length - 1].id;
      // Find my character
      const mine = data.characters.find(c => c.username === username);
      if (mine) setMyChar(mine);
      else if (data.character_mode === 'own' && data.status !== 'waiting') setShowCharForm(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function poll() {
    try {
      const data = await api.mp.poll(worldId, lastMsgId.current);
      if (data.new_messages.length > 0) {
        setMessages(prev => [...prev, ...data.new_messages]);
        lastMsgId.current = data.new_messages[data.new_messages.length - 1].id;
      }
      setWorld(prev => prev ? { ...prev, current_turn_username: data.current_turn_username, status: data.status } : prev);
      setTurnAge(data.turn_age_seconds);
    } catch {}
  }

  async function saveCharacter(e) {
    e.preventDefault();
    if (!charForm.name || !charForm.character_description) return;
    setCharSaving(true);
    try {
      await api.mp.saveCharacter(worldId, charForm);
      setMyChar(charForm);
      setShowCharForm(false);
    } catch (err) {
      setError(err.message);
    }
    setCharSaving(false);
  }

  async function startGame() {
    try {
      await api.mp.start(worldId);
      setWorld(prev => ({ ...prev, status: 'active' }));
      setTurnAge(0);
    } catch (e) {
      setError(e.message);
    }
  }

  async function sendTurn(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    const content = input.trim();
    setInput('');
    try {
      await api.mp.postTurn(worldId, content);
    } catch (err) {
      setError(err.message);
      setInput(content);
    }
    setSending(false);
  }

  async function skipTurn() {
    try {
      await api.mp.skip(worldId);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="mp-chat-loading">Loading world...</div>;
  if (!world) return <div className="mp-chat-loading">{error || 'World not found.'}</div>;

  const isHost = world.host_username === username;
  const isMyTurn = world.current_turn_username === username;
  const isActive = world.status === 'active';
  const timedOut = turnAge >= 60;
  const joinedPlayers = players.filter(p => p.status === 'joined');
  const invitedPlayers = players.filter(p => p.status === 'invited');

  return (
    <div className="mp-chat-page">
      {/* Header */}
      <div className="mp-chat-header">
        <button className="airp-back-btn mp-back-inline" onClick={onBack}>← Back</button>
        <div className="mp-chat-title">
          <span className="mp-chat-world-name">🌍 {world.world_name}</span>
          {isActive && (
            <span className={`mp-turn-badge ${isMyTurn ? 'mp-turn-mine' : ''}`}>
              {isMyTurn ? '⚡ Your turn!' : `${world.current_turn_username}'s turn`}
            </span>
          )}
        </div>
        {isActive && (
          <div className="mp-timer-wrap">
            <div className={`mp-timer ${turnAge >= 50 ? 'mp-timer-urgent' : ''}`}>
              {Math.max(0, 60 - turnAge)}s
            </div>
          </div>
        )}
      </div>

      {/* Player roster */}
      <div className="mp-roster">
        {joinedPlayers.map(p => (
          <div key={p.username} className={`mp-player-chip ${world.current_turn_username === p.username && isActive ? 'mp-player-active' : ''}`}>
            🐾 {p.username}
            {world.current_turn_username === p.username && isActive && ' ←'}
          </div>
        ))}
        {invitedPlayers.map(p => (
          <div key={p.username} className="mp-player-chip mp-player-invited" title="Hasn't joined yet">
            ⏳ {p.username}
          </div>
        ))}
      </div>

      {/* Waiting room (host controls) */}
      {!isActive && (
        <div className="mp-waiting-room">
          <h3>⏳ Waiting Room</h3>
          <p>{joinedPlayers.length} player{joinedPlayers.length !== 1 ? 's' : ''} joined{invitedPlayers.length > 0 ? `, ${invitedPlayers.length} invite${invitedPlayers.length !== 1 ? 's' : ''} pending` : ''}.</p>

          {/* Character setup for own-character mode */}
          {world.character_mode === 'own' && !myChar && (
            <div className="mp-char-needed">
              <p>⚠️ Create your character before the game starts!</p>
              <button className="mp-btn-primary" onClick={() => setShowCharForm(true)}>Create My Character</button>
            </div>
          )}
          {world.character_mode === 'own' && myChar && (
            <div className="mp-char-ready">
              ✅ Your character: <strong>{myChar.name}</strong>
              <button className="mp-btn-ghost mp-edit-char-btn" onClick={() => { setCharForm(myChar); setShowCharForm(true); }}>Edit</button>
            </div>
          )}

          {isHost && (
            <button className="mp-btn-primary mp-start-btn" onClick={startGame}>
              🚀 Start Game!
            </button>
          )}
          {!isHost && <p className="mp-hint">Waiting for {world.host_username} to start the game...</p>}
        </div>
      )}

      {/* Character creation form */}
      {showCharForm && (
        <div className="mp-char-form-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCharForm(false); }}>
          <form className="mp-char-form" onSubmit={saveCharacter}>
            <h3>🐾 {myChar ? 'Edit Your Character' : 'Create Your Character'}</h3>
            <p className="mp-hint">World: <strong>{world.world_name}</strong></p>
            <label className="mp-label">
              Character Name *
              <input className="mp-input" type="text" value={charForm.name} onChange={e => setCharForm(f => ({ ...f, name: e.target.value }))} placeholder="Name your character" maxLength={60} required />
            </label>
            <label className="mp-label">
              Who are they? *
              <textarea className="mp-textarea" value={charForm.character_description} onChange={e => setCharForm(f => ({ ...f, character_description: e.target.value }))} placeholder="What kind of character are they?" rows={3} maxLength={500} required />
            </label>
            <label className="mp-label">
              Appearance <span className="airp-optional">(optional)</span>
              <input className="mp-input" type="text" value={charForm.appearance} onChange={e => setCharForm(f => ({ ...f, appearance: e.target.value }))} placeholder="What do they look like?" maxLength={200} />
            </label>
            <label className="mp-label">
              Personality <span className="airp-optional">(optional)</span>
              <input className="mp-input" type="text" value={charForm.personality} onChange={e => setCharForm(f => ({ ...f, personality: e.target.value }))} placeholder="What is their personality?" maxLength={200} />
            </label>
            <div className="mp-form-nav">
              <button type="button" className="mp-btn-ghost" onClick={() => setShowCharForm(false)}>Cancel</button>
              <button type="submit" className="mp-btn-primary" disabled={charSaving}>
                {charSaving ? 'Saving...' : '💾 Save Character'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Message history */}
      <div className="mp-messages">
        {messages.length === 0 && (
          <div className="mp-no-messages">The adventure hasn't started yet!</div>
        )}
        {messages.map(m => {
          const isAI = m.sender === 'ai' || m.role === 'assistant';
          const isSystem = m.sender === 'system';
          const isMe = m.sender === username;
          return (
            <div key={m.id} className={`mp-message ${isAI ? 'mp-msg-ai' : isSystem ? 'mp-msg-system' : isMe ? 'mp-msg-mine' : 'mp-msg-other'}`}>
              {!isAI && !isSystem && <div className="mp-msg-sender">{m.sender}</div>}
              {isAI && <div className="mp-msg-sender mp-ai-label">🌟 Storyteller</div>}
              <div className="mp-msg-content">{m.content}</div>
              {isAI && m.image_url && <SceneImage url={m.image_url} />}
              <div className="mp-msg-time">{new Date(m.created_at + (m.created_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      {isActive && (
        <div className="mp-input-area">
          {error && <p className="mp-error mp-input-error">{error}</p>}

          {/* Auto-skip notice if timed out and not your turn */}
          {timedOut && !isMyTurn && (
            <div className="mp-timeout-notice">
              ⏰ {world.current_turn_username} ran out of time!
              <button className="mp-btn-skip-small" onClick={skipTurn}>Skip their turn</button>
            </div>
          )}

          <form className="mp-input-row" onSubmit={sendTurn}>
            <input
              className="mp-input mp-chat-input"
              type="text"
              placeholder={isMyTurn ? 'What does your character do?' : `Waiting for ${world.current_turn_username}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={(!isMyTurn && !timedOut) || sending}
              maxLength={500}
              autoComplete="off"
            />
            <div className="mp-input-buttons">
              {isMyTurn && (
                <button type="button" className="mp-btn-skip" onClick={skipTurn} title="Skip your turn">⏭ Skip</button>
              )}
              {isHost && !isMyTurn && (
                <button type="button" className="mp-btn-skip" onClick={skipTurn} title="Skip current player's turn">⏭ Skip</button>
              )}
              <button type="submit" className="mp-btn-send" disabled={!input.trim() || sending || (!isMyTurn && !timedOut)}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
