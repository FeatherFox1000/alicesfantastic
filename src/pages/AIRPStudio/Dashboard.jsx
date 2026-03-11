import { useState, useEffect } from 'react';
import { api } from './api';
import './AIRPStudio.css';

export default function Dashboard({ username, onSelectCharacter, onCreateCharacter, onEditCharacter, onLogout }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

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
        <button className="airp-btn-ghost" onClick={onLogout}>Log out</button>
      </div>

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
            <h3>{char.name}</h3>
            <p className="airp-world-name">🌍 {char.world_name}</p>
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
