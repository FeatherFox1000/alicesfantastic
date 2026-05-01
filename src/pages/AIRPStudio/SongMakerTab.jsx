import { useState, useRef } from 'react';
import { api } from './api';

const MOODS = [
  { label: '🌟 Epic', prompt: 'epic orchestral adventure music, heroic, sweeping strings and brass' },
  { label: '🌸 Peaceful', prompt: 'peaceful and calm ambient music, soft piano, gentle and relaxing' },
  { label: '😊 Happy', prompt: 'upbeat cheerful music, happy and playful, light and fun' },
  { label: '🌙 Mysterious', prompt: 'mysterious and magical music, eerie, fantasy, atmospheric' },
  { label: '⚔️ Battle', prompt: 'intense battle music, fast-paced, drums and electric guitar, exciting' },
  { label: '🎪 Silly', prompt: 'silly and goofy cartoon music, playful, funny, bouncy' },
];

const DURATIONS = [5, 10, 15, 20, 30];

export default function SongMakerTab() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setAudioUrl(null);
    setEnhancedPrompt('');
    setPlaying(false);
    try {
      const data = await api.createSong(prompt, duration);
      setAudioUrl(data.audioUrl);
      setEnhancedPrompt(data.prompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  return (
    <div className="create-tab">
      <div className="create-tab-header">
        <h2>🎵 Song Maker</h2>
        <p>Describe a vibe and get an original AI-made song!</p>
      </div>

      <div className="create-form">
        <div className="song-moods">
          {MOODS.map(m => (
            <button
              key={m.label}
              type="button"
              className={`song-mood-btn${prompt === m.prompt ? ' active' : ''}`}
              onClick={() => setPrompt(m.prompt)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="create-input-row">
          <textarea
            className="create-prompt-input"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your song... e.g. a cozy rainy day jazz tune with soft piano and drums"
            rows={3}
            maxLength={300}
          />
        </div>

        <div className="song-duration-row">
          <span className="song-duration-label">Length:</span>
          {DURATIONS.map(d => (
            <button
              key={d}
              type="button"
              className={`song-duration-btn${duration === d ? ' active' : ''}`}
              onClick={() => setDuration(d)}
            >
              {d}s
            </button>
          ))}
        </div>

        <button
          className="create-generate-btn"
          onClick={generate}
          disabled={loading || !prompt.trim()}
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? '🎵 Composing...' : '🎵 Make Song'}
        </button>

        {error && <p className="airp-error">{error}</p>}
      </div>

      {loading && (
        <div className="create-loading">
          <div className="create-loading-spinner" />
          <p>Composing your song... this can take up to 30 seconds</p>
        </div>
      )}

      {audioUrl && !loading && (
        <div className="create-result song-result">
          <button className="song-play-btn" onClick={togglePlay}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
            style={{ display: 'none' }}
          />
          {enhancedPrompt && (
            <p className="song-enhanced-prompt">🎼 {enhancedPrompt}</p>
          )}
          <a href={audioUrl} download="sandbox-song.mp3" className="create-download-btn" target="_blank" rel="noreferrer">
            ⬇️ Download
          </a>
        </div>
      )}
    </div>
  );
}
