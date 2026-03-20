const BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3003/api'
  : 'https://ai-rp-studio.fly.dev/api';

function headers() {
  const token = localStorage.getItem('site_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

export const api = {
  // Auth
  signup: (username, email, password) => request('POST', '/auth/signup', { username, email, password }),
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  me: () => request('GET', '/auth/me'),

  // Characters
  getCharacters: () => request('GET', '/characters'),
  getCharacter: (id) => request('GET', `/characters/${id}`),
  createCharacter: (data) => request('POST', '/characters', data),
  updateCharacter: (id, data) => request('PUT', `/characters/${id}`, data),
  deleteCharacter: (id) => request('DELETE', `/characters/${id}`),
  getSnapshots: (id) => request('GET', `/characters/${id}/snapshots`),
  getMemories: (id) => request('GET', `/characters/${id}/memories`),
  addMemory: (id, content, category) => request('POST', `/characters/${id}/memories`, { content, category }),
  deleteMemory: (id, memoryId) => request('DELETE', `/characters/${id}/memories/${memoryId}`),

  // Sessions
  getSessions: (characterId) => request('GET', `/characters/${characterId}/sessions`),
  createSession: (characterId, title, introText) => request('POST', `/characters/${characterId}/sessions`, { title, intro_text: introText }),
  getSession: (id) => request('GET', `/sessions/${id}`),
  sendMessage: (sessionId, content, style) => request('POST', `/sessions/${sessionId}/messages`, { content, style }),
  getInspirations: (sessionId) => request('POST', `/sessions/${sessionId}/inspirations`),
  updateSession: (id, title) => request('PUT', `/sessions/${id}`, { title }),
  deleteSession: (id) => request('DELETE', `/sessions/${id}`),
};
