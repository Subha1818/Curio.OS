import React from 'react';
import { useAnimationsEnabled } from '../../utils/useAnimations';

interface LetterBoxIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const LetterBoxIcon: React.FC<LetterBoxIconProps> = ({
  className = 'w-8 h-8',
  animated = true,
}) => {
  const animationsEnabled = useAnimationsEnabled();
  const shouldAnimate = animated && animationsEnabled;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        shouldAnimate ? 'animate-bounce-subtle' : ''
      }`}
      style={{
        filter: 'drop-shadow(0 4px 10px rgba(244, 114, 182, 0.35))',
      }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="mailboxGrad" x1="6" y1="12" x2="42" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="brainGrad" x1="16" y1="6" x2="32" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>

          <linearGradient id="envelopeGrad" x1="16" y1="10" x2="32" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3e8ff" />
          </linearGradient>

          <linearGradient id="flagGrad" x1="36" y1="12" x2="44" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Ambient sparkle glow */}
        <circle cx="24" cy="24" r="20" fill="url(#mailboxGrad)" opacity="0.15" />

        {/* Mailbox stand / pedestal */}
        <rect x="22" y="38" width="4" height="7" rx="2" fill="#475569" />
        <ellipse cx="24" cy="45" rx="9" ry="2" fill="#334155" />

        {/* Mailbox Chamber (Curved dome top + body) */}
        <path
          d="M10 22 C10 14 16 10 24 10 C32 10 38 14 38 22 L38 36 C38 37.5 36.5 39 35 39 L13 39 C11.5 39 10 37.5 10 36 Z"
          fill="url(#mailboxGrad)"
          stroke="#fbcfe8"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* Mailbox interior slot / opening */}
        <path
          d="M14 23 C14 18 18 15 24 15 C30 15 34 18 34 23 L34 29 C34 30.5 32.5 31.5 31 31.5 L17 31.5 C15.5 31.5 14 30.5 14 29 Z"
          fill="#1e1b4b"
          opacity="0.85"
        />

        {/* Brain Letter peeking out */}
        <g className={shouldAnimate ? 'animate-wiggle-subtle' : ''}>
          {/* Cute envelope base */}
          <path
            d="M16 19 L24 24 L32 19 L32 28 C32 29 31 30 30 30 L18 30 C17 30 16 29 16 28 Z"
            fill="url(#envelopeGrad)"
            stroke="#c084fc"
            strokeWidth="0.8"
          />
          {/* Envelope fold line */}
          <path d="M16 19 L24 24 L32 19" stroke="#cbd5e1" strokeWidth="0.8" fill="none" />

          {/* Tiny Brain peeking on top of the letter */}
          <path
            d="M19 15 C17 15 16 13 17.5 11 C18 9 21 8.5 22 10.5 C22.8 9 25.2 9 26 10.5 C27 8.5 30 9 30.5 11 C32 13 31 15 29 15 C29 17 27 18 24 18 C21 18 19 17 19 15 Z"
            fill="url(#brainGrad)"
            stroke="#fdf2f8"
            strokeWidth="0.8"
          />
          {/* Brain folds/sulci */}
          <path d="M24 10.5 L24 17" stroke="#fbcfe8" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M21 13 C22 14 22.5 13 22.5 14.5" stroke="#fbcfe8" strokeWidth="0.6" strokeLinecap="round" fill="none" />
          <path d="M27 13 C26 14 25.5 13 25.5 14.5" stroke="#fbcfe8" strokeWidth="0.6" strokeLinecap="round" fill="none" />
        </g>

        {/* Mailbox Red Flag (raised with joy) */}
        <path d="M38 27 L43 27 L43 17 L39.5 19 L38 18 Z" fill="url(#flagGrad)" />
        <rect x="37" y="25" width="2" height="9" rx="1" fill="#cbd5e1" />

        {/* Sparkles ✨ */}
        <path
          d="M8 12 L9 9 L12 8 L9 7 L8 4 L7 7 L4 8 L7 9 Z"
          fill="#fef08a"
          opacity={shouldAnimate ? '0.9' : '0.6'}
        />
        <circle cx="41" cy="9" r="1.2" fill="#fbcfe8" />
        <path
          d="M39 36 L40 34.5 L41.5 34 L40 33.5 L39 32 L38.5 33.5 L37 34 L38.5 34.5 Z"
          fill="#a7f3d0"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
