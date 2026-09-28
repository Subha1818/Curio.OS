import React, { useState } from 'react';
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
import { MiniMusicPlayer } from './MiniMusicPlayer';
import type { AppId, WallpaperId } from '../types/os';
import { useWindowManager } from '../context/WindowManagerContext';

interface DesktopProps {
  currentWallpaper: WallpaperId;
  onSelectWallpaper: (id: WallpaperId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReboot: () => void;
  isJittering?: boolean;
}

export const Desktop: React.FC<DesktopProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  soundEnabled,
  onToggleSound,
  onReboot,
  isJittering = false,
}) => {
  const { windows, openApp } = useWindowManager();
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

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

  const desktopIcons: {
    id: AppId;
    title: string;
    iconName: string;
    badge?: string;
  }[] = [
    { id: 'terminal', title: 'Terminal', iconName: 'Terminal' },
    { id: 'files', title: 'File Explorer', iconName: 'Folder' },
    { id: 'socials', title: 'Socials', iconName: 'Share2' },
    { id: 'music', title: 'Music Player', iconName: 'Music' },
    { id: 'letterbox', title: 'LetterBox', iconName: 'LetterBox' },
    { id: 'settings', title: 'Settings', iconName: 'Settings' },
    { id: 'void', title: 'VOID.EXE', iconName: 'Skull', badge: 'DANGER' },
  ];

  // Handle right-click on desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    // Only open context menu if clicked on background
    if ((e.target as HTMLElement).closest('.window-frame') || (e.target as HTMLElement).closest('.desktop-icon')) {
      return;
    }
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Marquee drag selection
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
      className="relative w-full h-[calc(100vh-48px)] overflow-hidden select-none"
    >
      {/* Dynamic Animated Wallpaper */}
      <Wallpaper id={currentWallpaper} />

      {/* Desktop Icons Grid */}
      <div className="absolute top-6 left-6 flex flex-col flex-wrap gap-4 max-h-[calc(100vh-120px)] z-0">
        {desktopIcons.map((icon) => (
          <div key={icon.id} className="desktop-icon">
            <DesktopIcon
              id={icon.id}
              title={icon.title}
              iconName={icon.iconName}
              badge={icon.badge}
              isSelected={selectedIconId === icon.id}
              onSelect={() => setSelectedIconId(icon.id)}
              onOpen={() => openApp(icon.id)}
            />
          </div>
        ))}
      </div>

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

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenApp={(appId) => openApp(appId)}
          onReboot={onReboot}
        />
      )}
    </div>
  );
};
