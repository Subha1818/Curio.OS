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
  const [standaloneQueue, setStandaloneQueue] = useState<NotificationToastData[]>([]);

  // Queue progression state
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isWaitingForTimer, setIsWaitingForTimer] = useState<boolean>(false);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to check live session activity state
  const getSessionActivity = useCallback(() => {
    const hasMusicWin = windows.some((w) => w.appId === 'music');
    const hasFilesWin = windows.some((w) => w.appId === 'files');
    const hasNotesWin = windows.some((w) => w.appId === 'notes');
    const hasVoidWin = windows.some((w) => w.appId === 'void');

    return {
      hasOpenedMusic: hasMusicWin || sessionStorage.getItem('curio_music_opened') === 'true',
      hasOpenedFiles: hasFilesWin || sessionStorage.getItem('curio_files_opened') === 'true',
      hasOpenedSecret: sessionStorage.getItem('curio_secret_folder_opened') === 'true',
      hasOpenedNotes: hasNotesWin || sessionStorage.getItem('curio_notes_opened') === 'true',
      hasOpenedVoid: hasVoidWin || sessionStorage.getItem('curio_void_opened') === 'true',
    };
  }, [windows]);

  // Handle Action Button click from notification
  const handleAction = useCallback(
    (item: NotificationConfigItem) => {
      if (!item.actionButton) return;
      const { appId, targetFolder } = item.actionButton;

      if (appId === 'files' && targetFolder) {
        sessionStorage.setItem('curio_files_target_folder', targetFolder);
        sessionStorage.setItem('curio_secret_folder_opened', 'true');
        window.dispatchEvent(new CustomEvent('curio_files_navigate', { detail: targetFolder }));
      }

      openApp(appId);
    },
    [openApp]
  );

  // Trigger Subbu is disappointed standalone reaction
  const triggerSubbuDisappointed = useCallback(() => {
    if (shownIdsRef.current.has('subbu-disappointed')) return;
    shownIdsRef.current.add('subbu-disappointed');

    const disappointedToast: NotificationToastData = {
      id: 'subbu-disappointed',
      emoji: '😢',
      title: 'Curio.OS',
      message: 'Subbu is disappointed 😢',
      onDismiss: () => {
        setActiveToast(null);
      },
    };

    setStandaloneQueue((prev) => [...prev, disappointedToast]);
  }, []);

  // Expose triggerSubbuDisappointed to parent
  useEffect(() => {
    onRegisterTriggerSubbuDisappointed(triggerSubbuDisappointed);
  }, [onRegisterTriggerSubbuDisappointed, triggerSubbuDisappointed]);

  // Check standalone queue whenever activeToast clears
  useEffect(() => {
    if (!activeToast && standaloneQueue.length > 0) {
      const [next, ...rest] = standaloneQueue;
      setActiveToast(next);
      setStandaloneQueue(rest);
    }
  }, [activeToast, standaloneQueue]);

  // Step resolution: called when current queued toast dismisses or is skipped
  const advanceQueue = useCallback(() => {
    setActiveToast(null);
    setQueueIndex((prev) => prev + 1);
    setIsWaitingForTimer(false);
  }, []);

  // Main Sequential Queue Driver
  useEffect(() => {
    // Only run if login popup sequence has completed
    if (!isLoginSequenceResolved) return;
    // Don't start a timer if queue is already finished or active toast is showing
    if (queueIndex >= QUEUED_NOTIFICATIONS.length) return;
    if (activeToast !== null || isWaitingForTimer) return;

    const currentItem = QUEUED_NOTIFICATIONS[queueIndex];
    if (!currentItem) return;

    // If already shown once, advance immediately
    if (shownIdsRef.current.has(currentItem.id)) {
      setQueueIndex((prev) => prev + 1);
      return;
    }

    setIsWaitingForTimer(true);

    timerRef.current = setTimeout(() => {
      setIsWaitingForTimer(false);

      // Check skip condition when timer expires
      const activity = getSessionActivity();
      const shouldSkip = currentItem.checkSkip(activity);

      if (shouldSkip) {
        // Skip silently, advance to next item
        shownIdsRef.current.add(currentItem.id);
        setQueueIndex((prev) => prev + 1);
        return;
      }

      // Show notification
      shownIdsRef.current.add(currentItem.id);
      const toastData: NotificationToastData = {
        id: currentItem.id,
        emoji: currentItem.emoji,
        title: 'Curio.OS',
        message: currentItem.message,
        actionButton: currentItem.actionButton
          ? {
              label: currentItem.actionButton.label,
              onClick: () => handleAction(currentItem),
            }
          : undefined,
        onDismiss: () => {
          advanceQueue();
        },
      };

      setActiveToast(toastData);
    }, currentItem.delayAfterPrevious);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    isLoginSequenceResolved,
    queueIndex,
    activeToast,
    isWaitingForTimer,
    getSessionActivity,
    handleAction,
    advanceQueue,
  ]);

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
