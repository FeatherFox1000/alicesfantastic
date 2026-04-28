import { useState } from 'react';
import Dashboard from './Dashboard';
import CreateCharacter from './CreateCharacter';
import ChatPage from './ChatPage';
import MultiplayerTab from './MultiplayerTab';
import { useAuth } from '../../context/AuthContext';
import './AIRPStudio.css';

export default function AIRPStudio() {
  const { user } = useAuth();
  const [tab, setTab] = useState('solo'); // solo | multiplayer
  const [page, setPage] = useState('dashboard'); // dashboard | create | edit | chat
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);

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
    setPage(selectedCharacter ? 'chat' : 'dashboard');
  }

  if (!user) {
    return (
      <div className="ai-rp-studio" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1>The Sandbox</h1>
        <p>You need to log in to use The Sandbox.</p>
        <a href="/login" style={{ color: '#7b14c9', fontWeight: 'bold', fontSize: '1.2rem' }}>Log In</a>
      </div>
    );
  }

  // Solo chat and create/edit pages don't show the tab bar
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
    <div className="ai-rp-studio">
      {/* Tab bar */}
      <div className="sandbox-tabs">
        <button
          className={`sandbox-tab ${tab === 'solo' ? 'sandbox-tab-active' : ''}`}
          onClick={() => setTab('solo')}
        >
          🐾 Solo
        </button>
        <button
          className={`sandbox-tab ${tab === 'multiplayer' ? 'sandbox-tab-active' : ''}`}
          onClick={() => setTab('multiplayer')}
        >
          👫 Multiplayer
        </button>
      </div>

      {tab === 'solo' ? (
        <Dashboard
          username={user.username}
          email={user.email}
          onSelectCharacter={handleSelectCharacter}
          onCreateCharacter={handleCreateCharacter}
          onEditCharacter={handleEditCharacter}
        />
      ) : (
        <MultiplayerTab username={user.username} />
      )}
    </div>
  );
}
