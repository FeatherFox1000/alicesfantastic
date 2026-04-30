import { useState } from 'react';
import { api } from './api';
import './AIRPStudio.css';

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', birthdate: '' });
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
        if (!form.birthdate) { setError('Please enter your date of birth.'); setLoading(false); return; }
        data = await api.signup(form.username, form.email, form.password, form.birthdate);
      }
      localStorage.setItem('site_token', data.token);
      onLogin(data);
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
          <h1>The Sandbox</h1>
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

          {tab === 'signup' && (
            <label>
              Date of Birth
              <input
                type="date"
                value={form.birthdate}
                onChange={e => set('birthdate', e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
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
            {loading ? '✨ Loading...' : tab === 'login' ? '🐾 Enter The Sandbox' : '🌟 Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
