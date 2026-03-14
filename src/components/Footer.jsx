import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Alice's Fantastic</p>
        <p className="tagline">Where your kid can learn and have some fun</p>
        <p className="footer-links">
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
