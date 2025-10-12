import './UnicornsUnite.css';
import { useEffect, useRef, useState } from 'react';

function UnicornsUnite() {
  const iframeRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Add/remove class to body to prevent scrolling when hovering over game
    if (isHovering) {
      document.body.classList.add('game-focused');
    } else {
      document.body.classList.remove('game-focused');
    }

    return () => {
      document.body.classList.remove('game-focused');
    };
  }, [isHovering]);

  useEffect(() => {
    // Always prevent arrow keys and space from scrolling on this page
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    const handleWheel = (e) => {
      if (isHovering) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isHovering]);

  return (
    <div className="page unicorns-unite">
      <div className="page-hero">
        <h1>Unicorns Unite</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Unicorn's Unite is a game where you can play as a unicorn, and use your magic to help other unicorns that are in danger.
          </p>
        </section>

        <section className="game-container">
          <div
            className="game-wrapper"
            ref={wrapperRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <iframe
              ref={iframeRef}
              src={import.meta.env.DEV ? 'http://localhost:5174/' : `/unicorns-unite/index.html?v=${Date.now()}`}
              title="Unicorns Unite Game"
              className="game-iframe"
            />
          </div>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>WASD / Arrow Keys:</strong> Move your unicorn</li>
              <li><strong>Mouse:</strong> Look around (click to enable)</li>
              <li><strong>Space:</strong> Cast magic spell</li>
              <li><strong>Shift:</strong> Activate protective shield</li>
            </ul>
            <p className="game-objective">
              <strong>Objective:</strong> Rescue all 5 unicorns in danger by casting spells on them!
            </p>
          </div>
        </section>

        <div className="info-grid">
          <section className="info-card">
            <div className="card-icon">🦄</div>
            <h2>Characters</h2>
            <p>Play as magical unicorns with unique personalities and abilities. Each character brings something special to the adventure!</p>
          </section>

          <section className="info-card">
            <div className="card-icon">✨</div>
            <h2>Abilities</h2>
            <p>Use your unicorn magic to cast spells, create shields, and help other unicorns in need. Master different magical powers!</p>
          </section>

          <section className="info-card">
            <div className="card-icon">🗺️</div>
            <h2>Map</h2>
            <p>Explore a magical world filled with wonder and adventure. Discover new areas and rescue unicorns in danger!</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default UnicornsUnite;
