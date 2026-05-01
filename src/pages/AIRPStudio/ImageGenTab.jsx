import { useState } from 'react';
import { api } from './api';

const ART_STYLES = [
  { value: '3d', label: '3D', img: '/images/art-styles/3d.webp' },
  { value: 'chibi', label: 'Chibi', img: '/images/art-styles/chibi.webp' },
  { value: 'abstract', label: 'Abstract', img: '/images/art-styles/abstract.webp' },
];

export default function ImageGenTab() {
  const [prompt, setPrompt] = useState('');
  const [artStyle, setArtStyle] = useState('3d');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState('');

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setImageUrl(null);
    try {
      const data = await api.createImage(prompt, artStyle);
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-tab">
      <div className="create-tab-header">
        <h2>🎨 Image Creator</h2>
        <p>Describe anything and get an AI-generated picture!</p>
      </div>

      <div className="create-form">
        <div className="create-art-styles">
          {ART_STYLES.map(s => (
            <button
              key={s.value}
              type="button"
              className={`airp-art-style-card${artStyle === s.value ? ' active' : ''}`}
              onClick={() => setArtStyle(s.value)}
            >
              <img src={s.img} alt={s.label} className="airp-art-style-preview" />
              <span className="airp-art-style-name">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="create-input-row">
          <textarea
            className="create-prompt-input"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your image... e.g. a dragon flying over a moonlit castle, fireflies glowing in the dark"
            rows={3}
            maxLength={400}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate(); }}
          />
          <button
            className="create-generate-btn"
            onClick={generate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? '✨ Creating...' : '✨ Create'}
          </button>
        </div>

        {error && <p className="airp-error">{error}</p>}
      </div>

      {loading && (
        <div className="create-loading">
          <div className="create-loading-spinner" />
          <p>Painting your scene... this takes about 10 seconds</p>
        </div>
      )}

      {imageUrl && !loading && (
        <div className="create-result">
          <img src={imageUrl} alt="Generated scene" className="create-result-img" />
          <a href={imageUrl} download="sandbox-image.webp" className="create-download-btn" target="_blank" rel="noreferrer">
            ⬇️ Download
          </a>
        </div>
      )}
    </div>
  );
}
