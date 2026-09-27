import React from 'react';
import { Terminal, Folder, Music, FileText, Settings, Skull, Compass, Gamepad2, MessageSquare } from 'lucide-react';
import { sound } from '../utils/sound';

interface DesktopIconProps {
  id?: string;
  title: string;
  iconName: string;
  badge?: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  title,
  iconName,
  badge,
  isDisabled,
  isSelected,
  onSelect,
  onOpen,
}) => {
  const getIcon = () => {
    switch (iconName) {
      case 'Terminal':
        return <Terminal className="w-8 h-8 text-pink-400 group-hover:scale-110 transition-transform" />;
      case 'Folder':
        return <Folder className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />;
      case 'Music':
        return <Music className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />;
      case 'FileText':
        return <FileText className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />;
      case 'Settings':
        return <Settings className="w-8 h-8 text-sky-400 group-hover:rotate-45 transition-transform" />;
      case 'Skull':
        return <Skull className="w-8 h-8 text-rose-500 group-hover:animate-pulse transition-transform" />;
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
      className={`group w-24 p-2 rounded-2xl flex flex-col items-center text-center cursor-pointer select-none transition-all relative ${
        isSelected
          ? 'bg-white/15 backdrop-blur-md ring-1 ring-white/30 shadow-lg'
          : 'hover:bg-white/10 hover:backdrop-blur-sm'
      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {/* Icon container */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative transition-all ${
          isSelected
            ? 'bg-indigo-600/30 border border-indigo-400/50 shadow-indigo-500/20'
            : 'bg-slate-900/60 border border-white/10 group-hover:border-white/20'
        }`}
      >
        {getIcon()}

        {badge && (
          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow">
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <span className="mt-1.5 text-[11px] font-medium text-slate-100 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 group-hover:text-white">
        {title}
      </span>
    </div>
  );
};
