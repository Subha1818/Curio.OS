import React, { useState, useMemo } from 'react';
import { useMusic } from '../context/MusicContext';
import { CloudRain } from 'lucide-react';

interface Droplet {
  id: number;
  left: number;
  duration: number;
  delay: number;
  length: number;
  opacity: number;
}

interface Splash {
  id: number;
  left: number;
  bottom: number;
  delay: number;
  duration: number;
  scale: number;
}

export const MusicRainEffect: React.FC = () => {
  const { isPlaying, currentTrack } = useMusic();
  const [rainEnabled, setRainEnabled] = useState(true);

  // Generate 45 realistic rain droplets
  const droplets: Droplet[] = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage across screen
      duration: 0.75 + Math.random() * 0.7, // 0.75s to 1.45s fall time
      delay: Math.random() * 2.5, // staggered start
      length: 24 + Math.random() * 40, // 24px - 64px streak length
      opacity: 0.25 + Math.random() * 0.45,
    }));
  }, []);

  // Generate splash ripples near bottom
  const splashes: Splash[] = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 98 + 1,
      bottom: Math.random() * 45 + 5, // 5px to 50px above taskbar
      delay: Math.random() * 2.0,
      duration: 0.8 + Math.random() * 0.6,
      scale: 0.8 + Math.random() * 0.7,
    }));
  }, []);

  const isVisible = isPlaying && rainEnabled;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[45] transition-opacity duration-1000 overflow-hidden ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Soft ambient moody tint when raining */}
      <div className="absolute inset-0 bg-blue-950/10 backdrop-brightness-[0.96] pointer-events-none transition-colors duration-1000" />

      {/* Falling Raindrops Layer */}
      {droplets.map((drop) => (
        <div
          key={drop.id}
          className="absolute"
          style={{
            left: `${drop.left}%`,
            top: '-60px',
            width: '1.5px',
            height: `${drop.length}px`,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(186, 230, 253, 0.4) 40%, rgba(224, 242, 254, 0.85) 100%)',
            boxShadow: '0 0 4px rgba(186, 230, 253, 0.5)',
            borderRadius: '9999px',
            animation: `raindropFall ${drop.duration}s linear infinite`,
            animationDelay: `${drop.delay}s`,
            opacity: drop.opacity,
          }}
        />
      ))}

      {/* Splash impact ripples */}
      {splashes.map((splash) => (
        <div
          key={splash.id}
          className="absolute rounded-full border border-sky-300/40"
          style={{
            left: `${splash.left}%`,
            bottom: `${splash.bottom}px`,
            width: '16px',
            height: '6px',
            animation: `rainSplash ${splash.duration}s ease-out infinite`,
            animationDelay: `${splash.delay}s`,
            transformOrigin: 'center center',
          }}
        />
      ))}

      {/* Cozy badge in the bottom-left above taskbar */}
      {isVisible && (
        <div className="absolute bottom-16 left-6 pointer-events-auto animate-float">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-sky-400/30 backdrop-blur-md text-xs shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(56,189,248,0.25)] text-sky-200">
            <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              Rain on Music: <span className="text-white font-semibold">{currentTrack.title}</span>
            </span>
            <button
              onClick={() => setRainEnabled(false)}
              className="ml-1 text-[10px] text-slate-400 hover:text-rose-300 transition-colors uppercase font-mono px-1 rounded hover:bg-white/10"
              title="Pause rain animation"
            >
              hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
