import React, { useState, useEffect } from 'react';
import { LogIn, X, Heart, Sparkles } from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { sound } from '../utils/sound';

interface LoginPopupProps {
  onDismissForSession: () => void;
  onStillNo?: () => void;
}

type PopupStage = 'primary' | 'secondary' | 'dismissed';

export const LoginPopup: React.FC<LoginPopupProps> = ({ onDismissForSession, onStillNo }) => {
  const [stage, setStage] = useState<PopupStage>('primary');
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { openApp } = useWindowManager();

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const animateOut = (then: () => void) => {
    setIsExiting(true);
    setTimeout(then, 300);
  };

  const handleLogin = () => {
    sound.playClick();
    // Open terminal and signal it to auto-run login
    openApp('terminal');
    sessionStorage.setItem('curio_terminal_autorun', 'login');
    animateOut(onDismissForSession);
  };

  const handlePrimaryNo = () => {
    sound.playClick();
    // Transition to secondary popup after a short delay
    animateOut(() => {
      setIsExiting(false);
      setVisible(false);
      setTimeout(() => {
        setStage('secondary');
        setVisible(true);
      }, 5000); // 5 second "guilt delay"
    });
  };

  const handleStillNo = () => {
    sound.playClick();
    animateOut(() => {
      if (onStillNo) onStillNo();
      onDismissForSession(); // Sets flag — no more popups this session
    });
  };

  if (stage === 'dismissed') return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[250] max-w-sm w-[92vw] sm:w-[350px] pointer-events-auto transition-all duration-300 ease-out select-none ${
        visible && !isExiting
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-8 opacity-0 scale-95'
      }`}
    >
      {stage === 'primary' ? (
        /* ─── Primary Popup ─── */
        <div className="w-72 rounded-2xl bg-slate-950/95 border border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(244,114,182,0.15)] overflow-hidden">
          {/* Decorative top gradient */}
          <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-indigo-500 to-purple-500" />

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Curio.OS</p>
                  <p className="text-[10px] text-slate-400">System Message</p>
                </div>
              </div>
              <button
                onClick={() => animateOut(onDismissForSession)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-100">Wanna login?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Unlock your saved notes, secret folder & custom wallpaper. ✨
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleLogin}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
              <button
                onClick={handlePrimaryNo}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                No I'm Fine
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Secondary Popup (guilt-trip mode) ─── */
        <div className="w-72 rounded-2xl bg-slate-950/95 border border-pink-500/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(244,114,182,0.25)] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 animate-pulse" />

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-md animate-bounce">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Curio.OS 👉👈</p>
                  <p className="text-[10px] text-slate-400">Gently persistent...</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-pink-300">
                Please cutie, Login Krlo 👉👈
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Your data is just waiting for you. It's lonely without you here. 🥺
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleLogin}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5" /> Okay Fine
              </button>
              <button
                onClick={handleStillNo}
                className="flex-1 py-2 bg-white/5 hover:bg-white/8 text-slate-400 text-xs font-medium rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                Still No 😐
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
