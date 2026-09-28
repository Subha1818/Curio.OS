import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { WallpaperId } from '../types/os';
import { getWallpaperConfig, type WallpaperConfig } from '../data/wallpapers';
import { useAnimationsEnabled } from '../utils/useAnimations';
import { useVoid } from '../context/VoidContext';

interface WallpaperProps {
  id: WallpaperId;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
  color?: string;
  len?: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  color: string;
}

export const Wallpaper: React.FC<WallpaperProps> = ({ id }) => {
  const animationsEnabled = useAnimationsEnabled();
  const { isVoidAwoken } = useVoid();

  // Active and previous wallpapers for smooth ~600ms crossfade
  const [activeId, setActiveId] = useState<WallpaperId>(id);
  const [prevId, setPrevId] = useState<WallpaperId | null>(null);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);

  // VOID.EXE glitch effect state
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [voidNoticed, setVoidNoticed] = useState<boolean>(() => {
    return isVoidAwoken || sessionStorage.getItem('curio_void_noticed') === 'true';
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const lastShootingStarTime = useRef<number>(Date.now());
  const isTabVisibleRef = useRef<boolean>(true);

  // Handle wallpaper switching crossfade
  useEffect(() => {
    if (id !== activeId) {
      setPrevId(activeId);
      setActiveId(id);
      setIsCrossfading(true);

      const timer = setTimeout(() => {
        setPrevId(null);
        setIsCrossfading(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [id, activeId]);

  // VOID.EXE event listener for glitch reaction
  useEffect(() => {
    const handleVoidGlitch = () => {
      setIsGlitching(true);
      setVoidNoticed(true);
      try {
        sessionStorage.setItem('curio_void_noticed', 'true');
      } catch { /* ignore */ }

      setTimeout(() => {
        setIsGlitching(false);
      }, 650);
    };

    window.addEventListener('curio:void-awoken', handleVoidGlitch);
    return () => window.removeEventListener('curio:void-awoken', handleVoidGlitch);
  }, []);

  // Sync if isVoidAwoken becomes true
  useEffect(() => {
    if (isVoidAwoken && !voidNoticed) {
      setVoidNoticed(true);
      try {
        sessionStorage.setItem('curio_void_noticed', 'true');
      } catch { /* ignore */ }
    }
  }, [isVoidAwoken, voidNoticed]);

  // Tab visibility listener to pause canvas rendering when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const activeConfig = useMemo(() => getWallpaperConfig(activeId), [activeId]);
  const prevConfig = useMemo(() => (prevId ? getWallpaperConfig(prevId) : null), [prevId]);

  // Canvas particle animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // If animations are disabled or effect is none, clear and exit
    if (!animationsEnabled || activeConfig.effect === 'none') {
      ctx.clearRect(0, 0, width, height);
      return () => window.removeEventListener('resize', handleResize);
    }

    const isSmall = width < 768;

    // Initialize particles based on wallpaper effect
    particlesRef.current = [];
    shootingStarsRef.current = [];

    if (activeConfig.effect === 'fireflies') {
      const count = isSmall ? 20 : 45;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height * 0.55 + Math.random() * (height * 0.42),
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.4 + 0.2),
          size: Math.random() * 2.2 + 1.2,
          alpha: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.015,
          color: Math.random() > 0.4 ? '250, 204, 21' : '192, 132, 252', // Amber gold or lavender
        });
      }
    } else if (activeConfig.effect === 'rain') {
      const count = isSmall ? 65 : 140;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -1.8, // wind slant
          vy: Math.random() * 12 + 18, // fast falling rain
          size: Math.random() * 1.5 + 0.8,
          alpha: Math.random() * 0.35 + 0.15,
          phase: 0,
          speed: 1,
          len: Math.random() * 22 + 18,
          color: '34, 211, 238',
        });
      }
    } else if (activeConfig.effect === 'petals') {
      const count = isSmall ? 25 : 55;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.random() * 0.9 + 0.6, // wind blowing right
          vy: Math.random() * 0.9 + 0.6, // gently falling
          size: Math.random() * 3.5 + 2.5,
          alpha: Math.random() * 0.45 + 0.55,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.015,
          color: Math.random() > 0.4 ? '244, 114, 182' : '251, 207, 232', // pink / blush
        });
      }
    } else if (activeConfig.effect === 'stars') {
      const count = isSmall ? 40 : 85;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.9,
          vx: 0,
          vy: 0,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.7 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.03 + 0.01,
          color: Math.random() > 0.3 ? '224, 231, 255' : '244, 114, 182',
        });
      }
    }

    let time = 0;

    const render = () => {
      if (!isTabVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      time += 0.03;

      if (activeConfig.effect === 'fireflies') {
        particlesRef.current.forEach((p) => {
          p.phase += p.speed;
          p.x += Math.sin(p.phase) * 0.6 + p.vx;
          p.y += p.vy;

          // Pulse opacity
          const pulseAlpha = Math.max(0.1, Math.min(1, p.alpha * (0.6 + 0.4 * Math.sin(p.phase * 2))));

          if (p.y < height * 0.4) {
            p.y = height * 0.95;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          // Glow halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${pulseAlpha * 0.25})`;
          ctx.fill();

          // Bright center
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${pulseAlpha})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${p.color}, 0.8)`;
          ctx.fill();
        });
      } else if (activeConfig.effect === 'rain') {
        ctx.lineWidth = 1.2;
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * (width + 100);
          }
          if (p.x < -20) p.x = width + 20;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + (p.len ?? 20));
          ctx.strokeStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.stroke();
        });
      } else if (activeConfig.effect === 'petals') {
        particlesRef.current.forEach((p) => {
          p.phase += p.speed;
          p.x += Math.cos(p.phase) * 1.4 + p.vx;
          p.y += p.vy;

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * (width + 100) - 50;
          }
          if (p.x > width + 20) {
            p.x = -20;
          }

          // Draw graceful fluttering sakura blossom petal
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.phase);
          const flutter = Math.abs(Math.sin(p.phase * 2));
          ctx.scale(1, 0.4 + 0.6 * flutter);

          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.5, p.size, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = `rgba(${p.color}, 0.5)`;
          ctx.fill();
          ctx.restore();
        });
      } else if (activeConfig.effect === 'stars') {
        // Twinkling stars
        particlesRef.current.forEach((p) => {
          p.phase += p.speed;
          const currentAlpha = 0.2 + 0.65 * (0.5 + 0.5 * Math.sin(p.phase));

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
          ctx.shadowBlur = p.size > 2 ? 6 : 2;
          ctx.shadowColor = `rgba(${p.color}, 0.7)`;
          ctx.fill();
        });

        // Shooting stars every 5-9 seconds
        const now = Date.now();
        if (now - lastShootingStarTime.current > 6000 + Math.random() * 4000) {
          lastShootingStarTime.current = now;
          shootingStarsRef.current.push({
            x: Math.random() * (width * 0.7) + width * 0.1,
            y: Math.random() * (height * 0.4),
            vx: Math.random() * 10 + 12,
            vy: Math.random() * 4 + 5,
            length: Math.random() * 60 + 80,
            life: 0,
            maxLife: 35,
            color: '255, 255, 255',
          });
        }

        // Render & update shooting stars
        for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
          const s = shootingStarsRef.current[i];
          s.life++;
          s.x += s.vx;
          s.y += s.vy;

          const progress = s.life / s.maxLife;
          const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;

          const tailX = s.x - (s.vx / 15) * s.length;
          const tailY = s.y - (s.vy / 15) * s.length;

          const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(1, `rgba(224, 231, 255, ${Math.max(0, alpha)})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          if (s.life >= s.maxLife) {
            shootingStarsRef.current.splice(i, 1);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeConfig.effect, animationsEnabled]);

  // Helper to render layers for a given wallpaper config
  const renderWallpaperLayers = (config: WallpaperConfig, isAnimated: boolean) => {
    if (config.id === 'classic-dark') {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#06080e] via-[#090d16] to-[#040508]" />
      );
    }

    if (config.id === 'twilight-peaks') {
      return (
        <div className="absolute inset-0 overflow-hidden select-none">
          {/* Layer 0: Sky and Sunset Clouds */}
          {config.layers[0] && (
            <img
              src={config.layers[0]}
              alt="Twilight Sky"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[cloudDrift_75s_ease-in-out_infinite]' : ''
              }`}
            />
          )}

          {/* Layer 1: Mountain Ridges */}
          {config.layers[1] && (
            <img
              src={config.layers[1]}
              alt="Misty Mountains"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[slowParallax_30s_ease-in-out_infinite]' : ''
              }`}
            />
          )}

          {/* Layer 2: Pine Forest Treeline */}
          {config.layers[2] && (
            <img
              src={config.layers[2]}
              alt="Pine Forest"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}
        </div>
      );
    }

    if (config.id === 'sakura-spring') {
      return (
        <div className="absolute inset-0 overflow-hidden select-none">
          {/* Layer 0: Pastel Pink Spring Sky Gradient */}
          {config.layers[0] && (
            <img
              src={config.layers[0]}
              alt="Spring Dawn Sky"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}

          {/* Layer 1: Rolling Green Hills & Cherry Blossom Groves */}
          {config.layers[1] && (
            <img
              src={config.layers[1]}
              alt="Spring Hills"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[slowParallax_35s_ease-in-out_infinite]' : ''
              }`}
            />
          )}

          {/* Layer 2: Overhead Framing Sakura Branches & Blooms */}
          {config.layers[2] && (
            <img
              src={config.layers[2]}
              alt="Sakura Blossoms"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[floatGentle_6s_ease-in-out_infinite]' : ''
              }`}
            />
          )}
        </div>
      );
    }

    if (config.id === 'neon-rain') {
      return (
        <div className="absolute inset-0 overflow-hidden select-none">
          {/* Layer 0: Distant Skyline & Cyber Sky */}
          {config.layers[0] && (
            <img
              src={config.layers[0]}
              alt="Cyber Skyline Back"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}

          {/* Layer 1: Midground Skyscrapers & Flickering Neon Signs */}
          {config.layers[1] && (
            <img
              src={config.layers[1]}
              alt="Skyscrapers Neon"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[neonFlicker_6s_infinite]' : ''
              }`}
            />
          )}

          {/* Layer 2: Foreground Rooftops & Red Aviation Warning Beacons */}
          {config.layers[2] && (
            <img
              src={config.layers[2]}
              alt="City Rooftops"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}
        </div>
      );
    }

    if (config.id === 'dream-void') {
      return (
        <div className="absolute inset-0 overflow-hidden select-none">
          {/* Layer 0: Deep Interstellar Nebula */}
          {config.layers[0] && (
            <img
              src={config.layers[0]}
              alt="Deep Nebula"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[voidPulse_24s_ease-in-out_infinite]' : ''
              }`}
            />
          )}

          {/* Layer 1: Gaseous Dust & Star Clusters */}
          {config.layers[1] && (
            <img
              src={config.layers[1]}
              alt="Nebula Dust"
              className={`absolute inset-0 w-full h-full object-cover select-none ${
                isAnimated ? 'animate-[slowParallax_40s_ease-in-out_infinite]' : ''
              }`}
            />
          )}

          {/* Subtle eerie cosmic eye / watcher star if VOID has noticed you */}
          {voidNoticed && (
            <div
              className={`absolute top-[32%] right-[28%] pointer-events-none ${
                isAnimated ? 'animate-[eyeWatcherGlow_4s_ease-in-out_infinite]' : 'opacity-60'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-rose-500/30 blur-md" />
                <div className="absolute w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_12px_#f43f5e]" />
                <div className="absolute w-1 h-3 rounded-full bg-white opacity-85 rotate-45" />
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden z-0 ${
        isGlitching ? 'animate-wallpaper-glitch' : ''
      }`}
    >
      {/* ── Fading out previous wallpaper during ~600ms crossfade ── */}
      {prevConfig && (
        <div
          className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
            isCrossfading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {renderWallpaperLayers(prevConfig, false)}
        </div>
      )}

      {/* ── Incoming/Active wallpaper with smooth crossfade ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
          isCrossfading ? 'opacity-100' : 'opacity-100'
        }`}
      >
        {renderWallpaperLayers(activeConfig, animationsEnabled)}
      </div>

      {/* ── Lightweight Canvas Particle Overlay ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* ── Subtle Vignette & Dark Overlay for Maximum Readability ── */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5, 7, 15, 0.28) 0%, rgba(3, 4, 10, 0.72) 100%)',
        }}
      />

      {/* Top & bottom gentle gradient tints for taskbar & titlebar contrast */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20" />
    </div>
  );
};
