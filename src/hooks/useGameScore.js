import { useEffect, useState } from 'react';
import { API_BASE } from '../context/AuthContext';

export function useGameScore(gameName) {
  const [lastScore, setLastScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === 'gameScore' && e.data.game === gameName) {
        setLastScore(e.data.score);
        setSubmitted(false);
        const token = localStorage.getItem('site_token');
        if (token) {
          fetch(API_BASE + '/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ game: gameName, score: e.data.score }),
          }).then(() => setSubmitted(true)).catch(() => {});
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [gameName]);

  return { lastScore, submitted };
}
