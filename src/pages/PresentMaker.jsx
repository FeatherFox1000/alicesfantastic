import './PresentMaker.css';

function PresentMaker() {
  return (
    <div className="page present-maker">
      <div className="page-hero" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)'}}>
        <h1>Present Maker</h1>
      </div>

      <div className="page-content">
        <section className="intro-section">
          <p className="game-intro">
            Design your own wrapping paper with any color and pattern you want, then see it wrapped on a 3D present!
            Pick your favorite colors, choose a fun pattern, add a bow, and save your creation.
          </p>
        </section>

        <section className="game-container">
          <h2 className="game-section-title">Make Your Present</h2>
          <div className="game-wrapper" style={{aspectRatio: '1 / 1', maxWidth: '560px', margin: '0 auto'}}>
            <iframe
              src="/present-maker/index.html"
              title="Present Maker"
              className="game-iframe"
            />
          </div>
          <a href="/present-maker/index.html" target="_blank" rel="noopener noreferrer" className="open-fullscreen-btn">
            Open Fullscreen
          </a>
          <div className="game-instructions">
            <h3>How to Use</h3>
            <ul>
              <li><strong>Base Color:</strong> Pick the main color of your wrapping paper</li>
              <li><strong>Pattern Color:</strong> Pick the color for dots, stripes, stars, and more</li>
              <li><strong>Pattern:</strong> Choose from 7 fun patterns or keep it plain</li>
              <li><strong>Bow:</strong> Add a classic or big bow, and pick its color</li>
              <li><strong>Save:</strong> Download your present as a picture!</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PresentMaker;
