import React, { useState, useEffect } from 'react';
import {
  Palette,
  Volume2,
  Sparkles,
  MousePointer,
  LogOut,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import { apiSaveUserSettings } from '../../api/authApi';
import type { WallpaperId } from '../../types/os';
import { WALLPAPERS, getWallpaperConfig } from '../../data/wallpapers';
import { useCursorStyle, CURSOR_OPTIONS, type CursorStyleId } from '../../utils/useCursorStyle';

interface SettingsAppProps {
  windowId: string;
  currentWallpaper: WallpaperId;
  onSelectWallpaper: (id: WallpaperId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReboot: () => void;
}

type AccentColor = 'pink' | 'indigo' | 'emerald' | 'amber' | 'cyan';

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
}) => {
  const { user, isLoggedIn, logout, updateUserSettings } = useAuth();
  const [cursorStyle, setCursorStyle] = useCursorStyle();

  // Settings State
  const getInitialSettings = () => {
    if (user?.themeSettings) {
      return user.themeSettings as {
        accentColor?: AccentColor;
        animations?: boolean;
        cursorStyle?: CursorStyleId;
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

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state if user's theme settings change
  useEffect(() => {
    if (user?.themeSettings) {
      const theme = user.themeSettings as {
        accentColor?: AccentColor;
        animations?: boolean;
        cursorStyle?: CursorStyleId;
      };
      if (theme.accentColor) setAccentColor(theme.accentColor);
      if (theme.animations !== undefined) setAnimations(theme.animations);
      if (theme.cursorStyle) setCursorStyle(theme.cursorStyle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.themeSettings]);

  // Handle saving settings to backend and local storage
  const handleSaveSettings = async (
    newAccent?: AccentColor,
    newAnims?: boolean,
    newWp?: WallpaperId,
    newCursor?: CursorStyleId
  ) => {
    const updatedTheme = {
      accentColor: newAccent ?? accentColor,
      animations: newAnims ?? animations,
      cursorStyle: newCursor ?? cursorStyle,
    };
    const targetWp = newWp ?? currentWallpaper;
    const validatedWp = getWallpaperConfig(targetWp).id;

    try {
      localStorage.setItem('curio_theme_settings', JSON.stringify(updatedTheme));
      localStorage.setItem('curio_wallpaper', validatedWp);
      localStorage.setItem('curio_cursor_style', newCursor ?? cursorStyle);
    } catch {}

    window.dispatchEvent(
      new CustomEvent('curio_theme_changed', { detail: updatedTheme })
    );

    if (isLoggedIn) {
      setSaving(true);
      await apiSaveUserSettings(updatedTheme, validatedWp);
      await updateUserSettings({
        wallpaperId: validatedWp,
        themeSettings: updatedTheme,
      });
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="h-full w-full bg-slate-950/95 text-slate-200 flex flex-col p-4 select-none overflow-y-auto text-sm space-y-6 font-sans relative">
      {/* ── User Session Status Header ────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-pink-500/20">
            {isLoggedIn ? (user?.username.charAt(0).toUpperCase() ?? 'U') : '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {isLoggedIn ? `cutie@${user?.username}` : 'cutie@guest'}
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-mono border ${
                  isLoggedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-semibold'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                }`}
              >
                {isLoggedIn ? 'VIP Cloud Sync' : 'Anonymous Explorer'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isLoggedIn
                ? `Synced account: ${user?.email}`
                : 'Preferences are saved locally on this machine.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving ? (
            <span className="text-xs text-pink-400 font-mono animate-pulse">Syncing...</span>
          ) : saveSuccess ? (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
            </span>
          ) : null}

          {isLoggedIn && (
            <button
              onClick={() => {
                sound.playClick();
                logout();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5 text-pink-400" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* ── Personalization: Wallpapers ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Desktop Wallpapers</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {WALLPAPERS.length} Animated Themes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WALLPAPERS.map((wp) => {
            const isSelected = currentWallpaper === wp.id;
            const effectLabel =
              wp.effect === 'fireflies'
                ? '✨ Fireflies'
                : wp.effect === 'petals'
                ? '🌸 Drifting Petals'
                : wp.effect === 'rain'
                ? '🌧 Rain Streaks'
                : wp.effect === 'stars'
                ? '⭐ Starfield'
                : '🖤 Low Power';

            return (
              <div
                key={wp.id}
                onClick={() => {
                  sound.playClick();
                  onSelectWallpaper(wp.id);
                  window.dispatchEvent(new CustomEvent('curio:wallpaper', { detail: wp.id }));
                  handleSaveSettings(undefined, undefined, wp.id);
                }}
                className={`group relative p-3 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'bg-slate-900/90 border-pink-500 ring-2 ring-pink-500/40 shadow-xl shadow-pink-500/10 scale-[1.01]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.01]'
                }`}
              >
                {/* Thumbnail Preview Box with live/animated hover layers */}
                <div
                  className={`relative w-full h-24 rounded-xl overflow-hidden mb-2.5 border border-white/10 bg-gradient-to-br ${wp.previewGradient} flex items-center justify-center shadow-inner group-hover:shadow-lg transition-all duration-300`}
                >
                  {/* Layer previews on hover */}
                  {wp.layers.length > 0 && (
                    <div className="absolute inset-0 overflow-hidden">
                      {wp.layers.map((layerUrl, idx) => (
                        <img
                          key={idx}
                          src={layerUrl}
                          alt=""
                          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                            idx === 1 ? 'group-hover:translate-x-1' : ''
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Dark subtle vignette over thumbnail */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                  {/* Effect Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                    <span className="text-[10px] font-medium text-white/95 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/15">
                      {effectLabel}
                    </span>
                  </div>

                  {/* Active Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="text-[10px] font-bold text-white bg-pink-500/95 px-2.5 py-0.5 rounded-full shadow-lg shadow-pink-500/30 backdrop-blur-sm border border-pink-300/30 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        Active
                      </span>
                    </div>
                  )}

                  {/* Bottom Accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: wp.accent }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: wp.accent }} />
                    {wp.name}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {wp.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Personalization: Cursor Style (New!) ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <MousePointer className="w-4 h-4 text-cyan-400" />
            <span>Pointer &amp; Cursor Style</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Live Custom Cursors</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CURSOR_OPTIONS.map((c) => {
            const isSelected = cursorStyle === c.id;
            return (
              <div
                key={c.id}
                onClick={() => {
                  sound.playClick();
                  setCursorStyle(c.id);
                  handleSaveSettings(undefined, undefined, undefined, c.id);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col items-center text-center relative group ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.02]'
                }`}
              >
                {/* Active check pill */}
                {isSelected && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-400/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}

                {/* Cursor Icon Preview Container */}
                <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <img src={c.iconUrl} alt={c.name} className="w-7 h-7 drop-shadow-md" />
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-100">
                  <span>{c.emoji}</span>
                  <span className="truncate">{c.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  {c.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── UI Accents & Motion Controls ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Theme Accents &amp; Audio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Accent Color picker */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
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
                    accentColor === color.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                      : 'opacity-80'
                  }`}
                >
                  {accentColor === color.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Animations Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Motion Effects</p>
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

          {/* Sound / Chimes Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-200">Audio Chimes</p>
                <p className="text-[10px] text-slate-400">Web Audio synthesis</p>
              </div>
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
      </div>
    </div>
  );
};
