import './Homey.css';

export default function Homey() {
  return (
    <div className="page homey-page">
      <section className="page-hero homey-hero">
        <h1>Homey</h1>
        <p>Design your dream rooms!</p>
      </section>

      <section className="intro-section">
        <p>Build and decorate your own bedroom, café, or gaming setup. Drag furniture from the palette and drop it into your room!</p>
      </section>

      <div className="game-container">
        <div className="game-wrapper" style={{ aspectRatio: '16 / 9', maxWidth: '900px', margin: '0 auto' }}>
          <iframe
            src="/homey/index.html"
            title="Homey"
            className="game-iframe"
          />
        </div>
        <a href="/homey/index.html" target="_blank" rel="noopener noreferrer" className="open-fullscreen-btn">
          Open Fullscreen
        </a>
      </div>

      <section className="intro-section">
        <h2>How to Play</h2>
        <ul>
          <li>Pick a room type — Bedroom, Café, or Gaming Setup</li>
          <li>Drag furniture from the left panel into the room</li>
          <li>Move placed items around by dragging them</li>
          <li>Hover over an item and click ✕ to remove it</li>
          <li>Your rooms are saved automatically!</li>
        </ul>
      </section>
    </div>
  );
}
