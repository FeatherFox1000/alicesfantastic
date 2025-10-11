import './TomatoHunter.css';

function TomatoHunter() {
  return (
    <div className="page tomato-hunter">
      <div className="page-hero">
        <h1>Tomato Hunter</h1>
      </div>

      <div className="page-content">
        <section className="game-showcase">
          <div className="game-image-container">
            <img src="/images/tomato-hunter.png" alt="Tomato Hunter Game Screenshot" className="showcase-image" />
          </div>

          <div className="game-details">
            <div className="game-meta">
              <span className="meta-item">Posted: May 21, 2023</span>
              <span className="meta-item">By: Alice</span>
              <div className="tags">
                <span className="tag">Silly Games</span>
              </div>
            </div>

            <div className="description-box">
              <h2>About the Game</h2>
              <p>
                This is Alice's first game created on Construct! In Tomato Hunter, you have to hunt tomatoes.
                There is only one level. It's still fun though!
              </p>
            </div>

            <div className="download-section">
              <h3>Download & Play</h3>
              <p>
                Want to try it out or modify the game? Download the Construct project file!
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
                <strong>Note:</strong> You need a Construct account to load this file.
                Construct accounts are free at{' '}
                <a
                  href="https://www.construct.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  construct.net
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TomatoHunter;
