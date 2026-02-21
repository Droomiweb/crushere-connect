import React from 'react';

interface HumbleMascotProps {
  className?: string;
  status?: 'idle' | 'pulling' | 'threshold' | 'refreshing' | 'success';
}

export function HumbleMascot({ className, status }: HumbleMascotProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_8px_15px_rgba(0,0,0,0.15)]"
        style={{
          animation: status === 'refreshing' ? 'humble-pulse 0.8s ease-in-out infinite' : 'humble-float 3s ease-in-out infinite'
        }}
      >
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--crush))" />
            <stop offset="100%" stopColor="hsl(var(--crush) / 0.8)" />
          </linearGradient>
        </defs>

        {/* Happy Heart Shape */}
        <path
          d="M50,85 C50,85 15,65 15,40 C15,20 35,15 50,30 C65,15 85,20 85,40 C85,65 50,85 50,85 Z"
          fill="url(#heartGradient)"
          className="transition-all duration-500"
        />

        {/* Happy Face */}
        <g className="face-container transition-all duration-500">
          {/* Eyes (Winking on success) */}
          <g style={{ animation: 'humble-blink 4s ease-in-out infinite' }}>
            <circle cx="38" cy="45" r="2.5" fill="white" />
            <circle cx="62" cy="45" r="2.5" fill="white" />
          </g>
          
          {/* Smile */}
          <path
            d="M42,55 Q50,60 58,55"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Success Stars */}
        {status === 'success' && (
          <g className="animate-in fade-in zoom-in duration-500">
            <path d="M20,25 L22,20 L24,25 L29,22 L26,27 L31,30 L25,30 L22,35 L19,30 L13,30 L18,27 L15,22 Z" fill="hsl(var(--match))" />
            <path d="M80,35 L82,30 L84,35 L89,32 L86,37 L91,40 L85,40 L82,45 L79,40 L73,40 L78,37 L75,32 Z" fill="hsl(var(--match))" className="delay-100" />
          </g>
        )}
      </svg>

      <style>{`
        @keyframes humble-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes humble-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes humble-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
      `}</style>
    </div>
  );
}
