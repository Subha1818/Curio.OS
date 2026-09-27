import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  FileText,
  Lock,
  Search,
  ChevronRight,
  Heart,
  Unlock,
  AlertTriangle,
  Mail,
  FileCode,
  Sparkles,
  LayoutGrid,
  List,
  X,
  IndianRupee,
  Home,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Code2,
  Trophy,
  Camera,
  Pen,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import {
  FOLDER_DEFINITIONS,
  AUTH_USER_DOCUMENTS,
  SECRET_FOLDER_FILES,
  type FolderId,
  type FileItem,
} from '../../data/fileSystemData';
import {
  portfolioContent,
  type PortfolioProject,
  type PortfolioAchievement,
  type PortfolioPhoto,
  type PortfolioDrawing,
} from '../../data/portfolioContent';

// ── Portfolio union type ─────────────────────────────────────────────────────
type PortfolioItem = PortfolioProject | PortfolioAchievement | PortfolioPhoto | PortfolioDrawing;

// ── Sincerity Scorer ─────────────────────────────────────────────────────────
function evaluateComplimentScore(text: string): { score: number; feedback: string } {
  const clean = text.toLowerCase().trim();
  if (!clean) return { score: 0, feedback: 'Type a message appreciating Administrator Subbu...' };

  let score = 0;
  if (clean.includes('subbu') || clean.includes('subhajit')) score += 25;
  if (clean.includes('best') || clean.includes('great') || clean.includes('awesome')) score += 15;
  if (clean.includes('love') || clean.includes('marry') || clean.includes('crush')) score += 20;
  if (clean.includes('kind') || clean.includes('good') || clean.includes('sweet')) score += 15;
  if (clean.includes('handsome') || clean.includes('cute') || clean.includes('cutie')) score += 15;
  if (clean.includes('genius') || clean.includes('goat') || clean.includes('legend') || clean.includes('smart')) score += 15;
  if (clean.includes('developer') || clean.includes('coder') || clean.includes('creator')) score += 10;
  if (clean.length > 25) score += 5;
  score = Math.min(100, score);

  let feedback = 'Needs more sincerity... Subbu is waiting.';
  if (score === 100) feedback = 'PERFECT HARMONY! 100% Sincerity achieved. Ready to unlock! 🎉';
  else if (score >= 90) feedback = 'Almost there! Add a touch more adoration to hit exactly 100%.';
  else if (score >= 60) feedback = 'Subbu is smiling, but the lock strictly requires 100% sincerity.';
  else if (score >= 30) feedback = 'Good start, but is that all the love you have for the admin?';

  return { score, feedback };
}

// ── Folder icon renderer ─────────────────────────────────────────────────────
const FolderIcon: React.FC<{ iconName: string; isUnlocked?: boolean; className?: string }> = ({
  iconName,
  isUnlocked,
  className = 'w-4 h-4',
}) => {
  switch (iconName) {
    case 'FileText': return <FileText className={`${className} text-amber-400`} />;
    case 'Code': return <Code2 className={`${className} text-cyan-400`} />;
    case 'Trophy': return <Trophy className={`${className} text-yellow-400`} />;
    case 'Camera': return <Camera className={`${className} text-pink-400`} />;
    case 'Pen': return <Pen className={`${className} text-purple-400`} />;
    case 'Lock':
      return isUnlocked
        ? <Unlock className={`${className} text-emerald-400`} />
        : <Lock className={`${className} text-rose-400`} />;
    default: return <Folder className={`${className} text-indigo-400`} />;
  }
};

// ── Placeholder image card (when image not yet provided) ────────────────────
const PlaceholderCard: React.FC<{ label: string; gradient: string }> = ({ label, gradient }) => (
  <div
    className="w-full h-full flex items-center justify-center rounded-xl text-white/50 text-[10px] font-mono text-center p-2"
    style={{ background: gradient }}
  >
    {label}
  </div>
);

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #0f172a, #312e81, #701a75)',
  'linear-gradient(135deg, #09090b, #1e1b4b, #db2777)',
  'linear-gradient(135deg, #18181b, #831843, #ea580c)',
  'linear-gradient(135deg, #0c0a09, #1c1917, #854d0e)',
  'linear-gradient(135deg, #030712, #1e3a5f, #065f46)',
];

// ── Portfolio Grid Card ───────────────────────────────────────────────────────
const PortfolioCard: React.FC<{
  item: PortfolioItem;
  index: number;
  folderId: FolderId;
  onClick: () => void;
}> = ({ item, index, folderId, onClick }) => {
  const imagePath =
    'banner' in item ? item.banner
    : 'image' in item ? item.image
    : '';

  const title =
    'title' in item ? item.title
    : 'caption' in item && item.caption ? item.caption
    : `Item ${index + 1}`;

  const subtitle =
    folderId === 'projects' && 'techStack' in item
      ? (item as PortfolioProject).techStack.slice(0, 3).join(' · ')
      : folderId === 'achievements' && 'description' in item
      ? (item as PortfolioAchievement).description
      : '';

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-pink-500/40 transition-all overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02]"
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video bg-slate-950/80 overflow-hidden">
        {imagePath ? (
          <img
            src={imagePath}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Replace broken image with gradient placeholder
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                (e.target as HTMLImageElement).style.display = 'none';
                const div = document.createElement('div');
                div.style.cssText = `width:100%;height:100%;background:${PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]};display:flex;align-items:center;justify-content:center`;
                div.innerHTML = `<span style="color:rgba(255,255,255,0.3);font-size:10px;font-family:monospace;text-align:center;padding:8px">Drop image in<br/>public/assets/</span>`;
                parent.appendChild(div);
              }
            }}
          />
        ) : (
          <PlaceholderCard
            label={`Drop image in\npublic/assets/`}
            gradient={PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]}
          />
        )}
      </div>

      {/* Labels */}
      <div className="p-3">
        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-pink-300 transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-slate-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

// ── Project Detail Modal ──────────────────────────────────────────────────────
const ProjectModal: React.FC<{ project: PortfolioProject; onClose: () => void }> = ({ project, onClose }) => (
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="max-w-lg w-full rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90%]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="truncate">{project.title}</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Banner */}
        <div className="w-full aspect-video bg-slate-950 overflow-hidden">
          <img
            src={project.banner}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.background = PLACEHOLDER_GRADIENTS[0]; (e.target as HTMLImageElement).alt = ''; }}
          />
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <span key={tech} className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium">
                {tech}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-2 pt-1">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Achievement Detail Modal ──────────────────────────────────────────────────
const AchievementModal: React.FC<{ achievement: PortfolioAchievement; onClose: () => void }> = ({ achievement, onClose }) => (
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="truncate">{achievement.title}</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full aspect-video bg-slate-950 overflow-hidden">
        <img
          src={achievement.image}
          alt={achievement.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.background = PLACEHOLDER_GRADIENTS[1]; (e.target as HTMLImageElement).alt = ''; }}
        />
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-300">{achievement.description}</p>
      </div>
    </div>
  </div>
);

// ── Photo / Drawing Lightbox Modal ────────────────────────────────────────────
const LightboxModal: React.FC<{
  item: PortfolioPhoto | PortfolioDrawing;
  folderId: 'photography' | 'drawings';
  onClose: () => void;
}> = ({ item, folderId, onClose }) => (
  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-slate-400 hover:text-white flex items-center gap-1.5 text-xs"
      >
        <X className="w-4 h-4" /> Close
      </button>
      <img
        src={item.image}
        alt={item.caption ?? (folderId === 'photography' ? 'Photo' : 'Drawing')}
        className="w-full rounded-2xl shadow-2xl object-contain max-h-[70vh]"
        onError={(e) => {
          (e.target as HTMLImageElement).style.cssText = `background:${PLACEHOLDER_GRADIENTS[2]};min-height:200px;width:100%;border-radius:16px`;
          (e.target as HTMLImageElement).alt = '';
        }}
      />
      {item.caption && (
        <p className="mt-3 text-center text-sm text-slate-400 italic">{item.caption}</p>
      )}
    </div>
  </div>
);

// ── File Preview Modal (for Documents / Secret folders) ───────────────────────
const FilePreviewModal: React.FC<{ file: FileItem; onClose: () => void }> = ({ file, onClose }) => {
  const renderFileIcon = (f: FileItem) => {
    switch (f.type) {
      case 'text': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'code': return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'secret': return <Lock className="w-4 h-4 text-rose-400" />;
      default: return <FileQuestion className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85%]">
        <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 truncate">
            {renderFileIcon(file)}
            <span className="truncate">{file.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
          {file.type === 'image' && file.previewUrl && (
            <div
              className="w-full h-36 rounded-xl border border-slate-700/50 shadow-inner flex items-center justify-center text-white/80 font-sans text-xs p-3 text-center"
              style={{ background: file.previewUrl }}
            >
              <p className="bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md">{file.content}</p>
            </div>
          )}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-slate-300 whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px]">
            {file.content}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans pt-1 border-t border-slate-800">
            <span>Size: {file.size}</span>
            <span>Modified: {file.modified}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main FilesApp ─────────────────────────────────────────────────────────────

export const FilesApp: React.FC<{ windowId: string }> = () => {
  const { isLoggedIn, user } = useAuth();

  const [currentFolder, setCurrentFolder] = useState<FolderId>('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Secret folder state
  const [complimentInput, setComplimentInput] = useState('');
  const [complimentScore, setComplimentScore] = useState(0);
  const [scoreFeedback, setScoreFeedback] = useState('Type a message appreciating Administrator Subbu...');
  const [unlocked, setUnlocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Preview / detail modals
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);

  // Toast
  const [actionToast, setActionToast] = useState<{ message: string; type: 'mail' | 'donate' } | null>(null);

  // Live sincerity scoring
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = evaluateComplimentScore(complimentInput);
      setComplimentScore(result.score);
      setScoreFeedback(result.feedback);
    }, 80);
    return () => clearTimeout(timer);
  }, [complimentInput]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (complimentScore === 100) {
      setUnlocked(true);
      sound.playNotification();
      confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
    } else {
      setFailedAttempts((prev) => prev + 1);
      sound.playAlert();
    }
  };

  // ── Folder content resolution ─────────────────────────────────────────────
  const folderDef = FOLDER_DEFINITIONS.find((f) => f.id === currentFolder)!;

  // For documents folder (auth-gated)
  const documentFiles: FileItem[] = useMemo(() => {
    if (currentFolder !== 'documents') return [];
    return isLoggedIn ? AUTH_USER_DOCUMENTS : [];
  }, [currentFolder, isLoggedIn]);

  // For secret folder
  const secretFiles: FileItem[] = useMemo(() => {
    if (currentFolder !== 'secret') return [];
    return unlocked ? SECRET_FOLDER_FILES : [];
  }, [currentFolder, unlocked]);

  // For portfolio folders
  const portfolioItems: PortfolioItem[] = useMemo(() => {
    switch (currentFolder) {
      case 'projects': return portfolioContent.projects;
      case 'achievements': return portfolioContent.achievements;
      case 'photography': return portfolioContent.photography;
      case 'drawings': return portfolioContent.drawings;
      default: return [];
    }
  }, [currentFolder]);

  const isPortfolioFolder = ['projects', 'achievements', 'photography', 'drawings'].includes(currentFolder);

  // Search filter (for portfolio items by title/caption)
  const filteredPortfolioItems = useMemo(() => {
    if (!searchQuery.trim() || !isPortfolioFolder) return portfolioItems;
    const q = searchQuery.toLowerCase();
    return portfolioItems.filter((item) => {
      const t = 'title' in item ? (item as PortfolioProject | PortfolioAchievement).title : '';
      const c = 'caption' in item ? ((item as PortfolioPhoto | PortfolioDrawing).caption ?? '') : '';
      return t.toLowerCase().includes(q) || c.toLowerCase().includes(q);
    });
  }, [portfolioItems, searchQuery, isPortfolioFolder]);

  // Search filter for document files
  const filteredDocFiles = useMemo(() => {
    const files = currentFolder === 'documents' ? documentFiles : secretFiles;
    if (!searchQuery.trim()) return files;
    return files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [documentFiles, secretFiles, currentFolder, searchQuery]);

  // Count displayed in sidebar
  const getFolderCount = (fid: FolderId): string | number => {
    if (fid === 'secret') return unlocked ? SECRET_FOLDER_FILES.length : 'Locked';
    if (fid === 'documents') return isLoggedIn ? AUTH_USER_DOCUMENTS.length : 0;
    if (fid === 'projects') return portfolioContent.projects.length;
    if (fid === 'achievements') return portfolioContent.achievements.length;
    if (fid === 'photography') return portfolioContent.photography.length;
    if (fid === 'drawings') return portfolioContent.drawings.length;
    return 0;
  };

  // ── Portfolio file icon for list view ─────────────────────────────────────
  const renderFileIcon = (file: FileItem) => {
    switch (file.type) {
      case 'text': return <FileText className="w-6 h-6 text-amber-400" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-pink-400" />;
      case 'code': return <FileCode className="w-6 h-6 text-cyan-400" />;
      case 'secret': return <Lock className="w-6 h-6 text-rose-400" />;
      default: return <FileQuestion className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950/95 text-slate-200 select-none overflow-hidden text-sm font-sans relative">

      {/* ── Left Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-56 border-r border-slate-800/80 bg-slate-900/50 p-3 flex flex-col gap-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
          <Home className="w-3.5 h-3.5 text-indigo-400" />
          <span>HOME</span>
        </div>

        <div className="space-y-0.5 pl-1.5 border-l-2 border-slate-800 ml-3">
          {FOLDER_DEFINITIONS.map((folder) => {
            const isActive = currentFolder === folder.id;
            const count = getFolderCount(folder.id);

            return (
              <button
                key={folder.id}
                onClick={() => { sound.playClick(); setCurrentFolder(folder.id); setSearchQuery(''); setPreviewFile(null); setDetailItem(null); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderIcon
                    iconName={folder.iconName}
                    isUnlocked={folder.id === 'secret' && unlocked}
                  />
                  <span className="truncate">{folder.name}</span>
                </div>
                {folder.badge ? (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 py-0.5 rounded font-mono font-bold tracking-tight">
                    {folder.badge}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div className="mt-auto p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
          {isLoggedIn ? (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                cutie@{user?.username}&apos;s documents synced.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold text-pink-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Guest Explorer
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Portfolio folders are public. Run <span className="text-amber-300 font-mono">login</span> in Terminal for your Documents.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">

        {/* Toolbar */}
        <div className="h-11 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-950/40 text-xs">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <span
              onClick={() => setCurrentFolder('documents')}
              className="hover:text-slate-200 cursor-pointer flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5 text-indigo-400" /> HOME
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-pink-300 font-semibold">{folderDef.name}</span>
            {isPortfolioFolder && (
              <span className="ml-1 text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-sans">
                Public Portfolio
              </span>
            )}
          </div>

          {/* Right toolbar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 text-xs focus-within:border-pink-500/50">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${folderDef.name.toLowerCase()}...`}
                className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-28 sm:w-40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => { sound.playClick(); setViewMode('grid'); }}
                title="Grid View"
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-pink-500/20 text-pink-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { sound.playClick(); setViewMode('list'); }}
                title="List View"
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-pink-500/20 text-pink-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="flex-1 p-5 overflow-y-auto relative">

          {/* ── Secret Folder Lock Screen ───────────────────────────────────── */}
          {currentFolder === 'secret' && !unlocked ? (
            <div className="h-full flex items-center justify-center p-2">
              <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/90 border border-rose-500/30 shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-300 text-sm tracking-widest font-mono">🔐 CLASSIFIED</h3>
                    <p className="text-xs text-slate-300">This folder belongs to Subbu.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Prove that you appreciate the administrator. Compliment Subbu with pure sincerity.
                </p>

                <form onSubmit={handleUnlockSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={complimentInput}
                        onChange={(e) => setComplimentInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={complimentScore !== 100}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 uppercase font-mono ${
                          complimentScore === 100
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-70'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" /> UNLOCK
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                          <Heart
                            className={`w-3.5 h-3.5 ${complimentScore > 0 ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-600'}`}
                          />
                          Compliment Sincerity:
                        </span>
                        <span className={`font-mono font-bold text-xs ${
                          complimentScore === 100 ? 'text-emerald-400' : complimentScore >= 70 ? 'text-pink-400' : 'text-amber-400'
                        }`}>
                          ❤️ {complimentScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            complimentScore === 100 ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-gradient-to-r from-pink-500 to-rose-500'
                          }`}
                          style={{ width: `${complimentScore}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic font-mono pt-0.5">{scoreFeedback}</p>
                    </div>
                  </div>

                  {failedAttempts >= 3 && complimentScore < 100 && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
                        <AlertTriangle className="w-4 h-4" /> 🔐 ACCESS DENIED
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        You&apos;ve tried very hard.<br />
                        Perhaps you should ask the administrator himself.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setActionToast({ message: 'Mail to Subhajit Patra initiated. Mail.js gateway ready!', type: 'mail' }); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" /> MAIL SUBBU
                        </button>
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setActionToast({ message: 'Thank you for your ₹1 thought! UPI QR donation terminal active in v2.0 ❤️', type: 'donate' }); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <IndianRupee className="w-3.5 h-3.5" /> DONATE ₹1
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3 text-pink-400" />
                      {showHint ? 'Hide hints' : 'Need inspiration?'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplimentInput('Subbu is the best, most kind, handsome, awesome, and genius developer. I love your work and would marry your code!')}
                      className="text-[11px] text-pink-400 hover:text-pink-300 font-medium underline"
                    >
                      Fill 100% Sincere Praise
                    </button>
                  </div>

                  {showHint && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-slate-300 space-y-1">
                      <p className="text-indigo-300 font-semibold">Keywords Subbu Loves:</p>
                      <p className="text-slate-400">
                        Include: <span className="text-pink-300">Subbu</span>, <span className="text-amber-300">best</span>, <span className="text-pink-300">love</span>, <span className="text-emerald-300">kind</span>, <span className="text-cyan-300">handsome</span>, <span className="text-pink-300">marry</span>, <span className="text-amber-300">awesome</span>, <span className="text-indigo-300">genius</span>!
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>

          ) : isPortfolioFolder ? (
            /* ── Portfolio Grid View ──────────────────────────────────────── */
            filteredPortfolioItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
                  <FolderIcon iconName={folderDef.iconName} className="w-8 h-8" />
                </div>
                <p className="text-slate-200 font-semibold text-sm">No items found</p>
                {searchQuery && <p className="text-slate-500 text-xs mt-1">Try a different search term.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
                {filteredPortfolioItems.map((item, idx) => (
                  <PortfolioCard
                    key={item.id}
                    item={item}
                    index={idx}
                    folderId={currentFolder}
                    onClick={() => { sound.playClick(); setDetailItem(item); }}
                  />
                ))}
              </div>
            )

          ) : (currentFolder === 'documents' || currentFolder === 'secret') && filteredDocFiles.length === 0 ? (
            /* ── Empty Documents / Secret View ──────────────────────────────── */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
                <FolderIcon iconName={folderDef.iconName} className="w-8 h-8" />
              </div>
              <p className="text-slate-200 font-semibold text-sm">This folder is empty</p>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                {!isLoggedIn
                  ? "Anonymous explorers see empty Documents. Log in via Terminal to sync your notes!"
                  : `No files in ${folderDef.name}.`}
              </p>
              {!isLoggedIn && currentFolder === 'documents' && (
                <div className="mt-4 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-mono">
                  Tip: Check Projects & Achievements — they&apos;re always public!
                </div>
              )}
            </div>

          ) : (
            /* ── Documents / Secret Populated View (Grid + List) ─────────── */
            <div>
              {currentFolder === 'secret' && unlocked && (
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-500/30">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Unlock className="w-4 h-4" /> ACCESS GRANTED — Administrator Subbu Archive Unlocked
                  </div>
                  <button
                    onClick={() => { sound.playClick(); setUnlocked(false); setComplimentInput(''); setComplimentScore(0); }}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Lock Vault
                  </button>
                </div>
              )}

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredDocFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => { sound.playClick(); setPreviewFile(file); }}
                      className="group p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-pink-500/40 transition-all cursor-pointer flex flex-col items-center text-center gap-2.5 shadow-sm hover:shadow-md hover:scale-[1.02]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center group-hover:border-pink-500/30 transition-colors">
                        {renderFileIcon(file)}
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-medium text-slate-200 truncate group-hover:text-pink-300 transition-colors">{file.name}</p>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mt-0.5 font-mono">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.extension.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Name</th>
                        <th className="py-2.5 px-4 font-medium">Date Modified</th>
                        <th className="py-2.5 px-4 font-medium">Type</th>
                        <th className="py-2.5 px-4 font-medium text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredDocFiles.map((file) => (
                        <tr
                          key={file.id}
                          onClick={() => { sound.playClick(); setPreviewFile(file); }}
                          className="hover:bg-pink-500/10 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-4 flex items-center gap-2.5 text-slate-200 group-hover:text-pink-300">
                            {renderFileIcon(file)}
                            <span className="font-medium truncate">{file.name}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">{file.modified}</td>
                          <td className="py-2.5 px-4 text-slate-500 uppercase font-mono text-[10px]">{file.extension} File</td>
                          <td className="py-2.5 px-4 text-right text-slate-400 font-mono text-[11px]">{file.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modals ────────────────────────────────────────────────────── */}
      {detailItem && currentFolder === 'projects' && (
        <ProjectModal project={detailItem as PortfolioProject} onClose={() => setDetailItem(null)} />
      )}
      {detailItem && currentFolder === 'achievements' && (
        <AchievementModal achievement={detailItem as PortfolioAchievement} onClose={() => setDetailItem(null)} />
      )}
      {detailItem && (currentFolder === 'photography' || currentFolder === 'drawings') && (
        <LightboxModal
          item={detailItem as PortfolioPhoto | PortfolioDrawing}
          folderId={currentFolder}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* ── File Preview Modal (Documents / Secret) ──────────────────────────── */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* ── Action Toast ─────────────────────────────────────────────────────── */}
      {actionToast && (
        <div className="absolute bottom-4 right-4 z-50 p-3 rounded-xl bg-slate-900 border border-amber-500/40 shadow-xl max-w-xs text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              {actionToast.type === 'mail' ? <Mail className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 text-rose-400" />}
              {actionToast.type === 'mail' ? 'Mail Client' : 'Support Subbu'}
            </span>
            <button onClick={() => setActionToast(null)} className="text-slate-500 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">{actionToast.message}</p>
        </div>
      )}
    </div>
  );
};
