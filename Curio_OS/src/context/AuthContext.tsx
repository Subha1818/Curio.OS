import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  apiUpdateSettings,
  apiDeleteAccount,
  type AuthUser,
} from '../api/authApi';
import type { WallpaperId } from '../types/os';

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isRestoringSession: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; notFound?: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUserSettings: (updates: {
    wallpaperId?: string;
    themeSettings?: Record<string, unknown>;
    bio?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const restoreSession = useCallback(async () => {
    setIsRestoringSession(true);
    try {
      const result = await apiGetMe();
      if (result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsRestoringSession(false);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.user) {
      setUser(result.user);
      return { success: true, message: result.message };
    }
    return {
      success: false,
      error: result.error,
      notFound: result.notFound,
    };
  }, []);

  const register = useCallback(async (email: string, password: string, username: string) => {
    const result = await apiRegister(email, password, username);
    if (result.user) {
      setUser(result.user);
      return { success: true, message: result.message };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const updateUserSettings = useCallback(
    async (updates: {
      wallpaperId?: string;
      themeSettings?: Record<string, unknown>;
      bio?: string;
    }) => {
      const result = await apiUpdateSettings(updates);
      if (result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    []
  );

  const deleteAccount = useCallback(async () => {
    const res = await apiDeleteAccount();
    if (res.success) {
      setUser(null);
      return { success: true };
    }
    return { success: false, error: res.error };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        isRestoringSession,
        login,
        register,
        logout,
        restoreSession,
        updateUserSettings,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export type { AuthUser, WallpaperId };
