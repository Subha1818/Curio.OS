import { Terminal, Folder, FolderCode, Music, FileText, Settings, Skull, Compass, Gamepad2, MessageSquare, Share2, Cpu } from 'lucide-react';
import { LetterBoxIcon } from './icons/LetterBoxIcon';
import { sound } from '../utils/sound';

interface DesktopIconProps {
  id?: string;
  title: string;
  iconName: string;
  badge?: string;
  isShortcut?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  title,
  iconName,
  badge,
  isShortcut,
  isDisabled,
  isSelected,
  isDragging,
  onSelect,
  onOpen,
}) => {
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
        return <Music className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />;
      case 'LetterBox':
        return <LetterBoxIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />;
      case 'FileText':
        return <FileText className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />;
      case 'Settings':
        return <Settings className="w-8 h-8 text-sky-400 group-hover:rotate-45 transition-transform" />;
      case 'Skull':
        return <Skull className="w-8 h-8 text-rose-500 group-hover:animate-pulse transition-transform" />;
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
          : 'hover:bg-white/10 hover:backdrop-blur-sm cursor-pointer'
      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {/* Icon container */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative transition-all ${
          isDragging
            ? 'bg-indigo-600/40 border border-pink-400/60 shadow-[0_0_20px_rgba(244,114,182,0.4)]'
            : isSelected
            ? 'bg-indigo-600/30 border border-indigo-400/50 shadow-indigo-500/20'
            : 'bg-slate-900/60 border border-white/10 group-hover:border-white/20'
        }`}
      >
        {getIcon()}

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
