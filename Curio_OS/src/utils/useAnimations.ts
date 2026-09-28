import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useAnimationsEnabled(): boolean {
  const { user } = useAuth();

  const getSavedSetting = (): boolean => {
    if (user?.themeSettings && typeof (user.themeSettings as Record<string, unknown>).animations === 'boolean') {
      return (user.themeSettings as { animations: boolean }).animations;
    }
    try {
      const saved = localStorage.getItem('curio_theme_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.animations === 'boolean') return parsed.animations;
      }
    } catch {
      // ignore JSON parse error
    }
    return true;
  };

  const [enabled, setEnabled] = useState<boolean>(getSavedSetting);

  useEffect(() => {
    if (user?.themeSettings && typeof (user.themeSettings as Record<string, unknown>).animations === 'boolean') {
      setEnabled((user.themeSettings as { animations: boolean }).animations);
    }
  }, [user?.themeSettings]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.animations === 'boolean') {
        setEnabled(customEvent.detail.animations);
      } else {
        setEnabled(getSavedSetting());
      }
    };

    window.addEventListener('curio_theme_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('curio_theme_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return enabled;
}
