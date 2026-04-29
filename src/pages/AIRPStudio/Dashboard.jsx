import { useState, useEffect } from 'react';
import { api } from './api';
import './AIRPStudio.css';

export default function Dashboard({ username, email, onSelectCharacter, onCreateCharacter, onEditCharacter }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    api.getCharacters()
      .then(setCharacters)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this character and all their adventures?')) return;
    setDeleting(id);
    try {
      await api.deleteCharacter(id);
      setCharacters(c => c.filter(ch => ch.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="airp-dashboard">
      <div className="airp-dashboard-header">
        <div>
          <h2>Welcome back, <span className="airp-username">{username}</span>! 🌟</h2>
          <p className="airp-subtitle">Choose a character to continue your adventure</p>
        </div>
        <div className="airp-header-buttons">
          <button className="airp-btn-icon" onClick={() => setShowSettings(true)} title="Account settings">
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="airp-settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="airp-settings-card" onClick={e => e.stopPropagation()}>
            <div className="airp-settings-header">
              <h3>Account Settings</h3>
              <button className="airp-settings-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="airp-settings-body">
              <div className="airp-settings-field">
                <label>Username</label>
                <p>{username}</p>
              </div>
              <div className="airp-settings-field">
                <label>Email</label>
                <p>{email || 'Not set'}</p>
              </div>
              <div className="airp-settings-field">
                <label>Password</label>
                <p>{localStorage.getItem('site_password') || localStorage.getItem('airp_password') || '••••••••'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="airp-error">{error}</p>}

      <div className="airp-character-grid">
        <button className="airp-character-card airp-new-card" onClick={onCreateCharacter}>
          <span className="airp-new-icon">✨</span>
          <span>Create New Character</span>
        </button>

        {loading && <div className="airp-character-card airp-loading-card">Loading...</div>}

        {characters.map(char => (
          <div
            key={char.id}
            className="airp-character-card"
            onClick={() => onSelectCharacter(char)}
          >
            <div className="airp-char-emoji">🐾</div>
            <p className="airp-world-name">🌍 {char.world_name}</p>
            <h3>{char.name}</h3>
            <p className="airp-char-preview">{char.character_description.slice(0, 80)}...</p>
            <p className="airp-char-date">Created {new Date(char.created_at).toLocaleDateString()}</p>
            <div className="airp-card-actions">
              <button
                className="airp-edit-btn"
                onClick={e => { e.stopPropagation(); onEditCharacter(char); }}
                title="Edit character"
              >
                ✏️
              </button>
              <button
                className="airp-delete-btn"
                onClick={e => handleDelete(char.id, e)}
                disabled={deleting === char.id}
                title="Delete character"
              >
                {deleting === char.id ? '...' : '🗑'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
