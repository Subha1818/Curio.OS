import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  Disc3,
  Sparkles,
  ListMusic,
  Radio,
  Music2,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { useMusic } from '../../context/MusicContext';

export const MusicApp: React.FC<{ windowId: string }> = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    progressPercent,
    toastMessage,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    seek,
  } = useMusic();

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekPercent = Math.max(0, Math.min(1, clickX / width));
    seek(seekPercent * duration);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col p-4 select-none relative overflow-hidden font-sans">
      {/* Flirty / Status Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-slate-900/90 text-pink-300 text-xs font-medium border border-pink-500/40 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Turntable Display */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md mb-3 shadow-2xl relative overflow-hidden">
        {/* Ambient neon backglow */}
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Animated Vinyl Turntable */}
        <div className="relative flex-shrink-0 group">
          <div
            className={`w-28 h-28 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border-4 border-slate-700/80 shadow-2xl flex items-center justify-center transition-transform ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '4.5s' }}
          >
            {/* Vinyl grooves */}
            <div className="w-22 h-22 rounded-full border border-slate-600/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-slate-500/40 flex items-center justify-center">
                {/* Center colorful label or Cover Art */}
                {currentTrack.coverArt ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg border border-pink-400/50 flex items-center justify-center bg-slate-900">
                    <img
                      src={currentTrack.coverArt.startsWith('http') ? currentTrack.coverArt : `/tracks/${currentTrack.coverArt}`}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white/40" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tone-arm needle / pulse marker */}
          {isPlaying && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500 shadow-md shadow-pink-500"></span>
            </span>
          )}
        </div>

        {/* Track Info & Dynamic Audio Waveform */}
        <div className="flex-1 text-center sm:text-left min-w-0 w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-indigo-500/20 text-pink-300 border border-pink-500/30 font-semibold flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-pink-400" />
              {currentTrack.tag}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{currentTrack.bpm} BPM</span>
            <span className="text-[10px] text-indigo-300/80 font-mono hidden md:inline">• {currentTrack.mood}</span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight truncate drop-shadow-sm">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-indigo-300 font-medium truncate">{currentTrack.artist}</p>

          {/* Animated Audio Equalizer Bars */}
          <div className="flex items-center justify-center sm:justify-start gap-1 mt-2.5 h-3">
            {[40, 75, 100, 60, 90, 50, 85, 30, 95, 65].map((height, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-pink-500 to-indigo-400 rounded-full transition-all duration-200"
                style={{
                  height: isPlaying ? `${Math.max(15, (height * (progressPercent % 10 + 5)) / 15)}%` : '20%',
                  opacity: isPlaying ? 0.9 : 0.25,
                }}
              />
            ))}
          </div>

          {/* Scrubbable Progress Bar */}
          <div className="mt-2.5 space-y-1">
            <div
              onClick={handleSeek}
              className="w-full bg-slate-800/80 hover:bg-slate-700/80 h-2 rounded-full overflow-hidden cursor-pointer relative group transition-colors"
              title="Click to seek"
            >
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-100 relative"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between px-3 py-2 mb-3 bg-white/[0.02] border border-white/5 rounded-xl">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevTrack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Slider with Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 sm:w-28 accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer transition-all"
            title={`Volume: ${isMuted ? 0 : volume}%`}
          />
          <span className="text-[10px] font-mono text-slate-400 w-7 text-right hidden sm:inline">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>
      </div>

      {/* Playlist Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600/40 text-white border border-indigo-500/50 shadow-sm">
            <ListMusic className="w-3.5 h-3.5" />
            <span>All Tracks ({tracks.length})</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          <span>Curio Vinyl Audio • Plays in background when minimized</span>
        </div>
      </div>

      {/* Tracks List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
        {tracks.map((track, idx) => {
          const isSelected = track.id === currentTrack.id;

          return (
            <div
              key={track.id}
              onClick={() => {
                sound.playClick();
                if (isSelected) {
                  togglePlay();
                } else {
                  playTrack(idx);
                }
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600/35 to-pink-600/25 border border-indigo-400/40 shadow-md'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-xs font-mono flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {track.coverArt && (!isSelected || !isPlaying) ? (
                    <img
                      src={track.coverArt.startsWith('http') ? track.coverArt : `/tracks/${track.coverArt}`}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : isSelected && isPlaying ? (
                    <Disc3 className="w-4 h-4 animate-spin text-white" />
                  ) : isSelected ? (
                    <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                  ) : (
                    <Music2 className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs truncate ${
                      isSelected ? 'text-white font-bold' : 'text-slate-200 font-medium'
                    }`}
                  >
                    {track.title}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="truncate">{track.artist}</span>
                    <span>•</span>
                    <span className="text-[10px] text-indigo-300 font-mono">{track.bpm} BPM</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-400">{track.duration}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Info Hint */}
      <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1 border-t border-white/5 mt-1">
        <Sparkles className="w-3 h-3 text-pink-400" />
        <span>Curio Lo-Fi Player • Handcrafted local tunes</span>
      </div>
    </div>
  );
};
