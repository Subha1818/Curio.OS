import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const VOID_AWOKEN_KEY = 'curio_void_awoken';

interface VoidContextType {
  isVoidAwoken: boolean;
  voidClickCount: number;
  escalateVoid: () => void;
  resetVoid: () => void;
}

const VoidContext = createContext<VoidContextType | null>(null);

export const VoidProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voidClickCount, setVoidClickCount] = useState<number>(() => {
    try {
      return parseInt(sessionStorage.getItem(VOID_AWOKEN_KEY) ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const isVoidAwoken = voidClickCount >= 5;

  const escalateVoid = useCallback(() => {
    setVoidClickCount((prev) => {
      const next = Math.min(prev + 1, 6);
      try {
        sessionStorage.setItem(VOID_AWOKEN_KEY, String(next));
      } catch { /* ignore */ }

      // Fire OS-wide awaken event exactly once (when crossing threshold)
      if (prev === 4) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('curio:void-awoken'));
        }, 50);
      }
      return next;
    });
  }, []);

  const resetVoid = useCallback(() => {
    setVoidClickCount(0);
    try {
      sessionStorage.removeItem(VOID_AWOKEN_KEY);
    } catch { /* ignore */ }
  }, []);

  // Re-fire silently if already awoken on mount (e.g. page refresh, VoidApp re-opened)
  useEffect(() => {
    if (voidClickCount >= 5) {
      window.dispatchEvent(new CustomEvent('curio:void-awoken', { detail: { silent: true } }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VoidContext.Provider value={{ isVoidAwoken, voidClickCount, escalateVoid, resetVoid }}>
      {children}
    </VoidContext.Provider>
  );
};

export const useVoid = () => {
  const ctx = useContext(VoidContext);
  if (!ctx) throw new Error('useVoid must be used within VoidProvider');
  return ctx;
};
