import React, { useState, useEffect } from 'react';
import {
  Palette,
  Volume2,
  RotateCcw,
  Sparkles,
  User,
  LogOut,
  Trash2,
  Check,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import { apiSaveUserSettings } from '../../api/authApi';
import type { WallpaperId } from '../../types/os';

interface SettingsAppProps {
  windowId: string;
  currentWallpaper: WallpaperId;
  onSelectWallpaper: (id: WallpaperId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReboot: () => void;
}

type AccentColor = 'pink' | 'indigo' | 'emerald' | 'amber' | 'cyan';
type ClockFormat = '12h' | '24h';

interface WallpaperPreset {
  id: WallpaperId;
  name: string;
  preview: string;
  description: string;
}

const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'cosmic-aurora',
    name: 'Cosmic Aurora',
    preview: 'from-indigo-950 via-purple-900 to-slate-950',
    description: 'Deep celestial nebulae and glowing starlight',
  },
  {
    id: 'cyber-noir',
    name: 'Cyber Noir',
    preview: 'from-slate-950 via-slate-900 to-cyan-950',
    description: 'Sleek dark mode with cybernetic cyan reflections',
  },
  {
    id: 'dream-lavender',
    name: 'Dreamy Lavender',
    preview: 'from-purple-900 via-pink-900 to-indigo-950',
    description: 'Pastel dreamscape with warm ethereal glows',
  },
  {
    id: 'synth-sunset',
    name: 'Synthwave Sunset',
    preview: 'from-rose-950 via-purple-950 to-amber-950',
    description: 'Neon dusk horizon inspired by 80s chillwave',
  },
  {
    id: 'matrix-green',
    name: 'Matrix Minimal',
    preview: 'from-slate-950 via-emerald-950 to-slate-950',
    description: 'Subtle cyberpunk emerald grid aesthetic',
  },
];

const ACCENT_COLORS: { id: AccentColor; name: string; bgClass: string; borderClass: string }[] = [
  { id: 'pink', name: 'Cosmic Pink', bgClass: 'bg-pink-500', borderClass: 'border-pink-500' },
  { id: 'indigo', name: 'Cyber Indigo', bgClass: 'bg-indigo-500', borderClass: 'border-indigo-500' },
  { id: 'emerald', name: 'Matrix Emerald', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500' },
  { id: 'amber', name: 'Synth Amber', bgClass: 'bg-amber-400', borderClass: 'border-amber-400' },
  { id: 'cyan', name: 'Neon Cyan', bgClass: 'bg-cyan-400', borderClass: 'border-cyan-400' },
];

export const SettingsApp: React.FC<SettingsAppProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  soundEnabled,
  onToggleSound,
  onReboot,
}) => {
  const { user, isLoggedIn, logout, updateUserSettings, deleteAccount } = useAuth();

  // Settings State
  const getInitialSettings = () => {
    if (user?.themeSettings) {
      return user.themeSettings as {
        accentColor?: AccentColor;
        animations?: boolean;
        clockFormat?: ClockFormat;
      };
    }
    try {
      const saved = localStorage.getItem('curio_theme_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  };

  const initialTheme = getInitialSettings();

  const [accentColor, setAccentColor] = useState<AccentColor>(initialTheme.accentColor || 'pink');
  const [animations, setAnimations] = useState<boolean>(initialTheme.animations !== false);
  const [clockFormat, setClockFormat] = useState<ClockFormat>(initialTheme.clockFormat || '12h');

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Delete Account Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state if user's theme settings change
  useEffect(() => {
    if (user?.themeSettings) {
      const theme = user.themeSettings as {
        accentColor?: AccentColor;
        animations?: boolean;
        clockFormat?: ClockFormat;
      };
      if (theme.accentColor) setAccentColor(theme.accentColor);
      if (theme.animations !== undefined) setAnimations(theme.animations);
      if (theme.clockFormat) setClockFormat(theme.clockFormat);
    }
  }, [user?.themeSettings]);

  // Handle saving settings to backend and local storage
  const handleSaveSettings = async (
    newAccent?: AccentColor,
    newAnims?: boolean,
    newClock?: ClockFormat,
    newWp?: WallpaperId
  ) => {
    const updatedTheme = {
      accentColor: newAccent ?? accentColor,
      animations: newAnims ?? animations,
      clockFormat: newClock ?? clockFormat,
    };
    const targetWp = newWp ?? currentWallpaper;

    try {
      localStorage.setItem('curio_theme_settings', JSON.stringify(updatedTheme));
    } catch {}

    window.dispatchEvent(
      new CustomEvent('curio_theme_changed', { detail: updatedTheme })
    );

    if (isLoggedIn) {
      setSaving(true);
      await apiSaveUserSettings(updatedTheme, targetWp);
      await updateUserSettings({
        wallpaperId: targetWp,
        themeSettings: updatedTheme,
      });
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    sound.playAlert();
    setDeleting(true);
    await deleteAccount();
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="h-full w-full bg-slate-950/95 text-slate-200 flex flex-col p-4 select-none overflow-y-auto text-sm space-y-5 font-sans relative">
      {/* ── User Account Status Card ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-pink-500/20">
            {isLoggedIn ? (user?.username.charAt(0).toUpperCase() ?? 'U') : '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {isLoggedIn ? `cutie@${user?.username}` : 'cutie@guest'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  isLoggedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-semibold'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                }`}
              >
                {isLoggedIn ? 'Authenticated VIP' : 'Anonymous Explorer'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoggedIn
                ? `Account: ${user?.email} • Sync active with Neon Postgres.`
                : 'Log in via Terminal to sync wallpaper, notes, and theme across sessions.'}
            </p>
          </div>
        </div>

        {saving ? (
          <span className="text-xs text-pink-400 font-mono animate-pulse">Syncing...</span>
        ) : saveSuccess ? (
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" /> Saved!
          </span>
        ) : null}
      </div>

      {/* ── Personalization: Wallpapers ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Palette className="w-4 h-4 text-pink-400" />
          <span>Desktop Wallpapers</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {WALLPAPER_PRESETS.map((wp) => {
            const isSelected = currentWallpaper === wp.id;
            return (
              <div
                key={wp.id}
                onClick={() => {
                  sound.playClick();
                  onSelectWallpaper(wp.id);
                  handleSaveSettings(undefined, undefined, undefined, wp.id);
                }}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-pink-500/15 border-pink-500 ring-2 ring-pink-500/40 shadow-md scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-full h-16 rounded-lg bg-gradient-to-br ${wp.preview} mb-2 shadow-inner border border-white/10 flex items-center justify-center`}
                >
                  {isSelected && (
                    <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-200">{wp.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{wp.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Personalization: Accent Color, Animations, Clock ────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>UI Personalization</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Accent Color picker */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <p className="text-xs font-medium text-slate-200">Accent Color</p>
            <div className="flex items-center gap-2 pt-1">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    sound.playClick();
                    setAccentColor(color.id);
                    handleSaveSettings(color.id);
                  }}
                  title={color.name}
                  className={`w-6 h-6 rounded-full ${color.bgClass} flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                    accentColor === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' : 'opacity-80'
                  }`}
                >
                  {accentColor === color.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Animations Toggle */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Animations</p>
              <p className="text-[10px] text-slate-400">Glassmorphic motion</p>
            </div>
            <button
              onClick={() => {
                const next = !animations;
                sound.playClick();
                setAnimations(next);
                handleSaveSettings(undefined, next);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                animations ? 'bg-pink-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  animations ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Clock Format (12h vs 24h) */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Clock Format</p>
              <p className="text-[10px] text-slate-400">Taskbar timestamp</p>
            </div>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => {
                  sound.playClick();
                  setClockFormat('12h');
                  handleSaveSettings(undefined, undefined, '12h');
                }}
                className={`px-2 py-1 text-[11px] rounded font-mono ${
                  clockFormat === '12h'
                    ? 'bg-pink-500/25 text-pink-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                12h
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setClockFormat('24h');
                  handleSaveSettings(undefined, undefined, '24h');
                }}
                className={`px-2 py-1 text-[11px] rounded font-mono ${
                  clockFormat === '24h'
                    ? 'bg-pink-500/25 text-pink-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                24h
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sound & Audio ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span>Audio Synthesizer</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-200">Web Audio API Synthesis</p>
            <p className="text-[11px] text-slate-400">Harmonic chimes on boot, clicks, window events, and notifications</p>
          </div>

          <button
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                soundEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Account Management (Logged-in Only) ─────────────────────────────── */}
      {isLoggedIn && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Account Details &amp; Danger Zone</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Username (Read-only)</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
                  {user?.username}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Email Address (Read-only)</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playClick();
                  logout();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" /> Logout Session
              </button>

              <button
                onClick={() => {
                  sound.playAlert();
                  setShowDeleteConfirm(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── System Actions (Reboot) ─────────────────────────────────────────── */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>System Operation</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-200">Reboot Curio.OS</p>
            <p className="text-[11px] text-slate-400">Replays full BIOS and desktop boot sequence</p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onReboot();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reboot OS
          </button>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ───────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-5 rounded-2xl bg-slate-900 border border-rose-500/40 shadow-2xl space-y-3.5">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Permanently Delete Account?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete your user profile (<span className="text-pink-400 font-semibold">{user?.username}</span>) and cascade-delete all your saved notes from Neon Postgres.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountConfirm}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
