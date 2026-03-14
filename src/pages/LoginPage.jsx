import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', parent_email: '' });
  const [ageGroup, setAgeGroup] = useState(null); // null = not answered, 'under13', '13plus'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingConsent, setPendingConsent] = useState(null);
  const [waitingApproval, setWaitingApproval] = useState(false);

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
        try {
          await login(form.username, form.password);
        } catch (err) {
          if (err.message.includes('waiting for parent') || err.message.includes('guardian approval')) {
            setWaitingApproval(true);
            setLoading(false);
            return;
          }
          throw err;
        }
      } else {
        if (!ageGroup) {
          setError('Please select your age group first.');
          setLoading(false);
          return;
        }
        const is_child = ageGroup === 'under13';
        const data = await signup(form.username, form.email, form.password, is_child, is_child ? form.parent_email : undefined);
        if (data.pending_consent) {
          setPendingConsent(data);
          return;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (pendingConsent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <img src="/images/logo.png" alt="Alice's Fantastic" className="login-logo-img" />
          </div>
          <div className="consent-pending">
            <h2>Almost there!</h2>
            <p>Your account <strong>{pendingConsent.username}</strong> has been created, but since you're under 13, a parent or guardian needs to approve it first.</p>
            <p>Please ask your parent or guardian to visit this link to approve your account:</p>
            <div className="consent-link-box">
              <code>{window.location.origin + '/consent/' + pendingConsent.consent_token}</code>
            </div>
            <p className="consent-note">Once approved, you'll be able to log in!</p>
            <button className="login-btn" onClick={() => { setPendingConsent(null); setTab('login'); }}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {waitingApproval && (
        <div className="popup-overlay" onClick={() => setWaitingApproval(false)}>
          <div className="popup-card" onClick={e => e.stopPropagation()}>
            <h2>Waiting for Approval</h2>
            <p>Your account is waiting to be approved by a parent/guardian.</p>
            <p>Please ask your parent or guardian to check the consent link that was shared when you signed up.</p>
            <p className="popup-hint">Once they approve, you'll be able to log in!</p>
            <button className="login-btn" onClick={() => setWaitingApproval(false)}>OK</button>
          </div>
        </div>
      )}

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
          {tab === 'signup' && !ageGroup && (
            <div className="age-gate">
              <p className="age-gate-label">How old are you?</p>
              <div className="age-gate-buttons">
                <button type="button" className="age-btn" onClick={() => setAgeGroup('under13')}>Under 13</button>
                <button type="button" className="age-btn" onClick={() => setAgeGroup('13plus')}>13 or older</button>
              </div>
            </div>
          )}

          {(tab === 'login' || ageGroup) && (
            <>
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

              {tab === 'signup' && ageGroup === 'under13' && (
                <label>
                  Parent/Guardian Email
                  <input
                    type="email"
                    value={form.parent_email}
                    onChange={e => set('parent_email', e.target.value)}
                    placeholder="Your parent's email"
                    required
                  />
                  <span className="field-hint">Required for users under 13. Your parent will need to approve your account.</span>
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

              {tab === 'signup' && (
                <p className="privacy-notice">
                  By signing up, you agree to our <Link to="/privacy">Privacy Policy</Link>.
                  {ageGroup === 'under13' && ' A parent or guardian must approve this account before you can log in.'}
                </p>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Loading...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              {tab === 'signup' && ageGroup && (
                <button type="button" className="age-reset" onClick={() => setAgeGroup(null)}>
                  Change age group
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
