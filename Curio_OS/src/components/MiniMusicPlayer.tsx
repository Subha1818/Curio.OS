import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize2, X, Radio } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { useWindowManager } from '../context/WindowManagerContext';

export const MiniMusicPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    progressPercent,
    isMiniPlayerDismissed,
    setIsMiniPlayerDismissed,
  } = useMusic();

  const { windows, openApp } = useWindowManager();

  // Find if music window is open and minimized
  const musicWindow = windows.find((w) => w.appId === 'music');
  const isMusicWindowOpen = Boolean(musicWindow);
  const isMusicWindowMinimized = musicWindow?.isMinimized ?? false;

  // Show mini-player if:
  // 1. Music is playing AND (music window is minimized OR music window is closed)
  // 2. AND user has not dismissed this mini card
  const shouldShow = (!isMusicWindowOpen || isMusicWindowMinimized) && !isMiniPlayerDismissed && isPlaying;

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return { x: Math.max(20, w - 380), y: Math.max(40, h - 180) };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicked on button
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const newX = Math.max(10, Math.min(screenWidth - 340, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(screenHeight - 140, dragStartRef.current.startY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleOpenFullApp = () => {
    openApp('music');
  };

  if (!shouldShow) return null;

  // On mobile: pin to bottom center, above taskbar
  if (isMobile) {
    return (
      <div
        style={{ position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 9000, width: 'calc(100vw - 32px)', maxWidth: '340px' }}
        className="rounded-2xl bg-slate-900/90 border border-pink-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(236,72,153,0.3)] backdrop-blur-2xl select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        <div className="h-6 px-3 pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-pink-300">
            <Radio className="w-2.5 h-2.5 text-pink-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[9px]">BACKGROUND AUDIO</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleOpenFullApp} title="Expand Music Player" className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <Maximize2 className="w-3 h-3" />
            </button>
            <button onClick={() => setIsMiniPlayerDismissed(true)} title="Dismiss Widget" className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="p-3 pt-1.5 flex items-center gap-3">
          <div onClick={handleOpenFullApp} className="relative flex-shrink-0 cursor-pointer">
            <div className={`w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center transition-transform ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
              {currentTrack.coverArt ? (
                <div className="w-6 h-6 rounded-full overflow-hidden shadow-inner border border-pink-400/50 flex items-center justify-center bg-slate-900">
                  <img src={currentTrack.coverArt.startsWith('http') ? currentTrack.coverArt : `/tracks/${currentTrack.coverArt}`} alt={currentTrack.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                </div>
              )}
            </div>
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
              </span>
            )}
          </div>
          <div onClick={handleOpenFullApp} className="flex-1 min-w-0 cursor-pointer">
            <h4 className="text-xs font-bold text-white tracking-tight truncate hover:text-pink-300 transition-colors">{currentTrack.title}</h4>
            <p className="text-[11px] text-pink-300/80 truncate font-medium">{currentTrack.artist}</p>
            <div className="flex items-center gap-0.5 mt-1 h-2">
              {[40, 80, 100, 60, 90, 50, 75].map((h, i) => (
                <span key={i} className="w-0.5 bg-gradient-to-t from-pink-500 to-indigo-400 rounded-full transition-all duration-150" style={{ height: isPlaying ? `${Math.max(20, (h * (progressPercent % 10 + 5)) / 15)}%` : '20%', opacity: isPlaying ? 0.9 : 0.3 }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={prevTrack} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer" title="Previous"><SkipBack className="w-3.5 h-3.5" /></button>
            <button onClick={togglePlay} className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer" title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer" title="Next"><SkipForward className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="w-full bg-slate-800/80 h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-pink-500 to-rose-400 h-full transition-all duration-150" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen drag overlay to prevent iframe/child mouse interception while moving */}
      {isDragging && <div className="fixed inset-0 z-[99999] cursor-grabbing select-none" />}

      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          position: 'fixed',
          zIndex: 9000,
        }}
        onMouseDown={handleMouseDown}
        className={`w-80 rounded-2xl bg-slate-900/90 border border-pink-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(236,72,153,0.3)] backdrop-blur-2xl select-none transition-shadow overflow-hidden group cursor-grab active:cursor-grabbing animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Ambient background glow */}
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Top Header Tag & Window Controls */}
        <div className="h-6 px-3 pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-pink-300">
            <Radio className="w-2.5 h-2.5 text-pink-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[9px]">BACKGROUND AUDIO</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Open Full Music Player */}
            <button
              onClick={handleOpenFullApp}
              title="Expand Music Player"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {/* Dismiss Mini Card */}
            <button
              onClick={() => setIsMiniPlayerDismissed(true)}
              title="Dismiss Widget"
              className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Player Body */}
        <div className="p-3 pt-1.5 flex items-center gap-3">
          {/* Mini Rotating Vinyl */}
          <div
            onClick={handleOpenFullApp}
            className="relative flex-shrink-0 cursor-pointer group/art"
            title="Click to open Music Player"
          >
            <div
              className={`w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center transition-transform ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '4s' }}
            >
              {currentTrack.coverArt ? (
                <div className="w-6 h-6 rounded-full overflow-hidden shadow-inner border border-pink-400/50 flex items-center justify-center bg-slate-900">
                  <img
                    src={currentTrack.coverArt.startsWith('http') ? currentTrack.coverArt : `/tracks/${currentTrack.coverArt}`}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                </div>
              )}
            </div>
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
              </span>
            )}
          </div>

          {/* Track Info */}
          <div
            onClick={handleOpenFullApp}
            className="flex-1 min-w-0 cursor-pointer"
            title="Click to open full player"
          >
            <h4 className="text-xs font-bold text-white tracking-tight truncate hover:text-pink-300 transition-colors">
              {currentTrack.title}
            </h4>
            <p className="text-[11px] text-pink-300/80 truncate font-medium">{currentTrack.artist}</p>

            {/* Equalizer animation */}
            <div className="flex items-center gap-0.5 mt-1 h-2">
              {[40, 80, 100, 60, 90, 50, 75].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-gradient-to-t from-pink-500 to-indigo-400 rounded-full transition-all duration-150"
                  style={{
                    height: isPlaying ? `${Math.max(20, (h * (progressPercent % 10 + 5)) / 15)}%` : '20%',
                    opacity: isPlaying ? 0.9 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={prevTrack}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Micro Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-pink-500 to-rose-400 h-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>
    </>
  );
};
