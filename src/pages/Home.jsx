import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="about-section">
        <div className="about-content">
          <h2>Welcome to Alice's Game Studio!</h2>
          <p>
            This website showcases games created by Alice, a young game developer who loves bringing
            imagination to life through interactive experiences. From magical unicorn adventures to
            creative world-building tools, each game is a project where Alice has built, designed,
            and shared her creations with the world.
          </p>
          <p>
            Explore the games Alice has made, try the world-building tools she's created, and see
            what's possible when creativity meets code. Each game represents a unique project and
            learning experience in Alice's game development journey.
          </p>
        </div>
      </section>

      <section className="featured-game">
        <div className="featured-badge">NEW!</div>
        <div className="featured-content">
          <div className="featured-text">
            <h2>Creator - Build Your World!</h2>
            <p className="featured-description">
              The ultimate 2D world-building game where you become the creator! Design personalized
              worlds using prebuilt shapes, custom blocks, and your imagination. Build amazing structures,
              create your own character pixel-by-pixel, and explore your creations in play mode.
            </p>
            <div className="featured-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🎨</span>
                <span>Custom Shape Editor</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">👤</span>
                <span>Character Builder</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🎮</span>
                <span>Play Mode</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🔗</span>
                <span>Share Creations</span>
              </div>
            </div>
            <Link to="/creator" className="play-button">Play Creator Now!</Link>
          </div>
          <div className="featured-preview">
            <Link to="/creator" className="preview-link">
              <img
                src="/images/creator-screenshot.png"
                alt="Creator Game Screenshot"
                className="preview-screenshot"
              />
              <div className="preview-overlay">
                <span className="preview-overlay-text">Click to Play Full Game →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="games-section">
        <h2 className="section-title">More Games</h2>
        <div className="games-grid">
          <Link to="/space-pups" className="game-card">
            <div className="game-image-wrapper">
              <div className="game-placeholder" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'white', fontSize: '4rem'}}>
                🚀🐕
              </div>
            </div>
            <div className="game-content">
              <h3>Space Pups</h3>
              <p className="game-date">October 13, 2025</p>
              <p className="game-description">
                A multiplayer platformer where space dogs race to the top! Customize your pup and compete with friends using room codes.
              </p>
            </div>
          </Link>

          <Link to="/unicorns-unite" className="game-card">
            <div className="game-image-wrapper">
              <img src="/images/unicorns-unite-screenshot.png" alt="Unicorns Unite Game" className="game-image" />
              <div className="original-art-badge">
                <img src="/images/unicorn.png" alt="Original Unicorn Drawing" className="original-art" />
                <span className="badge-text">Original Design</span>
              </div>
            </div>
            <div className="game-content">
              <h3>Unicorns Unite</h3>
              <p className="game-date">September 27, 2022</p>
              <p className="game-description">
                A magical 3D adventure where you play as a unicorn and use your magic to help other unicorns in danger!
              </p>
            </div>
          </Link>

          <Link to="/tomato-hunter" className="game-card">
            <div className="game-image-wrapper">
              <img src="/images/tomato-hunter.png" alt="Tomato Hunter" className="game-image" />
            </div>
            <div className="game-content">
              <h3>Tomato Hunter</h3>
              <p className="game-date">May 21, 2023</p>
              <p className="game-description">
                Alice's first game on Construct. You have to hunt tomatoes. There is only one level. It's still fun though!
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
