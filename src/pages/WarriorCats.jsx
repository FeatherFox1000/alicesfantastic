import { useEffect, useRef, useState } from 'react';
import './WarriorCats.css';

function WarriorCats() {
  const iframeRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, []);

  return (
    <div className="page warrior-cats">
      <div className="page-hero warrior-cats-hero">
        <h1>Warrior Cats</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Enter the forest as a warrior cat! Create your own cat with custom pelts, choose your clan,
            and explore the territories. Visit the Moonstone, roam through ThunderClan camp, and live the
            life of a warrior.
          </p>
        </section>

        <section className="game-container">
          <div className="game-wrapper warrior-cats-wrapper" ref={wrapperRef}>
            <iframe
              ref={iframeRef}
              src="/warrior-cats/index.html"
              title="Warrior Cats - The Forest"
              className="game-iframe"
              allow="autoplay; pointer-lock"
              style={{width: '100%', height: '100%', border: 'none'}}
            />
            <button
              className="fullscreen-button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
          </div>
          <div className="game-instructions">
            <h3>Controls</h3>
            <ul>
              <li><strong>WASD / Arrows:</strong> Move your cat</li>
              <li><strong>Mouse:</strong> Look around (click game first)</li>
              <li><strong>Shift:</strong> Run</li>
              <li><strong>Space:</strong> Jump</li>
              <li><strong>Scroll:</strong> Zoom in/out</li>
              <li><strong>Escape:</strong> Pause menu</li>
            </ul>
            <h3>Locations</h3>
            <ul>
              <li><strong>ThunderClan Camp:</strong> Northeast - dense oak forest</li>
              <li><strong>RiverClan Camp:</strong> Northwest - by the river</li>
              <li><strong>WindClan Camp:</strong> Southeast - open moor</li>
              <li><strong>ShadowClan Camp:</strong> Southwest - dark pine forest</li>
              <li><strong>Moonstone:</strong> Far south - glowing crystal cave</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WarriorCats;
