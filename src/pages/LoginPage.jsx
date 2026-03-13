import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, signup } = useAuth();
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
      if (tab === 'login') {
        await login(form.username, form.password);
      } else {
        await signup(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/images/logo.png" alt="Alice's Fantastic" className="login-logo-img" />
          <p className="login-tagline">Sign in to play!</p>
        </div>

        <div className="login-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Login</button>
          <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Sign Up</button>
        </div>

        <form onSubmit={submit} className="login-form">
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

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Loading...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
