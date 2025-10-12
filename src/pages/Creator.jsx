import './Creator.css';
import { useEffect, useRef, useState } from 'react';

function Creator() {
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
    <div className="page creator">
      <div className="page-hero">
        <h1>Welcome to Creator</h1>
        <p className="hero-subtitle">Unleash Your Imagination!</p>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            The Creator game enables users to build personalized 2D worlds using prebuilt shape blocks. Players can design structures, explore their creations as a character, and share their work with others.
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
              src="/creator/index.html"
              title="Creator Game"
              className="game-iframe"
              allowFullScreen
            />
          </div>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>Build Mode:</strong> Select shapes and colors, then click on canvas to place them</li>
              <li><strong>Play Mode:</strong> Use Arrow Keys or WASD to move your character</li>
              <li><strong>Custom Shapes:</strong> Click "+ Custom" to create your own shapes</li>
              <li><strong>Character Builder:</strong> Click "👤 Character" to design your player</li>
              <li><strong>Delete Mode:</strong> Click the 🗑️ button or right-click to remove objects</li>
            </ul>
            <p className="game-objective">
              <strong>Objective:</strong> Build amazing worlds, customize your character, and share your creations!
            </p>
          </div>
        </section>

        <div className="button-section">
          <button className="how-to-button">
            How to Videos
          </button>
        </div>

        <div className="features-section">
          <div className="feature">
            <div className="feature-number">1</div>
            <div className="feature-content">
              <h2>Creating Your Unique World</h2>
              <p>
                Launch the game, sign in, and access a blank canvas with prebuilt shape blocks in your inventory. Your imagination is the only limit!
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-number">2</div>
            <div className="feature-content">
              <h2>Bringing Your Imagination to Life</h2>
              <p>
                Select blocks, position them in the world, and combine different shapes to create amazing structures. Use the built-in editor to create custom shapes and bring your vision to reality!
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-number">3</div>
            <div className="feature-content">
              <h2>Becoming a Part of Your World</h2>
              <p>
                Switch to character mode to explore and interact with your creations from a first-person perspective. Walk through your builds and discover hidden surprises!
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-number">4</div>
            <div className="feature-content">
              <h2>Sharing Your Creations</h2>
              <p>
                Share your masterpieces with shareable links or upload them to the Creator community hub. Get feedback from other creators and inspire others with your amazing builds!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Creator;
