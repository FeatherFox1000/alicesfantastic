import './UnicornsUnite.css';

function UnicornsUnite() {
  return (
    <div className="page unicorns-unite">
      <div className="page-hero">
        <h1>Unicorns Unite</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Unicorn's Unite is a game where you can play as a unicorn, and use your magic to help other unicorns that are in danger.
          </p>
        </section>

        <section className="game-container">
          <div className="game-wrapper">
            <iframe
              src="/unicorns-unite/index.html"
              title="Unicorns Unite Game"
              className="game-iframe"
              allowFullScreen
            />
          </div>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>WASD / Arrow Keys:</strong> Move your unicorn</li>
              <li><strong>Mouse:</strong> Look around (click to enable)</li>
              <li><strong>Space:</strong> Cast magic spell</li>
              <li><strong>Shift:</strong> Activate protective shield</li>
            </ul>
            <p className="game-objective">
              <strong>Objective:</strong> Rescue all 5 unicorns in danger by casting spells on them!
            </p>
          </div>
        </section>

        <div className="info-grid">
          <section className="info-card">
            <div className="card-icon">🦄</div>
            <h2>Characters</h2>
            <p>Play as magical unicorns with unique personalities and abilities. Each character brings something special to the adventure!</p>
          </section>

          <section className="info-card">
            <div className="card-icon">✨</div>
            <h2>Abilities</h2>
            <p>Use your unicorn magic to cast spells, create shields, and help other unicorns in need. Master different magical powers!</p>
          </section>

          <section className="info-card">
            <div className="card-icon">🗺️</div>
            <h2>Map</h2>
            <p>Explore a magical world filled with wonder and adventure. Discover new areas and rescue unicorns in danger!</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default UnicornsUnite;
