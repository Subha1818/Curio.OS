import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import tracksData from '../data/tracks.json';
import { sound } from '../utils/sound';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  bpm: number;
  fileName: string;
  tag: string;
  mood: string;
  coverArt?: string;
}

const TRACKS: Track[] = tracksData as Track[];

interface MusicContextType {
  tracks: Track[];
  currentTrackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  progressPercent: number;
  toastMessage: string | null;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  seek: (seconds: number) => void;
  showToast: (msg: string) => void;
  isMiniPlayerDismissed: boolean;
  setIsMiniPlayerDismissed: (dismissed: boolean) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => {
    const durStr = TRACKS[0]?.duration || '3:40';
    const parts = durStr.split(':');
    return parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : 220;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const currentTrack = TRACKS[currentTrackIndex] || TRACKS[0];

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const getAudioUrl = (fileName: string) => {
    return `/tracks/${fileName}`;
  };

  // Sync volume & muted state directly to audio DOM
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Play a specific track by index
  const playTrack = useCallback(
    (index: number) => {
      const track = TRACKS[index];
      if (!track) return;

      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setIsMiniPlayerDismissed(false); // bring mini player back if user changes track

      const audio = audioRef.current;
      if (!audio) return;

      const primaryUrl = getAudioUrl(track.fileName);
      audio.src = primaryUrl;
      audio.load();
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
      audio.muted = isMuted;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Playback error with local path, attempting port 4000 fallback:', err);
            audio.src = `http://localhost:4000/tracks/${track.fileName}`;
            audio.load();
            audio
              .play()
              .then(() => setIsPlaying(true))
              .catch((e) => {
                console.error('Final playback error:', e);
                setIsPlaying(false);
                showToast('Unable to play audio. Check file.');
              });
          });
      }
    },
    [isMuted, volume, showToast]
  );

  const togglePlay = useCallback(() => {
    sound.playClick();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
      audio.muted = isMuted;

      if (!audio.src || !audio.src.includes(currentTrack.fileName)) {
        audio.src = getAudioUrl(currentTrack.fileName);
        audio.load();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsMiniPlayerDismissed(false);
          })
          .catch((err) => {
            console.warn('Primary playback error, trying port 4000:', err);
            audio.src = `http://localhost:4000/tracks/${currentTrack.fileName}`;
            audio.load();
            audio
              .play()
              .then(() => setIsPlaying(true))
              .catch((e) => {
                console.error('Playback error:', e);
                setIsPlaying(false);
                showToast('Unable to stream track.');
              });
          });
      }
    }
  }, [isPlaying, isMuted, volume, currentTrack.fileName, showToast]);

  const nextTrack = useCallback(() => {
    sound.playClick();
    if (TRACKS.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % TRACKS.length;
    playTrack(nextIdx);
  }, [currentTrackIndex, playTrack]);

  const prevTrack = useCallback(() => {
    sound.playClick();
    if (TRACKS.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    playTrack(prevIdx);
  }, [currentTrackIndex, playTrack]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (vol > 0) {
      setIsMuted(false);
    }
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, vol / 100));
      audioRef.current.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    sound.playClick();
    if (isMuted) {
      setIsMuted(false);
      const restoredVol = prevVolume || 50;
      setVolumeState(restoredVol);
      if (audioRef.current) {
        audioRef.current.volume = restoredVol / 100;
        audioRef.current.muted = false;
      }
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
        audioRef.current.muted = true;
      }
    }
  }, [isMuted, prevVolume, volume]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current || !duration) return;
    const clamped = Math.max(0, Math.min(duration, seconds));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <MusicContext.Provider
      value={{
        tracks: TRACKS,
        currentTrackIndex,
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
        showToast,
        isMiniPlayerDismissed,
        setIsMiniPlayerDismissed,
      }}
    >
      {/* Persistent global audio element — stays alive regardless of window state */}
      <audio
        ref={audioRef}
        src={getAudioUrl(currentTrack.fileName)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={nextTrack}
        onError={() => {
          const audio = audioRef.current;
          if (audio && !audio.src.includes(':4000')) {
            console.warn('Audio local path failed, switching to backend :4000 fallback');
            audio.src = `http://localhost:4000/tracks/${currentTrack.fileName}`;
            audio.load();
            if (isPlaying) {
              audio.play().catch(() => {});
            }
          }
        }}
      />
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
