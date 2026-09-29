import React, { useState } from 'react';
import { socialsData, type SocialProfile } from '../../data/socialsData';
import { useAnimationsEnabled } from '../../utils/useAnimations';
import { sound } from '../../utils/sound';
import { ExternalLink, Radio, Sparkles } from 'lucide-react';

interface SocialCardProps {
  profile: SocialProfile;
  index: number;
  animationsEnabled: boolean;
}

const SocialCard: React.FC<SocialCardProps> = ({ profile, index, animationsEnabled }) => {
  const [transform, setTransform] = useState<string>('perspective(600px) rotateX(0deg) rotateY(0deg)');
  const [isHovered, setIsHovered] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const isComingSoon = !profile.url || profile.url.trim() === '';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!animationsEnabled || isComingSoon) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setTransform(
      `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`
    );
  };

  const handleMouseEnter = () => {
    if (!isComingSoon) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  const handleClick = () => {
    if (isComingSoon || isConnecting) return;
    sound.playClick();
    setIsConnecting(true);

    setTimeout(() => {
      window.open(profile.url, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        setIsConnecting(false);
      }, 500);
    }, 380);
  };

  // Card style with dynamic accent glow
  const cardStyle: React.CSSProperties = {
    transform: animationsEnabled ? transform : 'none',
    transition: isHovered
      ? 'transform 0.1s ease-out, box-shadow 0.25s ease'
      : 'transform 0.4s ease-out, box-shadow 0.3s ease',
    boxShadow:
      isHovered && animationsEnabled
        ? `0 12px 30px -5px ${profile.accent}30, 0 0 20px 2px ${profile.accent}20`
        : '0 4px 15px -2px rgba(0, 0, 0, 0.4)',
    animationDelay: animationsEnabled ? `${index * 80}ms` : '0ms',
  };

  return (
    <div
      style={cardStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`group relative rounded-2xl p-5 border flex flex-col justify-between select-none ${
        animationsEnabled ? 'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both' : ''
      } ${
        isComingSoon
          ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
          : 'bg-slate-900/80 hover:bg-slate-900/95 border-slate-800 hover:border-slate-700/80 cursor-pointer backdrop-blur-md'
      }`}
    >
      {/* Accent corner ambient gradient */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${profile.accent}15 0%, transparent 70%)`,
        }}
      />

      {/* Connecting ripple wave overlay */}
      {isConnecting && (
        <div className="absolute inset-0 rounded-2xl bg-purple-500/10 border-2 border-purple-400 animate-pulse pointer-events-none flex items-center justify-center backdrop-blur-xs">
          <div className="bg-slate-950/90 text-purple-200 border border-purple-500/40 px-3 py-1 rounded-full text-xs font-sans font-medium flex items-center gap-1.5 shadow-lg shadow-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            Connecting...
          </div>
        </div>
      )}

      {/* Top row: Platform Logo + Status Badge */}
      <div className="flex items-start justify-between relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 transition-transform duration-300 group-hover:scale-110 shadow-md"
          style={{
            background: `linear-gradient(135deg, ${profile.accent}20, rgba(15, 23, 42, 0.8))`,
            borderColor: `${profile.accent}40`,
            borderWidth: '1px',
          }}
        >
          <img
            src={profile.logo}
            alt={`${profile.name} logo`}
            className="w-full h-full object-contain filter drop-shadow"
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Status Badge */}
        <div>
          {isComingSoon ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans text-slate-400 bg-slate-800/80 border border-slate-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Coming soon
            </span>
          ) : isConnecting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans bg-pink-500/15 text-pink-300 border border-pink-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              Connecting
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <span
                className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                  animationsEnabled ? 'animate-pulse' : ''
                }`}
              />
              Online
            </span>
          )}
        </div>
      </div>

      {/* Middle/Bottom: Info */}
      <div className="mt-5 space-y-1 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base text-white group-hover:text-purple-200 transition-colors flex items-center gap-1.5">
            {profile.name}
            {!isComingSoon && (
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100" />
            )}
          </h3>
        </div>
        <p className="font-sans text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
          {profile.handle}
        </p>
      </div>

      {/* Bottom Accent line */}
      <div
        className="w-full h-0.5 rounded-full mt-4 transition-all duration-300"
        style={{
          background: isHovered ? profile.accent : 'rgba(51, 65, 85, 0.4)',
          boxShadow: isHovered && animationsEnabled ? `0 0 8px ${profile.accent}` : 'none',
        }}
      />
    </div>
  );
};

export const SocialsApp: React.FC<{ windowId: string }> = () => {
  const animationsEnabled = useAnimationsEnabled();

  return (
    <div className="h-full w-full bg-slate-950/95 text-slate-200 flex flex-col p-4 sm:p-6 select-none overflow-y-auto font-sans relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-display font-semibold text-white flex items-center gap-2">
              Subbu's Transceiver Grid
              <span className="text-[11px] font-sans font-normal text-slate-400">
                v2.5
              </span>
            </h2>
            <p className="text-xs font-sans text-slate-400 flex items-center gap-1.5">
              Connecting to the outside world
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-slate-400 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {socialsData.filter((s) => s.url).length} of {socialsData.length} channels online
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {socialsData.map((profile, index) => (
          <SocialCard
            key={profile.id}
            profile={profile}
            index={index}
            animationsEnabled={animationsEnabled}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-slate-400">
        <div>Click any live transceiver to open in a new tab.</div>
        <div className="text-slate-500">External bridges</div>
      </div>
    </div>
  );
};
