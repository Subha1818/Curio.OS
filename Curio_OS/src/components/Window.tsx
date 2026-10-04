import React, { useRef, useState, useEffect } from 'react';
import { Minus, X, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import type { WindowState } from '../types/os';
import { useWindowManager } from '../context/WindowManagerContext';

interface WindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ windowState, children }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    updatePosition,
    updateSize,
  } = useWindowManager();

  const isFocused = activeWindowId === windowState.id;
  const windowRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const currentPosRef = useRef({ x: windowState.position.x, y: windowState.position.y });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const resizeDirection = useRef<string>('');
  const resizeStartBounds = useRef({ x: 0, y: 0, w: 0, h: 0, mouseX: 0, mouseY: 0 });
  const currentSizeRef = useRef({ w: windowState.size.width, h: windowState.size.height, x: windowState.position.x, y: windowState.position.y });

  // Keep refs in sync when windowState changes from outside (e.g. tile/maximize)
  const [isOpeningSpring, setIsOpeningSpring] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsOpeningSpring(true);
    const timer = setTimeout(() => setIsOpeningSpring(false), 460);
    return () => clearTimeout(timer);
  }, [windowState.isMinimized]);

  useEffect(() => {

    currentPosRef.current = { x: windowState.position.x, y: windowState.position.y };
    currentSizeRef.current = {
      w: windowState.size.width,
      h: windowState.size.height,
      x: windowState.position.x,
      y: windowState.position.y,
    };
  }, [windowState.position.x, windowState.position.y, windowState.size.width, windowState.size.height]);

  // Handle Dragging (mouse)
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't drag if clicked on window action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    if (windowState.isMaximized || isMobile) return;

    focusWindow(windowState.id);
    setIsDragging(true);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: windowState.position.x,
      winY: windowState.position.y,
    };
    currentPosRef.current = { x: windowState.position.x, y: windowState.position.y };
    e.preventDefault();
  };

  // Handle Dragging (touch)
  const handleHeaderTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (windowState.isMaximized || isMobile) return;
    const touch = e.touches[0];
    focusWindow(windowState.id);
    setIsDragging(true);
    dragStartPos.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      winX: windowState.position.x,
      winY: windowState.position.y,
    };
    currentPosRef.current = { x: windowState.position.x, y: windowState.position.y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.mouseX;
      const dy = e.clientY - dragStartPos.current.mouseY;

      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      // Allow dragging freely across desktop, keeping a small edge visible so it never gets lost
      const newX = Math.max(-windowState.size.width + 100, Math.min(screenWidth - 100, dragStartPos.current.winX + dx));
      const newY = Math.max(0, Math.min(screenHeight - 80, dragStartPos.current.winY + dy));

      currentPosRef.current = { x: newX, y: newY };

      // High-performance direct DOM transform during active drag (butter-smooth 120fps)
      if (windowRef.current) {
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartPos.current.mouseX;
      const dy = touch.clientY - dragStartPos.current.mouseY;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const newX = Math.max(-windowState.size.width + 100, Math.min(screenWidth - 100, dragStartPos.current.winX + dx));
      const newY = Math.max(0, Math.min(screenHeight - 80, dragStartPos.current.winY + dy));

      currentPosRef.current = { x: newX, y: newY };

      if (windowRef.current) {
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Commit final position to React context
      updatePosition(windowState.id, currentPosRef.current);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      updatePosition(windowState.id, currentPosRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, windowState.id, windowState.size.width, updatePosition]);

  // Handle Resizing
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (windowState.isMaximized) return;

    focusWindow(windowState.id);
    setIsResizing(true);
    resizeDirection.current = direction;
    resizeStartBounds.current = {
      x: windowState.position.x,
      y: windowState.position.y,
      w: windowState.size.width,
      h: windowState.size.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    currentSizeRef.current = {
      x: windowState.position.x,
      y: windowState.position.y,
      w: windowState.size.width,
      h: windowState.size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartBounds.current.mouseX;
      const dy = e.clientY - resizeStartBounds.current.mouseY;
      const dir = resizeDirection.current;

      const minW = 340;
      const minH = 240;

      let newW = resizeStartBounds.current.w;
      let newH = resizeStartBounds.current.h;
      let newX = resizeStartBounds.current.x;
      let newY = resizeStartBounds.current.y;

      if (dir.includes('e')) {
        newW = Math.max(minW, resizeStartBounds.current.w + dx);
      }
      if (dir.includes('s')) {
        newH = Math.max(minH, resizeStartBounds.current.h + dy);
      }
      if (dir.includes('w')) {
        const potentialW = resizeStartBounds.current.w - dx;
        if (potentialW >= minW) {
          newW = potentialW;
          newX = resizeStartBounds.current.x + dx;
        }
      }
      if (dir.includes('n')) {
        const potentialH = resizeStartBounds.current.h - dy;
        if (potentialH >= minH) {
          newH = potentialH;
          newY = resizeStartBounds.current.y + dy;
        }
      }

      currentSizeRef.current = { w: newW, h: newH, x: newX, y: newY };

      if (windowRef.current) {
        windowRef.current.style.width = `${newW}px`;
        windowRef.current.style.height = `${newH}px`;
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      updateSize(
        windowState.id,
        { width: currentSizeRef.current.w, height: currentSizeRef.current.h },
        { x: currentSizeRef.current.x, y: currentSizeRef.current.y }
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, windowState.id, updateSize]);

  // Position and dimension styling
  const style: React.CSSProperties = windowState.isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: isMobile ? '100dvh' : 'calc(100vh - 52px)',
        zIndex: windowState.zIndex,
        borderRadius: 0,
        display: windowState.isMinimized ? 'none' : 'flex',
      }
    : {
        position: 'absolute',
        top: `${windowState.position.y}px`,
        left: `${windowState.position.x}px`,
        width: `${windowState.size.width}px`,
        height: `${windowState.size.height}px`,
        zIndex: windowState.zIndex,
        display: windowState.isMinimized ? 'none' : 'flex',
      };

  return (
    <>
      {/* Full-screen drag overlay to prevent mouse capture loss during rapid movement */}
      {(isDragging || isResizing) && (
        <div className="fixed inset-0 z-[99999] cursor-grabbing select-none" />
      )}

      <div
        ref={windowRef}
        style={style}
        onMouseDown={() => focusWindow(windowState.id)}
        className={`flex-col overflow-hidden transition-shadow select-none ${
          isOpeningSpring && !isDragging && !isResizing ? 'animate-window-spring' : ''
        } ${
          windowState.isMaximized ? '' : 'rounded-2xl'
        } ${
          isFocused
            ? 'ring-1 ring-indigo-500/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_20px_rgba(99,102,241,0.25)]'
            : 'ring-1 ring-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Window Header Bar — Drag Handle */}
        <div
          onMouseDown={handleHeaderMouseDown}
          onTouchStart={handleHeaderTouchStart}
          onDoubleClick={() => toggleMaximize(windowState.id)}
          className={`h-10 px-3.5 flex items-center justify-between border-b backdrop-blur-xl transition-colors ${
            isMobile ? 'cursor-default select-none' : 'cursor-grab active:cursor-grabbing'
          } ${
            isFocused
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-100'
              : 'bg-slate-950/70 border-slate-800/60 text-slate-400'
          }`}
          
        >
          {/* Left: Window Traffic Light Controls */}
          <div className="flex items-center gap-2">
            {/* Close */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeWindow(windowState.id);
              }}
              title="Close"
              className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center group transition-colors shadow-sm cursor-pointer"
            >
              <X className="w-2.5 h-2.5 text-rose-950 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
            </button>

            {/* Minimize */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                minimizeWindow(windowState.id);
              }}
              title="Minimize"
              className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5 text-amber-950 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
            </button>

            {/* Maximize */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMaximize(windowState.id);
              }}
              title={windowState.isMaximized ? 'Restore' : 'Maximize'}
              className="w-3.5 h-3.5 rounded-full bg-emerald-400 hover:bg-emerald-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer"
            >
              {windowState.isMaximized ? (
                <Minimize2 className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
              ) : (
                <Maximize2 className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
              )}
            </button>
          </div>

          {/* Center: Title + Drag Cue */}
          <div className="flex items-center gap-1.5 font-display font-medium text-xs sm:text-sm tracking-normal pointer-events-none text-slate-200">
            {!isMobile && <GripHorizontal className="w-3.5 h-3.5 text-slate-500" />}
            <span className="truncate max-w-[200px] sm:max-w-xs">{windowState.title}</span>
          </div>

          {/* Right: Active window glow indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFocused ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-600'
              }`}
            />
          </div>
        </div>

        {/* Window Body */}
        <div className="flex-1 overflow-hidden relative bg-slate-900/90 backdrop-blur-2xl">
          {children}
        </div>

        {/* Resize Handles (only active when not maximized) */}
        {!windowState.isMaximized && (
          <>
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
              className="absolute top-0 right-0 w-1.5 h-full cursor-e-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
              className="absolute top-0 left-0 w-1.5 h-full cursor-w-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
              className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
              className="absolute top-0 left-0 w-full h-1.5 cursor-n-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
              className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
              className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
              className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize"
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
              className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize"
            />
          </>
        )}
      </div>
    </>
  );
};
