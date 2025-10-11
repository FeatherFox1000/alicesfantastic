import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">Alice's Fantastic</h1>
        <p className="hero-subtitle">Where your kid can learn and have some fun</p>
      </section>

      <section className="games-section">
        <h2 className="section-title">Featured Games</h2>
        <div className="games-grid">
          <Link to="/unicorns-unite" className="game-card">
            <div className="game-image-wrapper">
              <img src="/images/unicorn.png" alt="Unicorns Unite" className="game-image" />
            </div>
            <div className="game-content">
              <h3>Unicorns Unite</h3>
              <p className="game-date">September 27, 2022</p>
              <p className="game-description">
                A magical game where you can play as a unicorn, and use your magic!
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
