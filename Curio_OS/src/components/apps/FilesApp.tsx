import React, { useState, useMemo } from 'react';
import {
  Folder,
  FileText,
  Lock,
  Search,
  ChevronRight,
  Heart,
  Unlock,
  Mail,
  FileCode,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Home,
  CheckCircle2,
  FileQuestion,
  Code2,
  Trophy,
  Camera,
  Pen,
  ExternalLink,
  Download,
  Briefcase,
  Image as ImageIcon,
  GraduationCap,
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
  STATIC_DOCUMENTS,
  RESUME_FILES,
  SECRET_FOLDER_FILES,
  type FolderId,
  type FileItem,
} from '../../data/fileSystemData';
import { SecretFolderUnlocker } from './SecretFolderUnlocker';
import { EducationTimeline } from './EducationTimeline';
import {
  portfolioContent,
  type PortfolioProject,
  type PortfolioAchievement,
  type PortfolioPhoto,
  type PortfolioDrawing,
} from '../../data/portfolioContent';

// ── Portfolio union type ─────────────────────────────────────────────────────
type PortfolioItem = PortfolioProject | PortfolioAchievement | PortfolioPhoto | PortfolioDrawing;

// ── Folder icon renderer ─────────────────────────────────────────────────────
const FolderIcon: React.FC<{ iconName: string; isUnlocked?: boolean; className?: string }> = ({
  iconName,
  isUnlocked,
  className = 'w-4 h-4',
}) => {
  switch (iconName) {
    case 'FileText': return <FileText className={`${className} text-amber-400`} />;
    case 'GraduationCap': return <GraduationCap className={`${className} text-emerald-400`} />;
    case 'Code': return <Code2 className={`${className} text-cyan-400`} />;
    case 'Trophy': return <Trophy className={`${className} text-yellow-400`} />;
    case 'Briefcase': return <Briefcase className={`${className} text-rose-400`} />;
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
    'thumbnail' in item && item.thumbnail
      ? item.thumbnail
      : 'banner' in item
      ? item.banner
      : 'image' in item
      ? item.image
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
      style={{ contentVisibility: 'auto', containIntrinsicSize: '240px 180px' }}
      className="group cursor-pointer rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-pink-500/40 transition-all overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] will-change-transform"
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video bg-slate-950/80 overflow-hidden relative">
        {imagePath ? (
          <img
            src={imagePath}
            alt={title}
            loading="lazy"
            decoding="async"
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
        <p className="text-xs font-display font-medium text-slate-200 truncate group-hover:text-purple-300 transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-slate-400 font-sans truncate mt-0.5">{subtitle}</p>
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
        <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span className="truncate font-display text-sm">{project.title}</span>
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

        <div className="p-5 space-y-4 font-sans">
          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <span key={tech} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono">
                {tech}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-2 pt-1 font-sans">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
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

// ── File Preview Modal (for Documents / Secret / Resume folders) ───────────────
const FilePreviewModal: React.FC<{ file: FileItem; onClose: () => void }> = ({ file, onClose }) => {
  const isPdf = file.extension.toLowerCase() === 'pdf' || file.type === 'pdf';

  const renderFileIcon = (f: FileItem) => {
    switch (f.type) {
      case 'text': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-rose-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'code': return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'secret': return <Lock className="w-4 h-4 text-rose-400" />;
      default: return <FileQuestion className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90%] ${
        isPdf ? 'max-w-3xl h-[85vh]' : 'max-w-lg'
      }`}>
        <div className="h-11 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 truncate">
            {renderFileIcon(file)}
            <span className="truncate">{file.name}</span>
            {isPdf && (
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                PDF
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {file.downloadUrl && (
              <a
                href={file.downloadUrl}
                download={file.name}
                onClick={() => sound.playSuccess()}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-medium flex items-center gap-1.5 text-xs shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs flex flex-col">
          {isPdf && file.previewUrl ? (
            <div className="flex-1 flex flex-col space-y-3 min-h-0">
              <div className="flex-1 w-full min-h-[380px] rounded-xl border border-slate-800 overflow-hidden bg-slate-950 shadow-inner">
                <iframe
                  src={`${file.previewUrl}#toolbar=1`}
                  title={file.name}
                  className="w-full h-full min-h-[380px] border-0"
                />
              </div>
              <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-sans">
                <span>Direct PDF rendering active.</span>
                <a
                  href={file.downloadUrl || file.previewUrl}
                  download={file.name}
                  className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1.5 underline"
                >
                  <Download className="w-3.5 h-3.5" /> Save to Computer
                </a>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans pt-1 border-t border-slate-800">
            <span>Size: {file.size}</span>
            <span>Modified: {file.modified}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Resume Folder Dedicated View ──────────────────────────────────────────
const ResumeFolderView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 space-y-3">
      {/* Top Banner Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-indigo-950/50 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Subha_Resume_September_2026.pdf
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-semibold">
                PDF • 308 KB
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-medium">
                Verified Official
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Subhajit Patra (Subbu) • Full-Stack Engineer &amp; Creative Technologist
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href="/assets/resume/Subha_Resume_September_2026.pdf"
            download="Subha_Resume_September_2026.pdf"
            onClick={() => sound.playSuccess()}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Download PDF resume to your computer"
          >
            <Download className="w-4 h-4" />
            <span>Download Resume</span>
          </a>
          <a
            href="/assets/resume/Subha_Resume_September_2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </a>
        </div>
      </div>

      {/* Embedded Live PDF Frame */}
      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl relative flex flex-col min-h-0">
        <iframe
          src="/assets/resume/Subha_Resume_September_2026.pdf#toolbar=1"
          title="Subhajit Patra Resume"
          className="w-full flex-1 border-0 rounded-2xl min-h-[460px]"
        />
        {/* Fallback & details bar */}
        <div className="p-2.5 px-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Official Resume (September 2026 Edition)</span>
          <a
            href="/assets/resume/Subha_Resume_September_2026.pdf"
            download="Subha_Resume_September_2026.pdf"
            onClick={() => sound.playSuccess()}
            className="text-pink-400 hover:text-pink-300 underline font-medium flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Direct Download PDF
          </a>
        </div>
      </div>
    </div>
  );
};


// ── Main FilesApp ─────────────────────────────────────────────────────────────

export const FilesApp: React.FC<{ windowId: string }> = () => {
  const { isLoggedIn, user } = useAuth();

  const [currentFolder, setCurrentFolder] = useState<FolderId>(() => {
    const target = sessionStorage.getItem('curio_files_target_folder') as FolderId | null;
    if (target) {
      sessionStorage.removeItem('curio_files_target_folder');
      return target;
    }
    return 'documents';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const [unlocked, setUnlocked] = useState(false);

  // Preview / detail modals
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);

  // Toast
  const [actionToast, setActionToast] = useState<{ message: string; type: 'mail' | 'donate' } | null>(null);

  // Listen for navigation events from notifications & track activity
  React.useEffect(() => {
    sessionStorage.setItem('curio_files_opened', 'true');
    window.dispatchEvent(new Event('curio_activity_updated'));

    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<FolderId>;
      if (customEvent.detail) {
        setCurrentFolder(customEvent.detail);
        setSearchQuery('');
        setPreviewFile(null);
        setDetailItem(null);
      }
    };

    window.addEventListener('curio_files_navigate', handleNavigate);
    return () => window.removeEventListener('curio_files_navigate', handleNavigate);
  }, []);

  // Track secret folder opening
  React.useEffect(() => {
    if (currentFolder === 'secret') {
      sessionStorage.setItem('curio_secret_folder_opened', 'true');
      window.dispatchEvent(new Event('curio_activity_updated'));
    }
  }, [currentFolder]);

  // ── Folder content resolution ─────────────────────────────────────────────
  const folderDef = FOLDER_DEFINITIONS.find((f) => f.id === currentFolder)!;

  // For documents folder (static admin provided)
  const documentFiles: FileItem[] = useMemo(() => {
    if (currentFolder !== 'documents') return [];
    return STATIC_DOCUMENTS;
  }, [currentFolder]);

  // For resume folder
  const resumeFiles: FileItem[] = useMemo(() => {
    if (currentFolder !== 'resume') return [];
    return RESUME_FILES;
  }, [currentFolder]);

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
    const files = currentFolder === 'documents' ? documentFiles : currentFolder === 'resume' ? resumeFiles : secretFiles;
    if (!searchQuery.trim()) return files;
    return files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [documentFiles, resumeFiles, secretFiles, currentFolder, searchQuery]);

  // Count displayed in sidebar
  const getFolderCount = (fid: FolderId): string | number => {
    if (fid === 'secret') return unlocked ? SECRET_FOLDER_FILES.length : 'Locked';
    if (fid === 'education') return 3;
    if (fid === 'resume') return RESUME_FILES.length;
    if (fid === 'documents') return STATIC_DOCUMENTS.length;
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
      case 'pdf': return <FileText className="w-6 h-6 text-rose-400" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-pink-400" />;
      case 'code': return <FileCode className="w-6 h-6 text-cyan-400" />;
      case 'secret': return <Lock className="w-6 h-6 text-rose-400" />;
      default: return <FileQuestion className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950/95 text-slate-200 select-none overflow-hidden text-sm font-sans relative">

      {/* ── Left Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-900/60 p-3.5 flex flex-col gap-2 backdrop-blur-md">
        <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 text-xs font-medium mb-1 font-sans">
          <Home className="w-3.5 h-3.5 text-purple-400" />
          <span>Home</span>
        </div>

        <div className="space-y-1 pl-1.5 border-l-2 border-slate-800/80 ml-3">
          {FOLDER_DEFINITIONS.map((folder) => {
            const isActive = currentFolder === folder.id;
            const count = getFolderCount(folder.id);

            return (
              <button
                key={folder.id}
                onClick={() => { sound.playClick(); setCurrentFolder(folder.id); setSearchQuery(''); setPreviewFile(null); setDetailItem(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group font-sans ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/35 shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FolderIcon
                    iconName={folder.iconName}
                    isUnlocked={folder.id === 'secret' && unlocked}
                    className="w-4 h-4"
                  />
                  <span className="truncate">{folder.name}</span>
                </div>
                {folder.badge ? (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">
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
        <div className="mt-auto p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-sans">
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
              <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Guest Explorer
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Portfolio folders are public. Explore Subbu's personal notes &amp; manifesto!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30 font-sans">

        {/* Toolbar */}
        <div className="h-11 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-950/40 text-xs">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-slate-400 font-sans">
            <span
              onClick={() => setCurrentFolder('documents')}
              className="hover:text-slate-200 cursor-pointer flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5 text-purple-400" /> Home
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-100 font-medium font-display">{folderDef.name}</span>
            {isPortfolioFolder && (
              <span className="ml-1 text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-sans">
                Portfolio
              </span>
            )}
          </div>

          {/* Right toolbar */}
          {currentFolder !== 'education' ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 text-xs focus-within:border-purple-500/50">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${folderDef.name.toLowerCase()}...`}
                  className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-28 sm:w-40 font-sans"
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
                  title="Grid view"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { sound.playClick(); setViewMode('list'); }}
                  title="List view"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-sans text-slate-400">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>3 milestones recorded</span>
            </div>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className={`flex-1 overflow-y-auto relative overscroll-contain [transform:translateZ(0)] ${
          currentFolder === 'resume' ? 'p-3 flex flex-col' : 'p-5'
        }`}>

          {/* ── Secret Folder Lock Protocol ───────────────────────────────────── */}
          {currentFolder === 'secret' && !unlocked ? (
            <SecretFolderUnlocker
              onUnlock={() => {
                setUnlocked(true);
                sound.playNotification();
                confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
              }}
              onMailSubbu={() => {
                setActionToast({ message: 'Mail to Subhajit Patra initiated. Mail.js gateway ready!', type: 'mail' });
                window.open('mailto:subhajitpatra1818@gmail.com?subject=Permission%20for%20Secret%20Folder%20Access', '_blank');
              }}
              onDonate={() => {
                setActionToast({ message: 'Thank you for your ₹1 thought! UPI QR donation terminal active in v2.0 ❤️', type: 'donate' });
              }}
            />
          ) : currentFolder === 'education' ? (
            /* ── Education Timeline ────────────────────────────────────────── */
            <EducationTimeline key="education-timeline" />
          ) : currentFolder === 'resume' ? (
            /* ── Resume Viewer & Downloader ────────────────────────────────── */
            <ResumeFolderView key="resume-view" />
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
              <p className="text-slate-200 font-semibold text-sm">No files found</p>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                No files match your query in {folderDef.name}.
              </p>
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
                    onClick={() => { sound.playClick(); setUnlocked(false); }}
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
                      className="group p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col items-center text-center gap-2.5 shadow-sm hover:shadow-md hover:scale-[1.02]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
                        {renderFileIcon(file)}
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-medium text-slate-200 truncate group-hover:text-purple-300 transition-colors">{file.name}</p>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-sans">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span className="capitalize">{file.extension}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-950/60 text-slate-400 font-sans text-xs border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Name</th>
                        <th className="py-2.5 px-4 font-medium">Date modified</th>
                        <th className="py-2.5 px-4 font-medium">Type</th>
                        <th className="py-2.5 px-4 font-medium text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredDocFiles.map((file) => (
                        <tr
                          key={file.id}
                          onClick={() => { sound.playClick(); setPreviewFile(file); }}
                          className="hover:bg-purple-500/10 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-4 flex items-center gap-2.5 text-slate-200 group-hover:text-purple-300">
                            {renderFileIcon(file)}
                            <span className="font-medium truncate">{file.name}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-xs">{file.modified}</td>
                          <td className="py-2.5 px-4 text-slate-400 text-xs capitalize">{file.extension} file</td>
                          <td className="py-2.5 px-4 text-right text-slate-400 font-mono text-xs">{file.size}</td>
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
