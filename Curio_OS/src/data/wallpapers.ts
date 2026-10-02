import type { WallpaperId } from '../types/os';

export interface WallpaperConfig {
  id: WallpaperId;
  name: string;
  layers: string[];
  effect: 'fireflies' | 'rain' | 'stars' | 'petals' | 'none';
  accent: string;
  description: string;
  previewGradient: string;
  tags?: string[];
}

export const WALLPAPERS: WallpaperConfig[] = [
  {
    id: 'twilight-peaks',
    name: 'Twilight Peaks',
    layers: [
      '/assets/wallpapers/twilight/bg.webp',
      '/assets/wallpapers/twilight/mountains.webp',
      '/assets/wallpapers/twilight/forest.webp',
    ],
    effect: 'fireflies',
    accent: '#c084fc',
    description: 'Pixel-art purple & orange sunset over layered misty mountains and dark pine forest',
    previewGradient: 'from-purple-950 via-rose-900 to-amber-950',
    tags: ['Sunset', 'Mountains', 'Fireflies'],
  },
  {
    id: 'sakura-spring',
    name: 'Sakura Spring',
    layers: [
      '/assets/wallpapers/spring/bg.webp',
      '/assets/wallpapers/spring/hills.webp',
      '/assets/wallpapers/spring/blossoms.webp',
    ],
    effect: 'petals',
    accent: '#f472b6',
    description: 'Pixel-art pink sakura cherry blossoms blooming over soft green hills with drifting petals',
    previewGradient: 'from-pink-950 via-rose-900 to-purple-950',
    tags: ['Spring', 'Sakura', 'Pink', 'Blossoms', 'Petals', 'Default'],
  },
  {
    id: 'neon-rain',
    name: 'Neon Rain City',
    layers: [
      '/assets/wallpapers/neon/skyline-back.webp',
      '/assets/wallpapers/neon/skyline-mid.webp',
      '/assets/wallpapers/neon/foreground.webp',
    ],
    effect: 'rain',
    accent: '#22d3ee',
    description: 'Pixel-art cyberpunk night skyline with falling rain streaks and flickering neon signs',
    previewGradient: 'from-slate-950 via-cyan-950 to-purple-950',
    tags: ['Cyberpunk', 'Rain', 'Neon', 'Night'],
  },
  {
    id: 'dream-void',
    name: 'Dream Void',
    layers: [
      '/assets/wallpapers/void/nebula-deep.webp',
      '/assets/wallpapers/void/nebula-dust.webp',
    ],
    effect: 'stars',
    accent: '#818cf8',
    description: 'Deep cosmic nebula in indigo & violet with twinkling starfield and shooting stars',
    previewGradient: 'from-slate-950 via-indigo-950 to-violet-950',
    tags: ['Space', 'Nebula', 'Stars', 'VOID.EXE'],
  },
  {
    id: 'classic-dark',
    name: 'Classic Dark',
    layers: [],
    effect: 'none',
    accent: '#94a3b8',
    description: 'Sleek, low-power minimal pure dark background for focused desktop productivity',
    previewGradient: 'from-slate-950 via-slate-900 to-slate-950',
    tags: ['Minimal', 'OLED', 'Focus', 'Dark'],
  },
];

export const DEFAULT_WALLPAPER_ID: WallpaperId = 'sakura-spring';

export function getWallpaperConfig(id: WallpaperId | string): WallpaperConfig {
  const found = WALLPAPERS.find((w) => w.id === id);
  if (found) return found;

  // Backward compatibility alias mapping for legacy wallpapers
  if (id === 'cosmic-aurora') return WALLPAPERS[3]; // dream-void
  if (id === 'cyber-noir') return WALLPAPERS[2];     // neon-rain
  if (id === 'dream-lavender') return WALLPAPERS[0]; // twilight-peaks
  if (id === 'synth-sunset') return WALLPAPERS[0];   // twilight-peaks
  if (id === 'matrix-green') return WALLPAPERS[2];   // neon-rain

  return WALLPAPERS.find((w) => w.id === DEFAULT_WALLPAPER_ID) || WALLPAPERS[1]; // sakura-spring default
}
