import { useState, useEffect, useCallback } from 'react';
import { apiGetLetters } from '../api/letterboxApi';

const LAST_SEEN_KEY = 'curio_last_seen_letterbox';

export function getLetterBoxLastSeen(): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(LAST_SEEN_KEY);
  if (!val) return 0;
  const num = Number(val);
  return isNaN(num) ? new Date(val).getTime() || 0 : num;
}

export function markLetterBoxSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  window.dispatchEvent(new CustomEvent('curio_letterbox_seen'));
}

export function useLetterBoxActivity(): boolean {
  const [hasNewActivity, setHasNewActivity] = useState<boolean>(false);

  const checkActivity = useCallback(async () => {
    try {
      const lastSeen = getLetterBoxLastSeen();
      const res = await apiGetLetters('newest', undefined, 1);
      if (res.letters && res.letters.length > 0) {
        const latestTime = new Date(res.letters[0].createdAt).getTime();
        // If newer than last seen timestamp (or never seen before and letters exist)
        if (lastSeen === 0 || latestTime > lastSeen) {
          setHasNewActivity(true);
          return;
        }
      }
      setHasNewActivity(false);
    } catch {
      // Ignore network errors
    }
  }, []);

  useEffect(() => {
    checkActivity();

    const handleSeen = () => setHasNewActivity(false);
    window.addEventListener('curio_letterbox_seen', handleSeen);
    window.addEventListener('focus', checkActivity);

    return () => {
      window.removeEventListener('curio_letterbox_seen', handleSeen);
      window.removeEventListener('focus', checkActivity);
    };
  }, [checkActivity]);

  return hasNewActivity;
}
