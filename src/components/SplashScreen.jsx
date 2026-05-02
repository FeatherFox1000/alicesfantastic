import { useState, useEffect } from 'react';
import './SplashScreen.css';

// Stable star positions (no Math.random so they don't shift on re-render)
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: (i * 37 + 11) % 100,
  top: (i * 61 + 7) % 100,
  size: (i % 3) + 1,
  delay: ((i * 0.17) % 2).toFixed(2),
  dur: (1.2 + (i % 4) * 0.35).toFixed(2),
}));

const FLOATERS = ['🌟', '✨', '🎮', '🐾', '🎵', '🎨', '⭐', '🦄'];

export default function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2600);
    const t2 = setTimeout(onDone, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`splash${leaving ? ' splash-out' : ''}`}>
      {/* Starfield */}
      {STARS.map(s => (
        <div
          key={s.id}
          className="splash-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}

      {/* Floating emoji orbs */}
      {FLOATERS.map((emoji, i) => (
        <div
          key={i}
          className="splash-floater"
          style={{
            left: `${(i * 13 + 5) % 90}%`,
            animationDelay: `${(i * 0.3).toFixed(1)}s`,
            animationDuration: `${3 + (i % 3)}s`,
            fontSize: `${1.2 + (i % 3) * 0.4}rem`,
          }}
        >
          {emoji}
        </div>
      ))}

      {/* Main content */}
      <div className="splash-content">
        <div className="splash-icon">🐾</div>
        <h1 className="splash-title">
          <span className="splash-title-alice">Alice's</span>
          <span className="splash-title-studio">Game Studio</span>
        </h1>
        <p className="splash-tagline">Made by a kid, for kids ✨</p>
        <div className="splash-bar">
          <div className="splash-bar-fill" />
        </div>
      </div>
    </div>
  );
}
