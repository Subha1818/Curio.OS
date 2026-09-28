import React, { useEffect } from 'react';
import { Terminal, Folder, Palette, Info, RotateCcw, LayoutGrid } from 'lucide-react';
import { LetterBoxIcon } from './icons/LetterBoxIcon';
import { sound } from '../utils/sound';
import type { AppId } from '../types/os';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenApp: (appId: AppId) => void;
  onReboot: () => void;
  onAutoArrange?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onOpenApp,
  onReboot,
  onAutoArrange,
}) => {
  useEffect(() => {
    const handleGlobalClick = () => onClose();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [onClose]);

  // Constrain coordinates within screen
  const menuW = 200;
  const menuH = 260;
  const adjustedX = Math.min(x, window.innerWidth - menuW - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuH - 60);

  const items: { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }[] = [
    ...(onAutoArrange
      ? [
          {
            label: 'Auto Arrange Icons',
            icon: <LayoutGrid className="w-4 h-4 text-indigo-400" />,
            action: onAutoArrange,
          },
        ]
      : []),
    {
      label: 'Open Terminal',
      icon: <Terminal className="w-4 h-4 text-pink-400" />,
      action: () => onOpenApp('terminal'),
    },
    {
      label: 'File Explorer',
      icon: <Folder className="w-4 h-4 text-amber-400" />,
      action: () => onOpenApp('files'),
    },
    {
      label: 'Open LetterBox',
      icon: <LetterBoxIcon className="w-4 h-4" animated={false} />,
      action: () => onOpenApp('letterbox'),
    },
    {
      label: 'Change Wallpaper',
      icon: <Palette className="w-4 h-4 text-sky-400" />,
      action: () => onOpenApp('settings'),
    },
    {
      label: 'System Info',
      icon: <Info className="w-4 h-4 text-emerald-400" />,
      action: () => onOpenApp('settings'),
    },
    {
      label: 'Reboot Curio.OS',
      icon: <RotateCcw className="w-4 h-4 text-rose-400" />,
      action: () => onReboot(),
      danger: true,
    },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-48 rounded-xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-2xl p-1.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => {
            sound.playClick();
            item.action();
            onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
            item.danger
              ? 'text-rose-300 hover:bg-rose-500/20'
              : 'text-slate-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
