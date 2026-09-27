import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { sound } from '../utils/sound';

export interface NotificationToastData {
  id: string;
  emoji?: string;
  icon?: React.ReactNode;
  title?: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const NotificationToast: React.FC<NotificationToastData> = ({
  emoji,
  icon,
  title = 'Curio.OS',
  message,
  actionButton,
  onDismiss,
  autoDismissMs = 7000,
}) => {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate in on mount & play notification sound
  useEffect(() => {
    sound.playNotification();
    const animTimer = setTimeout(() => setVisible(true), 50);

    // Auto dismiss timer
    if (autoDismissMs > 0) {
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);
    }

    return () => {
      clearTimeout(animTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoDismissMs]);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleAction = () => {
    sound.playClick();
    if (actionButton) {
      actionButton.onClick();
    }
    handleDismiss();
  };

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[250] max-w-sm w-[92vw] sm:w-[410px] pointer-events-auto transition-all duration-300 ease-out select-none ${
        visible && !isExiting
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-8 opacity-0 scale-95'
      }`}
    >
      <div className="rounded-2xl bg-slate-950/95 border border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(244,114,182,0.18)] overflow-hidden">
        {/* Accent Top Gradient Line */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-400" />

        <div className="p-3.5 sm:p-4 flex items-start gap-3">
          {/* Icon / Emoji Badge */}
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center text-lg shadow-inner">
            {emoji ? <span>{emoji}</span> : icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider font-mono truncate">
                {title}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-snug font-sans">
              {message}
            </p>

            {/* Action Button */}
            {actionButton && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={handleAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {actionButton.label}
                </button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              handleDismiss();
            }}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 -mr-1 -mt-1 cursor-pointer rounded-lg hover:bg-white/5"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
