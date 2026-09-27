import React, { useState, useEffect } from 'react';
import { sound } from '../utils/sound';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const bootDiagnostics = [
    'BIOS Date 09/26/26 20:36:00 Ver: 08.00.15',
    'CPU: Quantum Neural Hexacore @ 4.20 GHz (Whimsy Edition)',
    'Memory Frequency: 4200MHz Dual Channel DDR5 (100% OK)',
    'Initializing Curio Quantum Kernel v2.4.9...',
    'Checking hardware whimsy thresholds... 100% NOMINAL',
    'Scanning for unauthorized seriousness... NONE DETECTED!',
    'Mounting virtual filesystem: /dev/curio-root mounted on /',
    "Decrypting Subbu's secret vault manifest... [ENCRYPTED/READY]",
    'Warming up lofi audio synthesis engine... READY',
    'Bootstrapping Cutie Pie subsystem... ENGAGED ❤️',
    'Calibrating celestial wallpaper & window manager...',
    'All systems whimsical. Entering desktop shell...',
  ];

  useEffect(() => {
    // Play startup chime
    sound.playBootChime();

    // Stream logs sequentially
    let currentLog = 0;
    const logInterval = setInterval(() => {
      if (currentLog < bootDiagnostics.length) {
        setLogs((prev) => [...prev, bootDiagnostics[currentLog]]);
        sound.playKeystroke();
        currentLog++;
      } else {
        clearInterval(logInterval);
      }
    }, 280);

    // Progress bar ticker
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              sessionStorage.setItem('curio_boot_completed', 'true');
              onComplete();
            }, 600);
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 65);

    // Keyboard shortcut to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finishBootImmediately();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const finishBootImmediately = () => {
    sessionStorage.setItem('curio_boot_completed', 'true');
    setIsFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black text-slate-200 font-mono flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 scale-105' : 'opacity-100'
      } crt-screen`}
    >
      {/* Top Banner / ASCII Header */}
      <div className="space-y-4 max-w-4xl">
        <div className="text-pink-400 font-bold text-xs sm:text-sm leading-tight tracking-wider select-none animate-pulse">
          <pre className="font-mono hidden sm:block">
{`   ____  _   _ ____  ___ ___       ___  ____  
  / ___|| | | |  _ \\|_ _/ _ \\     / _ \\/ ___| 
 | |    | | | | |_) || | | | |   | | | \\___ \\ 
 | |___ | |_| |  _ < | | |_| | _ | |_| |___) |
  \\____| \\___/|_| \\_\\___\\___/ (_) \\___/|____/  v2.4.9`}
          </pre>
          <div className="sm:hidden text-base font-bold text-pink-400">
            [ CURIO.OS v2.4.9 ]
          </div>
        </div>

        <div className="text-xs text-indigo-300/80 flex items-center gap-3">
          <span>Curio BIOS v1.0.4</span>
          <span>•</span>
          <span>Architecture: WebAssembly/Browser</span>
          <span>•</span>
          <span className="text-amber-400">Subbu Dev Edition</span>
        </div>

        {/* Diagnostics Log Output */}
        <div className="space-y-1 text-xs text-slate-400 h-64 overflow-hidden pt-2 font-mono">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold shrink-0">[ OK ]</span>
              <span className={idx === logs.length - 1 ? 'text-white font-medium' : ''}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Progress Bar & Skip Prompt */}
      <div className="max-w-4xl w-full space-y-3 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-pink-400 font-semibold tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            Loading Curio.OS desktop environment...
          </span>
          <span className="font-mono text-indigo-300 font-bold">{progress}%</span>
        </div>

        {/* Retro style segment bar */}
        <div className="w-full bg-slate-900 border border-slate-700/80 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(244,114,182,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Curio.OS Quantum Engine • SIH 2026 Edition</span>
          <button
            onClick={finishBootImmediately}
            className="text-slate-400 hover:text-pink-400 transition-colors underline cursor-pointer"
          >
            Press [ESC] or Click here to Skip Boot
          </button>
        </div>
      </div>
    </div>
  );
};
