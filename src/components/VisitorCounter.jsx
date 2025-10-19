import { useEffect, useState } from 'react';
import './VisitorCounter.css';

function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // Get current count from localStorage
    let count = parseInt(localStorage.getItem('visitorCount') || '0', 10);

    // Increment count
    count++;

    // Save updated count
    localStorage.setItem('visitorCount', count.toString());
    setVisitorCount(count);
  }, []);

  return (
    <div className="visitor-counter">
      <span className="visitor-icon">👁️</span>
      <span className="visitor-count">{visitorCount.toLocaleString()}</span>
      <span className="visitor-label">visitors</span>
    </div>
  );
}

export default VisitorCounter;
