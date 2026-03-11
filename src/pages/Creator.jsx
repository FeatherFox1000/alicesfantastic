import './Creator.css';
import { useEffect, useRef, useState } from 'react';

function Creator() {
  const iframeRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    // Exit fullscreen on component mount to prevent refresh issues
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore errors if already exited
      });
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

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
        <h1>Creator</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Build personalized 2D worlds using prebuilt shape blocks. Design structures, create custom characters, and share your creations with others.
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
              src={import.meta.env.DEV ? 'http://localhost:5175/' : '/creator-game/index.html'}
              title="Creator Game"
              className="game-iframe"
              style={{width: '100%', height: '100%', border: 'none'}}
            />
            <button
              className="fullscreen-button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
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

        <section className="updates-section">
          <h2 className="updates-title">What's New</h2>
          <div className="update-card">
            <div className="update-header">
              <span className="update-badge">Latest</span>
              <span className="update-date">October 12, 2025</span>
            </div>
            <h3>Major Feature Update!</h3>
            <ul className="update-list">
              <li><strong>Animated Characters:</strong> Bring your characters to life with multi-frame animations! Create walking cycles and custom movements.</li>
              <li><strong>First-Person Mode:</strong> Experience your world through your character's eyes with immersive first-person perspective.</li>
              <li><strong>Mouse Follow Building:</strong> Extend your building range infinitely! The camera now follows your mouse for limitless creativity.</li>
              <li><strong>Undo Everything:</strong> Made a mistake? New undo buttons in both the world builder and character creator let you step back through your changes.</li>
              <li><strong>Custom Colors:</strong> Use the color picker to select any color you can imagine for your blocks and characters.</li>
              <li><strong>Save & Load Worlds:</strong> Save multiple worlds to your browser and switch between projects seamlessly.</li>
              <li><strong>Fullscreen Mode:</strong> Immerse yourself in building with a dedicated fullscreen button.</li>
            </ul>
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
