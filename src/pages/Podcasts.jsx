import './Podcasts.css';

function Podcasts() {
  return (
    <div className="page podcasts">
      <div className="page-hero">
        <h1>Podcasts</h1>
        <p className="hero-subtitle">Listen to Story Fox</p>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="podcasts-intro">
            Welcome to the podcasts section! Here you'll find exciting stories, game development insights, and fun adventures.
          </p>
        </section>

        <section className="listen-on-section">
          <h2>Listen On</h2>
          <a
            href="https://podcasts.apple.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="platform-box"
          >
            <div className="platform-icon">🎧</div>
            <h3>Apple Podcasts</h3>
            <p>You can also listen on Apple Podcasts</p>
          </a>
        </section>

        <div className="podcasts-grid">
          <div className="podcast-card">
            <div className="podcast-icon">🎙️</div>
            <h3>Coming Soon</h3>
            <p>Exciting podcast episodes will be added here soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Podcasts;
