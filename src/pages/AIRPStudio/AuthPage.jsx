import { useState } from 'react';
import { api } from './api';
import './AIRPStudio.css';

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let data;
      if (tab === 'login') {
        data = await api.login(form.username, form.password);
      } else {
        data = await api.signup(form.username, form.email, form.password);
      }
      localStorage.setItem('airp_token', data.token);
      onLogin(data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="airp-auth-page">
      <div className="airp-auth-card">
        <div className="airp-logo">
          <span className="airp-logo-icon">🐾</span>
          <h1>AI RP Studio</h1>
          <p className="airp-tagline">Create your world. Tell your story.</p>
        </div>

        <div className="airp-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Login</button>
          <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Sign Up</button>
        </div>

        <form onSubmit={submit} className="airp-form">
          <label>
            Username
            <input
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              placeholder="Your username"
              required
              autoComplete="username"
            />
          </label>

          {tab === 'signup' && (
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </label>
          )}

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="airp-error">{error}</p>}

          <button type="submit" className="airp-btn-primary" disabled={loading}>
            {loading ? '✨ Loading...' : tab === 'login' ? '🐾 Enter the Studio' : '🌟 Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
