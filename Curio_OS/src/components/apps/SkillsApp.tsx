import React, { useState } from 'react';
import { skillsData } from '../../data/skillsData';
import { useAnimationsEnabled } from '../../utils/useAnimations';
import { Cpu, Code2, Layers, Database, Wrench, Sparkles } from 'lucide-react';

interface SkillCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: string[];
}

const CATEGORIES: SkillCategory[] = [
  {
    id: 'languages',
    title: 'Languages',
    icon: Code2,
    skills: skillsData.languages,
  },
  {
    id: 'frameworksAndLibraries',
    title: 'Frameworks & Libraries',
    icon: Layers,
    skills: skillsData.frameworksAndLibraries,
  },
  {
    id: 'backendAndDatabases',
    title: 'Backend & Databases',
    icon: Database,
    skills: skillsData.backendAndDatabases,
  },
  {
    id: 'toolsAndPlatforms',
    title: 'Tools & Platforms',
    icon: Wrench,
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
        ? '0 12px 30px -5px rgba(192, 132, 252, 0.2), 0 0 20px 2px rgba(192, 132, 252, 0.1)'
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
      className={`group relative rounded-2xl p-5 border flex flex-col justify-between select-none bg-slate-900/80 hover:bg-slate-900/95 border-slate-800 hover:border-purple-500/40 backdrop-blur-md transition-all ${animationsEnabled ? 'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both' : ''
        }`}
    >
      {/* Ambient corner glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"
        style={{
          background: 'radial-gradient(circle at 85% 15%, rgba(192, 132, 252, 0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 space-y-3.5">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-sm font-display font-medium text-slate-100">
            <IconComponent className="w-4 h-4 text-purple-400" />
            <span>{category.title}</span>
          </div>
          <span className="text-xs font-sans text-slate-400 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded-full">
            {category.skills.length} skills
          </span>
        </div>

        {/* Tech Stack Pills List */}
        <div className="flex flex-wrap gap-2 pt-1">
          {category.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-all duration-200 select-none cursor-default bg-purple-500/10 text-purple-200 border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-500/20 hover:shadow-[0_0_10px_rgba(192,132,252,0.25)]"
            >
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-display font-semibold text-white flex items-center gap-2">
              Tech Stack
            </h2>
            <p className="text-xs font-sans text-slate-400 flex items-center gap-1.5">
              Things I actually use, not just resume fluff ✨
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-slate-400 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {totalSkillsCount} tools in the toolbox
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

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-slate-400">
        <div>Continuous learning and production-grade engineering.</div>
        <div className="text-slate-500">Curio.OS Skills Engine</div>
      </div>
    </div>
  );
};
