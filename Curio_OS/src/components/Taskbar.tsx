import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryCharging,
  Volume2,
  VolumeX,
  Bell,
  Terminal,
  Folder,
  Music,
  Settings,
  Skull,
  Eye,
  Share2,
  Cpu,
  MessagesSquare,
} from 'lucide-react';
import { LetterBoxIcon } from './icons/LetterBoxIcon';
import type { AppId } from '../types/os';
import { useWindowManager } from '../context/WindowManagerContext';
import { sound } from '../utils/sound';
import { useLetterBoxActivity } from '../utils/useLetterBoxActivity';

interface TaskbarProps {
  onToggleStart: () => void;
  isStartOpen: boolean;
  isNotificationsOpen?: boolean;
  onToggleNotifications: () => void;
  hasUnreadNotifications: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isVoidAwoken?: boolean;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  onToggleStart,
  isStartOpen,
  onToggleNotifications,
  hasUnreadNotifications,
  soundEnabled,
  onToggleSound,
  isVoidAwoken = false,
}) => {
  const { windows, activeWindowId, openApp, focusWindow, minimizeWindow } = useWindowManager();
  const hasNewLetterBoxActivity = useLetterBoxActivity();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [voidGlitch, setVoidGlitch] = useState(false);

  // Glitch the void indicator every 4-8 seconds when awoken
  useEffect(() => {
    if (!isVoidAwoken) return;
    const glitchInterval = setInterval(() => {
      setVoidGlitch(true);
      setTimeout(() => setVoidGlitch(false), 300);
    }, 4000 + Math.random() * 4000);
    return () => clearInterval(glitchInterval);
  }, [isVoidAwoken]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const pinnedApps: { id: AppId; name: string; icon: React.ReactNode }[] = [
    { id: 'terminal', name: 'Terminal', icon: <Terminal className="w-6 h-6 text-pink-400" /> },
    { id: 'files', name: 'Files', icon: <Folder className="w-6 h-6 text-amber-400" /> },
    { id: 'skills', name: 'Skills', icon: <Cpu className="w-6 h-6 text-emerald-400" /> },
    { id: 'socials', name: 'Socials', icon: <Share2 className="w-6 h-6 text-cyan-400" /> },
    { id: 'music', name: 'Music', icon: <Music className="w-6 h-6 text-purple-400" /> },
    { id: 'letterbox', name: 'LetterBox', icon: <LetterBoxIcon className="w-6 h-6" animated={false} /> },
    { id: 'gmail', name: "Let's Connect", icon: <MessagesSquare className="w-6 h-6 text-emerald-400" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-6 h-6 text-sky-400" /> },
    { id: 'void', name: 'Void', icon: <Skull className="w-6 h-6 text-rose-500" /> },
  ];

  const handleAppClick = (appId: AppId) => {
    sound.playClick();
    const existing = windows.find((w) => w.appId === appId);
    if (!existing) {
      openApp(appId);
    } else if (existing.isMinimized) {
      // Un-minimize and focus
      openApp(appId);
    } else if (activeWindowId === existing.id) {
      // Already focused -> minimize
      minimizeWindow(existing.id);
    } else {
      // Bring to front
      focusWindow(existing.id);
    }
  };

  return (
    <div className="hidden md:flex h-[52px] w-full fixed bottom-0 left-0 right-0 z-50 items-center justify-between px-3 bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 select-none shadow-[0_-5px_25px_rgba(0,0,0,0.5)] taskbar-safe">
      {/* Left: Start / Curio Menu Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sound.playClick();
            onToggleStart();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            isStartOpen
              ? 'bg-gradient-to-r from-pink-500/30 to-indigo-500/30 border-pink-400/60 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          {/* Start Button Logo Mark */}
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-md">
            <span className="font-pixel text-[12px]">C</span>
          </div>
          <span className="font-pixel text-[10px] tracking-wide text-purple-200 hidden sm:inline">
            Curio<span className="text-pink-400">.OS</span>
          </span>
        </button>
      </div>

      {/* Center: Dock of Pinned & Running Apps */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md shadow-lg max-w-[60vw] sm:max-w-none overflow-x-auto scrollbar-none">
        {pinnedApps.map((app) => {
          const win = windows.find((w) => w.appId === app.id);
          const isOpen = Boolean(win);
          const isActive = win && activeWindowId === win.id && !win.isMinimized;
          const showNewActivity = app.id === 'letterbox' && hasNewLetterBoxActivity && !isOpen;

          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              title={app.name}
              className={`p-2 rounded-xl transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-white/15 shadow-inner ring-1 ring-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <div className="group-hover:scale-115 transition-transform">{app.icon}</div>

              {/* LetterBox new activity indicator dot */}
              {showNewActivity && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500 ring-1 ring-slate-950" />
                </span>
              )}

              {/* Status pill dot */}
              {isOpen && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full transition-all ${
                    isActive
                      ? 'w-3.5 h-0.5 bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)]'
                      : 'w-1 h-1 bg-slate-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: System Tray & Clock */}
      <div className="flex items-center gap-3">
        {/* Sound toggle */}
        <button
          onClick={() => {
            onToggleSound();
            sound.playClick();
          }}
          title={soundEnabled ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-300" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* VOID.EXE Persistent Leak Indicator */}
        {isVoidAwoken && (
          <div
            title="VOID.EXE has noticed you"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border cursor-default transition-all ${
              voidGlitch
                ? 'bg-rose-500/30 border-rose-400/60 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                : 'bg-rose-950/30 border-rose-800/40 text-rose-400/70'
            }`}
          >
            {voidGlitch ? (
              <Eye className="w-3 h-3" />
            ) : (
              <Skull className="w-3 h-3" />
            )}
            <span className="text-[9px] font-mono tracking-wider uppercase">
              {voidGlitch ? 'WATCHING' : 'VOID'}
            </span>
          </div>
        )}

        {/* Wi-Fi Indicator */}
        <div title="Curio-Mesh • 5G Quantum Link" className="cursor-default text-emerald-400 hidden sm:block">
          <Wifi className="w-4 h-4" />
        </div>

        {/* Battery Indicator */}
        <div title="Battery: 98% (Perpetual Whimsy)" className="items-center gap-1 text-slate-300 text-xs hidden md:flex cursor-default">
          <BatteryCharging className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-mono">98%</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleNotifications();
          }}
          title="Notifications"
          className="text-slate-400 hover:text-slate-200 relative p-1 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadNotifications && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-slate-950 animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Clock & Date */}
        <div className="text-right cursor-default leading-tight pr-1">
          <div className="text-xs font-semibold text-slate-200 font-mono tracking-tight">
            {timeStr}
          </div>
          <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
            {dateStr}
          </div>
        </div>
      </div>
    </div>
  );
};
