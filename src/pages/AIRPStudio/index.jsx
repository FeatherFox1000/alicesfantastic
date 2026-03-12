import { useState, useEffect } from 'react';
import { api } from './api';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import CreateCharacter from './CreateCharacter';
import ChatPage from './ChatPage';
import './AIRPStudio.css';

export default function AIRPStudio() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard'); // dashboard | create | edit | chat
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('airp_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('airp_token'))
      .finally(() => setLoading(false));
  }, []);

  function handleLogin(data) {
    setUser({ username: data.username || data, email: data.email });
    setPage('dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('airp_token');
    localStorage.removeItem('airp_password');
    setUser(null);
    setPage('dashboard');
    setSelectedCharacter(null);
  }

  function handleSelectCharacter(character) {
    setSelectedCharacter(character);
    setPage('chat');
  }

  function handleCreateCharacter() {
    setPage('create');
  }

  function handleEditCharacter(character) {
    setEditingCharacter(character);
    setPage('edit');
  }

  function handleCreated(character) {
    setSelectedCharacter(character);
    setEditingCharacter(null);
    setPage('chat');
  }

  function handleEditSaved(character) {
    setSelectedCharacter(character);
    setEditingCharacter(null);
    // Return to wherever they came from
    setPage(selectedCharacter ? 'chat' : 'dashboard');
  }

  if (loading) {
    return (
      <div className="airp-loading-screen">
        <div className="airp-loading-icon">🐾</div>
        <p>Loading The Sandbox...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (page === 'chat' && selectedCharacter) {
    return (
      <ChatPage
        character={selectedCharacter}
        onBack={() => setPage('dashboard')}
        onEditCharacter={handleEditCharacter}
      />
    );
  }

  if (page === 'edit' && editingCharacter) {
    return (
      <CreateCharacter
        character={editingCharacter}
        onCreated={handleEditSaved}
        onBack={() => setPage(selectedCharacter ? 'chat' : 'dashboard')}
      />
    );
  }

  if (page === 'create') {
    return (
      <CreateCharacter
        onCreated={handleCreated}
        onBack={() => setPage('dashboard')}
      />
    );
  }

  return (
    <Dashboard
      username={user.username}
      email={user.email}
      onSelectCharacter={handleSelectCharacter}
      onCreateCharacter={handleCreateCharacter}
      onEditCharacter={handleEditCharacter}
      onLogout={handleLogout}
    />
  );
}
