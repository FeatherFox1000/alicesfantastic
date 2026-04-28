import { useState, useEffect } from 'react';
import { api } from './api';
import CreateMultiplayerWorld from './CreateMultiplayerWorld';
import MultiplayerChat from './MultiplayerChat';

export default function MultiplayerTab({ username }) {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('list'); // list | create | game
  const [activeWorldId, setActiveWorldId] = useState(null);

  useEffect(() => {
    loadWorlds();
    const interval = setInterval(loadWorlds, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadWorlds() {
    try {
      const data = await api.mp.getWorlds();
      setWorlds(data);
    } catch {}
    setLoading(false);
  }

  async function handleJoin(worldId) {
    try {
      await api.mp.join(worldId);
      await loadWorlds();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDecline(worldId) {
    try {
      await api.mp.decline(worldId);
      await loadWorlds();
    } catch {}
  }

  if (page === 'create') {
    return (
      <CreateMultiplayerWorld
        username={username}
        onCreated={async (id) => {
          await loadWorlds();
          setActiveWorldId(id);
          setPage('game');
        }}
        onBack={() => setPage('list')}
      />
    );
  }

  if (page === 'game' && activeWorldId) {
    return (
      <MultiplayerChat
        worldId={activeWorldId}
        username={username}
        onBack={() => { setPage('list'); setActiveWorldId(null); loadWorlds(); }}
      />
    );
  }

  const invites = worlds.filter(w => w.my_status === 'invited');
  const active = worlds.filter(w => w.my_status === 'joined' && w.status === 'active');
  const waiting = worlds.filter(w => w.my_status === 'joined' && w.status === 'waiting');

  return (
    <div className="mp-tab">
      <div className="mp-tab-header">
        <div>
          <h2 className="mp-tab-title">👫 Multiplayer</h2>
          <p className="mp-tab-subtitle">Play The Sandbox with your buddies!</p>
        </div>
        <button className="mp-new-btn" onClick={() => setPage('create')}>+ New World</button>
      </div>

      {loading && <p className="mp-loading">Loading worlds...</p>}

      {/* Invites */}
      {invites.length > 0 && (
        <section className="mp-section">
          <h3 className="mp-section-title">🔔 Invites</h3>
          {invites.map(w => (
            <div key={w.id} className="mp-world-card mp-invite-card">
              <div className="mp-world-info">
                <span className="mp-world-emoji">🌍</span>
                <div>
                  <div className="mp-world-name">{w.world_name}</div>
                  <div className="mp-world-host">Hosted by {w.host_username}</div>
                </div>
              </div>
              <div className="mp-card-actions">
                <button className="mp-btn-join" onClick={() => handleJoin(w.id)}>Join!</button>
                <button className="mp-btn-decline" onClick={() => handleDecline(w.id)}>Decline</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Active games */}
      {active.length > 0 && (
        <section className="mp-section">
          <h3 className="mp-section-title">⚔️ Active Games</h3>
          {active.map(w => (
            <div key={w.id} className="mp-world-card" onClick={() => { setActiveWorldId(w.id); setPage('game'); }}>
              <div className="mp-world-info">
                <span className="mp-world-emoji">🌍</span>
                <div>
                  <div className="mp-world-name">{w.world_name}</div>
                  <div className="mp-world-host">Host: {w.host_username}</div>
                  <div className={`mp-turn-indicator ${w.current_turn_username === username ? 'mp-your-turn' : ''}`}>
                    {w.current_turn_username === username ? '⚡ Your turn!' : `${w.current_turn_username}'s turn`}
                  </div>
                </div>
              </div>
              <button className="mp-btn-play">Play →</button>
            </div>
          ))}
        </section>
      )}

      {/* Waiting rooms */}
      {waiting.length > 0 && (
        <section className="mp-section">
          <h3 className="mp-section-title">⏳ Waiting to Start</h3>
          {waiting.map(w => (
            <div key={w.id} className="mp-world-card" onClick={() => { setActiveWorldId(w.id); setPage('game'); }}>
              <div className="mp-world-info">
                <span className="mp-world-emoji">🌍</span>
                <div>
                  <div className="mp-world-name">{w.world_name}</div>
                  <div className="mp-world-host">Host: {w.host_username}</div>
                  <div className="mp-world-status">Waiting for everyone to set up...</div>
                </div>
              </div>
              <button className="mp-btn-play">Open →</button>
            </div>
          ))}
        </section>
      )}

      {!loading && worlds.length === 0 && (
        <div className="mp-empty">
          <div className="mp-empty-icon">🌍</div>
          <p>No multiplayer worlds yet!</p>
          <p>Create one and invite your buddies.</p>
          <button className="mp-new-btn" onClick={() => setPage('create')}>+ Create a World</button>
        </div>
      )}
    </div>
  );
}
