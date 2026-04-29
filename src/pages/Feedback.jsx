import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import './Feedback.css';

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

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div className="star-picker">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= display ? 'star-filled' : 'star-empty'}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          title={`${n} out of 10`}
        >
          ★
        </button>
      ))}
      {value > 0 && <span className="star-label">{value}/10</span>}
    </div>
  );
}

function ratingLabel(r) {
  if (r <= 2) return { text: 'Needs work', color: '#ef4444' };
  if (r <= 4) return { text: 'Okay', color: '#f97316' };
  if (r <= 6) return { text: 'Pretty good!', color: '#eab308' };
  if (r <= 8) return { text: 'Really fun!', color: '#22c55e' };
  return { text: 'Amazing!! 🌟', color: '#a855f7' };
}

function AverageDisplay({ average, count }) {
  if (!average) return null;
  const label = ratingLabel(Math.round(parseFloat(average)));
  return (
    <div className="fb-average">
      <div className="fb-avg-score" style={{ color: label.color }}>{average}</div>
      <div className="fb-avg-out">out of 10</div>
      <div className="fb-avg-label" style={{ color: label.color }}>{label.text}</div>
      <div className="fb-avg-count">{count} review{count !== 1 ? 's' : ''}</div>
    </div>
  );
}

async function adminPin(id, setList) {
  const token = localStorage.getItem('site_token');
  const res = await fetch(API_BASE + `/admin/feedback/${id}/pin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.ok) {
    setList(prev => prev.map(f => f.id === id ? { ...f, pinned: data.pinned } : f));
  }
}

async function adminDelete(id, setList) {
  if (!confirm('Delete this review?')) return;
  const token = localStorage.getItem('site_token');
  await fetch(API_BASE + `/admin/feedback/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  setList(prev => prev.filter(f => f.id !== id));
}

export default function Feedback() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [average, setAverage] = useState(null);
  const [count, setCount] = useState(0);
  const [myFeedback, setMyFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [type, setType] = useState('comment');
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [user]);

  async function loadAll() {
    try {
      const res = await fetch(API_BASE + '/feedback');
      const data = await res.json();
      setFeedbackList(data.feedback || []);
      setAverage(data.average);
      setCount(data.count);
    } catch {}

    if (user) {
      try {
        const res = await authFetch('/feedback/mine');
        const data = await res.json();
        if (data && data.id) {
          setMyFeedback(data);
          setRating(data.rating);
          setTitle(data.title || '');
          setComment(data.comment);
          setType(data.type || 'comment');
        }
      } catch {}
    }
    setLoading(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (rating === 0) { setError('Please pick a rating!'); return; }
    if (!title.trim()) { setError('Please add a title!'); return; }
    if (!comment.trim()) { setError('Please write a comment!'); return; }
    setError('');
    setStatus('');
    try {
      const res = await authFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ rating, title, comment, type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStatus(myFeedback ? 'Updated!' : 'Thanks for your feedback! 🌟');
      setEditing(false);
      await loadAll();
    } catch {
      setError('Something went wrong. Try again!');
    }
  }

  async function deleteMyFeedback() {
    if (!confirm('Delete your review?')) return;
    await authFetch('/feedback', { method: 'DELETE' });
    setMyFeedback(null);
    setRating(0);
    setTitle('');
    setComment('');
    setType('comment');
    setEditing(false);
    await loadAll();
  }

  return (
    <div className="feedback-page">
      <div className="fb-header">
        <h1 className="fb-title">💬 Feedback</h1>
        <p className="fb-subtitle">Share what you think about Alice's Fantastic!</p>
      </div>

      {/* Average rating */}
      {!loading && <AverageDisplay average={average} count={count} />}

      {/* My review section */}
      <div className="fb-my-section">
        {!user ? (
          <div className="fb-login-prompt">
            <span>Want to leave a review?</span>
            <Link to="/login" className="fb-login-link">Log in</Link>
          </div>
        ) : myFeedback && !editing ? (
          <div className="fb-my-review">
            <div className="fb-my-review-header">
              <span className="fb-my-label">Your review</span>
              <div className="fb-my-actions">
                <button className="fb-edit-btn" onClick={() => setEditing(true)}>✏️ Edit</button>
                <button className="fb-delete-btn" onClick={deleteMyFeedback}>🗑 Delete</button>
              </div>
            </div>
            <div className="fb-my-stars">{'★'.repeat(myFeedback.rating)}{'☆'.repeat(10 - myFeedback.rating)} <span className="fb-my-score">{myFeedback.rating}/10</span></div>
            {myFeedback.title && <p className="fb-my-title">{myFeedback.title}</p>}
            <p className="fb-my-comment">{myFeedback.comment}</p>
            {status && <p className="fb-status">{status}</p>}
          </div>
        ) : (
          <form className="fb-form" onSubmit={submit}>
            <h3 className="fb-form-title">{myFeedback ? '✏️ Edit Your Review' : '⭐ Leave a Review'}</h3>
            <div className="fb-type-switch">
              <button type="button" className={`fb-type-btn ${type === 'comment' ? 'fb-type-active' : ''}`} onClick={() => setType('comment')}>💬 Comment</button>
              <button type="button" className={`fb-type-btn ${type === 'bug' ? 'fb-type-active fb-type-bug' : ''}`} onClick={() => setType('bug')}>🐛 Bug Report</button>
            </div>
            <div className="fb-form-group">
              <label className="fb-form-label">Rating</label>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <span className="fb-rating-label" style={{ color: ratingLabel(rating).color }}>
                  {ratingLabel(rating).text}
                </span>
              )}
            </div>
            <div className="fb-form-group">
              <label className="fb-form-label">Title</label>
              <input
                className="fb-input"
                type="text"
                placeholder="Give your review a title..."
                value={title}
                onChange={e => { setTitle(e.target.value); setError(''); }}
                maxLength={100}
              />
            </div>
            <div className="fb-form-group">
              <label className="fb-form-label">Comment</label>
              <textarea
                className="fb-textarea"
                placeholder="What do you think? Any bugs? What's your favourite game? What would you like to see added?"
                value={comment}
                onChange={e => { setComment(e.target.value); setError(''); }}
                rows={4}
                maxLength={1000}
              />
              <span className="fb-char-count">{comment.length}/1000</span>
            </div>
            {error && <p className="fb-error">{error}</p>}
            {status && <p className="fb-status">{status}</p>}
            <div className="fb-form-actions">
              {myFeedback && <button type="button" className="fb-cancel-btn" onClick={() => { setEditing(false); setRating(myFeedback.rating); setTitle(myFeedback.title || ''); setComment(myFeedback.comment); setType(myFeedback.type || 'comment'); }}>Cancel</button>}
              <button type="submit" className="fb-submit-btn">
                {myFeedback ? '💾 Save Changes' : '🌟 Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Public wall */}
      <div className="fb-wall">
        <h2 className="fb-wall-title">What everyone thinks</h2>
        {loading && <p className="fb-loading">Loading reviews...</p>}
        {!loading && feedbackList.length === 0 && (
          <div className="fb-empty">
            <span className="fb-empty-icon">💬</span>
            <p>No reviews yet — be the first!</p>
          </div>
        )}
        <div className="fb-list">
          {feedbackList.map(fb => {
            const label = ratingLabel(fb.rating);
            return (
              <div key={fb.id} className={`fb-card${fb.pinned ? ' fb-card-pinned' : ''}`}>
                <div className="fb-card-top">
                  <div className="fb-card-user">
                    {fb.pinned ? <span className="fb-pin-badge">📌 Pinned</span> : null}
                    <span className="fb-card-avatar">🐾</span>
                    <span className="fb-card-username">{fb.username}</span>
                    {fb.username === user?.username && <span className="fb-you-badge">you</span>}
                    {fb.type === 'bug' && <span className="fb-bug-badge">🐛 Bug</span>}
                  </div>
                  <div className="fb-card-rating" style={{ color: label.color }}>
                    {'★'.repeat(fb.rating)}{'☆'.repeat(10 - fb.rating)}
                    <span className="fb-card-score">{fb.rating}/10</span>
                  </div>
                </div>
                {fb.title && <p className="fb-card-title">{fb.title}</p>}
                <p className="fb-card-comment">{fb.comment}</p>
                <div className="fb-card-footer">
                  <span className="fb-card-date">{new Date(fb.created_at + 'Z').toLocaleDateString()}</span>
                  {user?.is_admin && (
                    <div className="fb-admin-actions">
                      <button className="fb-admin-btn" onClick={() => adminPin(fb.id, setFeedbackList)}>{fb.pinned ? '📌 Unpin' : '📌 Pin'}</button>
                      <button className="fb-admin-btn fb-admin-del" onClick={() => adminDelete(fb.id, setFeedbackList)}>🗑 Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
