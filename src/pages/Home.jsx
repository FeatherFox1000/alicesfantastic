import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="about-section">
        <div className="about-content">
          <h2>Hey everyone — this is Alice! 👋</h2>
          <p>
            Welcome to my amazing site! I hope you all have a ton of fun here! 🎉
          </p>
          <p>
            So here's the story: I had this idea when I was 8 years old, and my dad did most of
            the coding. I did the drawings — you can see my original art in Unicorns Unite! — for
            the characters. Then Claude came along, the AI I used to help make this site possible.
          </p>
          <p>
            Just so you all know: <strong>this site was made by a kid, for kids.</strong>
          </p>
          <p>
            This is Alice, signing off — see y'all later! 🌟
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

          <Link to="/penguin-runner" className="game-card">
            <div className="game-image-wrapper" style={{background: 'linear-gradient(135deg, #1a5276, #87CEEB)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px'}}>
              <span style={{fontSize: '4rem'}}>🐧</span>
            </div>
            <div className="game-content">
              <h3>Penguin Runner</h3>
              <p className="game-date">March 2026</p>
              <p className="game-description">
                An endless runner like the Chrome dino game — but with a penguin! Jump over ice blocks and duck under snowballs. How far can you go?
              </p>
            </div>
          </Link>

          <Link to="/jumping-penguin" className="game-card">
            <div className="game-image-wrapper" style={{background: 'linear-gradient(135deg, #4a90d9, #87CEEB)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px'}}>
              <span style={{fontSize: '4rem'}}>🐧</span>
            </div>
            <div className="game-content">
              <h3>Jumping Penguin</h3>
              <p className="game-date">March 2026</p>
              <p className="game-description">
                Help a little penguin fly through icy pipes! Tap to jump and see how high you can score in this Flappy Bird-style game.
              </p>
            </div>
          </Link>

          <Link to="/present-maker" className="game-card">
            <div className="game-image-wrapper" style={{background: 'linear-gradient(135deg, #ad1457, #e91e63)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px'}}>
              <span style={{fontSize: '4rem'}}>🎁</span>
            </div>
            <div className="game-content">
              <h3>Present Maker</h3>
              <p className="game-date">March 2026</p>
              <p className="game-description">
                Design your own wrapping paper with any color and pattern! Pick from polka dots, stripes, stars, hearts, and more — then wrap it on a 3D present with a bow.
              </p>
            </div>
          </Link>

          <Link to="/homey" className="game-card">
            <div className="game-image-wrapper" style={{background: 'linear-gradient(135deg, #7b14c9, #e879a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px'}}>
              <span style={{fontSize: '4rem'}}>🏠</span>
            </div>
            <div className="game-content">
              <h3>Homey</h3>
              <p className="game-date">March 2026</p>
              <p className="game-description">
                Design your dream rooms! Build a cozy bedroom, a cute café, or the ultimate gaming setup by dragging and dropping furniture.
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
