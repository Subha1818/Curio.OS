export interface NotificationConfigItem {
  id: string;
  emoji: string;
  message: string;
  actionButton?: {
    label: string;
    appId: 'music' | 'files' | 'notes' | 'void';
    targetFolder?: string;
  };
  delayAfterPrevious: number; // in ms: 10000 for first after login, 30000 for subsequent
  checkSkip: (sessionState: {
    hasOpenedMusic: boolean;
    hasOpenedFiles: boolean;
    hasOpenedSecret: boolean;
    hasOpenedNotes: boolean;
    hasOpenedVoid: boolean;
  }) => boolean;
}

export const QUEUED_NOTIFICATIONS: NotificationConfigItem[] = [
  {
    id: 'music-promo',
    emoji: '🎧',
    message: "Too quiet in here. Play some music while exploring Subbu's portfolio.",
    actionButton: {
      label: 'Open Music',
      appId: 'music',
    },
    delayAfterPrevious: 10000, // 10 seconds after login sequence resolves
    checkSkip: (s) => s.hasOpenedMusic,
  },
  {
    id: 'files-promo',
    emoji: '📁',
    message: 'There are files hiding in here. Some of them might be worth opening.',
    actionButton: {
      label: 'Explore Files',
      appId: 'files',
    },
    delayAfterPrevious: 30000, // 30 seconds after music resolves
    checkSkip: (s) => s.hasOpenedFiles,
  },
  {
    id: 'secret-promo',
    emoji: '🔐',
    message: "Curious about the person behind this weird OS? There's more about Subbu hidden inside.",
    actionButton: {
      label: "Admin's Secret Folder",
      appId: 'files',
      targetFolder: 'secret',
    },
    delayAfterPrevious: 30000, // 30 seconds after files resolves
    checkSkip: (s) => s.hasOpenedSecret,
  },
  {
    id: 'brain-promo',
    emoji: '🧠',
    message: 'Thoughts scattered? Brain.exe is ready for your notes and observations.',
    actionButton: {
      label: 'Open Brain',
      appId: 'notes',
    },
    delayAfterPrevious: 30000, // 30 seconds after secret resolves
    checkSkip: (s) => s.hasOpenedNotes,
  },
  {
    id: 'void-promo',
    emoji: '👁️',
    message: 'A strange signal echoes in the deep... Enter VOID.EXE if you dare.',
    actionButton: {
      label: 'Open VOID',
      appId: 'void',
    },
    delayAfterPrevious: 30000, // 30 seconds after brain resolves
    checkSkip: (s) => s.hasOpenedVoid,
  },
];
