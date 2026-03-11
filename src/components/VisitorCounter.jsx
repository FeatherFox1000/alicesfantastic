import { useEffect, useRef, useState } from 'react';
import './VisitorCounter.css';

function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Generate or get session ID (persists for this browser session)
    let sessionId = sessionStorage.getItem('visitorSessionId');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitorSessionId', sessionId);
    }

    // Fetch current count and increment if new visitor
    const trackVisitor = async () => {
      try {
        // Try to increment (server will only count once per session per 24h)
        const incrementResponse = await fetch('http://localhost:3001/api/visitors/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (incrementResponse.ok) {
          const data = await incrementResponse.json();
          setVisitorCount(data.count);
        } else {
          // Fallback: just get the count without incrementing
          const getResponse = await fetch('http://localhost:3001/api/visitors');
          if (getResponse.ok) {
            const data = await getResponse.json();
            setVisitorCount(data.count);
          }
        }
      } catch (error) {
        console.error('Error tracking visitor:', error);
        // Fallback to localStorage for offline mode
        let count = parseInt(localStorage.getItem('visitorCount') || '0', 10);
        count++;
        localStorage.setItem('visitorCount', count.toString());
        setVisitorCount(count);
      } finally {
        setLoading(false);
      }
    };

    trackVisitor();
  }, []);

  if (loading) {
    return (
      <div className="visitor-counter">
        <span className="visitor-icon">👁️</span>
        <span className="visitor-count">...</span>
      </div>
    );
  }

  return (
    <div className="visitor-counter">
      <span className="visitor-icon">👁️</span>
      <span className="visitor-count">{visitorCount.toLocaleString()}</span>
      <span className="visitor-label">visitors</span>
    </div>
  );
}

export default VisitorCounter;
