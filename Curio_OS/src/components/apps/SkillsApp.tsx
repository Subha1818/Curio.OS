import React, { useState } from 'react';
import { skillsData } from '../../data/skillsData';
import { useAnimationsEnabled } from '../../utils/useAnimations';
import { Cpu, Code2, Layers, Database, Wrench, Sparkles } from 'lucide-react';

interface SkillCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  accent: string;
  pillClass: string;
  dotClass: string;
  skills: string[];
}

const CATEGORIES: SkillCategory[] = [
  {
    id: 'languages',
    title: 'Languages',
    icon: Code2,
    iconColor: 'text-pink-400',
    accent: '#ec4899',
    pillClass: 'bg-pink-500/10 text-pink-300 border-pink-500/30 hover:border-pink-400/60 hover:bg-pink-500/20 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)]',
    dotClass: 'bg-pink-400',
    skills: skillsData.languages,
  },
  {
    id: 'frameworksAndLibraries',
    title: 'Frameworks & Libraries',
    icon: Layers,
    iconColor: 'text-cyan-400',
    accent: '#06b6d4',
    pillClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    dotClass: 'bg-cyan-400',
    skills: skillsData.frameworksAndLibraries,
  },
  {
    id: 'backendAndDatabases',
    title: 'Backend & Databases',
    icon: Database,
    iconColor: 'text-emerald-400',
    accent: '#10b981',
    pillClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    dotClass: 'bg-emerald-400',
    skills: skillsData.backendAndDatabases,
  },
  {
    id: 'toolsAndPlatforms',
    title: 'Tools & Platforms',
    icon: Wrench,
    iconColor: 'text-amber-400',
    accent: '#f59e0b',
    pillClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/20 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    dotClass: 'bg-amber-400',
    skills: skillsData.toolsAndPlatforms,
  },
];

interface SkillSectionCardProps {
  category: SkillCategory;
  index: number;
  animationsEnabled: boolean;
}

const SkillSectionCard: React.FC<SkillSectionCardProps> = ({
  category,
  index,
  animationsEnabled,
}) => {
  const [transform, setTransform] = useState<string>('perspective(600px) rotateX(0deg) rotateY(0deg)');
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!animationsEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTransform(
      `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`
    );
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  const cardStyle: React.CSSProperties = {
    transform: animationsEnabled ? transform : 'none',
    transition: isHovered
      ? 'transform 0.1s ease-out, box-shadow 0.25s ease'
      : 'transform 0.4s ease-out, box-shadow 0.3s ease',
    boxShadow:
      isHovered && animationsEnabled
        ? `0 12px 30px -5px ${category.accent}25, 0 0 20px 2px ${category.accent}15`
        : '0 4px 15px -2px rgba(0, 0, 0, 0.4)',
    animationDelay: animationsEnabled ? `${index * 90}ms` : '0ms',
  };

  const IconComponent = category.icon;

  return (
    <div
      style={cardStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-2xl p-5 border flex flex-col justify-between select-none bg-slate-900/80 hover:bg-slate-900/95 border-slate-800 hover:border-slate-700/80 backdrop-blur-md transition-all ${
        animationsEnabled ? 'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both' : ''
      }`}
    >
      {/* Ambient corner glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"
        style={{
          background: `radial-gradient(circle at 85% 15%, ${category.accent}18 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 space-y-3.5">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <IconComponent className={`w-4 h-4 ${category.iconColor}`} />
            <span>{category.title}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded-full">
            {category.skills.length} skills
          </span>
        </div>

        {/* Tech Stack Pills List */}
        <div className="flex flex-wrap gap-2 pt-1">
          {category.skills.map((skill) => (
            <span
              key={skill}
              className={`px-2.5 py-1 rounded-full border text-xs font-mono font-medium transition-all duration-200 select-none inline-flex items-center gap-1.5 cursor-default ${category.pillClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${category.dotClass} opacity-80`} />
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkillsApp: React.FC<{ windowId: string }> = () => {
  const animationsEnabled = useAnimationsEnabled();

  const totalSkillsCount = CATEGORIES.reduce((acc, cat) => acc + cat.skills.length, 0);

  return (
    <div className="h-full w-full bg-slate-950/95 text-slate-200 flex flex-col p-4 sm:p-6 select-none overflow-y-auto font-sans relative">
      {/* Header bar with terminal-ish tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Subbu's Tech Stack
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Matrix v2.0
              </span>
            </h2>
            <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span>&gt;</span> compiling developer capabilities...
              <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse" />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 self-start sm:self-auto">
          <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {totalSkillsCount} Skills Active
          </span>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
        {CATEGORIES.map((category, index) => (
          <SkillSectionCard
            key={category.id}
            category={category}
            index={index}
            animationsEnabled={animationsEnabled}
          />
        ))}
      </div>

      {/* Subtle terminal-ish footer */}
      <div className="mt-auto pt-3 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500">
        <div>Continuous learning &amp; production-grade engineering.</div>
        <div className="text-slate-600">Curio.OS // Skills Engine</div>
      </div>
    </div>
  );
};
