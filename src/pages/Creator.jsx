import './Creator.css';

function Creator() {
  return (
    <div className="page creator">
      <div className="page-hero">
        <h1>Welcome to Creator</h1>
        <p className="hero-subtitle">Unleash Your Imagination!</p>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            The Creator game enables users to build personalized 3D worlds using prebuilt shape blocks. Players can design structures, explore their creations as a character, and share their work with others.
          </p>
        </section>

        <div className="button-section">
          <button className="how-to-button">
            How to Videos
          </button>
        </div>

        <div className="features-section">
          <div className="feature">
            <div className="feature-number">1</div>
            <div className="feature-content">
              <h2>Creating Your Unique World</h2>
              <p>
                Launch the game, sign in, and access a blank canvas with prebuilt shape blocks in your inventory. Your imagination is the only limit!
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-number">2</div>
            <div className="feature-content">
              <h2>Bringing Your Imagination to Life</h2>
              <p>
                Select blocks, position them in the world, and combine different shapes to create amazing structures. Use the built-in editor to create custom shapes and bring your vision to reality!
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-number">3</div>
            <div className="feature-content">
              <h2>Becoming a Part of Your World</h2>
              <p>
                Switch to character mode to explore and interact with your creations from a first-person perspective. Walk through your builds and discover hidden surprises!
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-number">4</div>
            <div className="feature-content">
              <h2>Sharing Your Creations</h2>
              <p>
                Share your masterpieces with shareable links or upload them to the Creator community hub. Get feedback from other creators and inspire others with your amazing builds!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Creator;
