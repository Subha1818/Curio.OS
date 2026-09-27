import React, { useEffect, useRef } from 'react';
import type { WallpaperId } from '../types/os';

interface WallpaperProps {
  id: WallpaperId;
}

export const Wallpaper: React.FC<WallpaperProps> = ({ id }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle settings depending on wallpaper
    const count = id === 'matrix-green' ? 60 : 45;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      char?: string;
    }[] = [];

    const matrixChars = '01CURIO249SUBBU<>/*{}';

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: id === 'matrix-green' ? Math.random() * 2 + 1 : (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (id === 'matrix-green') {
        // Digital rain particles
        ctx.font = '12px "Fira Code", monospace';
        particles.forEach((p) => {
          ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
          ctx.fillText(p.char || '1', p.x, p.y);
          p.y += p.vy;
          if (p.y > height) {
            p.y = 0;
            p.x = Math.random() * width;
          }
        });
      } else {
        // Celestial / ethereal floating orbs & lines
        particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Color per wallpaper theme
          let pColor = '244, 114, 182'; // pink default
          if (id === 'cosmic-aurora') pColor = '165, 180, 252'; // indigo
          if (id === 'cyber-noir') pColor = '56, 189, 248'; // cyan
          if (id === 'dream-lavender') pColor = '216, 180, 254'; // purple
          if (id === 'synth-sunset') pColor = '251, 146, 60'; // orange

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pColor}, ${p.alpha})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${pColor}, 0.8)`;
          ctx.fill();

          // Connect nearby particles
          for (let j = idx + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(${pColor}, ${0.15 * (1 - dist / 100)})`;
              ctx.lineWidth = 0.6;
              ctx.shadowBlur = 0;
              ctx.stroke();
            }
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [id]);

  // CSS background gradient depending on wallpaper
  const getGradientClass = () => {
    switch (id) {
      case 'cosmic-aurora':
        return 'from-[#0b0c1e] via-[#15112e] to-[#080914]';
      case 'cyber-noir':
        return 'from-[#090b10] via-[#0d151c] to-[#040608]';
      case 'dream-lavender':
        return 'from-[#1e1435] via-[#2a1b42] to-[#120a22]';
      case 'synth-sunset':
        return 'from-[#200e1f] via-[#2a1324] to-[#140812]';
      case 'matrix-green':
        return 'from-[#050e09] via-[#08170e] to-[#020503]';
      default:
        return 'from-[#0b0c1e] via-[#15112e] to-[#080914]';
    }
  };

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass()} overflow-hidden select-none -z-10`}>
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-[28rem] h-[28rem] rounded-full bg-pink-500/10 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />

      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
