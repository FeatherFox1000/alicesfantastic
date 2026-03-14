import { useEffect, useRef } from 'react';
import { useGameScore } from '../hooks/useGameScore';
import Leaderboard from '../components/Leaderboard';
import './PenguinRunner.css';

function PenguinRunner() {
  const gameRef = useRef(null);
  useGameScore('penguin-runner');

  useEffect(() => {
    const wrapper = gameRef.current;
    if (!wrapper) return;

    const handleMouseEnter = () => document.body.classList.add('game-focused');
    const handleMouseLeave = () => document.body.classList.remove('game-focused');

    wrapper.addEventListener('mouseenter', handleMouseEnter);
    wrapper.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      wrapper.removeEventListener('mouseenter', handleMouseEnter);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
      document.body.classList.remove('game-focused');
    };
  }, []);

  const handleFullscreen = () => {
    const iframe = gameRef.current?.querySelector('iframe');
    if (iframe?.requestFullscreen) iframe.requestFullscreen();
  };

  return (
    <div className="page penguin-runner">
      <div className="page-hero penguin-hero">
        <h1>Penguin Runner</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Run, jump, and slide your way through an icy world! How far can your penguin go?
            Dodge ice blocks and duck under snowballs in this endless runner.
          </p>
        </section>

        <section className="game-container">
          <div className="game-wrapper" ref={gameRef}>
            <iframe
              src="/penguin-runner/index.html"
              title="Penguin Runner"
              className="game-iframe"
              allow="autoplay"
            />
            <button className="fullscreen-btn" onClick={handleFullscreen}>
              ⛶
            </button>
          </div>

          <Leaderboard game="penguin-runner" title="Top Penguin Runners" />

          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>Space / Up Arrow:</strong> Jump over ice blocks</li>
              <li><strong>Down Arrow:</strong> Duck under snowballs</li>
              <li><strong>Tap (mobile):</strong> Tap top half to jump, bottom half to duck</li>
              <li><strong>Goal:</strong> Survive as long as you can — the game speeds up!</li>
            </ul>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <span className="info-icon">🐧</span>
            <h3>Endless Running</h3>
            <p>The penguin never stops — see how far you can go before hitting an obstacle!</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🧊</span>
            <h3>Ice Obstacles</h3>
            <p>Jump over small and tall ice blocks, and duck under flying snowballs.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">⚡</span>
            <h3>Speed Up</h3>
            <p>The longer you survive, the faster it gets. Can you beat your high score?</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PenguinRunner;
