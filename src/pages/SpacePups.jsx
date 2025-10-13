import './SpacePups.css';
import { useEffect, useRef, useState } from 'react';

function SpacePups() {
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
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
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
    <div className="page space-pups">
      <div className="page-hero">
        <h1>🚀 Space Pups</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Space Pups is a multiplayer 2D platformer where you race to the top of a vertical world! Customize your space dog with unique colors, hats, accessories, and patterns. Create or join rooms to compete with friends.
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
              src="http://localhost:3002"
              title="Space Pups Game"
              className="game-iframe"
            />
          </div>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>WASD / Arrow Keys:</strong> Move your space dog left and right</li>
              <li><strong>Space:</strong> Jump to reach higher platforms</li>
              <li><strong>Room Codes:</strong> Share your room code to play with friends</li>
              <li><strong>Checkpoints:</strong> Pass through green checkpoints to save your progress</li>
            </ul>
            <p className="game-objective">
              <strong>Objective:</strong> Race to reach the finish flag at the top and earn coins to unlock customizations!
            </p>
          </div>
        </section>

        <section className="updates-section">
          <h2 className="updates-title">Features</h2>
          <div className="update-card">
            <div className="update-header">
              <span className="update-badge">Latest</span>
              <span className="update-date">October 2025</span>
            </div>
            <h3>Space Pups Launch!</h3>
            <ul className="update-list">
              <li><strong>Multiplayer Racing:</strong> Race against friends in real-time vertical climbing challenges!</li>
              <li><strong>Dog Customization:</strong> Unlock colors, hats, accessories, and patterns for your space dog.</li>
              <li><strong>Pack Opening System:</strong> Open packs with coins to unlock rare and legendary items!</li>
              <li><strong>Checkpoint System:</strong> Respawn at checkpoints if you fall, no need to start over!</li>
              <li><strong>Room Codes:</strong> Create private rooms and share 6-digit codes with friends.</li>
              <li><strong>Coin Rewards:</strong> Earn 100 coins for winning races to unlock more customizations!</li>
            </ul>
          </div>
        </section>

        <div className="info-grid">
          <section className="info-card">
            <div className="card-icon">🐕</div>
            <h2>Customization</h2>
            <p>Personalize your space dog with 10 colors, 7 hats, 6 accessories, and 5 patterns. Collect legendary items!</p>
          </section>

          <section className="info-card">
            <div className="card-icon">🎮</div>
            <h2>Multiplayer</h2>
            <p>Host or join games with up to 8 players. Use room codes to play with your friends!</p>
          </section>

          <section className="info-card">
            <div className="card-icon">🏁</div>
            <h2>Checkpoints</h2>
            <p>Strategic checkpoints let you respawn closer to your progress. No more starting from the bottom!</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SpacePups;
