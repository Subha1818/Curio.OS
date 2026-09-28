import { useState, useEffect, useCallback, useRef } from 'react';
import { WindowManagerProvider } from './context/WindowManagerContext';
import { MusicProvider } from './context/MusicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VoidProvider, useVoid } from './context/VoidContext';
import { BootSequence, getTimeBasedGreeting } from './components/BootSequence';
import { Desktop } from './components/Desktop';
import { Taskbar } from './components/Taskbar';
import { StartMenu } from './components/StartMenu';
import { NotificationCenter } from './components/NotificationCenter';
import { LoginPopup } from './components/LoginPopup';
import { NotificationManager } from './components/NotificationManager';
import type { WallpaperId, SystemNotification } from './types/os';
import { DEFAULT_WALLPAPER_ID, getWallpaperConfig } from './data/wallpapers';
import { useCursorStyle } from './utils/useCursorStyle';
import { sound } from './utils/sound';

// ── Inner OS shell (has access to AuthContext + VoidContext) ────────────────
function CurioShell() {
  useCursorStyle();
  const { isLoggedIn, isRestoringSession, user } = useAuth();
  const { isVoidAwoken } = useVoid();

  const [hasBooted, setHasBooted] = useState<boolean>(() => {
    return sessionStorage.getItem('curio_boot_completed') === 'true';
  });

  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperId>(() => {
    try {
      const saved = localStorage.getItem('curio_wallpaper');
      if (saved) {
        return getWallpaperConfig(saved).id;
      }
    } catch { /* ignore */ }
    return DEFAULT_WALLPAPER_ID;
  });

  const handleSelectWallpaper = useCallback((id: WallpaperId) => {
    const validId = getWallpaperConfig(id).id;
    setCurrentWallpaper(validId);
    try {
      localStorage.setItem('curio_wallpaper', validId);
    } catch { /* ignore */ }
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShutDown, setIsShutDown] = useState(false);
  const [loginPopupDismissed, setLoginPopupDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('curio_login_popup_dismissed') === 'true';
  });

  // ── Jitter effect state (triggered by VOID.EXE) ─────────────────────────
  const [isJittering, setIsJittering] = useState(false);
  const [voidNotificationSent, setVoidNotificationSent] = useState(false);

  // ── Global Custom Event Listeners ─────────────────────────────────────────
  const handleReboot = useCallback(() => {
    sessionStorage.removeItem('curio_boot_completed');
    setIsStartOpen(false);
    setIsNotificationsOpen(false);
    setHasBooted(false);
  }, []);

  useEffect(() => {
    const handleShutdownEvent = () => {
      setIsStartOpen(false);
      setIsNotificationsOpen(false);
      setIsShutDown(true);
    };
    const handleWallpaperEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WallpaperId>;
      if (customEvent.detail) {
        handleSelectWallpaper(customEvent.detail);
      }
    };

    // VOID.EXE awaken — push notification + mark
    const handleVoidAwoken = (e: Event) => {
      const detail = (e as CustomEvent).detail as { silent?: boolean } | undefined;
      if (!detail?.silent && !voidNotificationSent) {
        setVoidNotificationSent(true);
        setNotifications((prev) => {
          const alreadyHas = prev.some((n) => n.id === 'void-awoken');
          if (alreadyHas) return prev;
          return [
            {
              id: 'void-awoken',
              title: '⚠ VOID.EXE — Containment Breach',
              message: 'VOID.EXE has noticed you. The process has leaked outside its sandbox. Proceed with caution.',
              time: 'Just now',
              read: false,
              type: 'alert' as const,
            },
            ...prev,
          ];
        });
      }
    };

    // Desktop jitter — shake windows for ~400ms
    const handleJitter = () => {
      setIsJittering(true);
      setTimeout(() => setIsJittering(false), 500);
    };

    window.addEventListener('curio:reboot', handleReboot);
    window.addEventListener('curio:shutdown', handleShutdownEvent);
    window.addEventListener('curio:wallpaper', handleWallpaperEvent as EventListener);
    window.addEventListener('curio:void-awoken', handleVoidAwoken);
    window.addEventListener('curio:void-jitter', handleJitter);

    return () => {
      window.removeEventListener('curio:reboot', handleReboot);
      window.removeEventListener('curio:shutdown', handleShutdownEvent);
      window.removeEventListener('curio:wallpaper', handleWallpaperEvent as EventListener);
      window.removeEventListener('curio:void-awoken', handleVoidAwoken);
      window.removeEventListener('curio:void-jitter', handleJitter);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleReboot, voidNotificationSent]);

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const greetingInfo = getTimeBasedGreeting();
    return [
      {
        id: '1',
        title: greetingInfo.greeting,
        message: `${greetingInfo.subtitle} Welcome to Curio.OS!`,
        time: 'Just now',
        read: false,
        type: 'heart',
      },
      {
        id: '2',
        title: 'Secret Archive Detected',
        message: "Can you pass Administrator Subbu's sincerity compliment filter? (Hint: >85%)",
        time: '1m ago',
        read: false,
        type: 'alert',
      },
      {
        id: '3',
        title: 'Aesthetic Sound Synthesizer',
        message: 'Web Audio API chimes are active. Click the speaker icon to toggle.',
        time: '2m ago',
        read: false,
        type: 'info',
      },
    ];
  });


  // ── Sync wallpaper from user profile on login ─────────────────────────────
  useEffect(() => {
    const wpId = user?.wallpaperId || (user?.themeSettings as Record<string, unknown> | undefined)?.wallpaperId;
    if (wpId && typeof wpId === 'string') {
      handleSelectWallpaper(wpId as WallpaperId);
    }
  }, [user?.wallpaperId, user?.themeSettings, handleSelectWallpaper]);

  // ── Push a welcome notification on login ──────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && user) {
      setNotifications((prev) => {
        const alreadyHas = prev.some((n) => n.id === 'login-success');
        if (alreadyHas) return prev;
        return [
          {
            id: 'login-success',
            title: `Hii ${user.username}! 🎉`,
            message: 'Your personalized desktop is now active. Notes and settings sync across sessions!',
            time: 'Just now',
            read: false,
            type: 'heart' as const,
          },
          ...prev,
        ];
      });
    }
  }, [isLoggedIn, user]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const handleDismissLoginPopup = () => {
    sessionStorage.setItem('curio_login_popup_dismissed', 'true');
    setLoginPopupDismissed(true);
  };

  const hasUnread = notifications.some((n) => !n.read);
  const showLoginPopup =
    hasBooted &&
    !isRestoringSession &&
    !isLoggedIn &&
    !loginPopupDismissed;

  const triggerSubbuDisappointedRef = useRef<(() => void) | null>(null);
  const isLoginSequenceResolved =
    hasBooted &&
    !isRestoringSession &&
    (isLoggedIn || loginPopupDismissed);

  const handleDesktopClick = () => {
    if (isStartOpen) setIsStartOpen(false);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  if (isRestoringSession && !hasBooted) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-pink-400 font-mono text-sm animate-pulse">Restoring session...</div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none relative"
      onClick={handleDesktopClick}
      style={
        isJittering
          ? {
              transform: `translate(${Math.random() * 8 - 4}px, ${Math.random() * 6 - 3}px)`,
              transition: 'transform 0.05s',
            }
          : { transition: 'transform 0.2s' }
      }
    >
      {isShutDown ? (
        <div
          onClick={() => {
            setIsShutDown(false);
            handleReboot();
          }}
          className="w-full h-full bg-black flex flex-col items-center justify-center cursor-pointer select-none text-center px-4 font-mono z-50"
        >
          <div className="w-16 h-16 rounded-full border-2 border-amber-500/40 flex items-center justify-center mb-6 animate-pulse">
            <span className="text-amber-400 text-2xl font-bold">⏻</span>
          </div>
          <p className="text-amber-500 text-lg sm:text-xl font-bold tracking-widest uppercase mb-2">
            It is now safe to turn off your computer.
          </p>
          <p className="text-slate-500 text-xs sm:text-sm tracking-wider mt-2">
            Curio.OS system halted.
          </p>
          <div className="mt-8 px-4 py-2 rounded-full border border-pink-500/30 bg-pink-950/20 text-pink-300 text-xs animate-bounce">
            Click anywhere to restart ⟳
          </div>
        </div>
      ) : !hasBooted ? (
        <BootSequence onComplete={() => setHasBooted(true)} />
      ) : (
        <>
          <Desktop
            currentWallpaper={currentWallpaper}
            onSelectWallpaper={handleSelectWallpaper}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onReboot={handleReboot}
            isJittering={isJittering}
          />

          <StartMenu
            isOpen={isStartOpen}
            onClose={() => setIsStartOpen(false)}
            onReboot={handleReboot}
          />

          <NotificationCenter
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onClearAll={() => setNotifications([])}
            onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
          />

          <Taskbar
            isStartOpen={isStartOpen}
            onToggleStart={() => {
              setIsStartOpen(!isStartOpen);
              if (isNotificationsOpen) setIsNotificationsOpen(false);
            }}
            isNotificationsOpen={isNotificationsOpen}
            onToggleNotifications={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              if (isStartOpen) setIsStartOpen(false);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            hasUnreadNotifications={hasUnread}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            isVoidAwoken={isVoidAwoken}
          />

          {/* Two-stage login popup — only for anonymous guests */}
          {showLoginPopup && (
            <LoginPopup
              onDismissForSession={handleDismissLoginPopup}
              onStillNo={() => triggerSubbuDisappointedRef.current?.()}
            />
          )}

          {/* Reusable top-center notification queue */}
          {hasBooted && (
            <NotificationManager
              isLoginSequenceResolved={isLoginSequenceResolved}
              onRegisterTriggerSubbuDisappointed={(trigger) => {
                triggerSubbuDisappointedRef.current = trigger;
              }}
            />
          )}

          {/* VOID leak overlay — subtle red vignette when awoken */}
          {isVoidAwoken && (
            <div
              className="pointer-events-none fixed inset-0 z-[999]"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 60%, rgba(244,63,94,0.08) 100%)',
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Root App — wraps providers ────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <VoidProvider>
        <WindowManagerProvider>
          <MusicProvider>
            <CurioShell />
          </MusicProvider>
        </WindowManagerProvider>
      </VoidProvider>
    </AuthProvider>
  );
}

export default App;
