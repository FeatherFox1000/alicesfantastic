import { useState, useRef } from 'react';
import { api } from './api';
import SongMakerGrid from './SongMakerGrid';

const TAGS = [
  'epic', 'peaceful', 'happy', 'mysterious', 'battle', 'romantic',
  'sad', 'silly', 'orchestral', 'piano', 'guitar', 'electronic',
  'jazz', 'fantasy', 'lo-fi', 'pop',
];

let nextId = 1;

export default function SongMakerTab() {
  const [subTab, setSubTab] = useState('create'); // create | advanced | songmaker

  // Shared song state
  const [songs, setSongs] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [publishedIds, setPublishedIds] = useState(new Set());
  const audioRefs = useRef({});

  // Create tab state
  const [prompt, setPrompt] = useState('');
  const [instrumental, setInstrumental] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Advanced tab state
  const [advLyrics, setAdvLyrics] = useState('');
  const [advAutoLyrics, setAdvAutoLyrics] = useState(true);
  const [advStyles, setAdvStyles] = useState([]);
  const [advStyleInput, setAdvStyleInput] = useState('');
  const [advTitle, setAdvTitle] = useState('');
  const [advInstrumental, setAdvInstrumental] = useState(false);
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState('');

  async function doGenerate(promptText, setLoadingFn, setErrorFn) {
    if (!promptText.trim()) return;
    setLoadingFn(true);
    setErrorFn('');
    const id = nextId++;
    setSongs(prev => [{
      id, title: '...', prompt: promptText,
      duration: null, audioUrl: null, coverUrl: null,
      enhancedPrompt: '', loading: true, error: null,
    }, ...prev]);
    try {
      const data = await api.createSong(promptText);
      setSongs(prev => prev.map(s => s.id === id
        ? { ...s, audioUrl: data.audioUrl, title: data.title || promptText.slice(0, 40), enhancedPrompt: data.prompt, duration: data.duration, coverUrl: data.coverUrl, loading: false }
        : s
      ));
    } catch (err) {
      setSongs(prev => prev.map(s => s.id === id
        ? { ...s, loading: false, error: err.message }
        : s
      ));
      setErrorFn(err.message);
    } finally {
      setLoadingFn(false);
    }
  }

  function generate() {
    if (loading || !prompt.trim()) return;
    doGenerate(prompt.trim() + (instrumental ? ', instrumental, no vocals' : ''), setLoading, setError);
  }

  function generateAdvanced() {
    if (advLoading) return;
    const parts = [];
    if (advStyles.length > 0) parts.push(advStyles.join(', '));
    if (advInstrumental) {
      parts.push('instrumental, no vocals');
    } else if (advAutoLyrics) {
      parts.push('with vocals');
    } else if (advLyrics.trim()) {
      parts.push(`with lyrics: "${advLyrics.trim()}"`);
    }
    if (advTitle.trim()) parts.push(`song title suggestion: "${advTitle.trim()}"`);
    const fullPrompt = parts.join('. ');
    if (!fullPrompt.trim()) {
      setAdvError('Add at least one style tag or some lyrics.');
      return;
    }
    doGenerate(fullPrompt, setAdvLoading, setAdvError);
  }

  function addAdvStyle(s) {
    const val = s.trim().toLowerCase();
    if (!val || advStyles.includes(val)) return;
    setAdvStyles(prev => [...prev, val]);
    setAdvStyleInput('');
  }

  function togglePlay(song) {
    const audio = audioRefs.current[song.id];
    if (!audio) return;
    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      Object.entries(audioRefs.current).forEach(([sid, a]) => {
        if (parseInt(sid) !== song.id) a.pause();
      });
      audio.play();
      setPlayingId(song.id);
    }
  }

  function formatDur(secs) {
    if (!secs) return '';
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  }

  async function publishSong(song) {
    if (publishedIds.has(song.id)) return;
    try {
      await api.publish('song', song.title, song.audioUrl, song.coverUrl, song.enhancedPrompt);
      setPublishedIds(prev => new Set([...prev, song.id]));
    } catch {}
  }

  function addCreateTag(tag) {
    const cur = prompt.trim();
    if (cur.toLowerCase().includes(tag)) return;
    setPrompt(cur ? cur + ', ' + tag : tag);
  }

  const songListJSX = (
    <div className="ml-right">
      <h3 className="ml-library-title">My Creations</h3>
      {songs.length === 0 && (
        <p className="ml-empty">Your songs will appear here</p>
      )}
      <div className="ml-song-list">
        {songs.map(song => (
          <div key={song.id} className={`ml-song-card${playingId === song.id ? ' ml-song-playing' : ''}`}>
            <div className="ml-song-art" style={song.coverUrl ? { background: 'none', padding: 0, overflow: 'hidden' } : {}}>
              {song.coverUrl && <img src={song.coverUrl} alt="" className="ml-song-art-img" />}
              {song.loading
                ? <div className="ml-song-art-spinner" style={song.coverUrl ? { position: 'absolute' } : {}} />
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
                  ? 'Your song is on the way! It may take a while, so please wait — thanks! 🎵'
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
                  <button
                    className={`ml-song-publish${publishedIds.has(song.id) ? ' ml-song-published' : ''}`}
                    onClick={() => publishSong(song)}
                    disabled={publishedIds.has(song.id)}
                    title={publishedIds.has(song.id) ? 'Published!' : 'Publish to Discover'}
                  >{publishedIds.has(song.id) ? '✅' : '🌍'}</button>
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
  );

  return (
    <div className="ml-wrapper">
      {/* Sub-tabs — only visible inside Music Lab */}
      <div className="ml-subtabs">
        <button
          className={`ml-subtab${subTab === 'create' ? ' ml-subtab-active' : ''}`}
          onClick={() => setSubTab('create')}
        >🎵 Create</button>
        <button
          className={`ml-subtab${subTab === 'advanced' ? ' ml-subtab-active' : ''}`}
          onClick={() => setSubTab('advanced')}
        >⚙️ Advanced</button>
        <button
          className={`ml-subtab${subTab === 'songmaker' ? ' ml-subtab-active' : ''}`}
          onClick={() => setSubTab('songmaker')}
        >🎹 Song Maker</button>
      </div>

      {subTab === 'songmaker' ? (
        <div className="ml-songmaker-embed">
          <SongMakerGrid />
        </div>
      ) : (
        <div className="ml-layout">

          {/* ── Create left panel ── */}
          {subTab === 'create' && (
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
                  >🎸 Instrumental</button>
                </div>
                <div className="ml-inspiration">
                  <span className="ml-insp-label">Inspiration</span>
                  <div className="ml-tags">
                    {TAGS.map(t => (
                      <button key={t} className="ml-tag" onClick={() => addCreateTag(t)}>+ {t}</button>
                    ))}
                  </div>
                </div>
              </div>
              {error && <p className="airp-error" style={{ margin: '0 0 1rem' }}>{error}</p>}
              <button
                className="ml-create-btn"
                onClick={generate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? <><span className="ml-btn-spinner" /> Creating...</> : '🎵 Create'}
              </button>
            </div>
          )}

          {/* ── Advanced left panel ── */}
          {subTab === 'advanced' && (
            <div className="ml-left">
              <div className="ml-left-top">
                <h2 className="ml-title">Advanced</h2>
                <p className="ml-subtitle">Fine-tune every detail</p>

                {/* Lyrics */}
                <div className="ml-adv-section">
                  <div className="ml-adv-row">
                    <span className="ml-adv-label">Lyrics</span>
                    <button
                      className={`ml-toggle-btn${advAutoLyrics ? ' ml-toggle-active' : ''}`}
                      style={{ padding: '0.22rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => setAdvAutoLyrics(t => !t)}
                    >Auto</button>
                  </div>
                  {!advAutoLyrics && !advInstrumental ? (
                    <textarea
                      className="ml-prompt"
                      value={advLyrics}
                      onChange={e => setAdvLyrics(e.target.value)}
                      placeholder="Write your own lyrics, or leave blank for auto..."
                      maxLength={500}
                      style={{ minHeight: '75px' }}
                    />
                  ) : (
                    <p className="ml-adv-hint">
                      {advInstrumental ? 'No vocals — instrumental track.' : 'AI will write lyrics for you.'}
                    </p>
                  )}
                </div>

                {/* Styles */}
                <div className="ml-adv-section">
                  <div className="ml-adv-row">
                    <span className="ml-adv-label">Styles</span>
                  </div>
                  <div className="ml-adv-input-row">
                    <input
                      className="ml-adv-input"
                      value={advStyleInput}
                      onChange={e => setAdvStyleInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addAdvStyle(advStyleInput);
                        }
                      }}
                      placeholder="e.g. jazz, cinematic, lo-fi..."
                      maxLength={40}
                    />
                    <button className="ml-adv-add-btn" onClick={() => addAdvStyle(advStyleInput)}>+</button>
                  </div>
                  {advStyles.length > 0 && (
                    <div className="ml-adv-chips">
                      {advStyles.map(s => (
                        <span key={s} className="ml-adv-chip">
                          {s}
                          <button className="ml-adv-chip-x" onClick={() => setAdvStyles(p => p.filter(x => x !== s))}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="ml-tags" style={{ marginTop: '0.5rem' }}>
                    {TAGS.map(t => (
                      <button key={t} className="ml-tag" onClick={() => addAdvStyle(t)}>+ {t}</button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="ml-toggles">
                  <button
                    className={`ml-toggle-btn${advInstrumental ? ' ml-toggle-active' : ''}`}
                    onClick={() => {
                      const next = !advInstrumental;
                      setAdvInstrumental(next);
                      if (next) setAdvAutoLyrics(true);
                    }}
                  >🎸 Instrumental</button>
                </div>

                {/* Song title */}
                <div className="ml-adv-section">
                  <div className="ml-adv-row">
                    <span className="ml-adv-label">Song Title</span>
                    <span className="ml-adv-optional">optional</span>
                  </div>
                  <input
                    className="ml-adv-input"
                    value={advTitle}
                    onChange={e => setAdvTitle(e.target.value)}
                    placeholder="Leave blank for AI to pick a title..."
                    maxLength={60}
                  />
                </div>
              </div>

              {advError && <p className="airp-error" style={{ margin: '0 0 1rem' }}>{advError}</p>}
              <button
                className="ml-create-btn"
                onClick={generateAdvanced}
                disabled={advLoading || (advStyles.length === 0 && !advLyrics.trim())}
              >
                {advLoading ? <><span className="ml-btn-spinner" /> Creating...</> : '🎵 Create'}
              </button>
            </div>
          )}

          {/* ── Right panel (shared) ── */}
          {songListJSX}
        </div>
      )}
    </div>
  );
}
