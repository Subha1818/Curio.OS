import React from 'react';
import { Bell, Heart, ShieldAlert, Sparkles, X, CheckCheck } from 'lucide-react';
import { sound } from '../utils/sound';
import type { SystemNotification } from '../types/os';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onClearAll: () => void;
  onDismiss: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 right-3 w-80 sm:w-88 rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden flex flex-col select-none text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold text-white">Curio Notifications</span>
          <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded-full font-mono">
            {notifications.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => {
                sound.playClick();
                onClearAll();
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="p-2 max-h-80 overflow-y-auto space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            All caught up! No notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 relative group hover:border-white/20 transition-all text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  {notif.type === 'heart' && <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />}
                  {notif.type === 'alert' && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                  {notif.type === 'info' && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{notif.title}</span>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onDismiss(notif.id);
                  }}
                  className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{notif.message}</p>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">{notif.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
