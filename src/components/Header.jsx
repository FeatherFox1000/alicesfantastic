import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src="/images/logo.png" alt="Alice's Fantastic" className="logo" />
        </Link>
        <nav className="nav">
          <Link to="/unicorns-unite" className="nav-link">Unicorns Unite</Link>
          <Link to="/creator" className="nav-link">Creator</Link>
          <Link to="/ai-rp-studio" className="nav-link">The Sandbox</Link>
          <Link to="/space-pups" className="nav-link">Space Pups</Link>
          <Link to="/penguin-runner" className="nav-link">Penguin Runner</Link>
          <Link to="/jumping-penguin" className="nav-link">Jumping Penguin</Link>
          <Link to="/tomato-hunter" className="nav-link">Tomato Hunter</Link>
          <Link to="/podcasts" className="nav-link">Podcasts</Link>
          <ThemeToggle />
          {user && (
            <div className="user-info">
              {user.is_admin ? <Link to="/admin" className="admin-link">Admin</Link> : null}
              <span className="user-name">Hi, {user.username}!</span>
              <button className="logout-btn" onClick={logout}>Log Out</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
