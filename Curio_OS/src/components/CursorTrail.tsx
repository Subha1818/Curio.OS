import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  shape: 'star' | 'petal' | 'sparkle';
  rotation: number;
  rotationSpeed: number;
}

const PALETTE = [
  '#f472b6', // Pink
  '#c084fc', // Purple / Lilac
  '#38bdf8', // Sky Cyan
  '#fde047', // Warm Gold
  '#fda4af', // Sakura Rose
];

export const CursorTrail: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;

      // Distance check to avoid clustering when barely moving
      if (lastPosRef.current) {
        const dx = x - lastPosRef.current.x;
        const dy = y - lastPosRef.current.y;
        if (dx * dx + dy * dy < 20) return;
      }
      lastPosRef.current = { x, y };

      // Spawn 2-3 whimsical particles
      const count = Math.random() > 0.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const shapeType: 'star' | 'petal' | 'sparkle' =
          Math.random() < 0.45 ? 'star' : Math.random() < 0.75 ? 'petal' : 'sparkle';
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const spread = (Math.random() - 0.5) * 2.2;
        const maxLife = 35 + Math.random() * 20;

        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: spread * 0.8,
          vy: -0.5 + Math.random() * 1.5,
          size: shapeType === 'star' ? 4 + Math.random() * 3 : 3 + Math.random() * 2.5,
          alpha: 1,
          maxLife,
          life: maxLife,
          color,
          shape: shapeType,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.12,
        });
      }

      // Limit particle count for high performance
      if (particlesRef.current.length > 70) {
        particlesRef.current.splice(0, particlesRef.current.length - 70);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Draw helper: 4-pointed sparkle star
    const drawStar = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      color: string,
      alpha: number
    ) => {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 8;
      context.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const xOuter = cx + Math.cos(angle) * size;
        const yOuter = cy + Math.sin(angle) * size;
        context.lineTo(xOuter, yOuter);

        const innerAngle = angle + Math.PI / 4;
        const xInner = cx + Math.cos(innerAngle) * (size * 0.35);
        const yInner = cy + Math.sin(innerAngle) * (size * 0.35);
        context.lineTo(xInner, yInner);
      }
      context.closePath();
      context.fill();
      context.restore();
    };

    // Draw helper: Sakura petal
    const drawPetal = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      rotation: number,
      color: string,
      alpha: number
    ) => {
      context.save();
      context.translate(cx, cy);
      context.rotate(rotation);
      context.globalAlpha = alpha * 0.9;
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 5;
      context.beginPath();
      context.ellipse(0, 0, size * 1.3, size * 0.7, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= 1;
        p.alpha = Math.max(0, p.life / p.maxLife);
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // subtle gravity
        p.vx *= 0.98; // gentle drag
        p.rotation += p.rotationSpeed;

        if (p.life <= 0 || p.alpha <= 0.01) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.color, p.alpha);
        } else if (p.shape === 'petal') {
          drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
        } else {
          // Circular sparkle
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [enabled]);

  // Don't render on touch-primary devices (no cursor to trail)
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  if (!enabled || isTouchDevice) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99998]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
