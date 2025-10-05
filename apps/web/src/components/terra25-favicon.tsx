export function Terra25Favicon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle with gradient border */}
      <defs>
        <linearGradient id="faviconBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="faviconTextGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <radialGradient id="faviconBackgroundGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
      </defs>
      
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#faviconBackgroundGradient)"
        stroke="url(#faviconBorderGradient)"
        strokeWidth="2"
      />
      
      {/* T25 Text - Simplified for favicon */}
      <g transform="translate(50, 50)">
        {/* Letter T */}
        <path
          d="M-20 -8 L20 -8 L20 -4 L4 -4 L4 16 L-4 16 L-4 -4 L-20 -4 Z"
          fill="url(#faviconTextGradient)"
        />
        
        {/* Number 25 */}
        <text
          x="0"
          y="20"
          textAnchor="middle"
          fill="url(#faviconTextGradient)"
          fontSize="16"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          25
        </text>
      </g>
    </svg>
  );
}