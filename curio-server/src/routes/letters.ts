import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ── In-memory rate limiting ──────────────────────────────────────────────────
const lastPostTime = new Map<string, number>();
const postHistory = new Map<string, number[]>(); // timestamps within 1 hr
const lastLikeTime = new Map<string, number>();

// ── Rank Configuration ───────────────────────────────────────────────────────
export interface RankDef {
  threshold: number;
  title: string;
  badge: string;
}

export const RANKS: RankDef[] = [
  { threshold: 100, title: 'Cosmic Mind', badge: '🌌 Cosmic Mind' },
  { threshold: 50, title: 'Big Brain', badge: '🧠 Big Brain' },
  { threshold: 20, title: 'Synapse', badge: '⚡ Synapse' },
  { threshold: 5, title: 'Daydreamer', badge: '💭 Daydreamer' },
  { threshold: 0, title: 'Thought Drifter', badge: '🫧 Thought Drifter' },
];

export function getRankFromLikes(likesReceived: number): { title: string; badge: string; likesReceived: number } {
  const match = RANKS.find((r) => likesReceived >= r.threshold) || RANKS[RANKS.length - 1];
  return {
    title: match.title,
    badge: match.badge,
    likesReceived,
  };
}

// Helper: Check if user is admin
async function checkIfAdmin(userId: string): Promise<boolean> {
  try {
    const res = await pool.query(`SELECT is_admin FROM users WHERE id = $1`, [userId]);
    return Boolean(res.rows[0]?.is_admin);
  } catch {
    return false;
  }
}

// ── GET /api/letters ──────────────────────────────────────────────────────────
// Public feed with optional auth for likedByMe & canDelete
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sort = req.query.sort === 'top' ? 'top' : 'newest';
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string, 10) : null;
    const currentUserId = req.user?.userId;
    const isAdmin = currentUserId ? await checkIfAdmin(currentUserId) : false;

    let queryText = `
      SELECT 
        l.id,
        l.user_id,
        u.username,
        l.content,
        l.created_at,
        COUNT(ll.user_id)::int AS like_count,
        COALESCE(
          (SELECT COUNT(*)::int 
           FROM letter_likes ll2 
           JOIN letters l2 ON ll2.letter_id = l2.id 
           WHERE l2.user_id = l.user_id AND ll2.user_id != l.user_id), 
          0
        ) AS author_likes_received
    `;

    if (currentUserId) {
      queryText += `,
        EXISTS(SELECT 1 FROM letter_likes WHERE letter_id = l.id AND user_id = $1) AS liked_by_me
      `;
    } else {
      queryText += `,
        false AS liked_by_me
      `;
    }

    queryText += `
      FROM letters l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN letter_likes ll ON ll.letter_id = l.id
    `;

    const params: (string | number)[] = [];
    if (currentUserId) {
      params.push(currentUserId);
    }

    // Cursor conditions
    if (cursor) {
      params.push(cursor);
      const cursorParamIdx = params.length;
      if (sort === 'newest') {
        queryText += ` WHERE l.id < $${cursorParamIdx} `;
      }
    }

    queryText += `
      GROUP BY l.id, l.user_id, u.username, l.content, l.created_at
    `;

    if (sort === 'top') {
      queryText += ` ORDER BY like_count DESC, l.id DESC `;
    } else {
      queryText += ` ORDER BY l.id DESC `;
    }

    params.push(limit);
    const limitParamIdx = params.length;
    queryText += ` LIMIT $${limitParamIdx} `;

    const result = await pool.query(queryText, params);

    const letters = result.rows.map((row) => ({
      id: row.id,
      formattedId: `#${String(row.id).padStart(3, '0')}`,
      userId: row.user_id,
      username: row.username,
      content: String(row.content), // rendered as plain text
      createdAt: row.created_at,
      likeCount: parseInt(row.like_count || '0', 10),
      likedByMe: Boolean(row.liked_by_me),
      authorRank: getRankFromLikes(parseInt(row.author_likes_received || '0', 10)),
      canDelete: Boolean(currentUserId && (currentUserId === row.user_id || isAdmin)),
    }));

    const nextCursor =
      letters.length === limit && sort === 'newest'
        ? letters[letters.length - 1].id
        : null;

    res.status(200).json({ letters, nextCursor });
  } catch (err) {
    console.error('Error in GET /api/letters:', err);
    res.status(500).json({ error: 'Failed to retrieve letters feed.' });
  }
});

// ── POST /api/letters ─────────────────────────────────────────────────────────
// Auth required. Post a new letter (max 280 chars)
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const rawContent = (req.body.content || '') as string;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';

    if (!content) {
      res.status(400).json({ error: 'Letter content cannot be empty.' });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ error: 'Letter exceeds maximum 280 characters.' });
      return;
    }

    // Rate limiting: 1 post per 30s
    const now = Date.now();
    const lastTime = lastPostTime.get(userId) || 0;
    if (now - lastTime < 30_000) {
      const waitSec = Math.ceil((30_000 - (now - lastTime)) / 1000);
      res.status(429).json({ error: `Slow down! You can leave another letter in ${waitSec}s.` });
      return;
    }

    // Rate limiting: max 10 per hour
    const history = (postHistory.get(userId) || []).filter((t) => now - t < 3600_000);
    if (history.length >= 10) {
      res.status(429).json({ error: 'Rate limit reached: maximum 10 letters per hour.' });
      return;
    }

    // Insert into database
    const insertRes = await pool.query(
      `INSERT INTO letters (user_id, content) 
       VALUES ($1, $2) 
       RETURNING id, user_id, content, created_at`,
      [userId, content]
    );

    lastPostTime.set(userId, now);
    history.push(now);
    postHistory.set(userId, history);

    const created = insertRes.rows[0];

    // Fetch author details
    const userRes = await pool.query(
      `SELECT username, 
        COALESCE(
          (SELECT COUNT(*)::int 
           FROM letter_likes ll 
           JOIN letters l ON ll.letter_id = l.id 
           WHERE l.user_id = $1 AND ll.user_id != l.user_id), 
          0
        ) AS rank_likes
       FROM users WHERE id = $1`,
      [userId]
    );

    const author = userRes.rows[0];

    res.status(201).json({
      letter: {
        id: created.id,
        formattedId: `#${String(created.id).padStart(3, '0')}`,
        userId: created.user_id,
        username: author?.username || 'user',
        content: created.content,
        createdAt: created.created_at,
        likeCount: 0,
        likedByMe: false,
        authorRank: getRankFromLikes(parseInt(author?.rank_likes || '0', 10)),
        canDelete: true,
      },
    });
  } catch (err) {
    console.error('Error creating letter:', err);
    res.status(500).json({ error: 'Failed to drop letter into the brain.' });
  }
});

// ── DELETE /api/letters/:id ───────────────────────────────────────────────────
// Author or admin only
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const letterId = parseInt(String(req.params.id), 10);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID.' });
      return;
    }

    const checkRes = await pool.query(
      `SELECT id, user_id FROM letters WHERE id = $1`,
      [letterId]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ error: 'Letter not found.' });
      return;
    }

    const letter = checkRes.rows[0];
    const isAdmin = await checkIfAdmin(userId);

    if (letter.user_id !== userId && !isAdmin) {
      res.status(403).json({ error: 'You do not have permission to delete this letter.' });
      return;
    }

    await pool.query(`DELETE FROM letters WHERE id = $1`, [letterId]);

    res.status(200).json({ success: true, message: 'Letter successfully removed from the brain.' });
  } catch (err) {
    console.error('Error deleting letter:', err);
    res.status(500).json({ error: 'Failed to delete letter.' });
  }
});

// ── POST /api/letters/:id/like ────────────────────────────────────────────────
// Auth required. Idempotent like
router.post('/:id/like', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const letterId = parseInt(String(req.params.id), 10);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID.' });
      return;
    }

    // Rate limit likes per user (1 every 300ms)
    const now = Date.now();
    const lastLike = lastLikeTime.get(userId) || 0;
    if (now - lastLike < 300) {
      res.status(429).json({ error: 'Too many requests.' });
      return;
    }
    lastLikeTime.set(userId, now);

    // Verify letter exists
    const letterRes = await pool.query(`SELECT id FROM letters WHERE id = $1`, [letterId]);
    if (letterRes.rows.length === 0) {
      res.status(404).json({ error: 'Letter not found.' });
      return;
    }

    await pool.query(
      `INSERT INTO letter_likes (user_id, letter_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, letter_id) DO NOTHING`,
      [userId, letterId]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM letter_likes WHERE letter_id = $1`,
      [letterId]
    );

    res.status(200).json({
      liked: true,
      likeCount: countRes.rows[0].count,
    });
  } catch (err) {
    console.error('Error liking letter:', err);
    res.status(500).json({ error: 'Failed to like letter.' });
  }
});

// ── DELETE /api/letters/:id/like ──────────────────────────────────────────────
// Auth required. Idempotent unlike
router.delete('/:id/like', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const letterId = parseInt(String(req.params.id), 10);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID.' });
      return;
    }

    await pool.query(
      `DELETE FROM letter_likes WHERE user_id = $1 AND letter_id = $2`,
      [userId, letterId]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM letter_likes WHERE letter_id = $1`,
      [letterId]
    );

    res.status(200).json({
      liked: false,
      likeCount: countRes.rows[0].count,
    });
  } catch (err) {
    console.error('Error unliking letter:', err);
    res.status(500).json({ error: 'Failed to unlike letter.' });
  }
});

// ── GET /api/letters/leaderboard ──────────────────────────────────────────────
// Public. Top 10 users by non-self likes received
router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        COUNT(ll.user_id)::int AS total_likes, 
        COUNT(DISTINCT l.id)::int AS letters_count
      FROM users u
      JOIN letters l ON l.user_id = u.id
      LEFT JOIN letter_likes ll ON ll.letter_id = l.id AND ll.user_id != u.id
      GROUP BY u.id, u.username
      ORDER BY total_likes DESC, letters_count DESC
      LIMIT 10
    `);

    const leaderboard = result.rows.map((row, index) => {
      const likes = parseInt(row.total_likes || '0', 10);
      return {
        rankPosition: index + 1,
        userId: row.id,
        username: row.username,
        totalLikes: likes,
        lettersCount: parseInt(row.letters_count || '0', 10),
        rankBadge: getRankFromLikes(likes),
      };
    });

    res.status(200).json({ leaderboard });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to retrieve Top Minds leaderboard.' });
  }
});

export default router;
