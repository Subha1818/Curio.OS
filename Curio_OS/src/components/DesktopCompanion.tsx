import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../utils/sound';
import { useWindowManager } from '../context/WindowManagerContext';

type CompanionType = 'cat' | 'ghost' | 'robot';
type CompanionState = 'idle' | 'walking' | 'sleeping' | 'happy' | 'flipping';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  symbol: string;
}

const GENERAL_CAT_QUOTES = [
  "Subbu coded this with pure caffeine and vibes ✨",
  "Remember to hydrate, or I'll knock your coffee over! 💧😼",
  "Letters in LetterBox are looking extra wholesome today 💌",
  "Double click me to see my Olympic-level backflip! 🤸",
  "Purrrrr... this wallpaper is prime napping material 🐾",
  "I sniffed the kernel. 100% whimsy, 0% bugs detected 🧶",
  "When you play lofi music, actual rain starts falling! 🌧️",
  "Sleeping on your keyboard right now... zzz 🐾",
  "Don't forget to star Subbu's repo! ⭐",
  "You're doing great today, human! Keep going 🌸",
];

const FILE_EXPLORER_QUOTES = [
  "Psst... there's a whole file cabinet of secrets in there. 📁",
  "The File Explorer knows more about Subbu than I do. 🐱",
  "Go on, open a folder. I won't tell anyone you're curious. 🐾",
  "Some folders are locked. Some are just waiting to be found... 🔑",
  "I heard the Projects folder has some really good stuff in it. 👀",
  "Click around in there. I promise it's more interesting than me. ✨",
];

const GHOST_QUOTES = [
  "Booo! Just kidding, I'm friendly 👻✨",
  "Floating through your desktop memory sectors...",
  "VOID.EXE thinks it's scary. I think it needs a hug 🕯️",
  "Whispering good vibes directly into your terminal 💫",
  "OoooOOoo... did someone say lofi beats? 🎶",
  "Psst... have you checked the secret folders in File Explorer? 📁👻",
];

const ROBOT_QUOTES = [
  "BEEP BOOP! Whimsy engine running at 99.98% efficiency 🤖⚡",
  "Calculating cuteness probability... 100% confirmed!",
  "Syntax error: seriousness not found in runtime 🛸",
  "Performing quantum diagnostic: user is awesome. 💎",
  "Recharging batteries on aesthetic lofi vibrations... 🔋",
  "Memory scan complete: high-density projects detected in File Explorer 📂",
];

export const DesktopCompanion: React.FC = () => {
  const windowManager = useWindowManager();
  const isFilesOpen = Boolean(windowManager?.windows.some((w) => w.appId === 'files'));
  const filesEverOpenedRef = useRef(false);

  useEffect(() => {
    if (isFilesOpen) {
      filesEverOpenedRef.current = true;
    }
  }, [isFilesOpen]);

  const [companionType, setCompanionType] = useState<CompanionType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curio_companion_type');
      if (saved === 'cat' || saved === 'ghost' || saved === 'robot') return saved;
    }
    return 'cat';
  });
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [posX, setPosX] = useState<number>(200);
  const [posY, setPosY] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerHeight - 170 : 500;
  });
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(
    "Hi cutie! I'm Mochi. Click me to pet or double-click for a flip! 🌸"
  );
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const messageTimeoutRef = useRef<number | null>(null);
  const companionRef = useRef<HTMLDivElement | null>(null);
  const lastQuoteRef = useRef<string | null>(null);

  // Show a temporary bubble message
  const triggerMessage = useCallback((text: string, duration = 6000) => {
    setMessage(text);
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage(null);
    }, duration);
  }, []);

  // Weighted quote selection favoring File Explorer lines when not yet opened
  const pickNextQuote = useCallback((): string => {
    if (companionType === 'ghost') {
      const candidates = GHOST_QUOTES.filter((q) => q !== lastQuoteRef.current);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || GHOST_QUOTES[0];
      lastQuoteRef.current = chosen;
      return chosen;
    }

    if (companionType === 'robot') {
      const candidates = ROBOT_QUOTES.filter((q) => q !== lastQuoteRef.current);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || ROBOT_QUOTES[0];
      lastQuoteRef.current = chosen;
      return chosen;
    }

    // Mochi (Cat): 2.5x weighting for File Explorer lines until visited
    const hasViewedFiles = isFilesOpen || filesEverOpenedRef.current;
    const fileWeight = hasViewedFiles ? 0.35 : 2.5;
    const generalWeight = 1.0;

    const weightedItems: { quote: string; weight: number }[] = [];

    FILE_EXPLORER_QUOTES.forEach((q) => {
      if (q !== lastQuoteRef.current) {
        weightedItems.push({ quote: q, weight: fileWeight });
      }
    });

    GENERAL_CAT_QUOTES.forEach((q) => {
      if (q !== lastQuoteRef.current) {
        weightedItems.push({ quote: q, weight: generalWeight });
      }
    });

    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const item of weightedItems) {
      if (rand < item.weight) {
        lastQuoteRef.current = item.quote;
        return item.quote;
      }
      rand -= item.weight;
    }

    const fallback = FILE_EXPLORER_QUOTES[0];
    lastQuoteRef.current = fallback;
    return fallback;
  }, [companionType, isFilesOpen]);

  // Periodic whimsical speech bubble
  useEffect(() => {
    if (isHidden) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.65 && !isDragging) {
        const quote = pickNextQuote();
        triggerMessage(quote);
      }
    }, 16000);

    return () => clearInterval(interval);
  }, [isHidden, isDragging, pickNextQuote, triggerMessage]);


  // Wandering behavior AI
  useEffect(() => {
    if (isDragging || isHidden || companionState === 'flipping') return;

    let wanderTimeout: number;

    const wanderStep = () => {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const margin = 80;

      // Choose random action
      const rand = Math.random();
      if (rand < 0.45) {
        // Walk left or right
        const walkDist = (40 + Math.random() * 80) * (Math.random() > 0.5 ? 1 : -1);
        setPosX((prev) => {
          let nextX = prev + walkDist;
          if (nextX < margin) {
            nextX = margin + 20;
            setFacingLeft(false);
          } else if (nextX > screenWidth - margin - 80) {
            nextX = screenWidth - margin - 100;
            setFacingLeft(true);
          } else {
            setFacingLeft(walkDist < 0);
          }
          return nextX;
        });
        setCompanionState('walking');

        wanderTimeout = window.setTimeout(() => {
          setCompanionState('idle');
          scheduleNext();
        }, 1600);
      } else if (rand < 0.8) {
        // Idle / sit
        setCompanionState('idle');
        wanderTimeout = window.setTimeout(scheduleNext, 2500 + Math.random() * 3000);
      } else {
        // Sleep for a short nap
        setCompanionState('sleeping');
        wanderTimeout = window.setTimeout(scheduleNext, 5000 + Math.random() * 4000);
      }
    };

    const scheduleNext = () => {
      wanderTimeout = window.setTimeout(wanderStep, 2000 + Math.random() * 3000);
    };

    scheduleNext();

    return () => clearTimeout(wanderTimeout);
  }, [isDragging, isHidden, companionState]);

  // Petting / clicking interaction
  const handlePet = () => {
    sound.playChime();
    setCompanionState('happy');

    // Spawn floating heart particles
    const symbols = ['❤️', '💖', '✨', '🐾', '🌸'];
    const newHearts: HeartParticle[] = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 40,
      y: -10 - Math.random() * 30,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
    }));
    setHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1200);

    const happyQuotes = [
      "Purrr! That feels so nice! ✨",
      "Yay, pats! You're my favorite human ❤️",
      "*purrs loudly* Maximum cozy achieved 🐾",
      "Hehe! Subbu loves hugs too! 🌸",
      "+100 Whimsy points! ✨",
    ];
    triggerMessage(happyQuotes[Math.floor(Math.random() * happyQuotes.length)], 4000);

    setTimeout(() => {
      if (companionState !== 'flipping') setCompanionState('idle');
    }, 1800);
  };

  // Double click acrobatic flip
  const handleDoubleClick = () => {
    sound.playSuccess();
    setCompanionState('flipping');
    triggerMessage("TA-DA! 10/10 landing! 🤸✨", 3500);
    setTimeout(() => {
      setCompanionState('happy');
      setTimeout(() => setCompanionState('idle'), 1200);
    }, 700);
  };

  // Dragging support
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - posX,
      y: e.clientY - posY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const newX = Math.max(20, Math.min(screenWidth - 100, e.clientX - dragOffsetRef.current.x));
    // 170 = ~80px sprite + 20px label + 52px taskbar + 18px margin
    const newY = Math.max(40, Math.min(screenHeight - 170, e.clientY - dragOffsetRef.current.y));
    setPosX(newX);
    setPosY(newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Switch companion type
  const cycleCompanion = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSwitch();
    const nextType: Record<CompanionType, CompanionType> = {
      cat: 'ghost',
      ghost: 'robot',
      robot: 'cat',
    };
    const next = nextType[companionType];
    setCompanionType(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('curio_companion_type', next);
      window.dispatchEvent(new Event('curio_companion_changed'));
    }
    triggerMessage(
      next === 'cat'
        ? "Mochi the Cat is back! 🐾"
        : next === 'ghost'
        ? "Spooky the Friendly Ghost has materialized! 👻"
        : "Byte the Quantum Bot online! 🤖",
      4000
    );
  };

  if (isHidden) {
    return (
      <button
        onClick={() => {
          setIsHidden(false);
          sound.playChime();
        }}
        className="fixed bottom-16 right-6 z-50 px-3 py-1.5 rounded-full bg-slate-900/90 border border-pink-500/40 text-xs text-pink-300 shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
        title="Summon Desktop Companion"
      >
        <span>🐾</span>
        <span>Summon Mochi</span>
      </button>
    );
  }

  return (
    <div
      ref={companionRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handlePet}
      onDoubleClick={handleDoubleClick}
      className={`fixed z-[60] select-none cursor-grab active:cursor-grabbing group transition-[left,top] ${
        isDragging ? 'duration-0' : 'duration-700 ease-out'
      }`}
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        touchAction: 'none',
      }}
    >
      {/* Floating Hearts Animation */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute pointer-events-none text-base animate-bounce"
          style={{
            left: `${35 + h.x}px`,
            top: `${h.y}px`,
            filter: 'drop-shadow(0 0 6px rgba(244, 114, 182, 0.9))',
            animationDuration: '0.8s',
          }}
        >
          {h.symbol}
        </span>
      ))}

      {/* Whimsical Speech Bubble */}
      {message && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 sm:w-64 p-3 rounded-2xl bg-slate-900/95 border border-pink-400/40 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.7),0_0_15px_rgba(244,114,182,0.3)] backdrop-blur-xl text-xs text-slate-100 font-sans pointer-events-auto transition-all animate-float">
          <div className="relative">
            <p className="leading-snug">{message}</p>
            {/* Tiny bubble tail pointing to sprite */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-pink-400/40 transform rotate-45" />
          </div>
        </div>
      )}

      {/* Hover action toolbox */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-full px-2 py-0.5 shadow-md backdrop-blur-md text-[10px] pointer-events-auto">
        <button
          onClick={cycleCompanion}
          className="text-slate-300 hover:text-pink-300 transition-colors font-medium cursor-pointer"
          title="Switch character (Cat / Ghost / Robot)"
        >
          Switch
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsHidden(true);
          }}
          className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          title="Hide companion"
        >
          Hide
        </button>
      </div>

      {/* Companion Character Sprite Container */}
      <div
        className={`relative w-20 h-20 transition-transform ${
          companionState === 'flipping'
            ? 'animate-spin'
            : companionState === 'happy'
            ? 'animate-bounce'
            : companionState === 'walking'
            ? 'animate-pulse'
            : ''
        }`}
        style={{
          transform: `${facingLeft ? 'scaleX(-1)' : 'scaleX(1)'} ${
            companionState === 'sleeping' ? 'rotate(10deg) scale(0.92)' : ''
          }`,
          transformOrigin: 'bottom center',
        }}
      >
        {/* Render Cat Sprite */}
        {companionType === 'cat' && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            {/* Shadow */}
            <ellipse cx="50" cy="85" rx="30" ry="8" fill="rgba(0,0,0,0.35)" />

            {/* Wagging Tail */}
            <path
              d="M24 68 C10 65, 8 45, 18 42 C24 40, 26 55, 30 64"
              fill="none"
              stroke="#fb923c"
              strokeWidth="7"
              strokeLinecap="round"
              className="origin-bottom-right transition-transform"
              style={{
                animation: companionState === 'sleeping' ? 'none' : 'floatGentle 2s ease-in-out infinite',
              }}
            />

            {/* Cat Body */}
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

            {/* Eyes */}
            {companionState === 'sleeping' ? (
              <>
                {/* Sleeping curved eyes */}
                <path d="M40 43 Q45 48 50 43" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M54 43 Q59 48 64 43" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
                {/* Floating ZZZ */}
                <text x="70" y="28" fill="#a78bfa" fontSize="12" fontWeight="bold" className="animate-pulse">
                  z
                </text>
                <text x="78" y="20" fill="#c084fc" fontSize="15" fontWeight="bold" className="animate-pulse">
                  Z
                </text>
              </>
            ) : companionState === 'happy' ? (
              <>
                {/* Happy closed arched eyes ^^ */}
                <path d="M38 45 Q44 38 48 45" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
                <path d="M54 45 Q60 38 64 45" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Cute Open Eyes */}
                <circle cx="43" cy="42" r="4.5" fill="#1e293b" />
                <circle cx="61" cy="42" r="4.5" fill="#1e293b" />
                {/* Eye Sparkles */}
                <circle cx="44.5" cy="40.5" r="1.5" fill="#ffffff" />
                <circle cx="62.5" cy="40.5" r="1.5" fill="#ffffff" />
              </>
            )}

            {/* Cute Pink Cheeks */}
            <circle cx="36" cy="47" r="4" fill="#f472b6" opacity="0.6" />
            <circle cx="68" cy="47" r="4" fill="#f472b6" opacity="0.6" />

            {/* Nose & Mouth */}
            <polygon points="50,46 52,49 48,49" fill="#f43f5e" />
            <path d="M47 51 Q50 54 52 51 Q55 54 58 51" fill="none" stroke="#431407" strokeWidth="2" strokeLinecap="round" />

            {/* Whiskers */}
            <line x1="28" y1="46" x2="38" y2="48" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="26" y1="51" x2="38" y2="51" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="48" x2="76" y2="46" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="51" x2="78" y2="51" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

            {/* Cute Little Bell Collar */}
            <path d="M38 58 Q50 63 64 58" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
            <circle cx="51" cy="62" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          </svg>
        )}

        {/* Render Friendly Ghost Sprite */}
        {companionType === 'ghost' && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_16px_rgba(167,139,250,0.6)]">
            <ellipse cx="50" cy="85" rx="24" ry="6" fill="rgba(167,139,250,0.2)" />
            {/* Floating Ghost Body */}
            <path
              d="M30 55 C30 32, 70 32, 70 55 C70 72, 65 78, 62 72 C58 66, 54 75, 50 71 C46 67, 42 76, 38 72 C35 77, 30 72, 30 55 Z"
              fill="url(#ghostGrad)"
            />
            <defs>
              <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            {/* Blushing Cheeks */}
            <circle cx="38" cy="52" r="3.5" fill="#f472b6" opacity="0.6" />
            <circle cx="62" cy="52" r="3.5" fill="#f472b6" opacity="0.6" />
            {/* Eyes */}
            <circle cx="42" cy="46" r="4" fill="#3b0764" />
            <circle cx="58" cy="46" r="4" fill="#3b0764" />
            <circle cx="43.5" cy="44.5" r="1.5" fill="#ffffff" />
            <circle cx="59.5" cy="44.5" r="1.5" fill="#ffffff" />
            {/* Mouth */}
            <ellipse cx="50" cy="53" rx="3" ry="4" fill="#3b0764" />
            {/* Little ghost star wand */}
            <circle cx="69" cy="42" r="4" fill="#fde047" className="animate-ping" />
          </svg>
        )}

        {/* Render Quantum Robot Sprite */}
        {companionType === 'robot' && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_14px_rgba(56,189,248,0.5)]">
            <ellipse cx="50" cy="85" rx="22" ry="6" fill="rgba(0,0,0,0.3)" />
            {/* Antenna */}
            <line x1="50" y1="24" x2="50" y2="15" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="13" r="4" fill="#ec4899" className="animate-pulse" />
            {/* Head */}
            <rect x="32" y="24" width="36" height="28" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Visor / Eyes */}
            <rect x="38" y="32" width="24" height="12" rx="4" fill="#0f172a" />
            <circle cx="44" cy="38" r="3" fill="#38bdf8" className="animate-pulse" />
            <circle cx="56" cy="38" r="3" fill="#38bdf8" className="animate-pulse" />
            {/* Neck */}
            <rect x="46" y="52" width="8" height="5" fill="#64748b" />
            {/* Body */}
            <rect x="30" y="57" width="40" height="25" rx="6" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
            {/* Heart Core Meter */}
            <rect x="40" y="64" width="20" height="10" rx="3" fill="#0f172a" />
            <line x1="43" y1="69" x2="57" y2="69" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Tiny Status Tag */}
      <div className="text-center mt-0.5">
        <span className="text-[10px] font-bold tracking-wider text-pink-300/80 bg-slate-950/70 border border-pink-500/20 px-1.5 py-0.5 rounded-full shadow-sm">
          {companionType === 'cat'
            ? 'Mochi 🐾'
            : companionType === 'ghost'
            ? 'Spooky 👻'
            : 'Byte 🤖'}
        </span>
      </div>
    </div>
  );
};
