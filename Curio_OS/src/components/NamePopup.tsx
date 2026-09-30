import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LetterBoxIcon } from './icons/LetterBoxIcon';
import { setNickname, setAskedName, hasAskedName, getNickname } from '../utils/identity';
import { sound } from '../utils/sound';

interface NamePopupProps {
  onDismissForSession: () => void;
  onStayAnonymous: () => void;
  onNameSet?: (name: string) => void;
  forceShow?: boolean;
  reason?: 'post' | 'general';
}

export const NamePopup: React.FC<NamePopupProps> = ({
  onDismissForSession,
  onStayAnonymous,
  onNameSet,
  forceShow = false,
  reason = 'general',
}) => {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Animate in on mount
  useEffect(() => {
    // Only skip if not forced AND already asked or already have name
    if (!forceShow && (hasAskedName() || getNickname())) {
      onDismissForSession();
      return;
    }

    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [onDismissForSession, forceShow]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAnonymous();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const animateOut = (then: () => void) => {
    setIsExiting(true);
    setTimeout(then, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;

    sound.playClick();
    setNickname(cleanName);
    setAskedName();
    onNameSet?.(cleanName);
    animateOut(onDismissForSession);
  };

  const handleAnonymous = () => {
    sound.playClick();
    setAskedName();
    animateOut(() => {
      onStayAnonymous();
      onDismissForSession();
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 pointer-events-auto ${
          visible && !isExiting ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleAnonymous}
      />

      {/* Modal Card */}
      <div
        className={`relative z-[301] max-w-sm w-full pointer-events-auto transition-all duration-300 ease-out select-none ${
          visible && !isExiting
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-6 opacity-0 scale-95'
        }`}
      >
        {/* Mochi mascot peeking over the top right corner */}
        <div className="absolute -top-9 right-8 z-20 pointer-events-none select-none">
          <div className="relative w-18 h-12 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
            <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
              {/* Wagging Tail */}
              <path
                d="M18 50 C6 44, 4 28, 14 24 C20 22, 22 36, 26 46"
                fill="none"
                stroke="#fb923c"
                strokeWidth="6"
                strokeLinecap="round"
                className="animate-mochi-tail"
              />
              {/* Calico Cat Head */}
              <ellipse cx="50" cy="54" rx="28" ry="22" fill="#fed7aa" />
              {/* Patches */}
              <path d="M54 36 C65 38, 74 44, 72 60 C64 52, 58 45, 54 36 Z" fill="#fb923c" />
              <path d="M28 42 C24 48, 25 56, 32 60 C29 54, 28 46, 28 42 Z" fill="#78350f" />
              {/* Ears */}
              <g className="animate-mochi-ear">
                <polygon points="32,32 25,12 43,24" fill="#fb923c" />
                <polygon points="32,27 28,16 39,24" fill="#fda4af" />
                <polygon points="68,32 75,12 57,24" fill="#78350f" />
                <polygon points="68,27 72,16 61,24" fill="#fda4af" />
              </g>
              {/* Eyes */}
              <circle cx="42" cy="45" r="4.5" fill="#1e293b" />
              <circle cx="58" cy="45" r="4.5" fill="#1e293b" />
              <circle cx="43.5" cy="43.5" r="1.5" fill="#ffffff" />
              <circle cx="59.5" cy="43.5" r="1.5" fill="#ffffff" />
              {/* Cheeks */}
              <circle cx="34" cy="51" r="4.5" fill="#f472b6" opacity="0.65" />
              <circle cx="66" cy="51" r="4.5" fill="#f472b6" opacity="0.65" />
              {/* Cute nose & mouth */}
              <polygon points="50,49 52,52 48,52" fill="#f43f5e" />
              <path
                d="M47 54 Q50 57 52 54 Q55 57 58 54"
                fill="none"
                stroke="#431407"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Whiskers */}
              <line x1="24" y1="48" x2="35" y2="50" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="22" y1="53" x2="35" y2="53" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="65" y1="50" x2="76" y2="48" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="65" y1="53" x2="78" y2="53" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
              {/* Paws holding onto the top edge */}
              <ellipse cx="33" cy="74" rx="7.5" ry="5.5" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1.5" />
              <ellipse cx="67" cy="74" rx="7.5" ry="5.5" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1.5" />
              <circle cx="33" cy="74" r="2" fill="#fda4af" opacity="0.6" />
              <circle cx="67" cy="74" r="2" fill="#fda4af" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Card Body */}
        <div className="w-full rounded-3xl bg-[#1C1128]/95 backdrop-blur-2xl border border-purple-500/20 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(192,132,252,0.12)] p-6 sm:p-7 relative overflow-hidden font-sans">
          {/* Subtle top hairline in accent violet */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

          {/* Top Header Row: Mailbox Icon & Close Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shadow-inner shadow-purple-500/15">
              <LetterBoxIcon className="w-6 h-6" animated={true} />
            </div>

            <button
              onClick={handleAnonymous}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Greeting & Headline */}
          <div className="space-y-1 mb-5">
            <p className="font-sans text-xs sm:text-sm text-purple-300 font-medium tracking-normal">
              {reason === 'post' ? '✍️ Dropping a letter in the guestbook?' : '👋 Psst, mystery visitor...'}
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-medium text-white tracking-normal leading-snug">
              What Should we call you?
            </h2>
            {reason === 'post' && (
              <p className="text-xs text-purple-200/70 font-sans mt-0.5">
                A name is required so readers know who sent this letter.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="your name, nickname, or secret identity..."
                maxLength={28}
                className="w-full bg-[#12081C]/90 border border-purple-500/30 hover:border-purple-400/50 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all font-sans"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-3 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-sans text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>That&apos;s me ✦</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleAnonymous}
                className="text-xs text-slate-400 hover:text-purple-300 transition-colors cursor-pointer font-sans inline-flex items-center gap-1"
              >
                {reason === 'post' ? "I'll stay a mystery (cancel)" : "I'll stay a mystery 👻"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
