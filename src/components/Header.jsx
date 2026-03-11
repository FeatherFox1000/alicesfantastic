import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src="/images/logo.png" alt="Alice's Fantastic" className="logo" />
        </Link>
        <nav className="nav">
          <Link to="/unicorns-unite" className="nav-link">Unicorns Unite</Link>
          <Link to="/creator" className="nav-link">Creator</Link>
          <Link to="/ai-rp-studio" className="nav-link">AI RP Studio</Link>
          <Link to="/space-pups" className="nav-link">Space Pups</Link>
          <Link to="/tomato-hunter" className="nav-link">Tomato Hunter</Link>
          <Link to="/podcasts" className="nav-link">Podcasts</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export default Header;
