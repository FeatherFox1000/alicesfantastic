import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import './Buddies.css';

function authFetch(path, options = {}) {
  const token = localStorage.getItem('site_token');
  return fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export default function Buddies() {
  const { user } = useAuth();
  const [myCode, setMyCode] = useState('');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [addTarget, setAddTarget] = useState(null);
  const [addCode, setAddCode] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const requestsPollRef = useRef(null);

  // On mount: fetch existing code (or create one if none), load friends + requests
  useEffect(() => {
    if (!user) return;
    loadCode();
    loadFriends();
    loadRequests();
    setLoading(false);
    // Poll for new buddy requests and friends every 5 seconds
    requestsPollRef.current = setInterval(() => {
      loadRequests();
      loadFriends();
    }, 5000);
    return () => clearInterval(requestsPollRef.current);
  }, [user]);

  // Poll for new messages when a chat is open
  useEffect(() => {
    if (!selectedFriend) {
      clearInterval(pollRef.current);
      return;
    }
    loadMessages(selectedFriend);
    pollRef.current = setInterval(() => loadMessages(selectedFriend), 5000);
    return () => clearInterval(pollRef.current);
  }, [selectedFriend]);


  async function loadCode() {
    try {
      const res = await authFetch('/buddies/code');
      const data = await res.json();
      if (data.code) setMyCode(data.code);
      else setMyCode('ERROR: ' + (data.error || 'no code returned'));
    } catch (e) {
      setMyCode('ERROR: ' + e.message);
    }
  }

  async function generateCode() {
    try {
      const res = await authFetch('/buddies/code', { method: 'POST' });
      const data = await res.json();
      if (data.code) setMyCode(data.code);
    } catch {}
  }

  async function loadFriends() {
    try {
      const res = await authFetch('/buddies');
      const data = await res.json();
      if (Array.isArray(data)) setFriends(data);
    } catch {}
  }

  async function loadRequests() {
    try {
      const res = await authFetch('/buddies/requests');
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch {}
  }

  async function loadMessages(username) {
    try {
      const res = await authFetch(`/buddies/messages/${username}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        // Clear unread badge for this friend
        setFriends(prev => prev.map(f => f.username === username ? { ...f, unread: 0 } : f));
      }
    } catch {}
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedFriend) return;
    const content = chatInput.trim();
    setChatInput('');
    try {
      const res = await authFetch(`/buddies/messages/${selectedFriend}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const msg = await res.json();
      if (msg.id) setMessages(prev => [...prev, msg]);
    } catch {}
  }

  async function approveRequest(id, fromUsername) {
    try {
      const res = await authFetch(`/buddies/requests/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.message) {
        setRequests(prev => prev.filter(r => r.id !== id));
        loadFriends();
      }
    } catch {}
  }

  async function denyRequest(id) {
    try {
      await authFetch(`/buddies/requests/${id}/deny`, { method: 'POST' });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  }

  async function removeFriend(username) {
    if (!confirm(`Remove ${username} as a buddy?`)) return;
    try {
      await authFetch(`/buddies/${username}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f.username !== username));
      if (selectedFriend === username) {
        setSelectedFriend(null);
        setMessages([]);
      }
    } catch {}
  }

  async function searchUsers(q) {
    setSearchQuery(q);
    setAddTarget(null);
    setAddCode('');
    setAddStatus('');
    setSearchError('');
    if (q.length < 1) { setSearchResults([]); return; }
    try {
      const res = await authFetch(`/buddies/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error || 'Search failed.'); return; }
      if (Array.isArray(data)) setSearchResults(data);
    } catch {
      setSearchError('Cannot reach server. Make sure the dev server is running.');
    }
  }

  async function sendRequest() {
    if (!addTarget || !addCode.trim()) return;
    setAddStatus('');
    try {
      const res = await authFetch('/buddies/request', {
        method: 'POST',
        body: JSON.stringify({ username: addTarget, code: addCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddStatus({ type: 'success', text: data.message });
        setTimeout(() => {
          setShowAddModal(false);
          setSearchQuery('');
          setSearchResults([]);
          setAddTarget(null);
          setAddCode('');
          setAddStatus('');
        }, 2000);
      } else {
        setAddStatus({ type: 'error', text: data.error });
      }
    } catch {
      setAddStatus({ type: 'error', text: 'Something went wrong. Try again!' });
    }
  }

  if (!user) {
    return (
      <div className="buddies-page">
        <div className="buddies-login-prompt">
          <div className="buddies-login-icon">👫</div>
          <h2>Buddies</h2>
          <p>You need to be logged in to use Buddies!</p>
          <Link to="/login" className="buddies-login-btn">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="buddies-page">
      <h1 className="buddies-title">👫 Buddies</h1>

      {/* Your buddy code */}
      <div className="buddy-code-card">
        <div className="buddy-code-label">Your Buddy Code</div>
        <div className="buddy-code-display">{myCode || '...'}</div>
        <p className="buddy-code-hint">
          Share this code with a friend so they can add you! It changes every time you open this page.
        </p>
        <button className="buddy-code-refresh" onClick={generateCode}>🔄 Get New Code</button>
      </div>

      <div className="buddies-main">
        {/* Friends list */}
        <div className="buddies-panel">
          <div className="panel-header">
            <h2>My Buddies ({friends.length})</h2>
            <button className="add-buddy-btn" onClick={() => setShowAddModal(true)}>+ Add Buddy</button>
          </div>

          {friends.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌟</span>
              <p>No buddies yet! Add some friends to get started.</p>
            </div>
          ) : (
            <ul className="friends-list">
              {friends.map(f => (
                <li
                  key={f.username}
                  className={`friend-item ${selectedFriend === f.username ? 'friend-selected' : ''}`}
                  onClick={() => setSelectedFriend(f.username)}
                >
                  <span className="friend-avatar">🐾</span>
                  <span className="friend-name">{f.username}</span>
                  {f.unread > 0 && <span className="unread-badge">{f.unread}</span>}
                  <button
                    className="remove-friend-btn"
                    title="Remove buddy"
                    onClick={e => { e.stopPropagation(); removeFriend(f.username); }}
                  >✕</button>
                </li>
              ))}
            </ul>
          )}

          {/* Pending requests */}
          {requests.length > 0 && (
            <div className="requests-section">
              <h3>Buddy Requests 🔔</h3>
              {requests.map(r => (
                <div key={r.id} className="request-item">
                  <span className="request-name">🐾 <strong>{r.from_username}</strong> wants to be your buddy!</span>
                  <div className="request-actions">
                    <button className="approve-btn" onClick={() => approveRequest(r.id, r.from_username)}>✓ Yes!</button>
                    <button className="deny-btn" onClick={() => denyRequest(r.id)}>✕ No</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="chat-panel">
          {!selectedFriend ? (
            <div className="chat-empty">
              <span className="chat-empty-icon">💬</span>
              <p>Pick a buddy to chat with!</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button className="chat-back" onClick={() => { setSelectedFriend(null); setMessages([]); }}>←</button>
                <span className="chat-with">💬 {selectedFriend}</span>
              </div>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-no-messages">No messages yet — say hi! 👋</div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`chat-bubble ${m.sender === user.username ? 'bubble-mine' : 'bubble-theirs'}`}>
                    <div className="bubble-content">{m.content}</div>
                    <div className="bubble-time">{new Date(m.created_at + (m.created_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  className="chat-input"
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  maxLength={500}
                  autoComplete="off"
                />
                <button className="chat-send" type="submit" disabled={!chatInput.trim()}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Add Buddy Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); setSearchError(''); setAddTarget(null); setAddCode(''); setAddStatus(''); } }}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>Add a Buddy</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); setSearchError(''); setAddTarget(null); setAddCode(''); setAddStatus(''); }}>✕</button>
            </div>

            {!addTarget ? (
              <>
                <p className="modal-hint">Search for your friend's username:</p>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="🔍 Type a username..."
                  value={searchQuery}
                  onChange={e => searchUsers(e.target.value)}
                  autoFocus
                />
                {searchError && <p className="modal-status error">{searchError}</p>}
                {searchResults.length > 0 && (
                  <ul className="search-results">
                    {searchResults.map(u => (
                      <li key={u} className="search-result-item" onClick={() => { setAddTarget(u); setSearchQuery(''); setSearchResults([]); setSearchError(''); }}>
                        🐾 {u}
                      </li>
                    ))}
                  </ul>
                )}
                {!searchError && searchQuery.length >= 1 && searchResults.length === 0 && (
                  <p className="modal-no-results">No users found.</p>
                )}
              </>
            ) : (
              <>
                <p className="modal-hint">
                  Adding <strong>{addTarget}</strong> as a buddy.<br />
                  Ask them to open their Buddies page and share their code with you!
                </p>
                <input
                  className="modal-input code-input"
                  type="text"
                  placeholder="Enter their buddy code..."
                  value={addCode}
                  onChange={e => setAddCode(e.target.value.toUpperCase())}
                  autoFocus
                />
                {addStatus && (
                  <p className={`modal-status ${addStatus.type}`}>{addStatus.text}</p>
                )}
                <div className="modal-actions">
                  <button className="modal-back" onClick={() => { setAddTarget(null); setAddCode(''); setAddStatus(''); }}>← Back</button>
                  <button className="modal-send" onClick={sendRequest} disabled={!addCode.trim()}>Send Request 🐾</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
