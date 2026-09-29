import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AppId, WindowState, WindowPosition, WindowSize } from '../types/os';
import { sound } from '../utils/sound';

interface WindowManagerContextType {
  windows: WindowState[];
  activeWindowId: string | null;
  openApp: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, pos: WindowPosition) => void;
  updateSize: (id: string, size: WindowSize, pos?: WindowPosition) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

const APP_CONFIGS: Record<
  AppId,
  { title: string; iconName: string; defaultWidth: number; defaultHeight: number }
> = {
  terminal: { title: 'Curio Terminal', iconName: 'Terminal', defaultWidth: 640, defaultHeight: 440 },
  files: { title: 'File Explorer', iconName: 'Folder', defaultWidth: 720, defaultHeight: 480 },
  music: { title: 'Curio Music Player', iconName: 'Music', defaultWidth: 540, defaultHeight: 520 },
  letterbox: { title: 'LetterBox', iconName: 'LetterBox', defaultWidth: 680, defaultHeight: 520 },
  settings: { title: 'System Settings', iconName: 'Settings', defaultWidth: 580, defaultHeight: 520 },
  void: { title: 'VOID.EXE', iconName: 'Skull', defaultWidth: 460, defaultHeight: 380 },
  socials: { title: "Subbu's Socials", iconName: 'Share2', defaultWidth: 640, defaultHeight: 480 },
  skills: { title: "Subbu's Tech Stack", iconName: 'Cpu', defaultWidth: 680, defaultHeight: 520 },
};

export const WindowManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setMaxZIndex((prev) => {
      const nextZ = prev + 1;
      setWindows((prevWins) =>
        prevWins.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w))
      );
      return nextZ;
    });
  }, []);

  const openApp = useCallback(
    (appId: AppId) => {
      const existing = windows.find((w) => w.appId === appId);

      if (existing) {
        if (existing.isMinimized) {
          // Restore
          setWindows((prev) =>
            prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: false } : w))
          );
        }
        focusWindow(existing.id);
        sound.playClick();
        return;
      }

      // New window creation with cascade positioning
      const config = APP_CONFIGS[appId];
      const offset = (windows.length % 6) * 32;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      const initialX = Math.max(20, Math.min(screenWidth - config.defaultWidth - 20, 80 + offset));
      const initialY = Math.max(30, Math.min(screenHeight - config.defaultHeight - 80, 50 + offset));

      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);

      const newWindow: WindowState = {
        id: `${appId}-${Date.now()}`,
        appId,
        title: config.title,
        iconName: config.iconName,
        position: { x: initialX, y: initialY },
        size: { width: config.defaultWidth, height: config.defaultHeight },
        isMinimized: false,
        isMaximized: false,
        zIndex: newZ,
      };

      setWindows((prev) => [...prev, newWindow]);
      setActiveWindowId(newWindow.id);
      sound.playWindowOpen();
    },
    [windows, maxZIndex, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    sound.playClick();
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    sound.playWindowMinimize();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    sound.playClick();
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          // Restore
          return {
            ...w,
            isMaximized: false,
            position: w.previousBounds ? w.previousBounds.position : w.position,
            size: w.previousBounds ? w.previousBounds.size : w.size,
          };
        } else {
          // Maximize
          return {
            ...w,
            isMaximized: true,
            previousBounds: {
              position: { ...w.position },
              size: { ...w.size },
            },
          };
        }
      })
    );
  }, []);

  const updatePosition = useCallback((id: string, pos: WindowPosition) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: pos } : w))
    );
  }, []);

  const updateSize = useCallback(
    (id: string, size: WindowSize, pos?: WindowPosition) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          return {
            ...w,
            size,
            ...(pos ? { position: pos } : {}),
          };
        })
      );
    },
    []
  );

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        activeWindowId,
        openApp,
        closeWindow,
        minimizeWindow,
        toggleMaximize,
        focusWindow,
        updatePosition,
        updateSize,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  return context;
};
