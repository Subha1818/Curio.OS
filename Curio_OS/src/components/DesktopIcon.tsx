import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Folder,
  FolderCode,
  Music,
  FileText,
  Settings,
  Skull,
  Compass,
  Gamepad2,
  MessageSquare,
  Share2,
  Cpu,
  Heart,
} from 'lucide-react';
import { LetterBoxIcon } from './icons/LetterBoxIcon';
import { sound } from '../utils/sound';
import { useAnimationsEnabled } from '../utils/useAnimations';

interface DesktopIconProps {
  id?: string;
  title: string;
  iconName: string;
  badge?: string;
  isShortcut?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isOpen?: boolean;
  isActive?: boolean;
  hasNewActivity?: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

// Icon accent color & glow mapping (matches exact icon hexes)
interface IconAccent {
  color: string;
  glow: string;
  hoverBorder: string;
}

const ICON_ACCENTS: Record<string, IconAccent> = {
  Terminal: {
    color: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.45)',
    hoverBorder: 'group-hover:border-pink-400/60',
  },
  Folder: {
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.45)',
    hoverBorder: 'group-hover:border-amber-400/60',
  },
  FolderCode: {
    color: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.45)',
    hoverBorder: 'group-hover:border-cyan-400/60',
  },
  Projects: {
    color: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.45)',
    hoverBorder: 'group-hover:border-cyan-400/60',
  },
  Code: {
    color: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.45)',
    hoverBorder: 'group-hover:border-cyan-400/60',
  },
  Share2: {
    color: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.45)',
    hoverBorder: 'group-hover:border-cyan-400/60',
  },
  Cpu: {
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.45)',
    hoverBorder: 'group-hover:border-emerald-400/60',
  },
  LetterBox: {
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.5)',
    hoverBorder: 'group-hover:border-purple-400/60',
  },
  Music: {
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.5)',
    hoverBorder: 'group-hover:border-purple-400/60',
  },
  Settings: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    hoverBorder: 'group-hover:border-sky-400/60',
  },
  Skull: {
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.55)',
    hoverBorder: 'group-hover:border-rose-500/70',
  },
};

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id: _id,
  title,
  iconName,
  badge,
  isShortcut,
  isDisabled,
  isSelected,
  isDragging,
  isOpen,
  isActive,
  hasNewActivity,
  onSelect,
  onOpen,
}) => {
  const animationsEnabled = useAnimationsEnabled();
  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    const handleVis = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  const shouldIdleAnimate = animationsEnabled && isTabVisible;
  const accent = ICON_ACCENTS[iconName] || {
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.4)',
    hoverBorder: 'group-hover:border-purple-400/50',
  };

  const getIcon = () => {
    switch (iconName) {
      case 'Terminal':
        return <Terminal className="w-8 h-8 text-pink-400 group-hover:scale-110 transition-transform" />;

      case 'Folder':
        return <Folder className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />;

      case 'FolderCode':
      case 'Projects':
      case 'Code':
        return <FolderCode className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />;

      case 'Music':
        return (
          <div className="relative flex items-center justify-center">
            <Music className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
            {/* Bespoke mini equalizer bars (idle animation) */}
            <div className="absolute -bottom-1 -right-1 flex items-end gap-0.5 h-3 px-0.5 pointer-events-none">
              <span
                className={`w-0.5 bg-purple-400 rounded-full transition-all ${
                  shouldIdleAnimate ? 'animate-eq-bar-1' : 'h-1.5'
                }`}
              />
              <span
                className={`w-0.5 bg-purple-300 rounded-full transition-all ${
                  shouldIdleAnimate ? 'animate-eq-bar-2' : 'h-2.5'
                }`}
              />
              <span
                className={`w-0.5 bg-purple-400 rounded-full transition-all ${
                  shouldIdleAnimate ? 'animate-eq-bar-3' : 'h-1'
                }`}
              />
            </div>
          </div>
        );

      case 'LetterBox':
        return (
          <div className="relative flex items-center justify-center">
            <LetterBoxIcon className="w-8 h-8 group-hover:scale-110 transition-transform" animated={false} />
            {/* Bespoke floating heart idle detail */}
            {shouldIdleAnimate && (
              <div className="absolute -top-1.5 right-0.5 pointer-events-none animate-letterbox-heart">
                <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400" />
              </div>
            )}
          </div>
        );

      case 'FileText':
        return <FileText className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />;

      case 'Settings':
        return <Settings className="w-8 h-8 text-sky-400 group-hover:rotate-45 transition-transform" />;

      case 'Skull':
        return (
          <Skull
            className={`w-8 h-8 text-rose-500 group-hover:scale-110 transition-transform ${
              shouldIdleAnimate ? 'animate-void-skull-idle' : ''
            }`}
          />
        );

      case 'Share2':
        return <Share2 className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />;

      case 'Cpu':
        return <Cpu className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />;

      case 'Compass':
        return <Compass className="w-8 h-8 text-slate-500" />;

      case 'MessageSquare':
        return <MessageSquare className="w-8 h-8 text-slate-500" />;

      case 'Gamepad2':
        return <Gamepad2 className="w-8 h-8 text-slate-500" />;

      default:
        return <Terminal className="w-8 h-8 text-pink-400" />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    onSelect();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    onOpen();
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`group w-24 p-2 rounded-2xl flex flex-col items-center text-center select-none transition-all relative ${
        isDragging
          ? 'bg-white/20 backdrop-blur-md ring-2 ring-pink-400/60 shadow-2xl scale-105 cursor-grabbing z-50'
          : isSelected
          ? 'bg-white/15 backdrop-blur-md ring-1 ring-white/30 shadow-lg cursor-pointer'
          : 'hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer'
      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {/* Icon container with per-icon accent hover glow */}
      <div
        style={
          {
            '--accent-glow': accent.glow,
            '--accent-color': accent.color,
          } as React.CSSProperties
        }
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative transition-all duration-200 ${
          isDragging
            ? 'bg-indigo-600/40 border border-pink-400/60 shadow-[0_0_20px_rgba(244,114,182,0.4)]'
            : isSelected
            ? 'bg-white/15 border border-white/40 shadow-[0_0_15px_var(--accent-glow)] ring-1 ring-white/30'
            : isActive
            ? 'bg-white/10 border border-white/25 ring-1 ring-white/20 shadow-[0_0_12px_var(--accent-glow)]'
            : `bg-slate-900/65 border border-white/10 ${accent.hoverBorder} group-hover:shadow-[0_0_18px_var(--accent-glow)]`
        }`}
      >
        {getIcon()}

        {/* Shortcut arrow badge */}
        {isShortcut && (
          <div
            className="absolute -bottom-1 -left-1 w-4 h-4 bg-slate-950/95 border border-slate-700/80 rounded flex items-center justify-center shadow-md shadow-black/60 pointer-events-none"
            title="Folder Shortcut"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-2.5 h-2.5 text-cyan-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="8 4 12 4 12 8" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </div>
        )}

        {/* VOID DANGER or custom badge */}
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(244,63,94,0.6)]">
            {badge}
          </span>
        )}

        {/* LetterBox new activity indicator badge */}
        {hasNewActivity && !badge && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500 ring-2 ring-slate-950 shadow-md" />
          </span>
        )}

        {/* Matching Taskbar Status Pill Dot (when open) */}
        {isOpen && (
          <span
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full transition-all pointer-events-none ${
              isActive
                ? 'w-4 h-1 bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.95)]'
                : 'w-1.5 h-1.5 bg-slate-400/90 shadow-sm'
            }`}
          />
        )}
      </div>

      {/* Label */}
      <span className="mt-1.5 text-[11px] font-medium text-slate-100 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 group-hover:text-white">
        {title}
      </span>
    </div>
  );
};
