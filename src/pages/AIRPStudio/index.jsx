import { useState } from 'react';
import Dashboard from './Dashboard';
import CreateCharacter from './CreateCharacter';
import ChatPage from './ChatPage';
import { useAuth } from '../../context/AuthContext';
import './AIRPStudio.css';

export default function AIRPStudio() {
  const { user } = useAuth();
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
    />
  );
}
