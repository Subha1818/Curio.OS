import React, { useState } from 'react';
import {
  Search,
  Terminal,
  Folder,
  Music,
  Settings,
  Skull,
  RotateCcw,
  Maximize,
  Share2,
  Cpu,
  MessagesSquare,
} from 'lucide-react';
import { LetterBoxIcon } from './icons/LetterBoxIcon';
import type { AppId } from '../types/os';
import { useWindowManager } from '../context/WindowManagerContext';
import { getNickname } from '../utils/identity';
import { sound } from '../utils/sound';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReboot: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, onReboot }) => {
  const { openApp } = useWindowManager();
  const nickname = getNickname() || 'Mystery Visitor';
  const hasName = !!getNickname();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allApps: {
    id: AppId;
    name: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'terminal',
      name: 'Terminal',
      desc: 'The heart of Curio.OS • Auth, neofetch, commands',
      icon: <Terminal className="w-5 h-5 text-pink-400" />,
      badge: 'CORE',
    },
    {
      id: 'files',
      name: 'File Manager',
      desc: "Browse directories & Subbu's Classified Vault",
      icon: <Folder className="w-5 h-5 text-amber-400" />,
      badge: 'SECRET',
    },
    {
      id: 'skills',
      name: 'Skills',
      desc: "Subbu's technical skills, frameworks & tools",
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      badge: 'TECH',
    },
    {
      id: 'socials',
      name: 'Socials',
      desc: "Subbu's social transceivers & external uplinks",
      icon: <Share2 className="w-5 h-5 text-cyan-400" />,
      badge: 'NEW',
    },
    {
      id: 'music',
      name: 'Music Player',
      desc: 'Lofi beats, chill vinyl vibes, and soundscapes',
      icon: <Music className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'letterbox',
      name: 'LetterBox',
      desc: "Subbu's cerebral guestbook • Drop a thought into the stream",
      icon: <LetterBoxIcon className="w-5 h-5" animated={false} />,
      badge: 'COMMUNITY',
    },
    {
      id: 'gmail',
      name: "Let's Connect",
      desc: "Direct contact client • Send a message directly to Subbu's inbox",
      icon: <MessagesSquare className="w-5 h-5 text-emerald-400" />,
      badge: 'CONTACT',
    },
    {
      id: 'settings',
      name: 'Settings',
      desc: 'Wallpapers, audio chimes, and system tweaks',
      icon: <Settings className="w-5 h-5 text-sky-400" />,
    },
    {
      id: 'void',
      name: 'VOID.EXE',
      desc: 'An ominous void. Definitely do not click.',
      icon: <Skull className="w-5 h-5 text-rose-500" />,
      badge: 'DANGER',
    },
  ];

  const filteredApps = allApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLaunch = (appId: AppId) => {
    sound.playClick();
    openApp(appId);
    onClose();
  };

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-[60px] left-0 right-0 mx-3 sm:left-3 sm:right-auto sm:mx-0 w-auto sm:w-80 md:w-96 rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col select-none text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* User profile card */}
      <div className="p-4 bg-gradient-to-r from-pink-500/15 via-indigo-500/15 to-purple-500/15 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shadow-lg bg-gradient-to-tr from-pink-500 to-indigo-600">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">
                cutie@{nickname}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${hasName ? 'bg-emerald-500/20 text-emerald-300' : 'bg-pink-500/20 text-pink-300'}`}>
                {hasName ? 'NAMED' : 'ANON'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Curio.OS Guest Explorer
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Curio apps & files..."
            className="bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-xs w-full"
            autoFocus
          />
        </div>
      </div>

      {/* Apps List */}
      <div className="p-2 max-h-72 overflow-y-auto space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
          Installed Applications
        </div>

        {filteredApps.map((app) => (
          <div
            key={app.id}
            onClick={() => handleLaunch(app.id)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                {app.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  {app.name}
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{app.desc}</p>
              </div>
            </div>

            {app.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300">
                {app.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer System Power bar */}
      <div className="p-3 bg-slate-900/60 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span className="text-[11px]">Fullscreen</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onReboot();
            onClose();
          }}
          className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors py-1 px-2 rounded-lg hover:bg-rose-500/10 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Reboot Curio.OS</span>
        </button>
      </div>
    </div>
  );
};
