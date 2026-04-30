import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3003/api/site-auth'
  : 'https://ai-rp-studio.fly.dev/api/site-auth';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = localStorage.getItem('site_token');
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(API_BASE + path, opts);
  } catch {
    throw new Error('Cannot connect to server. Make sure the auth server is running (npm run dev).');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('site_token');
    if (!token) {
      setLoading(false);
      return;
    }
    request('GET', '/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('site_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const data = await request('POST', '/login', { username, password });
    localStorage.setItem('site_token', data.token);
    localStorage.setItem('site_password', password);
    setUser({ username: data.username, email: data.email, is_admin: data.is_admin });
    return data;
  }

  async function signup(username, email, password, is_child, parent_email, birthdate) {
    const data = await request('POST', '/signup', { username, email, password, is_child, parent_email, birthdate });
    if (data.pending_consent) {
      return data;
    }
    localStorage.setItem('site_token', data.token);
    setUser({ username: data.username, email: data.email, is_admin: data.is_admin });
    return data;
  }

  async function deleteAccount() {
    await request('DELETE', '/account');
    localStorage.removeItem('site_token');
    setUser(null);
  }

  function logout() {
    localStorage.removeItem('site_token');
    localStorage.removeItem('site_password');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
