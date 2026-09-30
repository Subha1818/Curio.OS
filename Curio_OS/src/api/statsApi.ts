import { getSessionId } from '../utils/identity';

export interface UserStats {
  username: string;
  lettersPosted: number;
  likesReceived: number;
  rank: {
    badge: string;
    likesReceived: number;
  };
  shell: string;
  kernel: string;
  memory: string;
  uptime: string;
  packages: string;
  role: string;
  daysSinceJoined?: number;
  loginStreak?: number;
  wallpaper?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(endpoint: string, options: RequestInit = {}) {
  const sessionId = getSessionId();

  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { error: errData.error || `HTTP error ${response.status}` };
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API request failed (${endpoint}):`, error);
    return { error: error.message || 'Network error' };
  }
}

export async function apiGetStats(): Promise<{ stats?: UserStats; error?: string }> {
  const res = await request('/api/stats/me');
  if (res.error) return { error: res.error };
  return { stats: res as UserStats };
}
