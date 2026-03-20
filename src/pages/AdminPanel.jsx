import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3003/api/site-auth'
  : 'https://ai-rp-studio.fly.dev/api/site-auth';

function adminRequest(method, path, body) {
  const token = localStorage.getItem('site_token');
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${token}` },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return fetch(API_BASE + path, opts).then(r => r.json());
}

const GAME_NAMES = {
  'jumping-penguin': 'Jumping Penguin',
  'penguin-runner': 'Penguin Runner',
  'tomato-hunter-v2': 'Tomato Hunter',
};

function UserDetail({ username, basicInfo, currentAdmin, onClose }) {
  const [extra, setExtra] = useState(null);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifySent, setNotifySent] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const notesEndRef = useRef(null);

  useEffect(() => {
    adminRequest('GET', `/admin/user/${username}`).then(data => {
      if (!data.error) setExtra(data);
    });
    loadNotes();
  }, [username]);

  async function loadNotes() {
    const data = await adminRequest('GET', `/admin/user-notes/${username}`);
    if (Array.isArray(data)) setNotes(data);
  }

  useEffect(() => {
    const el = notesEndRef.current;
    if (el) el.parentElement.scrollTop = el.parentElement.scrollHeight;
  }, [notes]);

  async function sendNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const msg = noteText.trim();
    setNoteText('');
    const result = await adminRequest('POST', `/admin/user-notes/${username}`, { message: msg });
    if (result.id) setNotes(prev => [...prev, result]);
  }

  async function sendNotification(e) {
    e.preventDefault();
    if (!notifyMsg.trim()) return;
    await adminRequest('POST', `/admin/notify/${username}`, { message: notifyMsg.trim() });
    setNotifyMsg('');
    setNotifySent(true);
    setTimeout(() => setNotifySent(false), 3000);
  }

  const info = extra || basicInfo;

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{info.username}</h2>
        <div className="user-detail-badges">
          {info.is_admin ? <span className="admin-badge">Admin</span> : null}
          {info.is_child ? <span className="child-badge">Child</span> : null}
          {info.is_banned ? <span className="status-banned">Banned</span> : null}
        </div>

        <div className="user-detail-grid">
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{info.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Password Hash</span>
            <span className="detail-value detail-hash">{extra ? extra.password_hash : 'Loading...'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Joined</span>
            <span className="detail-value">{info.created_at ? new Date(info.created_at + 'Z').toLocaleString() : 'Unknown'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last Login</span>
            <span className="detail-value">{info.last_login ? new Date(info.last_login + 'Z').toLocaleString() : 'Never'}</span>
          </div>
          {info.is_child ? (
            <>
              <div className="detail-item">
                <span className="detail-label">Parent Email</span>
                <span className="detail-value">{extra ? (extra.parent_email || 'None') : 'Loading...'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Parent Consent</span>
                <span className="detail-value">{info.parent_consent ? 'Approved' : 'Pending'}</span>
              </div>
            </>
          ) : null}
        </div>

        <h3 className="scores-title">High Scores</h3>
        {!extra ? (
          <p className="no-scores">Loading scores...</p>
        ) : extra.scores && extra.scores.length > 0 ? (
          <div className="scores-list">
            {extra.scores.map(s => (
              <div key={s.game} className="score-item">
                <span className="score-game">{GAME_NAMES[s.game] || s.game}</span>
                <span className="score-value">{s.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-scores">No scores yet</p>
        )}

        <h3 className="scores-title">Send Notification</h3>
        <form className="notify-form" onSubmit={sendNotification}>
          <input
            type="text"
            value={notifyMsg}
            onChange={e => setNotifyMsg(e.target.value)}
            placeholder={`Message for ${username}...`}
            className="notify-input"
            maxLength={300}
          />
          <button type="submit" className="notify-btn" disabled={!notifyMsg.trim()}>Send</button>
        </form>
        {notifySent && <p className="notify-sent">Notification sent!</p>}

        <h3 className="scores-title">Admin Notes about {username}</h3>
        <div className="user-notes-chat">
          {notes.length === 0 && <p className="chat-empty">No notes yet — start a discussion about this user.</p>}
          {notes.map(n => (
            <div key={n.id} className={`chat-msg ${n.author_username === currentAdmin ? 'chat-msg-mine' : ''}`} style={n.author_username !== currentAdmin ? { background: getUserColor(n.author_username) + '18', borderLeft: `3px solid ${getUserColor(n.author_username)}` } : undefined}>
              <span className="chat-author" style={{ color: n.author_username === currentAdmin ? undefined : getUserColor(n.author_username) }}>{n.author_username}</span>
              <span className="chat-text">{n.message}</span>
              <span className="chat-time">{new Date(n.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          <div ref={notesEndRef} />
        </div>
        <form className="chat-input-row user-notes-input" onSubmit={sendNote}>
          <input
            type="text"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder={`Note about ${username}...`}
            className="chat-input"
            maxLength={500}
          />
          <button type="submit" className="chat-send-btn">Send</button>
        </form>
      </div>
    </div>
  );
}

const ADMIN_COLOR_MAP = {
  'LIESELTHEAWESOME': '#d53f8c',
  'THE MAFIA PENGUIN': '#3182ce',
  'DillonIsCool': '#e53e3e',
  'warrior_cats': '#7b14c9',
};

const FALLBACK_COLORS = ['#38a169', '#ed8936', '#805ad5', '#2b6cb0', '#d69e2e', '#319795'];

function getUserColor(name) {
  if (ADMIN_COLOR_MAP[name]) return ADMIN_COLOR_MAP[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function AdminChat({ username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);

  async function loadMessages() {
    const data = await adminRequest('GET', '/admin/chat');
    if (Array.isArray(data)) setMessages(data);
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = chatEndRef.current;
    if (el) el.parentElement.scrollTop = el.parentElement.scrollHeight;
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    const result = await adminRequest('POST', '/admin/chat', { message: msg });
    if (result.id) {
      setMessages(prev => [...prev, result]);
    }
  }

  return (
    <div className="admin-chat">
      <h2>Admin Chat</h2>
      <div className="chat-messages">
        {messages.length === 0 && <p className="chat-empty">No messages yet — say hi!</p>}
        {messages.map(m => (
          <div key={m.id} className={`chat-msg ${m.username === username ? 'chat-msg-mine' : ''}`} style={m.username !== username ? { background: getUserColor(m.username) + '18', borderLeft: `3px solid ${getUserColor(m.username)}` } : undefined}>
            <span className="chat-author" style={{ color: m.username === username ? undefined : getUserColor(m.username) }}>{m.username}</span>
            <span className="chat-text">{m.message}</span>
            <span className="chat-time">{new Date(m.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={sendMessage}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          maxLength={500}
        />
        <button type="submit" className="chat-send-btn">Send</button>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState(() => {
    const cached = sessionStorage.getItem('admin_users');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(!sessionStorage.getItem('admin_users'));
  const [selectedUser, setSelectedUser] = useState(null);

  async function loadUsers() {
    if (!users.length) setLoading(true);
    const data = await adminRequest('GET', '/admin/users');
    if (Array.isArray(data)) {
      setUsers(data);
      sessionStorage.setItem('admin_users', JSON.stringify(data));
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  const isOwner = user?.username === 'warrior_cats';

  async function requestBan(username) {
    if (isOwner) {
      setUsers(prev => prev.map(u => u.username === username ? { ...u, is_banned: 1, ban_pending: 0 } : u));
      await adminRequest('POST', `/admin/ban/${username}`);
    } else {
      setUsers(prev => prev.map(u => u.username === username ? { ...u, ban_pending: 1, ban_requested_by: user.username } : u));
      await adminRequest('POST', `/admin/ban/${username}`);
    }
  }

  async function confirmBan(username) {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, is_banned: 1, ban_pending: 0, ban_requested_by: null } : u));
    await adminRequest('POST', `/admin/confirm-ban/${username}`);
  }

  async function denyBan(username) {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, ban_pending: 0, ban_requested_by: null } : u));
    await adminRequest('POST', `/admin/deny-ban/${username}`);
  }

  async function unban(username) {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, is_banned: 0, ban_pending: 0, ban_requested_by: null } : u));
    await adminRequest('POST', `/admin/unban/${username}`);
  }

  async function approveAccount(username) {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, parent_consent: 1 } : u));
    await adminRequest('POST', `/admin/approve/${username}`);
  }

  async function toggleAdmin(username, isAdmin) {
    const action = isAdmin ? 'remove-admin' : 'make-admin';
    setUsers(prev => prev.map(u => u.username === username ? { ...u, is_admin: isAdmin ? 0 : 1 } : u));
    await adminRequest('POST', `/admin/${action}/${username}`);
  }

  if (!user?.is_admin) {
    return (
      <div className="admin-panel">
        <h1>Not Authorized</h1>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p className="admin-subtitle">Manage users on Alice's Fantastic — click a username to see details</p>

      {selectedUser && <UserDetail username={selectedUser} basicInfo={users.find(u => u.username === selectedUser)} currentAdmin={user.username} onClose={() => setSelectedUser(null)} />}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Last On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={u.is_banned ? 'banned-row' : ''}>
                  <td className="username-cell">
                    <span className="username-link" onClick={() => setSelectedUser(u.username)}>
                      {u.username}
                    </span>
                    {u.is_admin ? <span className="admin-badge">Admin</span> : null}
                    {u.is_child ? <span className="child-badge">Child</span> : null}
                  </td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at + 'Z').toLocaleDateString()}</td>
                  <td>{u.last_login ? new Date(u.last_login + 'Z').toLocaleDateString() : 'Never'}</td>
                  <td>
                    {u.is_banned
                      ? <span className="status-banned">Banned</span>
                      : u.ban_pending
                        ? <span className="status-pending">Ban Pending (by {u.ban_requested_by})</span>
                        : u.is_child && !u.parent_consent
                          ? <span className="status-pending">Pending Approval</span>
                          : <span className="status-active">Active</span>
                    }
                  </td>
                  <td className="action-cell">
                    {u.is_child && !u.parent_consent && (
                      <button className="approve-btn" onClick={() => approveAccount(u.username)}>Approve</button>
                    )}
                    {u.username !== user.username && !u.is_banned && !u.ban_pending && (
                      <button className="ban-btn" onClick={() => requestBan(u.username)}>
                        {isOwner ? 'Ban' : 'Request Ban'}
                      </button>
                    )}
                    {u.ban_pending && isOwner && (
                      <>
                        <button className="ban-btn" onClick={() => confirmBan(u.username)}>Confirm Ban</button>
                        <button className="unban-btn" onClick={() => denyBan(u.username)}>Deny</button>
                      </>
                    )}
                    {u.is_banned && isOwner && (
                      <button className="unban-btn" onClick={() => unban(u.username)}>Unban</button>
                    )}
                    {isOwner && u.username !== 'warrior_cats' && (
                      <button
                        className={u.is_admin ? 'remove-admin-btn' : 'make-admin-btn'}
                        onClick={() => toggleAdmin(u.username, u.is_admin)}
                      >
                        {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="user-count">{users.length} total user{users.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      <AdminChat username={user.username} />
    </div>
  );
}

