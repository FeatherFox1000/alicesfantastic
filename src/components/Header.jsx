import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Header.css';

function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifs();
  }, []);

  async function loadNotifs() {
    const token = localStorage.getItem('site_token');
    if (!token) return;
    try {
      const res = await fetch(API_BASE + '/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setNotifs(data);
    } catch {}
  }

  async function markRead(id) {
    const token = localStorage.getItem('site_token');
    await fetch(API_BASE + `/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
  }

  function dismissAll() {
    notifs.filter(n => !n.read).forEach(n => markRead(n.id));
    setOpen(false);
  }

  return (
    <div className="notif-wrapper">
      <button className="notif-bell" onClick={() => setOpen(!open)} title="Notifications">
        🔔{unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unread > 0 && <button className="notif-clear" onClick={dismissAll}>Mark all read</button>}
          </div>
          {notifs.length === 0 ? (
            <p className="notif-empty">No notifications</p>
          ) : (
            <div className="notif-list">
              {notifs.map(n => (
                <div key={n.id} className={`notif-item ${n.read ? 'notif-read' : 'notif-unread'}`} onClick={() => !n.read && markRead(n.id)}>
                  <span className="notif-text">{n.message}</span>
                  <span className="notif-time">{new Date(n.created_at + 'Z').toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
          <Link to="/present-maker" className="nav-link">🎁 {!collapsed && 'Present Maker'}</Link>
          <Link to="/homey" className="nav-link">🏠 {!collapsed && 'Homey'}</Link>
          <Link to="/warrior-cats" className="nav-link">🐱 {!collapsed && 'Warrior Cats'}</Link>
          <Link to="/tomato-hunter" className="nav-link">🍅 {!collapsed && 'Tomato Hunter'}</Link>
          <Link to="/podcasts" className="nav-link">🎙️ {!collapsed && 'Podcasts'}</Link>
        </nav>

        <div className="sidebar-bottom">
          <ThemeToggle />
          {user && !collapsed && (
            <div className="user-info">
              {user.is_admin && <Link to="/admin" className="admin-link">Admin</Link>}
              <NotificationBell />
              <span className="user-name">Hi, {user.username}!</span>
              <button className="logout-btn" onClick={logout}>Log Out</button>
            </div>
          )}
          {user && collapsed && (
            <div className="user-info">
              <NotificationBell />
              <button className="logout-btn" onClick={logout} title="Log Out">👋</button>
            </div>
          )}
          {!user && (
            <div className="user-info">
              <Link to="/login" className="nav-link login-link">🔑 {!collapsed && 'Log In'}</Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Header;
