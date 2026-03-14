import { useGameScore } from '../hooks/useGameScore';
import Leaderboard from '../components/Leaderboard';
import './JumpingPenguin.css';

function JumpingPenguin() {
  useGameScore('jumping-penguin');

  return (
    <div className="page jumping-penguin">
      <div className="page-hero" style={{background: 'linear-gradient(135deg, #d4eaf7 0%, #b8e4f0 100%)'}}>
        <h1>Jumping Penguin</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Help this little penguin fly through the icy pipes! Tap or press space to jump and see how far you can go.
            How high can you score?
          </p>
        </section>

        <section className="game-container">
          <h2 className="game-section-title">Play Jumping Penguin</h2>
          <div className="game-wrapper" style={{aspectRatio: '3 / 4', maxWidth: '480px', margin: '0 auto'}}>
            <iframe
              src="/jumping-penguin/index.html"
              title="Jumping Penguin"
              className="game-iframe"
              allow="autoplay"
            />
          </div>
          <a href="/jumping-penguin/index.html" target="_blank" rel="noopener noreferrer" className="open-fullscreen-btn">
            Open Fullscreen
          </a>
          <Leaderboard game="jumping-penguin" title="Top Penguin Jumpers" />
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>Space / Up Arrow:</strong> Jump</li>
              <li><strong>Click / Tap:</strong> Jump</li>
              <li><strong>Objective:</strong> Fly through as many pipes as you can without hitting them!</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default JumpingPenguin;
