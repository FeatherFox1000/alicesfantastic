import './TomatoHunter.css';

function TomatoHunter() {

  return (
    <div className="page tomato-hunter">
      <div className="page-hero">
        <h1>Tomato Hunter</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            This is Alice's first game created on Construct! In Tomato Hunter, you have to hunt tomatoes.
            Scroll down to also play <strong>Tomato Hunter 2</strong> — a brand new version with 5 levels of platformer action!
          </p>
        </section>

        <section className="game-container">
          <h2 className="game-section-title">🍅 Original Game</h2>
          <p className="game-section-desc">The original Construct 3 version — Alice's very first game!</p>
          <a href="/tomato-hunter-game/index.html" target="_blank" rel="noopener noreferrer" className="open-fullscreen-btn">
            🍅 Tomato Hunter Unleashed
          </a>
          <a href="/tomato-hunter-v2/index.html" target="_blank" rel="noopener noreferrer" className="open-fullscreen-btn">
            🍅 Tomato Hunter +
          </a>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>Arrow Keys:</strong> Move your character around</li>
              <li><strong>Mouse:</strong> Click to interact and hunt tomatoes</li>
              <li><strong>Objective:</strong> Hunt all the tomatoes in the level!</li>
            </ul>
          </div>
        </section>

        <section className="download-section-wrapper">
          <div className="download-section">
              <h3>Download Project File</h3>
              <p>
                Want to see how it was made or modify the game? Download the original Construct 3 project file!
              </p>
              <a
                href="/downloads/Tomato-Hunter.c3p"
                className="download-button"
                download
              >
                <span className="button-icon">⬇️</span>
                Download Tomato-Hunter.c3p
              </a>
              <div className="note">
                Open for free without registering using Construct's guided free mode. Visit{' '}
                <a
                  href="https://www.construct.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  construct.net
                </a>{' '}
                for details.
              </div>
          </div>
        </section>

        <section className="updates-section">
          <h2 className="updates-title">Looking Back</h2>
          <div className="update-card">
            <div className="update-header">
              <span className="update-badge">First Game</span>
              <span className="update-date">October 2022</span>
            </div>
            <h3>Where It All Started</h3>
            <div className="update-content">
              <p>
                Tomato Hunter holds a special place in my heart as my very first game! Back in 2022, I was just learning
                the basics of game development with Construct 3. This simple hunting game taught me so much about:
              </p>
              <ul className="update-list">
                <li><strong>Game Mechanics:</strong> How to make characters move and interact with objects on screen.</li>
                <li><strong>Event Systems:</strong> Using Construct's visual programming to bring ideas to life without writing code.</li>
                <li><strong>Player Experience:</strong> What makes a game fun, even if it's just one level!</li>
                <li><strong>The Joy of Creating:</strong> Seeing something I imagined actually playable was incredible.</li>
              </ul>
              <p className="reflection">
                Three years later, I've moved on to much more advanced projects like <strong>Unicorns Unite</strong> with
                3D graphics and complex rescue missions, and <strong>Creator</strong> where players can build entire worlds
                with custom characters and animations. But Tomato Hunter will always remind me that every game developer
                starts somewhere simple—and that's perfectly okay! Every tomato hunted was a lesson learned. 🍅
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TomatoHunter;
