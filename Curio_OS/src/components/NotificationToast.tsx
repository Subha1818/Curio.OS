import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

export interface NotificationToastData {
  id: string;
  emoji?: string;
  icon?: React.ReactNode;
  title?: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  autoDismissMs?: number;
}

type CompanionType = 'cat' | 'ghost' | 'robot';

export const NotificationToast: React.FC<NotificationToastData> = ({
  emoji,
  icon,
  title = 'Curio.OS',
  message,
  actionButton,
  onDismiss,
  autoDismissMs = 7000,
}) => {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const [companionType, setCompanionType] = useState<CompanionType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curio_companion_type');
      if (saved === 'cat' || saved === 'ghost' || saved === 'robot') return saved;
    }
    return 'cat';
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingTimeRef = useRef(autoDismissMs);
  const startTimeRef = useRef(Date.now());

  // Listen to companion changes from DesktopCompanion
  useEffect(() => {
    const handleCompanionChange = () => {
      const saved = localStorage.getItem('curio_companion_type');
      if (saved === 'cat' || saved === 'ghost' || saved === 'robot') {
        setCompanionType(saved);
      }
    };
    window.addEventListener('curio_companion_changed', handleCompanionChange);
    return () => {
      window.removeEventListener('curio_companion_changed', handleCompanionChange);
    };
  }, []);

  // Animate in on mount & play notification sound
  useEffect(() => {
    sound.playNotification();
    const animTimer = setTimeout(() => setVisible(true), 40);

    return () => {
      clearTimeout(animTimer);
    };
  }, []);

  // Progress bar & auto-dismiss handling with pause on hover
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    if (isHovered) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const currentRemaining = remainingTimeRef.current;

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, currentRemaining);

    const stepMs = 50;
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const timeLeft = Math.max(0, currentRemaining - elapsed);
      remainingTimeRef.current = timeLeft;
      setProgress((timeLeft / autoDismissMs) * 100);

      if (timeLeft <= 0) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, stepMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isHovered, autoDismissMs]);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 450); // Matches retract animation duration
  };

  const handleAction = () => {
    sound.playClick();
    if (actionButton) {
      actionButton.onClick();
    }
    handleDismiss();
  };

  // Header title based on companion
  const deliveryTitle =
    companionType === 'cat'
      ? 'Mochi Air Mail'
      : companionType === 'ghost'
      ? 'Spooky Post'
      : 'Byte Dispatch';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 right-4 sm:right-10 md:right-16 z-[250] pointer-events-auto select-none max-w-sm w-[92vw] sm:w-[400px] transition-transform ${
        !visible
          ? '-translate-y-[140%] opacity-0'
          : isExiting
          ? 'animate-mochi-retract'
          : 'animate-mochi-drop'
      }`}
      style={{ transformOrigin: 'top center' }}
    >
      {/* Pendulum sway wrapper */}
      <div className={visible && !isExiting ? 'animate-mochi-sway' : ''} style={{ transformOrigin: 'top center' }}>
        {/* Dual Hanging Ribbons / Cords from Top Edge - Centered directly to companion */}
        <div className="w-full flex justify-center gap-10 relative pointer-events-none">
          {/* Left Rope */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-8 sm:h-9 bg-gradient-to-b from-pink-400 via-rose-400 to-pink-500 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-300 shadow-[0_0_6px_rgba(244,114,182,1)] -mt-0.5" />
          </div>

          {/* Right Rope */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-8 sm:h-9 bg-gradient-to-b from-pink-400 via-rose-400 to-pink-500 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-300 shadow-[0_0_6px_rgba(244,114,182,1)] -mt-0.5" />
          </div>
        </div>

        {/* Hanging Companion Sprite */}
        <div className="relative flex justify-center items-end -mt-1 z-20 pointer-events-none">
          {companionType === 'cat' && (
            <div className="relative w-24 h-16 flex items-end justify-center filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]">
              <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
                {/* Wagging Tail peeking behind */}
                <path
                  d="M18 50 C6 44, 4 28, 14 24 C20 22, 22 36, 26 46"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="animate-mochi-tail"
                />

                {/* Calico Cat Head & upper body */}
                <ellipse cx="50" cy="54" rx="28" ry="22" fill="#fed7aa" />
                {/* Orange Patch */}
                <path d="M54 36 C65 38, 74 44, 72 60 C64 52, 58 45, 54 36 Z" fill="#fb923c" />
                {/* Dark Brown Patch */}
                <path d="M28 42 C24 48, 25 56, 32 60 C29 54, 28 46, 28 42 Z" fill="#78350f" />

                {/* Ears with twitch */}
                <g className="animate-mochi-ear">
                  <polygon points="32,32 25,12 43,24" fill="#fb923c" />
                  <polygon points="32,27 28,16 39,24" fill="#fda4af" />
                  <polygon points="68,32 75,12 57,24" fill="#78350f" />
                  <polygon points="68,27 72,16 61,24" fill="#fda4af" />
                </g>

                {/* Eyes - Happy & Sparkly */}
                <circle cx="42" cy="45" r="4.5" fill="#1e293b" />
                <circle cx="58" cy="45" r="4.5" fill="#1e293b" />
                {/* Eye Sparkles */}
                <circle cx="43.5" cy="43.5" r="1.5" fill="#ffffff" />
                <circle cx="59.5" cy="43.5" r="1.5" fill="#ffffff" />
                <circle cx="40.5" cy="46.5" r="0.8" fill="#ffffff" />
                <circle cx="56.5" cy="46.5" r="0.8" fill="#ffffff" />

                {/* Pink Blush Cheeks */}
                <circle cx="34" cy="51" r="4.5" fill="#f472b6" opacity="0.65" />
                <circle cx="66" cy="51" r="4.5" fill="#f472b6" opacity="0.65" />

                {/* Cute Nose & Mouth */}
                <polygon points="50,49 52,52 48,52" fill="#f43f5e" />
                <path d="M47 54 Q50 57 52 54 Q55 57 58 54" fill="none" stroke="#431407" strokeWidth="2" strokeLinecap="round" />

                {/* Whiskers */}
                <line x1="24" y1="48" x2="35" y2="50" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="22" y1="53" x2="35" y2="53" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="65" y1="50" x2="76" y2="48" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="65" y1="53" x2="78" y2="53" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

                {/* Collar with Bell */}
                <path d="M37 62 Q50 67 63 62" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                <g className="animate-mochi-bell">
                  <circle cx="50" cy="67" r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                  <circle cx="50" cy="68" r="1" fill="#713f12" />
                </g>

                {/* Paws grasping the top edge of the card */}
                <ellipse cx="33" cy="74" rx="7.5" ry="5.5" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1.5" />
                <ellipse cx="67" cy="74" rx="7.5" ry="5.5" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1.5" />
                {/* Paw beans */}
                <circle cx="33" cy="74" r="2" fill="#fda4af" opacity="0.6" />
                <circle cx="67" cy="74" r="2" fill="#fda4af" opacity="0.6" />
              </svg>
            </div>
          )}

          {companionType === 'ghost' && (
            <div className="relative w-20 h-16 flex items-end justify-center filter drop-shadow-[0_0_15px_rgba(192,132,252,0.6)]">
              <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
                {/* Ghost body */}
                <path
                  d="M28 50 C28 26, 72 26, 72 50 C72 68, 66 74, 62 68 C58 62, 54 71, 50 67 C46 63, 42 72, 38 68 C35 73, 28 68, 28 50 Z"
                  fill="url(#mochiGhostGrad)"
                />
                <defs>
                  <linearGradient id="mochiGhostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f3e8ff" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
                {/* Eyes */}
                <circle cx="42" cy="42" r="4" fill="#3b0764" />
                <circle cx="58" cy="42" r="4" fill="#3b0764" />
                <circle cx="43.5" cy="40.5" r="1.5" fill="#ffffff" />
                <circle cx="59.5" cy="40.5" r="1.5" fill="#ffffff" />
                {/* Blush */}
                <circle cx="36" cy="47" r="3.5" fill="#f472b6" opacity="0.6" />
                <circle cx="64" cy="47" r="3.5" fill="#f472b6" opacity="0.6" />
                {/* Cute Open Mouth */}
                <ellipse cx="50" cy="48" rx="2.5" ry="3.5" fill="#3b0764" />
                {/* Little ghost hands holding the card rim */}
                <ellipse cx="32" cy="70" rx="6" ry="4.5" fill="#f3e8ff" />
                <ellipse cx="68" cy="70" rx="6" ry="4.5" fill="#f3e8ff" />
              </svg>
            </div>
          )}

          {companionType === 'robot' && (
            <div className="relative w-20 h-16 flex items-end justify-center filter drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
                {/* Antenna */}
                <line x1="50" y1="26" x2="50" y2="14" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="50" cy="12" r="3.5" fill="#ec4899" className="animate-pulse" />
                {/* Head */}
                <rect x="30" y="26" width="40" height="30" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                {/* Screen */}
                <rect x="36" y="34" width="28" height="14" rx="4" fill="#0f172a" />
                <circle cx="43" cy="41" r="3" fill="#38bdf8" className="animate-pulse" />
                <circle cx="57" cy="41" r="3" fill="#38bdf8" className="animate-pulse" />
                {/* Metallic Hands holding top rim */}
                <rect x="28" y="66" width="10" height="7" rx="3" fill="#64748b" stroke="#38bdf8" strokeWidth="1" />
                <rect x="62" y="66" width="10" height="7" rx="3" fill="#64748b" stroke="#38bdf8" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>

        {/* The Hanging Card / Delivery Letter */}
        <div className="relative -mt-2 rounded-2xl bg-[#12081C]/95 border border-pink-500/30 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(244,114,182,0.22)] overflow-hidden">
          {/* Postal / Envelope Header Strip */}
          <div className="px-3.5 pt-2.5 pb-1.5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold tracking-wider text-pink-300/90 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-pink-400" />
                {deliveryTitle}
              </span>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                handleDismiss();
              }}
              className="text-slate-400 hover:text-pink-300 transition-colors p-1 cursor-pointer rounded-lg hover:bg-white/10"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main Card Body */}
          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            {/* Stamp-style Icon / Emoji Frame */}
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-400/30 flex items-center justify-center text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              {emoji ? <span>{emoji}</span> : icon}
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider font-mono truncate">
                  {title}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {message}
              </p>

              {/* Action Button */}
              {actionButton && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleAction}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(244,114,182,0.35)] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
                  >
                    <span>{actionButton.label}</span>
                    <Sparkles className="w-3 h-3 text-pink-200" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Dismiss Progress Bar */}
          {autoDismissMs > 0 && (
            <div className="w-full h-1 bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-[width] duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Tiny Hanging Charm at the Bottom */}
        <div className="flex flex-col items-center pointer-events-none -mt-0.5">
          <div className="w-0.5 h-3 bg-pink-400/60" />
          <div className="text-xs filter drop-shadow-[0_0_6px_rgba(244,114,182,0.8)] animate-pulse">
            ✨
          </div>
        </div>
      </div>
    </div>
  );
};
