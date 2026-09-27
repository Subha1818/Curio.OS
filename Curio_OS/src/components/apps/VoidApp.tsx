import React, { useState, useEffect, useRef } from 'react';
import { Skull, Eye, Zap, AlertTriangle } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useVoid } from '../../context/VoidContext';

// ── Scripted sequence messages ──────────────────────────────────────────────
const SEQUENCE: { message: string; subtext: string; color: string }[] = [
  {
    message: 'THERE IS NOTHING HERE.',
    subtext: 'Classified Subsystem • Restricted Access',
    color: 'text-slate-200',
  },
  {
    message: 'Why?',
    subtext: 'Curiosity is a dangerous thing in this sector.',
    color: 'text-purple-400',
  },
  {
    message: 'Seriously?',
    subtext: 'The Void is watching you. It always was.',
    color: 'text-indigo-400',
  },
  {
    message: 'Stop.',
    subtext: 'Every click frays the membrane. You were warned.',
    color: 'text-amber-400',
  },
  {
    message: '...',
    subtext: 'Silence speaks what I cannot. Still here?',
    color: 'text-rose-400',
  },
  {
    message: 'Fine.',
    subtext: 'VOID.EXE is no longer contained. Welcome to the other side.',
    color: 'text-rose-500',
  },
];

// ── Glitch text effect component ─────────────────────────────────────────────
const GlitchText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [glitched, setGlitched] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*▓▒░█';

  useEffect(() => {
    let iterations = 0;
    const interval = setInterval(() => {
      setGlitched(
        text
          .split('')
          .map((char, idx) => {
            if (idx < iterations) return char;
            if (char === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      iterations += 1 / 2;
      if (iterations >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <span className={className}>{glitched}</span>;
};

// ── Void particle field ───────────────────────────────────────────────────────
const VoidParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; r: number; dx: number; dy: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.6 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 63, 94, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
    />
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const VoidApp: React.FC<{ windowId: string }> = () => {
  useEffect(() => {
    sessionStorage.setItem('curio_void_opened', 'true');
    window.dispatchEvent(new Event('curio_activity_updated'));
  }, []);

  const { voidClickCount, escalateVoid, isVoidAwoken } = useVoid();
  const [showGlitch, setShowGlitch] = useState(false);
  const [jitter, setJitter] = useState(false);

  const currentStep = SEQUENCE[voidClickCount] ?? SEQUENCE[SEQUENCE.length - 1];
  const isAtStart = voidClickCount === 0;

  const handleClick = () => {
    if (voidClickCount >= SEQUENCE.length - 1) return; // cap after "Fine."

    sound.playKeystroke();

    // Trigger jitter on click 3+ 
    if (voidClickCount >= 2) {
      setJitter(true);
      setTimeout(() => setJitter(false), 400);
    }

    // Trigger glitch effect on awaken click (click 4 → step 5)
    if (voidClickCount === 4) {
      setShowGlitch(true);
      // Dispatch jitter event to all windows
      window.dispatchEvent(new CustomEvent('curio:void-jitter'));
    }

    escalateVoid();
  };

  const buttonLabel = () => {
    if (isAtStart) return '[ DO NOT CLICK ]';
    if (voidClickCount >= 5) return '[ YOU HAVE BEEN NOTICED ]';
    return '[ DO NOT CLICK AGAIN ]';
  };

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-6 text-center select-none transition-all duration-700 relative overflow-hidden ${
        isVoidAwoken
          ? 'bg-gradient-to-b from-black via-rose-950/20 to-black'
          : 'bg-slate-950'
      } ${jitter ? 'animate-pulse' : ''}`}
      style={
        jitter
          ? { transform: `translate(${Math.random() * 6 - 3}px, ${Math.random() * 4 - 2}px)` }
          : {}
      }
    >
      {/* Particle field — only when awoken */}
      {isVoidAwoken && <VoidParticles />}

      {/* Scan-line overlay for creepy atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Glitch flash */}
      {showGlitch && (
        <div className="absolute inset-0 bg-rose-500/20 z-30 pointer-events-none animate-ping" />
      )}

      <div className="space-y-6 max-w-sm relative z-10">
        {/* Icon */}
        <div className="relative inline-block mx-auto">
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border-2 transition-all duration-700 ${
              isVoidAwoken
                ? 'border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.7),0_0_100px_rgba(244,63,94,0.3)] bg-rose-950/30'
                : voidClickCount >= 3
                ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-950/20'
                : voidClickCount >= 1
                ? 'border-indigo-500/50 bg-indigo-950/20'
                : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            {isVoidAwoken ? (
              <Eye className="w-11 h-11 text-rose-400 animate-pulse" />
            ) : voidClickCount >= 3 ? (
              <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
            ) : voidClickCount >= 1 ? (
              <Zap className="w-10 h-10 text-indigo-400" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-700 animate-ping" />
            )}
          </div>

          {/* Ripple rings when awoken */}
          {isVoidAwoken && (
            <>
              <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-[-8px] rounded-full border border-rose-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            </>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2
            className={`text-2xl font-bold tracking-widest font-mono uppercase transition-all duration-500 ${currentStep.color} ${
              isVoidAwoken ? 'animate-pulse' : ''
            }`}
          >
            {isVoidAwoken && voidClickCount === 5 ? (
              <GlitchText text={currentStep.message} />
            ) : (
              currentStep.message
            )}
          </h2>
          <p className={`text-xs font-mono transition-colors duration-500 ${
            isVoidAwoken ? 'text-rose-300/70' : 'text-slate-500'
          }`}>
            {currentStep.subtext}
          </p>
        </div>

        {/* Button */}
        <div>
          <button
            onClick={handleClick}
            disabled={voidClickCount >= 5}
            className={`px-6 py-2.5 rounded-xl font-mono text-xs tracking-wider transition-all uppercase border cursor-pointer disabled:cursor-not-allowed ${
              isVoidAwoken
                ? 'bg-rose-950/60 text-rose-300 border-rose-600/70 shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-60 disabled:shadow-none'
                : voidClickCount >= 3
                ? 'bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/60'
                : voidClickCount >= 1
                ? 'bg-indigo-950/40 text-indigo-300 border-indigo-600/40 hover:bg-indigo-900/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            {buttonLabel()}
          </button>
        </div>

        {/* Defiance counter */}
        {voidClickCount > 0 && (
          <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
            <div>
              Defiance count:{' '}
              <span className={isVoidAwoken ? 'text-rose-400' : 'text-pink-400'}>
                {voidClickCount}
              </span>
            </div>
            {isVoidAwoken && (
              <div className="text-rose-500/60 animate-pulse text-[10px]">
                The Void has seeped into Curio.OS. Check your taskbar.
              </div>
            )}
          </div>
        )}

        {/* Awoken lore block */}
        {isVoidAwoken && (
          <div className="mt-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest">VOID.EXE — Breach Log</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
              Process containment failed at iteration <span className="text-rose-400">5</span>.
              <br />Leaking into host OS kernel...
              <br />Taskbar contamination: <span className="text-rose-400">ACTIVE</span>
              <br />Terminal mode: <span className="text-amber-400">ALTERED</span>
              <br />Memory anomalies: <span className="text-indigo-400">DETECTED</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
