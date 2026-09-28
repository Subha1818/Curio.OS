import type React from 'react';

export type AppId = 'terminal' | 'files' | 'music' | 'notes' | 'settings' | 'void' | 'socials';

export interface AppDefinition {
  id: AppId;
  title: string;
  iconName: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  component: React.ComponentType<{ windowId: string }>;
  badge?: string;
  category?: 'core' | 'system' | 'creative' | 'secret';
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  iconName: string;
  position: WindowPosition;
  size: WindowSize;
  previousBounds?: {
    position: WindowPosition;
    size: WindowSize;
  };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export type WallpaperId = 'cosmic-aurora' | 'cyber-noir' | 'dream-lavender' | 'synth-sunset' | 'matrix-green';

export interface WallpaperOption {
  id: WallpaperId;
  name: string;
  type: 'mesh' | 'canvas' | 'gradient';
  description: string;
  previewGradient: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'alert' | 'heart';
}
