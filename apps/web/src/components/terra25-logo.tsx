interface Terra25LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function Terra25Logo({ size = 32, className = "", animated = false }: Terra25LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${animated ? 'transition-all duration-300 hover:scale-110' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle with gradient border */}
      <defs>
        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
        {animated && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
      </defs>
      
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#backgroundGradient)"
        stroke="url(#borderGradient)"
        strokeWidth="2"
        filter={animated ? "url(#glow)" : undefined}
      />
      
      {/* T25 Text */}
      <g transform="translate(50, 50)">
        {/* Letter T */}
        <path
          d="M-28 -12 L-18 -12 L-18 -8 L-10 -8 L-10 -12 L0 -12 L0 -8 L-4 -8 L-4 12 L-10 12 L-10 -8 L-18 -8 L-18 12 L-24 12 L-24 -8 L-28 -8 Z"
          fill="url(#textGradient)"
        />
        
        {/* Number 2 */}
        <path
          d="M4 -12 L16 -12 C19 -12 21 -10 21 -7 C21 -4 19 -2 16 -2 L12 -2 L21 12 L14 12 L8 -2 L4 -2 Z M4 -8 L15 -8 C16 -8 17 -7.5 17 -7 C17 -6.5 16 -6 15 -6 L4 -6 Z"
          fill="url(#textGradient)"
        />
        
        {/* Number 5 */}
        <path
          d="M25 -12 L37 -12 L37 -8 L29 -8 L29 -2 L35 -2 C38 -2 40 0 40 3 C40 6 38 8 35 8 L25 8 L25 4 L35 4 C36 4 36 3.5 36 3 C36 2.5 36 2 35 2 L25 2 Z"
          fill="url(#textGradient)"
        />
      </g>
      
      {/* Orbital ring accent */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#borderGradient)"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="4 8"
        className={animated ? 'animate-spin' : ''}
        style={animated ? { animationDuration: '20s' } : {}}
      />
      
      {/* Small accent dots */}
      <circle cx="85" cy="75" r="1.5" fill="#60A5FA" opacity="0.8" />
      <circle cx="15" cy="25" r="1" fill="#3B82F6" opacity="0.6" />
    </svg>
  );
}