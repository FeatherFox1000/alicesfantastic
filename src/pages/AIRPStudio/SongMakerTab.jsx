import { useState, useRef } from 'react';
import { api } from './api';

const TAGS = [
  'epic', 'peaceful', 'happy', 'mysterious', 'battle', 'romantic',
  'sad', 'silly', 'orchestral', 'piano', 'guitar', 'electronic',
  'jazz', 'fantasy', 'lo-fi', 'pop',
];

let nextId = 1;

export default function SongMakerTab() {
  const [prompt, setPrompt] = useState('');
  const [instrumental, setInstrumental] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [songs, setSongs] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef({});

  function addTag(tag) {
    const cur = prompt.trim();
    if (cur.toLowerCase().includes(tag)) return;
    setPrompt(cur ? cur + ', ' + tag : tag);
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    const id = nextId++;
    const placeholder = {
      id,
      title: prompt.slice(0, 40) + (prompt.length > 40 ? '...' : ''),
      prompt,
      duration: null,
      audioUrl: null,
      enhancedPrompt: '',
      loading: true,
      error: null,
    };
    setSongs(prev => [placeholder, ...prev]);
    try {
      const data = await api.createSong(
        prompt + (instrumental ? ', instrumental, no vocals' : '')
      );
      setSongs(prev => prev.map(s => s.id === id
        ? { ...s, audioUrl: data.audioUrl, enhancedPrompt: data.prompt, duration: data.duration, loading: false }
        : s
      ));
    } catch (err) {
      setSongs(prev => prev.map(s => s.id === id
        ? { ...s, loading: false, error: err.message }
        : s
      ));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function togglePlay(song) {
    const audio = audioRefs.current[song.id];
    if (!audio) return;
    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause any currently playing
      Object.entries(audioRefs.current).forEach(([id, a]) => {
        if (parseInt(id) !== song.id) a.pause();
      });
      audio.play();
      setPlayingId(song.id);
    }
  }

  function formatDur(secs) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  }

  return (
    <div className="ml-layout">
      {/* ── Left panel ── */}
      <div className="ml-left">
        <div className="ml-left-top">
          <h2 className="ml-title">Music Lab</h2>
          <p className="ml-subtitle">Describe your song</p>
          <textarea
            className="ml-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Lounge music in a bar on a rainy night, exotica, ethereal..."
            maxLength={300}
          />

          <div className="ml-toggles">
            <button
              className={`ml-toggle-btn${instrumental ? ' ml-toggle-active' : ''}`}
              onClick={() => setInstrumental(t => !t)}
            >
              🎸 Instrumental
            </button>
          </div>

          <div className="ml-inspiration">
            <span className="ml-insp-label">Inspiration</span>
            <div className="ml-tags">
              {TAGS.map(t => (
                <button key={t} className="ml-tag" onClick={() => addTag(t)}>+ {t}</button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="airp-error" style={{margin: '0 0 1rem'}}>{error}</p>}

        <button
          className="ml-create-btn"
          onClick={generate}
          disabled={loading || !prompt.trim()}
        >
          {loading
            ? <><span className="ml-btn-spinner" /> Creating...</>
            : <> 🎵 Create</>
          }
        </button>
      </div>

      {/* ── Right panel ── */}
      <div className="ml-right">
        <h3 className="ml-library-title">My Creations</h3>
        {songs.length === 0 && (
          <p className="ml-empty">Your songs will appear here</p>
        )}
        <div className="ml-song-list">
          {songs.map(song => (
            <div key={song.id} className={`ml-song-card${playingId === song.id ? ' ml-song-playing' : ''}`}>
              <div className="ml-song-art">
                {song.loading
                  ? <div className="ml-song-art-spinner" />
                  : song.error
                  ? '❌'
                  : <button className="ml-song-play" onClick={() => togglePlay(song)}>
                      {playingId === song.id ? '⏸' : '▶'}
                    </button>
                }
              </div>
              <div className="ml-song-info">
                <div className="ml-song-name">{song.title}</div>
                <div className="ml-song-meta">
                  {song.loading
                    ? 'Composing... this takes 1-3 minutes'
                    : song.error
                    ? song.error
                    : song.enhancedPrompt
                  }
                </div>
              </div>
              <div className="ml-song-right">
                {!song.loading && !song.error && (
                  <>
                    <span className="ml-song-dur">{formatDur(song.duration)}</span>
                    <a
                      href={song.audioUrl}
                      download={`song-${song.id}.mp3`}
                      className="ml-song-dl"
                      target="_blank"
                      rel="noreferrer"
                      title="Download"
                    >⬇</a>
                  </>
                )}
                {song.audioUrl && (
                  <audio
                    ref={el => { if (el) audioRefs.current[song.id] = el; }}
                    src={song.audioUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
