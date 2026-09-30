import { useState, useEffect } from 'react';

export type CursorStyleId = 'default' | 'pixel' | 'fairy' | 'heart';

export interface CursorOption {
  id: CursorStyleId;
  name: string;
  iconUrl: string;
  description: string;
  emoji: string;
}

export const CURSOR_OPTIONS: CursorOption[] = [
  {
    id: 'default',
    name: 'Curio Aerodynamic',
    iconUrl: '/assets/cursors/default.svg',
    description: 'Sleek modern pointer with subtle glow',
    emoji: '✨',
  },
  {
    id: 'pixel',
    name: 'Retro 8-Bit Cyber',
    iconUrl: '/assets/cursors/pixel.svg',
    description: 'Iconic chunky pixel arrow with cyan shadow',
    emoji: '👾',
  },
  {
    id: 'fairy',
    name: 'Fairy Wand Sparkle',
    iconUrl: '/assets/cursors/fairy.svg',
    description: 'Magic wand with radiant starburst tip',
    emoji: '🪄',
  },
  {
    id: 'heart',
    name: 'Sweet Pastel Heart',
    iconUrl: '/assets/cursors/heart.svg',
    description: 'Whimsical pink heart pointer for cuties',
    emoji: '💖',
  },
];

export function useCursorStyle(): [CursorStyleId, (style: CursorStyleId) => void] {
  const getSavedStyle = (): CursorStyleId => {
    try {
      const saved = localStorage.getItem('curio_cursor_style');
      if (saved === 'default' || saved === 'pixel' || saved === 'fairy' || saved === 'heart') return saved;
      const theme = localStorage.getItem('curio_theme_settings');
      if (theme) {
        const parsed = JSON.parse(theme);
        if (parsed.cursorStyle) return parsed.cursorStyle;
      }
    } catch { /* ignore */ }
    return 'default';
  };

  const [cursorStyle, setCursorStyleState] = useState<CursorStyleId>(getSavedStyle);

  const applyCursorToDOM = (style: CursorStyleId) => {
    if (typeof document === 'undefined') return;
    document.body.classList.remove(
      'cursor-style-default',
      'cursor-style-pixel',
      'cursor-style-fairy',
      'cursor-style-heart'
    );
    document.body.classList.add(`cursor-style-${style}`);
  };

  const setCursorStyle = (style: CursorStyleId) => {
    setCursorStyleState(style);
    applyCursorToDOM(style);
    try {
      localStorage.setItem('curio_cursor_style', style);
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('curio_cursor_changed', { detail: style }));
  };

  useEffect(() => {
    applyCursorToDOM(cursorStyle);
  }, [cursorStyle]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CursorStyleId>;
      if (customEvent.detail) {
        setCursorStyleState(customEvent.detail);
        applyCursorToDOM(customEvent.detail);
      }
    };
    window.addEventListener('curio_cursor_changed', handleUpdate as EventListener);
    return () => window.removeEventListener('curio_cursor_changed', handleUpdate as EventListener);
  }, []);

  return [cursorStyle, setCursorStyle];
}
