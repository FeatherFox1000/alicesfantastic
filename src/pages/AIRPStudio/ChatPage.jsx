import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import './AIRPStudio.css';

const STORY_STYLES = [
  { key: 'standard', icon: '⚖️', label: 'Standard', desc: 'Default balanced mode — a little bit of everything' },
  { key: 'saga', icon: '📜', label: 'Saga', desc: 'Long-form storytelling with rich world-building and detail' },
  { key: 'epic', icon: '⚔️', label: 'Epic', desc: 'Dramatic action, big battles, and heroic moments' },
  { key: 'tale', icon: '📖', label: 'Tale', desc: 'Longer, detailed responses with deep descriptions' },
  { key: 'cozy', icon: '🌸', label: 'Cozy', desc: 'Warm, gentle, and peaceful adventures' },
  { key: 'silly', icon: '🤪', label: 'Silly', desc: 'Goofy humor, funny surprises, and wild chaos' },
  { key: 'mysterious', icon: '🔮', label: 'Mysterious', desc: 'Dark secrets, puzzles, and suspenseful twists' },
  { key: 'poetic', icon: '✨', label: 'Poetic', desc: 'Beautiful, lyrical descriptions and dreamy vibes' },
  { key: 'quick', icon: '⚡', label: 'Quick', desc: 'Short, snappy responses — fast-paced action' },
  { key: 'dramatic', icon: '🎭', label: 'Dramatic', desc: 'Big emotions, plot twists, and intense character moments' },
  { key: 'spooky', icon: '👻', label: 'Spooky', desc: 'Creepy vibes, haunted places, and eerie encounters' },
  { key: 'romance', icon: '💕', label: 'Friendship', desc: 'Focus on bonds, loyalty, and heartfelt connections' },
];

const MEMORY_CATEGORIES = [
  { key: 'character', icon: '🐱', label: 'Character', placeholder: 'e.g. "Has fire powers" or "Is shy around strangers"' },
  { key: 'story', icon: '📖', label: 'Story', placeholder: 'e.g. "Defeated the shadow wolf in the cave"' },
  { key: 'friends', icon: '👥', label: 'Friends', placeholder: 'e.g. "Luna is a friendly healer NPC"' },
  { key: 'items', icon: '🎒', label: 'Items', placeholder: 'e.g. "Owns a magic crystal sword"' },
];

function renderMessageContent(text) {
  // Split text into parts: quoted dialogue vs narrative/actions
  const parts = [];
  const regex = /"([^"]+)"/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'narrative', text: text.slice(last, match.index) });
    }
    parts.push({ type: 'dialogue', text: `"${match[1]}"` });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: 'narrative', text: text.slice(last) });
  }
  return parts.map((part, i) =>
    part.type === 'dialogue'
      ? <span key={i} className="airp-dialogue">{part.text}</span>
      : <span key={i} className="airp-narrative">{part.text}</span>
  );
}

function getStarterPrompts(character) {
  const name = character.name;
  const world = (character.world_name || '').toLowerCase();
  const desc = (character.world_description || '').toLowerCase() + ' ' + (character.character_description || '').toLowerCase();
  const all = world + ' ' + desc;

  const prompts = [];

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

  if (all.includes('dragon') || all.includes('wings of fire'))
    prompts.push(`I look for other dragons to talk to`);
  else if (all.includes('cat') || all.includes('warrior') || all.includes('clan'))
    prompts.push(`I look for my clanmates at camp`);
  else if (all.includes('school') || all.includes('academy') || all.includes('hogwarts'))
    prompts.push(`I look for other students to hang out with`);
  else
    prompts.push(`I look for someone friendly to talk to`);

  if (all.includes('magic') || all.includes('wizard') || all.includes('witch') || all.includes('spell'))
    prompts.push(`I try to practice my magic and see what I can do`);
  else if (all.includes('warrior') || all.includes('fight') || all.includes('battle') || all.includes('sword'))
    prompts.push(`I look for a challenge to test my skills`);
  else if (all.includes('mystery') || all.includes('detective') || all.includes('secret'))
    prompts.push(`I search for clues about a mystery nearby`);
  else
    prompts.push(`I go looking for an adventure or quest`);

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
  const [memories, setMemories] = useState([]);
  const [showMemoryBook, setShowMemoryBook] = useState(false);
  const [memoryTab, setMemoryTab] = useState('character');
  const [newMemory, setNewMemory] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const [memoryToast, setMemoryToast] = useState(null);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirations, setInspirations] = useState([]);
  const [loadingInspo, setLoadingInspo] = useState(false);
  const [storyStyle, setStoryStyle] = useState('standard');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showNewAdventureModal, setShowNewAdventureModal] = useState(false);
  const [keepMemories, setKeepMemories] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
    api.getSnapshots(character.id).then(setSnapshots).catch(() => {});
  }, [character.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load memories for the active session
  useEffect(() => {
    if (activeSession) {
      api.getMemories(character.id, activeSession.id).then(setMemories).catch(() => {});
    } else {
      setMemories([]);
    }
  }, [activeSession?.id, character.id]);

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

  function newAdventure() {
    setKeepMemories(true);
    setShowNewAdventureModal(true);
  }

  async function confirmNewAdventure() {
    setShowNewAdventureModal(false);
    const title = `Adventure ${sessions.length + 1}`;
    try {
      // If keeping memories, pass current session id so backend copies them
      const copyFrom = (keepMemories && activeSession) ? activeSession.id : undefined;
      const session = await api.createSession(character.id, title, character.intro_text || undefined, copyFrom);
      setSessions(s => [session, ...s]);
      setActiveSession(session);
      if (character.intro_text) {
        setMessages([{ role: 'assistant', content: character.intro_text, created_at: new Date().toISOString() }]);
      } else {
        setMessages([]);
      }
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
        currentSession = await api.createSession(character.id, 'Adventure 1', character.intro_text || undefined);
        setSessions(s => [currentSession, ...s]);
        setActiveSession(currentSession);
        // Add intro as first message if it exists
        if (character.intro_text) {
          setMessages([{ role: 'assistant', content: character.intro_text, created_at: new Date().toISOString() }]);
        }
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
      const aiMsg = await api.sendMessage(currentSession.id, content, storyStyle);
      setMessages(m => [...m, { ...aiMsg, created_at: new Date().toISOString() }]);
      // Handle auto-extracted memories
      if (aiMsg.newMemories && aiMsg.newMemories.length > 0) {
        setMemories(m => [...aiMsg.newMemories, ...m]);
        setMemoryToast(aiMsg.newMemories.length === 1
          ? `🧠 New memory: ${aiMsg.newMemories[0].content}`
          : `🧠 ${aiMsg.newMemories.length} new memories saved!`
        );
        setTimeout(() => setMemoryToast(null), 4000);
      }
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

  async function handleAddMemory(e) {
    e.preventDefault();
    const content = newMemory.trim();
    if (!content) return;
    setAddingMemory(true);
    try {
      const memory = await api.addMemory(character.id, content, memoryTab, activeSession?.id);
      setMemories(m => [memory, ...m]);
      setNewMemory('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingMemory(false);
    }
  }

  async function handleDeleteMemory(memoryId) {
    try {
      await api.deleteMemory(character.id, memoryId);
      setMemories(m => m.filter(mem => mem.id !== memoryId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function getInspiration() {
    if (!activeSession || loadingInspo) return;
    setLoadingInspo(true);
    setShowInspiration(true);
    setShowStylePicker(false);
    try {
      const ideas = await api.getInspirations(activeSession.id);
      setInspirations(ideas);
    } catch (err) {
      setInspirations(['I look around for something interesting', 'I talk to someone nearby', 'I try something bold and unexpected', 'I search for a hidden secret']);
    } finally {
      setLoadingInspo(false);
    }
  }

  function pickInspiration(text) {
    setInput(text);
    setShowInspiration(false);
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

  const currentCat = MEMORY_CATEGORIES.find(c => c.key === memoryTab);
  const filteredMemories = memories.filter(m => (m.category || 'story') === memoryTab);
  const memoryCounts = {};
  for (const m of memories) {
    const cat = m.category || 'story';
    memoryCounts[cat] = (memoryCounts[cat] || 0) + 1;
  }

  return (
    <div className="airp-chat-page">
      {/* Sidebar */}
      <div className={`airp-sidebar ${sidebarOpen ? '' : 'airp-sidebar-collapsed'}`}>
        <button className="airp-sidebar-collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
        {sidebarOpen && <button className="airp-back-btn airp-sidebar-back" onClick={onBack}>← Characters</button>}

        {sidebarOpen && (
          <>
            <div className="airp-char-info">
              <div className="airp-char-avatar">🐾</div>
              <p className="airp-world-name">🌍 {character.world_name}</p>
              <h3>{character.name}</h3>
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

            <div className="airp-sidebar-section">
              <button
                className="airp-sidebar-toggle"
                onClick={() => setShowMemoryBook(true)}
              >
                🧠 Memory Book ({memories.length})
              </button>
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
          </>
        )}
      </div>

      {/* Memory Book Panel — PolyBuzz style */}
      {showMemoryBook && (
        <div className="airp-membook-overlay" onClick={() => setShowMemoryBook(false)}>
          <div className="airp-membook" onClick={e => e.stopPropagation()}>
            <div className="airp-membook-header">
              <h3>🧠 Permanent Memory</h3>
              <button className="airp-settings-close" onClick={() => setShowMemoryBook(false)}>✕</button>
            </div>

            <div className="airp-membook-topbar">
              <div className="airp-membook-stat">
                <span className="airp-membook-stat-icon">📅</span>
                <span>Our Memories: <strong>{memories.length}</strong> total</span>
              </div>
              <div className="airp-membook-stat airp-membook-stat-pinned">
                <span className="airp-membook-stat-icon">📌</span>
                <span><strong>Pinned</strong></span>
                <span className="airp-membook-stat-count">{memories.length}</span>
              </div>
            </div>

            <div className="airp-membook-body">
              <div className="airp-membook-left">
                {MEMORY_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    className={`airp-membook-tab ${memoryTab === cat.key ? 'active' : ''}`}
                    onClick={() => setMemoryTab(cat.key)}
                  >
                    {memoryTab === cat.key && <span className="airp-membook-tab-arrow">▶</span>}
                    <span className="airp-membook-tab-label">{cat.label}</span>
                    <span className="airp-membook-tab-count">{memoryCounts[cat.key] || 0}</span>
                  </button>
                ))}
              </div>

              <div className="airp-membook-right">
                <div className="airp-membook-right-header">
                  <span className="airp-membook-right-title">{currentCat?.icon} {currentCat?.label}</span>
                </div>

                <div className="airp-membook-fields">
                  {filteredMemories.length === 0 && (
                    <div className="airp-membook-empty">
                      <p>No {currentCat?.label.toLowerCase()} memories yet</p>
                      <p className="airp-membook-empty-hint">The AI will add memories as you play, or add your own below!</p>
                    </div>
                  )}
                  {filteredMemories.map(m => (
                    <div key={m.id} className="airp-membook-field">
                      <span className="airp-membook-field-dot">✦</span>
                      <span className="airp-membook-field-text">{m.content}</span>
                      <button className="airp-membook-field-delete" onClick={() => handleDeleteMemory(m.id)} title="Remove">✕</button>
                    </div>
                  ))}
                </div>

                <form className="airp-membook-form" onSubmit={handleAddMemory}>
                  <input
                    className="airp-membook-input"
                    type="text"
                    value={newMemory}
                    onChange={e => setNewMemory(e.target.value)}
                    placeholder={currentCat?.placeholder || 'Add a memory...'}
                    disabled={addingMemory}
                  />
                  <button type="submit" className="airp-membook-add" disabled={addingMemory || !newMemory.trim()}>
                    {addingMemory ? '...' : '+ Add'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory toast */}
      {memoryToast && (
        <div className="airp-memory-toast" onClick={() => { setMemoryToast(null); setShowMemoryBook(true); }}>
          {memoryToast}
        </div>
      )}

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
                <p>{msg.role === 'assistant' ? renderMessageContent(msg.content) : msg.content}</p>
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

        <div className="airp-input-area">
          {showStylePicker && (
            <div className="airp-style-popup">
              <div className="airp-style-header">
                <span>🎭 Story Style</span>
                <button className="airp-inspo-close" onClick={() => setShowStylePicker(false)}>✕</button>
              </div>
              <div className="airp-style-list">
                {STORY_STYLES.map(style => (
                  <button
                    key={style.key}
                    className={`airp-style-option ${storyStyle === style.key ? 'active' : ''}`}
                    onClick={() => { setStoryStyle(style.key); setShowStylePicker(false); }}
                  >
                    <span className="airp-style-icon">{style.icon}</span>
                    <div className="airp-style-info">
                      <span className="airp-style-label">{style.label}</span>
                      <span className="airp-style-desc">{style.desc}</span>
                    </div>
                    {storyStyle === style.key && <span className="airp-style-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showInspiration && (
            <div className="airp-inspo-popup">
              <div className="airp-inspo-header">
                <span>💡 Inspiration</span>
                <button className="airp-inspo-close" onClick={() => setShowInspiration(false)}>✕</button>
              </div>
              {loadingInspo ? (
                <div className="airp-inspo-loading">✨ Thinking of ideas...</div>
              ) : (
                <div className="airp-inspo-list">
                  {inspirations.map((idea, i) => (
                    <button key={i} className="airp-inspo-option" onClick={() => pickInspiration(idea)}>
                      {idea}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <form className="airp-chat-input-form" onSubmit={sendMessage}>
            <button
              type="button"
              className="airp-inspo-btn"
              onClick={getInspiration}
              disabled={sending || !activeSession}
              title="Get inspiration"
            >
              💡
            </button>
            <button
              type="button"
              className="airp-style-btn"
              onClick={() => { setShowStylePicker(!showStylePicker); setShowInspiration(false); }}
              title="Change story style"
            >
              {STORY_STYLES.find(s => s.key === storyStyle)?.icon} {STORY_STYLES.find(s => s.key === storyStyle)?.label}
            </button>
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

      {/* New Adventure Modal */}
      {showNewAdventureModal && (
        <div className="airp-membook-overlay" onClick={() => setShowNewAdventureModal(false)}>
          <div className="airp-new-adventure-modal" onClick={e => e.stopPropagation()}>
            <h3>Start New Adventure</h3>
            <p>Starting a new adventure for <strong>{character.name}</strong> in <strong>{character.world_name}</strong></p>
            {memories.length > 0 && (
              <div className="airp-memory-toggle-row">
                <label className="airp-toggle-switch">
                  <input
                    type="checkbox"
                    checked={keepMemories}
                    onChange={e => setKeepMemories(e.target.checked)}
                  />
                  <span className="airp-toggle-slider"></span>
                </label>
                <span className="airp-toggle-text">
                  Keep Memories ({memories.length} saved)
                </span>
              </div>
            )}
            {!keepMemories && memories.length > 0 && (
              <p className="airp-memory-warning">All memories will be cleared for this character!</p>
            )}
            <div className="airp-new-adventure-actions">
              <button className="airp-btn-secondary" onClick={() => setShowNewAdventureModal(false)}>Cancel</button>
              <button className="airp-btn-primary" onClick={confirmNewAdventure}>Start Adventure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
