// LetterBox Guestbook API Client
import { getSessionId, getAdminSecret } from '../utils/identity';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

export interface AuthorRank {
  title: string;
  badge: string;
  likesReceived: number;
}

export interface LetterItem {
  id: number;
  formattedId: string; // e.g. #047
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  authorRank: AuthorRank;
  canDelete: boolean;
}

export interface LeaderboardUser {
  rankPosition: number;
  userId: string;
  username: string;
  totalLikes: number;
  lettersCount: number;
  rankBadge: {
    title: string;
    badge: string;
    likesReceived: number;
  };
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
    const sessionId = getSessionId();
    const adminSecret = getAdminSecret();
    const authHeaders: Record<string, string> = {
      'x-session-id': sessionId,
    };
    if (adminSecret) {
      authHeaders['x-admin-secret'] = adminSecret;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'omit', // No cookies needed anymore
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    const json = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      return { error: (json.error as string) ?? 'An unknown error occurred.' };
    }

    return { data: json as T };
  } catch (err) {
    console.error(`[LetterBox API] ${path} failed:`, err);
    return { error: 'Cannot connect to Curio.OS server. Please ensure port 4000 is online.' };
  }
}

// ── GET /api/letters ──────────────────────────────────────────────────────────
export async function apiGetLetters(
  sort: 'newest' | 'top' = 'newest',
  cursor?: number | null,
  limit: number = 20
): Promise<{ letters?: LetterItem[]; nextCursor?: number | null; error?: string }> {
  const params = new URLSearchParams();
  params.set('sort', sort);
  params.set('limit', String(limit));
  if (cursor) {
    params.set('cursor', String(cursor));
  }

  const res = await request<{ letters: LetterItem[]; nextCursor: number | null }>(
    `/api/letters?${params.toString()}`
  );
  if (res.error) return { error: res.error };
  return { letters: res.data?.letters, nextCursor: res.data?.nextCursor };
}

// ── POST /api/letters ─────────────────────────────────────────────────────────
export async function apiPostLetter(
  content: string,
  displayName?: string
): Promise<{ letter?: LetterItem; error?: string }> {
  const res = await request<{ letter: LetterItem }>('/api/letters', {
    method: 'POST',
    body: JSON.stringify({ content, displayName }),
  });
  if (res.error) return { error: res.error };
  return { letter: res.data?.letter };
}

// ── DELETE /api/letters/:id ───────────────────────────────────────────────────
export async function apiDeleteLetter(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const res = await request<{ success: boolean; message: string }>(`/api/letters/${id}`, {
    method: 'DELETE',
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true };
}

// ── POST /api/letters/:id/like ────────────────────────────────────────────────
export async function apiLikeLetter(
  id: number
): Promise<{ liked?: boolean; likeCount?: number; error?: string }> {
  const res = await request<{ liked: boolean; likeCount: number }>(`/api/letters/${id}/like`, {
    method: 'POST',
  });
  if (res.error) return { error: res.error };
  return { liked: res.data?.liked, likeCount: res.data?.likeCount };
}

// ── DELETE /api/letters/:id/like ──────────────────────────────────────────────
export async function apiUnlikeLetter(
  id: number
): Promise<{ liked?: boolean; likeCount?: number; error?: string }> {
  const res = await request<{ liked: boolean; likeCount: number }>(`/api/letters/${id}/like`, {
    method: 'DELETE',
  });
  if (res.error) return { error: res.error };
  return { liked: res.data?.liked, likeCount: res.data?.likeCount };
}

// ── GET /api/letters/leaderboard ──────────────────────────────────────────────
export async function apiGetLeaderboard(): Promise<{
  leaderboard?: LeaderboardUser[];
  error?: string;
}> {
  const res = await request<{ leaderboard: LeaderboardUser[] }>('/api/letters/leaderboard');
  if (res.error) return { error: res.error };
  return { leaderboard: res.data?.leaderboard };
}
