import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className="top-banner">
        <Link to="/">
          <img src="/images/logo.png" alt="Alice's Fantastic" className="banner-logo" />
        </Link>
      </div>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '☰' : '✕'}
        </button>

        <nav className="nav">
          <Link to="/" className="nav-link">🏠 {!collapsed && 'Home'}</Link>
          <Link to="/unicorns-unite" className="nav-link">🦄 {!collapsed && 'Unicorns Unite'}</Link>
          <Link to="/creator" className="nav-link">🎨 {!collapsed && 'Creator'}</Link>
          <Link to="/ai-rp-studio" className="nav-link">🐱 {!collapsed && 'The Sandbox'}</Link>
          <Link to="/space-pups" className="nav-link">🐶 {!collapsed && 'Space Pups'}</Link>
          <Link to="/penguin-runner" className="nav-link">🐧 {!collapsed && 'Penguin Runner'}</Link>
          <Link to="/jumping-penguin" className="nav-link">🐥 {!collapsed && 'Jumping Penguin'}</Link>
          <Link to="/tomato-hunter" className="nav-link">🍅 {!collapsed && 'Tomato Hunter'}</Link>
          <Link to="/podcasts" className="nav-link">🎙️ {!collapsed && 'Podcasts'}</Link>
        </nav>

        <div className="sidebar-bottom">
          <ThemeToggle />
          {user && !collapsed && (
            <div className="user-info">
              {user.is_admin && <Link to="/admin" className="admin-link">Admin</Link>}
              <span className="user-name">Hi, {user.username}!</span>
              <button className="logout-btn" onClick={logout}>Log Out</button>
            </div>
          )}
          {user && collapsed && (
            <div className="user-info">
              <button className="logout-btn" onClick={logout} title="Log Out">👋</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Header;
