import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/sound';

interface BootSequenceProps {
  onComplete: () => void;
}

// Preserved for notification center / desktop greeting utilities in App.tsx
export const getTimeBasedGreeting = () => {
  const now = new Date();
  const hour = now.getHours();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good morning cutie 🌸",
      subtitle: "Hope you have a magical and productive day ahead!",
      tag: "MORNING",
      timeFormatted,
      icon: "🌸",
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good afternoon sunshine ☀️",
      subtitle: "Cruising through the day! Welcome to your digital sanctuary.",
      tag: "AFTERNOON",
      timeFormatted,
      icon: "☀️",
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: "Good evening star gazer ✨",
      subtitle: "Time to unwind, listen to lofi beats, and explore.",
      tag: "EVENING",
      timeFormatted,
      icon: "✨",
    };
  } else {
    return {
      greeting: "Still up? 🌙",
      subtitle: "Burning the midnight oil... nocturnal genius mode activated!",
      tag: "MIDNIGHT",
      timeFormatted,
      icon: "🌙",
    };
  }
};

const checkReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('curio_theme_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.animations === false) return true;
    }
  } catch {}
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
};

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [reducedMotion] = useState<boolean>(() => checkReducedMotion());
  const [phase, setPhase] = useState<'sleeping' | 'stretching' | 'awake'>(() =>
    checkReducedMotion() ? 'awake' : 'sleeping'
  );
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const completedRef = useRef(false);

  const finishBootImmediately = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    sessionStorage.setItem('curio_boot_completed', 'true');
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    // Soft startup chime
    sound.playBootChime();

    // Keyboard shortcut to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finishBootImmediately();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // If animations are off / prefers-reduced-motion:
    // Show Mochi static awake, then transition to desktop after a brief delay
    if (reducedMotion) {
      setProgress(100);
      const timer = setTimeout(() => {
        finishBootImmediately();
      }, 1000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    // Sequence when animations are enabled (~2.6s total):
    // 0.0s - 1.1s: sleeping & breathing
    // 1.1s - 1.9s: stretching & yawning
    // 1.9s - 2.6s: awake (eyes open)
    // 2.6s: fade out to desktop
    const stretchTimer = setTimeout(() => {
      setPhase('stretching');
    }, 1100);

    const awakeTimer = setTimeout(() => {
      setPhase('awake');
    }, 1900);

    // Progress bar ticker (runs over ~2.5s)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 3;
      });
    }, 70);

    const finishTimer = setTimeout(() => {
      finishBootImmediately();
    }, 2650);

    return () => {
      clearTimeout(stretchTimer);
      clearTimeout(awakeTimer);
      clearTimeout(finishTimer);
      clearInterval(progressInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-700 ease-out bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#241335] via-[#120a1c] to-[#07040a] ${
        isFadingOut ? 'opacity-0 scale-[1.02]' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes mochiBreathe {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.035, 0.97) translateY(-1px);
          }
        }
        @keyframes mochiStretchAnim {
          0% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.03, 1.07) translateY(-4px);
          }
          100% {
            transform: scale(1.01, 1.02) translateY(-1px);
          }
        }
        .mochi-breathing {
          animation: mochiBreathe 2s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .mochi-stretching {
          animation: mochiStretchAnim 0.8s ease-in-out forwards;
          transform-origin: bottom center;
        }
      `}</style>

      {/* Centerpiece Container */}
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Mochi Character Container */}
        <div
          className={`relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center transition-transform duration-500 ${
            !reducedMotion && phase === 'sleeping'
              ? 'mochi-breathing'
              : !reducedMotion && phase === 'stretching'
              ? 'mochi-stretching'
              : ''
          }`}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
            {/* Ambient Base Shadow */}
            <ellipse cx="50" cy="86" rx="32" ry="8" fill="rgba(0,0,0,0.4)" />

            {/* ── PHASE 1: ASLEEP (Curled up) ── */}
            {phase === 'sleeping' && (
              <g className="transition-all duration-300">
                {/* Curled Tail wrapped forward */}
                <path
                  d="M26 68 C14 70, 14 83, 30 83 C38 83, 42 78, 42 78"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Curled Body */}
                <ellipse cx="50" cy="66" rx="26" ry="19" fill="#fed7aa" />
                {/* Calico Orange Patch */}
                <path d="M50 49 C60 51, 72 57, 68 74 C60 64, 54 58, 50 49 Z" fill="#fb923c" />
                {/* Calico Dark Patch */}
                <path d="M30 56 C26 63, 28 73, 36 78 C32 70, 31 61, 30 56 Z" fill="#78350f" />

                {/* Tucked Paws */}
                <ellipse cx="44" cy="78" rx="5" ry="3.5" fill="#ffedd5" />
                <ellipse cx="56" cy="78" rx="5" ry="3.5" fill="#ffedd5" />

                {/* Head resting down slightly tilted */}
                <g transform="translate(0, 3) rotate(-3 50 42)">
                  <circle cx="50" cy="42" r="21" fill="#fed7aa" />

                  {/* Ears */}
                  <polygon points="34,30 28,12 44,24" fill="#fb923c" />
                  <polygon points="33,26 30,16 40,24" fill="#fda4af" />
                  <polygon points="66,30 72,12 56,24" fill="#78350f" />
                  <polygon points="67,26 70,16 60,24" fill="#fda4af" />

                  {/* Sleeping curved closed eyes */}
                  <path d="M40 43 Q45 48 50 43" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M54 43 Q59 48 64 43" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Soft Rosy Cheeks */}
                  <circle cx="36" cy="48" r="4" fill="#f472b6" opacity="0.6" />
                  <circle cx="68" cy="48" r="4" fill="#f472b6" opacity="0.6" />

                  {/* Nose & Sweet resting mouth */}
                  <polygon points="50,47 52,50 48,50" fill="#f43f5e" />
                  <path d="M48 52 Q50 54 52 52" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />

                  {/* Whiskers */}
                  <line x1="28" y1="47" x2="38" y2="49" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="26" y1="52" x2="38" y2="52" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="66" y1="49" x2="76" y2="47" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="66" y1="52" x2="78" y2="52" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Red ribbon collar & bell */}
                  <path d="M38 58 Q50 63 64 58" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="51" cy="62" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                </g>
              </g>
            )}

            {/* ── PHASE 2: STRETCHING & YAWNING ── */}
            {phase === 'stretching' && (
              <g className="transition-all duration-300">
                {/* Tail stretched up */}
                <path
                  d="M22 68 C12 58, 10 36, 20 32 C26 30, 28 48, 30 62"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />

                {/* Arched Body */}
                <ellipse cx="50" cy="64" rx="25" ry="21" fill="#fed7aa" />
                {/* Calico Patches */}
                <path d="M50 47 C60 49, 72 55, 68 73 C60 63, 54 56, 50 47 Z" fill="#fb923c" />
                <path d="M30 55 C26 62, 28 72, 36 78 C32 70, 31 60, 30 55 Z" fill="#78350f" />

                {/* Paws stretching forward */}
                <ellipse cx="37" cy="80" rx="7" ry="4" fill="#ffedd5" transform="rotate(-12 37 80)" />
                <ellipse cx="63" cy="80" rx="7" ry="4" fill="#ffedd5" transform="rotate(12 63 80)" />

                {/* Head */}
                <circle cx="50" cy="40" r="21" fill="#fed7aa" />

                {/* Flattened stretch ears */}
                <polygon points="33,31 25,15 43,25" fill="#fb923c" />
                <polygon points="32,27 27,19 39,25" fill="#fda4af" />
                <polygon points="67,31 75,15 57,25" fill="#78350f" />
                <polygon points="68,27 73,19 61,25" fill="#fda4af" />

                {/* Happy curved squint eyes during stretch */}
                <path d="M39 42 Q44 37 49 42" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M55 42 Q60 37 65 42" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />

                {/* Rosy Cheeks */}
                <circle cx="36" cy="47" r="4" fill="#f472b6" opacity="0.6" />
                <circle cx="68" cy="47" r="4" fill="#f472b6" opacity="0.6" />

                {/* Cute Yawn Mouth */}
                <ellipse cx="51" cy="51" rx="3.5" ry="4.5" fill="#e11d48" stroke="#431407" strokeWidth="1.5" />
                <ellipse cx="51" cy="53" rx="2" ry="1.5" fill="#fda4af" />

                {/* Nose */}
                <polygon points="50,45 52,48 48,48" fill="#f43f5e" />

                {/* Whiskers */}
                <line x1="28" y1="46" x2="38" y2="48" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="26" y1="51" x2="38" y2="51" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="66" y1="48" x2="76" y2="46" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="66" y1="51" x2="78" y2="51" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

                {/* Collar */}
                <path d="M38 57 Q50 62 64 57" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                <circle cx="51" cy="61" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              </g>
            )}

            {/* ── PHASE 3: AWAKE (Eyes open, alert & cute) ── */}
            {phase === 'awake' && (
              <g className="transition-all duration-300">
                {/* Happy curved Tail */}
                <path
                  d="M24 68 C10 65, 8 45, 18 42 C24 40, 26 55, 30 64"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                {/* Upright Body */}
                <ellipse cx="50" cy="65" rx="26" ry="20" fill="#fed7aa" />
                {/* Calico Orange Patch */}
                <path d="M50 46 C60 48, 72 54, 68 72 C60 62, 54 55, 50 46 Z" fill="#fb923c" />
                {/* Calico Dark Patch */}
                <path d="M30 55 C26 62, 28 72, 36 78 C32 70, 31 60, 30 55 Z" fill="#78350f" />

                {/* Paws */}
                <ellipse cx="40" cy="80" rx="6" ry="4" fill="#ffedd5" />
                <ellipse cx="60" cy="80" rx="6" ry="4" fill="#ffedd5" />

                {/* Head */}
                <circle cx="50" cy="42" r="21" fill="#fed7aa" />

                {/* Ears */}
                <polygon points="34,30 28,12 44,24" fill="#fb923c" />
                <polygon points="33,26 30,16 40,24" fill="#fda4af" />
                <polygon points="66,30 72,12 56,24" fill="#78350f" />
                <polygon points="67,26 70,16 60,24" fill="#fda4af" />

                {/* Wide Open Sparkly Eyes */}
                <circle cx="43" cy="42" r="4.5" fill="#1e293b" />
                <circle cx="61" cy="42" r="4.5" fill="#1e293b" />
                <circle cx="44.5" cy="40.5" r="1.5" fill="#ffffff" />
                <circle cx="62.5" cy="40.5" r="1.5" fill="#ffffff" />

                {/* Cheeks */}
                <circle cx="36" cy="47" r="4" fill="#f472b6" opacity="0.6" />
                <circle cx="68" cy="47" r="4" fill="#f472b6" opacity="0.6" />

                {/* Nose & Happy Kitty Smile */}
                <polygon points="50,46 52,49 48,49" fill="#f43f5e" />
                <path
                  d="M47 51 Q50 54 52 51 Q55 54 58 51"
                  fill="none"
                  stroke="#431407"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Whiskers */}
                <line x1="28" y1="46" x2="38" y2="48" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="26" y1="51" x2="38" y2="51" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="66" y1="48" x2="76" y2="46" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="66" y1="51" x2="78" y2="51" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

                {/* Collar with Bell */}
                <path d="M38 58 Q50 63 64 58" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                <circle cx="51" cy="62" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              </g>
            )}
          </svg>
        </div>

        {/* Caption: exactly one short line beneath Mochi, lowercase, quiet/muted styling */}
        <p className="text-xs text-slate-400/60 font-sans tracking-widest lowercase select-none">
          waking up...
        </p>

        {/* Minimal Progress Cue: thin, borderless progress line */}
        <div className="w-24 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400/40 via-purple-400/40 to-indigo-400/40 rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Skip affordance: small, unobtrusive, corner-positioned, one word only */}
      <button
        onClick={finishBootImmediately}
        className="fixed bottom-6 right-6 text-xs text-slate-500/40 hover:text-slate-300 transition-colors lowercase cursor-pointer tracking-widest select-none bg-transparent border-0 outline-none p-2"
        aria-label="Skip boot sequence"
      >
        skip
      </button>
    </div>
  );
};
