import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import './AIRPStudio.css';

function getStarterPrompts(character) {
  const name = character.name;
  const world = (character.world_name || '').toLowerCase();
  const desc = (character.world_description || '').toLowerCase() + ' ' + (character.character_description || '').toLowerCase();
  const all = world + ' ' + desc;

  const prompts = [];

  // First prompt: always explore the world
  if (all.includes('dragon') || all.includes('wings of fire'))
    prompts.push(`I spread my wings and fly over the land to see what's below`);
  else if (all.includes('ocean') || all.includes('sea') || all.includes('underwater') || all.includes('mermaid'))
    prompts.push(`I swim deeper into the water to explore what's around me`);
  else if (all.includes('space') || all.includes('galaxy') || all.includes('planet') || all.includes('starship'))
    prompts.push(`I look out the viewport and scan the stars around me`);
  else if (all.includes('forest') || all.includes('wood') || all.includes('jungle'))
    prompts.push(`I wander deeper into the trees to see what I can find`);
  else if (all.includes('castle') || all.includes('kingdom') || all.includes('palace'))
    prompts.push(`I walk through the castle halls and look around`);
  else if (all.includes('school') || all.includes('academy') || all.includes('hogwarts'))
    prompts.push(`I explore the school grounds to see who's around`);
  else if (all.includes('cat') || all.includes('warrior') || all.includes('clan'))
    prompts.push(`I pad through the territory, ears alert for any sounds`);
  else if (all.includes('pirate') || all.includes('ship') || all.includes('sail'))
    prompts.push(`I climb up to the deck and look out at the horizon`);
  else if (all.includes('city') || all.includes('town') || all.includes('village'))
    prompts.push(`I walk through the streets and check out what's happening`);
  else
    prompts.push(`I look around and explore the area`);

  // Second prompt: meet someone
  if (all.includes('dragon') || all.includes('wings of fire'))
    prompts.push(`I look for other dragons to talk to`);
  else if (all.includes('cat') || all.includes('warrior') || all.includes('clan'))
    prompts.push(`I look for my clanmates at camp`);
  else if (all.includes('school') || all.includes('academy') || all.includes('hogwarts'))
    prompts.push(`I look for other students to hang out with`);
  else
    prompts.push(`I look for someone friendly to talk to`);

  // Third prompt: find adventure
  if (all.includes('magic') || all.includes('wizard') || all.includes('witch') || all.includes('spell'))
    prompts.push(`I try to practice my magic and see what I can do`);
  else if (all.includes('warrior') || all.includes('fight') || all.includes('battle') || all.includes('sword'))
    prompts.push(`I look for a challenge to test my skills`);
  else if (all.includes('mystery') || all.includes('detective') || all.includes('secret'))
    prompts.push(`I search for clues about a mystery nearby`);
  else
    prompts.push(`I go looking for an adventure or quest`);

  // Fourth prompt: character-specific action
  if (all.includes('fly') || all.includes('wing'))
    prompts.push(`I take off and fly as fast as I can to see where I end up`);
  else if (all.includes('power') || all.includes('ability') || all.includes('magic'))
    prompts.push(`I try to use my special powers`);
  else if (all.includes('cook') || all.includes('food') || all.includes('bake'))
    prompts.push(`I look for ingredients to make something delicious`);
  else if (all.includes('build') || all.includes('craft') || all.includes('create'))
    prompts.push(`I start building something cool with what I have`);
  else if (all.includes('pet') || all.includes('animal') || all.includes('creature'))
    prompts.push(`I look for a creature to befriend`);
  else
    prompts.push(`I search the area for something interesting`);

  return prompts;
}

export default function ChatPage({ character, onBack, onEditCharacter }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
    api.getSnapshots(character.id).then(setSnapshots).catch(() => {});
  }, [character.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const s = await api.getSessions(character.id);
      setSessions(s);
      if (s.length > 0) {
        await loadSession(s[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadSession(session) {
    try {
      const data = await api.getSession(session.id);
      setActiveSession(data);
      setMessages(data.messages);
      setShowHistory(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function newAdventure() {
    const title = `Adventure ${sessions.length + 1}`;
    try {
      const session = await api.createSession(character.id, title);
      setSessions(s => [session, ...s]);
      setActiveSession(session);
      setMessages([]);
      setShowHistory(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    let currentSession = activeSession;
    if (!currentSession) {
      try {
        currentSession = await api.createSession(character.id, 'Adventure 1');
        setSessions(s => [currentSession, ...s]);
        setActiveSession(currentSession);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    const userMsg = { role: 'user', content, created_at: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const aiMsg = await api.sendMessage(currentSession.id, content);
      setMessages(m => [...m, { ...aiMsg, created_at: new Date().toISOString() }]);
    } catch (err) {
      setError(err.message);
      setMessages(m => m.filter(msg => msg !== userMsg));
    } finally {
      setSending(false);
    }
  }

  function startRename(s, e) {
    e.stopPropagation();
    setRenamingId(s.id);
    setRenameValue(s.title);
  }

  async function commitRename(sessionId) {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    try {
      await api.updateSession(sessionId, title);
      setSessions(s => s.map(sess => sess.id === sessionId ? { ...sess, title } : sess));
      if (activeSession?.id === sessionId) setActiveSession(a => ({ ...a, title }));
    } catch (err) {
      setError(err.message);
    } finally {
      setRenamingId(null);
    }
  }

  async function deleteSession(sessionId, e) {
    e.stopPropagation();
    if (!confirm('Delete this adventure?')) return;
    try {
      await api.deleteSession(sessionId);
      setSessions(s => s.filter(sess => sess.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="airp-chat-page">
      {/* Sidebar */}
      <div className="airp-sidebar">
        <button className="airp-back-btn airp-sidebar-back" onClick={onBack}>← Characters</button>

        <div className="airp-char-info">
          <div className="airp-char-avatar">🐾</div>
          <h3>{character.name}</h3>
          <p className="airp-world-name">🌍 {character.world_name}</p>
          <button className="airp-edit-char-btn" onClick={() => onEditCharacter(character)}>
            ✏️ Edit Character
          </button>
        </div>

        <button className="airp-btn-primary airp-new-adventure-btn" onClick={newAdventure}>
          ✨ New Adventure
        </button>

        <div className="airp-sidebar-section">
          <button
            className="airp-sidebar-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            📖 Adventures {showHistory ? '▲' : '▼'}
          </button>
          {showHistory && (
            <div className="airp-session-list">
              {loadingSessions && <p className="airp-loading-text">Loading...</p>}
              {sessions.map(s => (
                <div
                  key={s.id}
                  className={`airp-session-item ${activeSession?.id === s.id ? 'active' : ''}`}
                  onClick={() => renamingId !== s.id && loadSession(s)}
                >
                  {renamingId === s.id ? (
                    <input
                      className="airp-rename-input"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(s.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(s.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="airp-session-title" onDoubleClick={e => startRename(s, e)} title="Double-click to rename">{s.title}</span>
                      <span className="airp-session-date">{new Date(s.updated_at).toLocaleDateString()}</span>
                      <div className="airp-session-btns">
                        <button className="airp-mini-btn" onClick={e => startRename(s, e)} title="Rename">✏️</button>
                        <button className="airp-mini-btn" onClick={e => deleteSession(s.id, e)} title="Delete">🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {!loadingSessions && sessions.length === 0 && (
                <p className="airp-loading-text">No adventures yet!</p>
              )}
            </div>
          )}
        </div>

        {snapshots.length > 0 && (
          <div className="airp-sidebar-section">
            <button
              className="airp-sidebar-toggle"
              onClick={() => setShowSnapshots(!showSnapshots)}
            >
              ⭐ Character Growth {showSnapshots ? '▲' : '▼'}
            </button>
            {showSnapshots && (
              <div className="airp-snapshot-list">
                {snapshots.map(s => (
                  <div key={s.id} className="airp-snapshot-item">
                    <span>{s.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="airp-chat-main">
        <div className="airp-chat-header">
          <h3>
            {activeSession ? activeSession.title : 'Ready to adventure!'}
          </h3>
          <p className="airp-chat-hint">
            {messages.length === 0
              ? `Tell the AI what you want to do as ${character.name}!`
              : `${messages.length} messages`}
          </p>
        </div>

        <div className="airp-messages">
          {messages.length === 0 && !sending && (
            <div className="airp-welcome-message">
              <div className="airp-welcome-icon">🌟</div>
              <h3>Your adventure awaits, {character.name}!</h3>
              <p>Type anything to begin — describe what you want to do, where you want to go, or who you want to meet!</p>
              <div className="airp-starter-prompts">
                {getStarterPrompts(character).map((prompt, i) => (
                  <button
                    key={i}
                    className="airp-starter-btn"
                    onClick={() => { setInput(prompt); }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`airp-message airp-message-${msg.role}`}>
              <div className="airp-message-avatar">
                {msg.role === 'user' ? '🐾' : '✨'}
              </div>
              <div className="airp-message-bubble">
                <p>{msg.content}</p>
                <span className="airp-message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {messages.length > 0 && !sending && messages[messages.length - 1].role === 'assistant' && (
            <button
              className="airp-go-on-btn"
              onClick={() => { setInput('Go on'); setTimeout(() => document.querySelector('.airp-chat-input-form')?.requestSubmit(), 0); }}
            >
              Go on ➤
            </button>
          )}

          {sending && (
            <div className="airp-message airp-message-assistant">
              <div className="airp-message-avatar">✨</div>
              <div className="airp-message-bubble airp-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && <p className="airp-error airp-chat-error">{error}</p>}
          <div ref={messagesEndRef} />
        </div>

        <form className="airp-chat-input-form" onSubmit={sendMessage}>
          <input
            className="airp-chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`What does ${character.name} do next?`}
            disabled={sending}
            autoFocus
          />
          <button type="submit" className="airp-send-btn" disabled={sending || !input.trim()}>
            {sending ? '✨' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
