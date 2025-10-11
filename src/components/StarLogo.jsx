import './StarLogo.css';

function StarLogo() {
  return (
    <svg
      className="star-logo"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="magentaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff00ff" />
          <stop offset="50%" stopColor="#e91e63" />
          <stop offset="100%" stopColor="#9c27b0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon
        points="50,10 61,35 88,35 67,52 75,78 50,62 25,78 33,52 12,35 39,35"
        fill="url(#magentaGradient)"
        filter="url(#glow)"
        className="star-shape"
      />
    </svg>
  );
}

export default StarLogo;
