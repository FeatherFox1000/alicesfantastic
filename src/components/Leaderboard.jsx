import { useEffect, useState } from 'react';
import { API_BASE } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

export default function Leaderboard({ game, title }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  function fetchScores() {
    setLoading(true);
    fetch(API_BASE + '/scores/' + game)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setScores(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchScores();
    // Refresh when a score is submitted (listen for postMessage)
    function onMessage(e) {
      if (e.data?.type === 'gameScore' && e.data.game === game) {
        setTimeout(fetchScores, 1000); // wait for backend to save
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [game]);

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3>{title || 'Leaderboard'}</h3>
        <button className="leaderboard-refresh" onClick={fetchScores} title="Refresh">
          &#x21bb;
        </button>
      </div>
      {loading ? (
        <p className="leaderboard-loading">Loading scores...</p>
      ) : scores.length === 0 ? (
        <p className="leaderboard-empty">No scores yet. Be the first!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i} className={user && s.username === user.username ? 'leaderboard-you' : ''}>
                <td className="leaderboard-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td>{s.username}</td>
                <td className="leaderboard-score">{s.score.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
