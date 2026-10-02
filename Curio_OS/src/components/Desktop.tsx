import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wallpaper } from './Wallpaper';
import { DesktopIcon } from './DesktopIcon';
import { Window } from './Window';
import { ContextMenu } from './ContextMenu';
import { TerminalApp } from './apps/TerminalApp';
import { FilesApp } from './apps/FilesApp';
import { MusicApp } from './apps/MusicApp';
import { LetterBoxApp } from './apps/LetterBoxApp';
import { SettingsApp } from './apps/SettingsApp';
import { VoidApp } from './apps/VoidApp';
import { SocialsApp } from './apps/SocialsApp';
import { SkillsApp } from './apps/SkillsApp';
import { GmailApp } from './apps/GmailApp';
import { MiniMusicPlayer } from './MiniMusicPlayer';
import { CursorTrail } from './CursorTrail';
import { MusicRainEffect } from './MusicRainEffect';
import { DesktopCompanion } from './DesktopCompanion';
import type { AppId, WallpaperId } from '../types/os';
import { useWindowManager } from '../context/WindowManagerContext';
import { sound } from '../utils/sound';
import { useAnimationsEnabled } from '../utils/useAnimations';
import { useLetterBoxActivity } from '../utils/useLetterBoxActivity';

interface DesktopProps {
  currentWallpaper: WallpaperId;
  onSelectWallpaper: (id: WallpaperId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReboot: () => void;
  isJittering?: boolean;
}

const GRID_CELL_W = 100;
const GRID_CELL_H = 104;
const GRID_OFFSET_X = 24;
const GRID_OFFSET_Y = 24;

export interface DesktopItem {
  id: string;
  appId?: AppId;
  title: string;
  iconName: string;
  badge?: string;
  targetFolder?: string;
  isShortcut?: boolean;
}

const DESKTOP_APPS: DesktopItem[] = [
  { id: 'terminal', appId: 'terminal', title: 'Terminal', iconName: 'Terminal' },
  { id: 'files', appId: 'files', title: 'File Explorer', iconName: 'Folder' },
  { id: 'socials', appId: 'socials', title: 'Socials', iconName: 'Share2' },
  {
    id: 'projects-shortcut',
    title: 'Projects',
    iconName: 'FolderCode',
    targetFolder: 'projects',
    isShortcut: true,
  },
  { id: 'letterbox', appId: 'letterbox', title: 'LetterBox', iconName: 'LetterBox' },
  { id: 'skills', appId: 'skills', title: 'Skills', iconName: 'Cpu' },
  { id: 'music', appId: 'music', title: 'Music Player', iconName: 'Music' },
  { id: 'settings', appId: 'settings', title: 'Settings', iconName: 'Settings' },
  { id: 'void', appId: 'void', title: 'VOID.EXE', iconName: 'Skull', badge: 'DANGER' },
  { id: 'gmail', appId: 'gmail', title: 'Gmail', iconName: 'Mail' },
];

// Intentional default desktop layout:
// Col 0: Terminal, Socials, LetterBox, Music Player, Settings, VOID.EXE
// Col 1: File Explorer, Skills, Projects (Folder Shortcut)
export const DEFAULT_ICON_GRID: Record<string, { col: number; row: number }> = {
  terminal: { col: 0, row: 0 },
  files: { col: 1, row: 0 },
  socials: { col: 0, row: 1 },
  skills: { col: 1, row: 1 },
  letterbox: { col: 0, row: 2 },
  'projects-shortcut': { col: 1, row: 2 },
  music: { col: 0, row: 3 },
  gmail: { col: 1, row: 3 },
  settings: { col: 0, row: 4 },
  void: { col: 0, row: 5 },
};

const STORAGE_KEY = 'curio_desktop_icon_positions_v4';

// Helper to compute default icon positions matching screenshot 1 layout
const computeDefaultPositions = (
  apps: { id: string }[]
): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};

  apps.forEach((app, idx) => {
    const grid = DEFAULT_ICON_GRID[app.id] ?? { col: Math.floor(idx / 6), row: idx % 6 };
    positions[app.id] = {
      x: GRID_OFFSET_X + grid.col * GRID_CELL_W,
      y: GRID_OFFSET_Y + grid.row * GRID_CELL_H,
    };
  });
  return positions;
};

// Helper to snap icon to nearest grid cell, resolving collisions with other icons
const snapToGrid = (
  rawX: number,
  rawY: number,
  iconId: string,
  currentPositions: Record<string, { x: number; y: number }>,
  screenWidth: number,
  screenHeight: number
) => {
  const maxCols = Math.max(0, Math.floor((screenWidth - GRID_OFFSET_X - 100) / GRID_CELL_W));
  const maxRows = Math.max(0, Math.floor((screenHeight - GRID_OFFSET_Y - 120) / GRID_CELL_H));

  let targetCol = Math.max(0, Math.min(maxCols, Math.round((rawX - GRID_OFFSET_X) / GRID_CELL_W)));
  let targetRow = Math.max(0, Math.min(maxRows, Math.round((rawY - GRID_OFFSET_Y) / GRID_CELL_H)));

  const isOccupied = (c: number, r: number) => {
    const checkX = GRID_OFFSET_X + c * GRID_CELL_W;
    const checkY = GRID_OFFSET_Y + r * GRID_CELL_H;
    return Object.entries(currentPositions).some(
      ([id, pos]) => id !== iconId && pos.x === checkX && pos.y === checkY
    );
  };

  // If cell is occupied, find the nearest open slot
  if (isOccupied(targetCol, targetRow)) {
    let found = false;
    for (let radius = 1; radius <= Math.max(maxCols, maxRows) + 2; radius++) {
      for (let dc = -radius; dc <= radius; dc++) {
        for (let dr = -radius; dr <= radius; dr++) {
          const testC = targetCol + dc;
          const testR = targetRow + dr;
          if (testC >= 0 && testC <= maxCols && testR >= 0 && testR <= maxRows && !isOccupied(testC, testR)) {
            targetCol = testC;
            targetRow = testR;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
  }

  return {
    x: GRID_OFFSET_X + targetCol * GRID_CELL_W,
    y: GRID_OFFSET_Y + targetRow * GRID_CELL_H,
  };
};

export const Desktop: React.FC<DesktopProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  soundEnabled,
  onToggleSound,
  onReboot,
  isJittering = false,
}) => {
  const { windows, activeWindowId, openApp } = useWindowManager();
  const animationsEnabled = useAnimationsEnabled();
  const hasNewLetters = useLetterBoxActivity();
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  // Skip stagger or let it complete after 1.2s so it doesn't interfere with later interactions
  useEffect(() => {
    if (!animationsEnabled) {
      setHasEntered(true);
      return;
    }
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [animationsEnabled]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Marquee Selection Box State
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);

  // Desktop Icon Positions (persisted to localStorage)
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const defaults = computeDefaultPositions(DESKTOP_APPS);
    try {
      localStorage.removeItem('curio_desktop_icon_positions');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const result: Record<string, { x: number; y: number }> = { ...parsed };
        for (const app of DESKTOP_APPS) {
          if (!result[app.id]) {
            const defPos = defaults[app.id] || { x: GRID_OFFSET_X, y: GRID_OFFSET_Y };
            result[app.id] = snapToGrid(defPos.x, defPos.y, app.id, result, screenW, screenH);
          }
        }
        return result;
      }
    } catch {}
    return defaults;
  });

  // Active dragging state
  const [draggingIcon, setDraggingIcon] = useState<{
    id: string;
    currentX: number;
    currentY: number;
  } | null>(null);

  const dragPointerRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    iconStartX: number;
    iconStartY: number;
    hasMoved: boolean;
    targetEl: HTMLElement | null;
  } | null>(null);

  const preventClickRef = useRef(false);

  // Auto-arrange icons back to default grid layout
  const handleAutoArrange = useCallback(() => {
    sound.playClick();
    const defaults = computeDefaultPositions(DESKTOP_APPS);
    setIconPositions(defaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch {}
  }, []);

  // Helper to open File Explorer at a specific folder
  const openFileExplorer = useCallback((targetFolder?: string) => {
    if (targetFolder) {
      sessionStorage.setItem('curio_files_target_folder', targetFolder);
    }
    openApp('files');
    if (targetFolder) {
      window.dispatchEvent(new CustomEvent('curio_files_navigate', { detail: targetFolder }));
    }
  }, [openApp]);

  // Handle launch of any desktop icon (app or folder shortcut)
  const handleLaunchItem = useCallback((item: DesktopItem) => {
    if (item.targetFolder) {
      openFileExplorer(item.targetFolder);
    } else if (item.appId) {
      openApp(item.appId);
    }
  }, [openFileExplorer, openApp]);

  // Keyboard shortcut: Press Enter to open currently selected desktop icon
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedIconId) {
        const item = DESKTOP_APPS.find((a) => a.id === selectedIconId);
        if (item) {
          handleLaunchItem(item);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIconId, handleLaunchItem]);

  // Window resize handler: ensure icons stay within screen
  useEffect(() => {
    const handleResize = () => {
      setIconPositions((prev) => {
        let changed = false;
        const updated = { ...prev };
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        for (const [id, pos] of Object.entries(prev)) {
          const clampedX = Math.max(GRID_OFFSET_X, Math.min(screenW - 110, pos.x));
          const clampedY = Math.max(GRID_OFFSET_Y, Math.min(screenH - 150, pos.y));
          if (clampedX !== pos.x || clampedY !== pos.y) {
            updated[id] = { x: clampedX, y: clampedY };
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Icon Pointer Handlers (Draggable with 120fps direct transform)
  const handleIconPointerDown = (e: React.PointerEvent, itemId: string) => {
    if (e.button !== 0) return; // Only primary mouse button
    e.stopPropagation();

    const currentPos = iconPositions[itemId] || { x: GRID_OFFSET_X, y: GRID_OFFSET_Y };
    const el = e.currentTarget as HTMLElement;

    dragPointerRef.current = {
      id: itemId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      iconStartX: currentPos.x,
      iconStartY: currentPos.y,
      hasMoved: false,
      targetEl: el,
    };
  };

  const handleGlobalPointerMove = (e: React.PointerEvent) => {
    if (!dragPointerRef.current) return;
    const { startX, startY, iconStartX, iconStartY, pointerId, targetEl } = dragPointerRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragPointerRef.current.hasMoved) {
      if (Math.hypot(dx, dy) >= 6) {
        dragPointerRef.current.hasMoved = true;
        setSelectedIconId(dragPointerRef.current.id);
        if (targetEl) {
          try {
            targetEl.setPointerCapture(pointerId);
          } catch {}
        }
      } else {
        return;
      }
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 110, iconStartX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 150, iconStartY + dy));

    setDraggingIcon({
      id: dragPointerRef.current.id,
      currentX: newX,
      currentY: newY,
    });
  };

  const handleGlobalPointerUp = () => {
    if (!dragPointerRef.current) return;
    const { id, hasMoved, pointerId, targetEl } = dragPointerRef.current;
    dragPointerRef.current = null;

    if (targetEl) {
      try {
        targetEl.releasePointerCapture(pointerId);
      } catch {}
    }

    if (hasMoved && draggingIcon) {
      // Completed drag: snap cleanly to grid!
      const snapped = snapToGrid(
        draggingIcon.currentX,
        draggingIcon.currentY,
        id,
        iconPositions,
        window.innerWidth,
        window.innerHeight
      );

      const nextPositions = { ...iconPositions, [id]: snapped };
      setIconPositions(nextPositions);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPositions));
      } catch {}

      sound.playClick();
      setDraggingIcon(null);

      // Prevent triggering click on drop
      preventClickRef.current = true;
      setTimeout(() => {
        preventClickRef.current = false;
      }, 150);
    } else {
      setDraggingIcon(null);
    }
  };

  // Handle right-click on desktop background
  const handleContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-frame') || (e.target as HTMLElement).closest('.desktop-icon')) {
      return;
    }
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Marquee drag selection on desktop background
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.window-frame') || (e.target as HTMLElement).closest('.desktop-icon')) {
      return;
    }
    setSelectedIconId(null);
    setContextMenu(null);
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isSelecting: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox || !selectionBox.isSelecting) return;
    setSelectionBox((prev) =>
      prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
    );
  };

  const handleMouseUp = () => {
    if (selectionBox && selectionBox.isSelecting) {
      setSelectionBox(null);
    }
  };

  const renderAppContent = (appId: AppId, windowId: string) => {
    switch (appId) {
      case 'terminal':
        return <TerminalApp windowId={windowId} />;
      case 'files':
        return <FilesApp windowId={windowId} />;
      case 'music':
        return <MusicApp windowId={windowId} />;
      case 'letterbox':
        return <LetterBoxApp windowId={windowId} />;
      case 'settings':
        return (
          <SettingsApp
            windowId={windowId}
            currentWallpaper={currentWallpaper}
            onSelectWallpaper={onSelectWallpaper}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            onReboot={onReboot}
          />
        );
      case 'void':
        return <VoidApp windowId={windowId} />;
      case 'socials':
        return <SocialsApp windowId={windowId} />;
      case 'skills':
        return <SkillsApp windowId={windowId} />;
      case 'gmail':
        return <GmailApp windowId={windowId} />;
      default:
        return <div className="p-4 text-slate-300">App under construction</div>;
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onPointerMove={handleGlobalPointerMove}
      onPointerUp={handleGlobalPointerUp}
      onPointerCancel={handleGlobalPointerUp}
      className="relative w-full h-[calc(100vh-52px)] overflow-hidden select-none"
    >
      {/* Dynamic Animated Wallpaper */}
      <Wallpaper id={currentWallpaper} />

      {/* Draggable Desktop Applications */}
      {DESKTOP_APPS.map((icon, index) => {
        const isDraggingThis = draggingIcon?.id === icon.id;
        const pos = isDraggingThis
          ? { x: draggingIcon.currentX, y: draggingIcon.currentY }
          : iconPositions[icon.id] || { x: GRID_OFFSET_X, y: GRID_OFFSET_Y };

        const win = icon.appId ? windows.find((w) => w.appId === icon.appId) : undefined;
        const isOpen = Boolean(win);
        const isActive = Boolean(win && activeWindowId === win.id && !win.isMinimized);
        const hasNewActivity = icon.id === 'letterbox' && hasNewLetters && !isOpen;

        return (
          <div
            key={icon.id}
            className={`desktop-icon absolute select-none ${
              !hasEntered && animationsEnabled && !isDraggingThis
                ? 'animate-desktop-icon-enter'
                : ''
            } ${
              isDraggingThis
                ? 'z-40 scale-105 cursor-grabbing opacity-95 transition-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]'
                : 'z-10 transition-[left,top] duration-200 ease-out cursor-pointer'
            }`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              touchAction: 'none',
              animationDelay:
                !hasEntered && animationsEnabled && !isDraggingThis
                  ? `${index * 70}ms`
                  : undefined,
              animationFillMode:
                !hasEntered && animationsEnabled && !isDraggingThis ? 'both' : undefined,
            }}
            onPointerDown={(e) => handleIconPointerDown(e, icon.id)}
          >
            <DesktopIcon
              id={icon.id}
              title={icon.title}
              iconName={icon.iconName}
              badge={icon.badge}
              isShortcut={icon.isShortcut}
              isSelected={selectedIconId === icon.id}
              isDragging={isDraggingThis}
              isOpen={isOpen}
              isActive={isActive}
              hasNewActivity={hasNewActivity}
              onSelect={() => {
                if (!preventClickRef.current) {
                  setSelectedIconId(icon.id);
                }
              }}
              onOpen={() => {
                if (!preventClickRef.current) {
                  handleLaunchItem(icon);
                }
              }}
            />
          </div>
        );
      })}

      {/* Marquee Selection Box */}
      {selectionBox && selectionBox.isSelecting && (
        <div
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
            width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
          }}
          className="fixed pointer-events-none border border-pink-400/60 bg-pink-500/15 rounded z-40"
        />
      )}

      {/* Windows Manager Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={
          isJittering
            ? { filter: 'hue-rotate(180deg)', transition: 'filter 0.1s' }
            : { filter: 'none', transition: 'filter 0.3s' }
        }
      >
        {windows.map((win) => (
          <div
            key={win.id}
            className="window-frame pointer-events-auto"
            style={
              isJittering
                ? {
                    transform: `translate(${Math.floor(Math.random() * 8 - 4)}px, ${Math.floor(Math.random() * 6 - 3)}px)`,
                    transition: 'transform 0.05s',
                  }
                : { transform: 'none', transition: 'transform 0.2s' }
            }
          >
            <Window windowState={win}>
              {renderAppContent(win.appId, win.id)}
            </Window>
          </div>
        ))}
      </div>

      {/* Movable Floating Mini Music Player Card */}
      <MiniMusicPlayer />

      {/* Atmospheric Lofi Rain on Music Play */}
      <MusicRainEffect />

      {/* Dynamic Cursor Sparkle & Sakura Petal Trail */}
      <CursorTrail />

      {/* Wandering Interactive Desktop Companion (Mochi / Spooky / Byte) */}
      <DesktopCompanion />

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenApp={(appId) => openApp(appId)}
          onAutoArrange={handleAutoArrange}
          onReboot={onReboot}
        />
      )}
    </div>
  );
};
