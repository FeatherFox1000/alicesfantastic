import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './BugsComments.css';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3003/api/site-auth'
  : 'https://ai-rp-studio.fly.dev/api/site-auth';

function req(method, path, body) {
  const token = localStorage.getItem('site_token');
  return fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(r => r.json());
}

export default function BugsComments() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState('bug');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  async function loadTickets() {
    const data = await req('GET', '/tickets');
    if (Array.isArray(data)) setTickets(data);
  }

  async function openTicket(ticket) {
    setActiveTicket(ticket);
    const data = await req('GET', `/tickets/${ticket.id}/messages`);
    if (data.messages) setMessages(data.messages);
  }

  async function submitTicket(e) {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setLoading(true);
    await req('POST', '/tickets', { type: newType, subject: newSubject, message: newMessage });
    setNewSubject('');
    setNewMessage('');
    setShowNew(false);
    setLoading(false);
    loadTickets();
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    await req('POST', `/tickets/${activeTicket.id}/messages`, { message: reply });
    setReply('');
    setLoading(false);
    openTicket(activeTicket);
  }

  if (!user) {
    return (
      <div className="bugs-page">
        <div className="bugs-hero">
          <h1>Bugs & Comments</h1>
          <p>Please log in to submit bugs or comments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bugs-page">
      <div className="bugs-hero">
        <h1>Bugs & Comments</h1>
        <p>Report bugs or send us feedback! Only you and the admins can see your messages.</p>
      </div>

      <div className="bugs-content">
        {activeTicket ? (
          <div className="bugs-thread">
            <button className="bugs-back-btn" onClick={() => { setActiveTicket(null); setMessages([]); }}>
              ← Back to tickets
            </button>
            <div className="bugs-thread-header">
              <span className={`bugs-type-badge bugs-type-${activeTicket.type}`}>
                {activeTicket.type === 'bug' ? '🐛 Bug' : '💬 Comment'}
              </span>
              <h2>{activeTicket.subject}</h2>
              <span className={`bugs-status bugs-status-${activeTicket.status}`}>{activeTicket.status}</span>
            </div>

            <div className="bugs-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`bugs-msg ${msg.is_admin ? 'bugs-msg-admin' : 'bugs-msg-user'}`}>
                  <div className="bugs-msg-header">
                    <span className="bugs-msg-author">
                      {msg.is_admin ? '🛡️ ' : ''}{msg.username}
                    </span>
                    <span className="bugs-msg-time">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="bugs-msg-text">{msg.message}</p>
                </div>
              ))}
            </div>

            {activeTicket.status !== 'closed' && (
              <form className="bugs-reply-form" onSubmit={sendReply}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                />
                <button type="submit" disabled={loading || !reply.trim()}>
                  {loading ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <button className="bugs-new-btn" onClick={() => setShowNew(true)}>
              + New Ticket
            </button>

            {showNew && (
              <form className="bugs-new-form" onSubmit={submitTicket}>
                <div className="bugs-type-picker">
                  <button type="button" className={`bugs-type-opt ${newType === 'bug' ? 'active' : ''}`} onClick={() => setNewType('bug')}>
                    🐛 Bug Report
                  </button>
                  <button type="button" className={`bugs-type-opt ${newType === 'comment' ? 'active' : ''}`} onClick={() => setNewType('comment')}>
                    💬 Comment
                  </button>
                </div>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="Subject..."
                  maxLength={100}
                  required
                />
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={newType === 'bug' ? 'Describe the bug — what happened, what should have happened?' : 'What would you like to tell us?'}
                  rows={4}
                  maxLength={1000}
                  required
                />
                <div className="bugs-form-actions">
                  <button type="button" className="bugs-cancel-btn" onClick={() => setShowNew(false)}>Cancel</button>
                  <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
                </div>
              </form>
            )}

            <div className="bugs-ticket-list">
              {tickets.length === 0 && !showNew && (
                <p className="bugs-empty">No tickets yet. Click "New Ticket" to report a bug or leave a comment!</p>
              )}
              {tickets.map(t => (
                <div key={t.id} className="bugs-ticket-card" onClick={() => openTicket(t)}>
                  <span className={`bugs-type-badge bugs-type-${t.type}`}>
                    {t.type === 'bug' ? '🐛' : '💬'}
                  </span>
                  <div className="bugs-ticket-info">
                    <h3>{t.subject}</h3>
                    <span className="bugs-ticket-date">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`bugs-status bugs-status-${t.status}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
