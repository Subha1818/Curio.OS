import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { NotificationToast, type NotificationToastData } from './NotificationToast';
import { QUEUED_NOTIFICATIONS, type NotificationConfigItem } from '../data/notificationConfig';

interface NotificationManagerProps {
  isLoginSequenceResolved: boolean;
  onRegisterTriggerSubbuDisappointed: (trigger: () => void) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  isLoginSequenceResolved,
  onRegisterTriggerSubbuDisappointed,
}) => {
  const { windows, openApp } = useWindowManager();
  const [activeToast, setActiveToast] = useState<NotificationToastData | null>(null);

  // Queue of toasts waiting to be shown if one is already active
  const toastQueueRef = useRef<NotificationToastData[]>([]);

  // Stable references for timer operations
  const windowsRef = useRef(windows);
  windowsRef.current = windows;

  const openAppRef = useRef(openApp);
  openAppRef.current = openApp;

  const queueIndexRef = useRef<number>(0);
  const queueStartedRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Check live session activity state
  const checkActivity = useCallback(() => {
    const currentWindows = windowsRef.current;
    const hasMusicWin = currentWindows.some((w) => w.appId === 'music');
    const hasFilesWin = currentWindows.some((w) => w.appId === 'files');
    const hasNotesWin = currentWindows.some((w) => w.appId === 'notes');
    const hasVoidWin = currentWindows.some((w) => w.appId === 'void');

    const activity = {
      hasOpenedMusic: hasMusicWin || sessionStorage.getItem('curio_music_opened') === 'true',
      hasOpenedFiles: hasFilesWin || sessionStorage.getItem('curio_files_opened') === 'true',
      hasOpenedSecret: sessionStorage.getItem('curio_secret_folder_opened') === 'true',
      hasOpenedNotes: hasNotesWin || sessionStorage.getItem('curio_notes_opened') === 'true',
      hasOpenedVoid: hasVoidWin || sessionStorage.getItem('curio_void_opened') === 'true',
    };

    return activity;
  }, []);

  // Display a toast safely ensuring only 1 is on screen at a time
  const showToast = useCallback((toast: NotificationToastData) => {
    setActiveToast((current) => {
      if (current) {
        console.log(`[Curio Notification] Another notification (${current.id}) is active. Queuing:`, toast.id);
        toastQueueRef.current.push(toast);
        return current;
      }
      return toast;
    });
  }, []);

  // Handle toast dismissal (auto or manual)
  const handleToastDismissed = useCallback((toastId: string, isFromQueue: boolean) => {
    console.log(`[Curio Notification] Toast dismissed: ${toastId}`);

    // If there is another toast waiting in the queue, show it next
    if (toastQueueRef.current.length > 0) {
      const nextToast = toastQueueRef.current.shift()!;
      setTimeout(() => setActiveToast(nextToast), 300);
    } else {
      setActiveToast(null);
    }

    // If this was a timed queue notification, start the next 30s timer
    if (isFromQueue) {
      scheduleStep(30000);
    }
  }, []);

  // Action button click dispatcher
  const handleAction = useCallback((item: NotificationConfigItem) => {
    if (!item.actionButton) return;
    const { appId, targetFolder } = item.actionButton;

    if (appId === 'files' && targetFolder) {
      sessionStorage.setItem('curio_files_target_folder', targetFolder);
      sessionStorage.setItem('curio_secret_folder_opened', 'true');
      window.dispatchEvent(new CustomEvent('curio_files_navigate', { detail: targetFolder }));
    }

    openAppRef.current(appId);
  }, []);

  // Schedule next step in the queue
  const scheduleStep = useCallback(
    (delayMs: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      console.log(
        `%c[Curio Notification]%c Next queue check in ${delayMs / 1000}s (index: ${queueIndexRef.current})`,
        'color: #ec4899; font-weight: bold;',
        'color: #94a3b8;'
      );

      timerRef.current = setTimeout(() => {
        timerRef.current = null;

        while (queueIndexRef.current < QUEUED_NOTIFICATIONS.length) {
          const item = QUEUED_NOTIFICATIONS[queueIndexRef.current];

          if (shownIdsRef.current.has(item.id)) {
            console.log(`[Curio Notification] ${item.id} already shown. Skipping.`);
            queueIndexRef.current += 1;
            continue;
          }

          const activity = checkActivity();
          const shouldSkip = item.checkSkip(activity);

          if (shouldSkip) {
            console.log(
              `%c[Curio Notification]%c Skip condition met for "${item.id}". Advancing to next step in 30s.`,
              'color: #eab308; font-weight: bold;',
              'color: #94a3b8;'
            );
            shownIdsRef.current.add(item.id);
            queueIndexRef.current += 1;
            scheduleStep(30000);
            return;
          }

          // Found next eligible notification!
          console.log(
            `%c[Curio Notification]%c Displaying: "${item.message}"`,
            'color: #10b981; font-weight: bold;',
            'color: #f1f5f9;'
          );
          shownIdsRef.current.add(item.id);
          queueIndexRef.current += 1;

          const toastData: NotificationToastData = {
            id: item.id,
            emoji: item.emoji,
            title: 'Curio.OS',
            message: item.message,
            autoDismissMs: 7500,
            actionButton: item.actionButton
              ? {
                label: item.actionButton.label,
                onClick: () => handleAction(item),
              }
              : undefined,
            onDismiss: () => {
              handleToastDismissed(item.id, true);
            },
          };

          showToast(toastData);
          return;
        }

        console.log('%c[Curio Notification]%c All notifications finished.', 'color: #8b5cf6; font-weight: bold;', 'color: #94a3b8;');
      }, delayMs);
    },
    [checkActivity, handleAction, handleToastDismissed, showToast]
  );

  // Standalone "Subbu is disappointed 😢" popup
  const triggerSubbuDisappointed = useCallback(() => {
    if (shownIdsRef.current.has('subbu-disappointed')) return;
    shownIdsRef.current.add('subbu-disappointed');

    console.log(
      '%c[Curio Notification]%c Fired standalone: "Subbu is disappointed 😢"',
      'color: #ef4444; font-weight: bold;',
      'color: #f87171;'
    );

    const disappointedToast: NotificationToastData = {
      id: 'subbu-disappointed',
      emoji: '😢',
      title: 'Curio.OS',
      message: 'Subbu is disappointed 😢',
      autoDismissMs: 6000,
      onDismiss: () => {
        handleToastDismissed('subbu-disappointed', false);
      },
    };

    showToast(disappointedToast);
  }, [handleToastDismissed, showToast]);

  // Connect standalone trigger
  useEffect(() => {
    onRegisterTriggerSubbuDisappointed(triggerSubbuDisappointed);
  }, [onRegisterTriggerSubbuDisappointed, triggerSubbuDisappointed]);

  // Start the queue as soon as login sequence is resolved
  useEffect(() => {
    if (!isLoginSequenceResolved || queueStartedRef.current) return;

    queueStartedRef.current = true;
    console.log(
      '%c[Curio Notification]%c Login resolved! Starting 10-second countdown for Music notification...',
      'color: #38bdf8; font-weight: bold;',
      'color: #94a3b8;'
    );

    // Initial 10 second delay
    scheduleStep(10000);
  }, [isLoginSequenceResolved, scheduleStep]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!activeToast) return null;

  return (
    <NotificationToast
      key={activeToast.id}
      id={activeToast.id}
      emoji={activeToast.emoji}
      icon={activeToast.icon}
      title={activeToast.title}
      message={activeToast.message}
      actionButton={activeToast.actionButton}
      onDismiss={activeToast.onDismiss}
      autoDismissMs={activeToast.autoDismissMs ?? 7000}
    />
  );
};
