// API client for Curio.OS — talks to curio-server on port 4000

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  wallpaperId: string;
  themeSettings: Record<string, unknown>;
  bio?: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('curio_jwt_token') : null;
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include', // sends httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    const json = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return { error: (json.error as string) ?? 'An unknown error occurred.' };
    }

    return { data: json as T };
  } catch (err) {
    console.error(`[API] ${path} failed:`, err);
    return { error: 'Cannot reach Curio server. Is it running on port 4000?' };
  }
}

// ── Auth API ────────────────────────────────────────────

export async function apiRegister(
  email: string,
  password: string,
  username: string
): Promise<{ user?: AuthUser; message?: string; error?: string }> {
  const res = await request<{ user: AuthUser; message: string; token?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });
  if (res.error) return { error: res.error };
  if (res.data?.token) {
    localStorage.setItem('curio_jwt_token', res.data.token);
  }
  return { user: res.data?.user, message: res.data?.message };
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user?: AuthUser; message?: string; error?: string; notFound?: boolean }> {
  const res = await request<{ user: AuthUser; message: string; token?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.error) {
    // 404 = email not found → trigger register flow
    const notFound = res.error.includes('No account found');
    return { error: res.error, notFound };
  }
  if (res.data?.token) {
    localStorage.setItem('curio_jwt_token', res.data.token);
  }
  return { user: res.data?.user, message: res.data?.message };
}

export async function apiLogout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('curio_jwt_token');
  }
  await request('/api/auth/logout', { method: 'POST' });
}

export async function apiGetMe(): Promise<{ user?: AuthUser; error?: string }> {
  const res = await request<{ user: AuthUser }>('/api/auth/me');
  if (res.error) return { error: res.error };
  return { user: res.data?.user };
}

export async function apiUpdateSettings(
  updates: Partial<{ wallpaperId: string; themeSettings: Record<string, unknown>; bio: string }>
): Promise<{ user?: AuthUser; error?: string }> {
  const res = await request<{ user: AuthUser }>('/api/auth/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  if (res.error) return { error: res.error };
  return { user: res.data?.user };
}

export interface UserStats {
  username: string;
  email: string;
  wallpaper: string;
  createdAt: string;
  daysSinceJoined: number;
  notesCount: number;
  loginStreak: number;
  shell: string;
  kernel: string;
  memory: string;
  uptime: string;
  packages: string;
  role: string;
}

export async function apiGetStats(): Promise<{ stats?: UserStats; error?: string }> {
  const res = await request<UserStats>('/api/stats/me');
  if (res.error) return { error: res.error };
  return { stats: res.data };
}

// ── Notes API ────────────────────────────────────────────

export interface BackendNote {
  id: string;
  user_id: string;
  content: string;
  pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export async function apiGetNotes(): Promise<{ notes?: BackendNote[]; error?: string }> {
  const res = await request<{ notes: BackendNote[] }>('/api/notes');
  if (res.error) return { error: res.error };
  return { notes: res.data?.notes };
}

export async function apiCreateNote(
  content: string,
  pinned = false,
  tags: string[] = []
): Promise<{ note?: BackendNote; error?: string }> {
  const res = await request<{ note: BackendNote }>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ content, pinned, tags }),
  });
  if (res.error) return { error: res.error };
  return { note: res.data?.note };
}

export async function apiUpdateNote(
  id: string,
  updates: { content?: string; pinned?: boolean; tags?: string[] }
): Promise<{ note?: BackendNote; error?: string }> {
  const res = await request<{ note: BackendNote }>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (res.error) return { error: res.error };
  return { note: res.data?.note };
}

export async function apiDeleteNote(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await request<{ message: string; id: string }>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true };
}

// ── User Settings & Account Management ────────────────────

export async function apiSaveUserSettings(
  themeSettings: Record<string, unknown>,
  wallpaperId?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await request<{ message: string }>('/api/users/settings', {
    method: 'PUT',
    body: JSON.stringify({ themeSettings, wallpaperId }),
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true };
}

export async function apiDeleteAccount(): Promise<{ success: boolean; error?: string }> {
  const res = await request<{ message: string }>('/api/auth/me', {
    method: 'DELETE',
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true };
}
