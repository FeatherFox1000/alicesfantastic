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
        <div className="featured-content" style={{background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)'}}>
          <div className="featured-text">
            <h2>The Sandbox - Create Your Story!</h2>
            <p className="featured-description">
              Build your own world, create a character, and dive into an AI-powered roleplay adventure!
              Be a brave dragon, a playful puppy, a space explorer — anything you can imagine. The AI
              storyteller brings your character to life in any world you dream up.
            </p>
            <div className="featured-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🌍</span>
                <span>Custom Worlds</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🐾</span>
                <span>Any Character</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🤖</span>
                <span>AI Storytelling</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">💾</span>
                <span>Save Adventures</span>
              </div>
            </div>
            <Link to="/ai-rp-studio" className="play-button" style={{color: '#7c3aed'}}>Play The Sandbox!</Link>
          </div>
          <div className="featured-preview">
            <Link to="/ai-rp-studio" className="preview-link">
              <img
                src="/images/ai-rp-studio-screenshot.png"
                alt="The Sandbox Screenshot"
                className="preview-screenshot"
              />
              <div className="preview-overlay">
                <span className="preview-overlay-text" style={{color: '#7c3aed'}}>Click to Play →</span>
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
              <img src="/images/space-pups-screenshot.png" alt="Space Pups Game" className="game-image" />
            </div>
            <div className="game-content">
              <h3>Space Pups</h3>
              <p className="game-date">October 2025</p>
              <p className="game-description">
                Multiplayer platformer racing game! Customize your space dog with 69+ items and compete with up to 8 friends in vertical climbing races.
              </p>
            </div>
          </Link>

          <Link to="/creator" className="game-card">
            <div className="game-image-wrapper">
              <img src="/images/creator-screenshot.png" alt="Creator Game" className="game-image" />
            </div>
            <div className="game-content">
              <h3>Creator</h3>
              <p className="game-date">February 2025</p>
              <p className="game-description">
                The ultimate 2D world-building game! Design worlds using prebuilt shapes, custom blocks, and your imagination. Build amazing structures and explore in play mode.
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
              <p className="game-date">September 2022</p>
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
              <p className="game-date">May 2023</p>
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
