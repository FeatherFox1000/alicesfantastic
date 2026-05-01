import { useState, useEffect } from 'react';
import { api } from './api';

const TYPE_ICONS = { image: '🎨', song: '🎵', story: '📖' };
const TYPE_LABELS = { image: 'Image', song: 'Song', story: 'Story' };

export default function DiscoverTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = {};

  useEffect(() => {
    api.getDiscover()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  function togglePlay(item, audioEl) {
    if (!audioEl) return;
    if (playingId === item.id) {
      audioEl.pause();
      setPlayingId(null);
    } else {
      Object.values(audioRefs).forEach(a => a?.pause());
      audioEl.play();
      setPlayingId(item.id);
    }
  }

  return (
    <div className="discover-tab">
      <div className="discover-header">
        <h2>🌍 Discover</h2>
        <p>See what everyone is creating</p>
      </div>

      <div className="discover-filters">
        {['all', 'image', 'song', 'story'].map(f => (
          <button
            key={f}
            className={`discover-filter${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '✨ All' : TYPE_ICONS[f] + ' ' + TYPE_LABELS[f] + 's'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="create-loading">
          <div className="create-loading-spinner" />
          <p>Loading...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="discover-empty">
          <p>Nothing published yet — be the first! 🌟</p>
        </div>
      )}

      <div className="discover-grid">
        {filtered.map(item => (
          <DiscoverCard
            key={item.id}
            item={item}
            playing={playingId === item.id}
            onTogglePlay={(el) => togglePlay(item, el)}
            onEnded={() => setPlayingId(null)}
            audioRef={el => { if (el) audioRefs[item.id] = el; }}
          />
        ))}
      </div>
    </div>
  );
}

function DiscoverCard({ item, playing, onTogglePlay, onEnded, audioRef }) {
  const [audioEl, setAudioEl] = useState(null);

  return (
    <div className="discover-card">
      {/* Cover / thumbnail */}
      <div className="discover-card-art">
        {item.cover_url
          ? <img src={item.cover_url} alt={item.title} className="discover-card-img" />
          : <span className="discover-card-icon">{TYPE_ICONS[item.type]}</span>
        }
        {item.type === 'image' && item.content_url && (
          <a href={item.content_url} target="_blank" rel="noreferrer" className="discover-card-overlay">
            🔍
          </a>
        )}
        {item.type === 'song' && item.content_url && (
          <button
            className="discover-card-overlay"
            onClick={() => onTogglePlay(audioEl)}
          >
            {playing ? '⏸' : '▶'}
          </button>
        )}
      </div>

      <div className="discover-card-info">
        <div className="discover-card-type">{TYPE_ICONS[item.type]} {TYPE_LABELS[item.type]}</div>
        <div className="discover-card-title">{item.title}</div>
        {item.description && (
          <div className="discover-card-desc">{item.description.slice(0, 100)}{item.description.length > 100 ? '…' : ''}</div>
        )}
        <div className="discover-card-author">by {item.username}</div>
      </div>

      {item.type === 'song' && item.content_url && (
        <audio
          ref={el => { setAudioEl(el); audioRef(el); }}
          src={item.content_url}
          onEnded={onEnded}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}
