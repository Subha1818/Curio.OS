import { Router, Request, Response } from 'express';
import pool from '../db/pool';

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

// Helper: Check if request has admin secret
function checkIsAdmin(req: Request): boolean {
  const adminSecret = req.headers['x-admin-secret'];
  return !!adminSecret && adminSecret === process.env.ADMIN_SECRET;
}

// ── GET /api/letters ──────────────────────────────────────────────────────────
// Public feed
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const sort = req.query.sort === 'top' ? 'top' : 'newest';
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string, 10) : null;
    const currentSessionId = req.headers['x-session-id'] as string | undefined;
    const isAdmin = checkIsAdmin(req);

    let queryText = `
      SELECT 
        l.id,
        l.session_id,
        l.display_name AS username,
        l.content,
        l.created_at,
        COUNT(ll.session_id)::int AS like_count,
        COALESCE(
          (SELECT COUNT(*)::int 
           FROM letter_likes ll2 
           JOIN letters l2 ON ll2.letter_id = l2.id 
           WHERE l2.session_id = l.session_id AND ll2.session_id != l.session_id), 
          0
        ) AS author_likes_received
    `;

    if (currentSessionId) {
      queryText += `,
        EXISTS(SELECT 1 FROM letter_likes WHERE letter_id = l.id AND session_id = $1) AS liked_by_me
      `;
    } else {
      queryText += `,
        false AS liked_by_me
      `;
    }

    queryText += `
      FROM letters l
      LEFT JOIN letter_likes ll ON ll.letter_id = l.id
    `;

    const params: (string | number)[] = [];
    if (currentSessionId) {
      params.push(currentSessionId);
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
      GROUP BY l.id, l.session_id, l.display_name, l.content, l.created_at
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
      userId: row.session_id, // map session_id to userId for frontend compatibility
      username: row.username,
      content: String(row.content), 
      createdAt: row.created_at,
      likeCount: parseInt(row.like_count || '0', 10),
      likedByMe: Boolean(row.liked_by_me),
      authorRank: getRankFromLikes(parseInt(row.author_likes_received || '0', 10)),
      canDelete: Boolean(isAdmin || (currentSessionId && currentSessionId === row.session_id)),
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
// Post a new letter (max 280 chars)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.status(401).json({ error: 'Session ID is required.' });
      return;
    }

    const rawContent = (req.body.content || '') as string;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    let displayName = (req.body.displayName || '') as string;
    displayName = typeof displayName === 'string' ? displayName.trim() : '';

    // Honeypot check
    if (req.body.website || req.body.email) {
      // Honeypot filled! Return 201 silently (bot reject)
      res.status(201).json({ success: true });
      return;
    }

    if (!content) {
      res.status(400).json({ error: 'Letter content cannot be empty.' });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ error: 'Letter exceeds maximum 280 characters.' });
      return;
    }
    
    // Basic content filter: mostly URL or profanity (simple check)
    const urlPattern = /^(https?:\/\/[^\s]+)$/;
    if (urlPattern.test(content)) {
      res.status(400).json({ error: 'Post cannot be just a URL.' });
      return;
    }

    // fallback name
    if (!displayName) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      displayName = `Mystery Visitor #${suffix}`;
    }

    // Rate limiting: 1 post per 60s
    const now = Date.now();
    const lastTime = lastPostTime.get(sessionId) || 0;
    if (now - lastTime < 60_000) {
      const waitSec = Math.ceil((60_000 - (now - lastTime)) / 1000);
      res.status(429).json({ error: `Slow down! You can leave another letter in ${waitSec}s.` });
      return;
    }

    // Rate limiting: max 15 per day
    const history = (postHistory.get(sessionId) || []).filter((t) => now - t < 86400_000);
    if (history.length >= 15) {
      res.status(429).json({ error: 'Rate limit reached: maximum 15 letters per day.' });
      return;
    }

    // Insert into database
    const insertRes = await pool.query(
      `INSERT INTO letters (session_id, display_name, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, session_id, display_name, content, created_at`,
      [sessionId, displayName, content]
    );

    lastPostTime.set(sessionId, now);
    history.push(now);
    postHistory.set(sessionId, history);

    const created = insertRes.rows[0];

    // Fetch author details
    const userRes = await pool.query(
      `SELECT COALESCE(
          (SELECT COUNT(*)::int 
           FROM letter_likes ll 
           JOIN letters l ON ll.letter_id = l.id 
           WHERE l.session_id = $1 AND ll.session_id != l.session_id), 
          0
        ) AS rank_likes`,
      [sessionId]
    );

    const author = userRes.rows[0];

    res.status(201).json({
      letter: {
        id: created.id,
        formattedId: `#${String(created.id).padStart(3, '0')}`,
        userId: created.session_id,
        username: created.display_name,
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
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const letterId = parseInt(String(req.params.id), 10);
    const isAdmin = checkIsAdmin(req);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID.' });
      return;
    }

    const checkRes = await pool.query(
      `SELECT id, session_id FROM letters WHERE id = $1`,
      [letterId]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ error: 'Letter not found.' });
      return;
    }

    const letter = checkRes.rows[0];

    if (letter.session_id !== sessionId && !isAdmin) {
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
// Idempotent like
router.post('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.status(401).json({ error: 'Session ID is required.' });
      return;
    }

    const letterId = parseInt(String(req.params.id), 10);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID.' });
      return;
    }

    // Rate limit likes per session (1 every 300ms)
    const now = Date.now();
    const lastLike = lastLikeTime.get(sessionId) || 0;
    if (now - lastLike < 300) {
      res.status(429).json({ error: 'Too many requests.' });
      return;
    }
    lastLikeTime.set(sessionId, now);

    // Verify letter exists
    const letterRes = await pool.query(`SELECT id FROM letters WHERE id = $1`, [letterId]);
    if (letterRes.rows.length === 0) {
      res.status(404).json({ error: 'Letter not found.' });
      return;
    }

    await pool.query(
      `INSERT INTO letter_likes (session_id, letter_id)
       VALUES ($1, $2)
       ON CONFLICT (session_id, letter_id) DO NOTHING`,
      [sessionId, letterId]
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
// Idempotent unlike
router.delete('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.status(401).json({ error: 'Session ID is required.' });
      return;
    }

    const letterId = parseInt(String(req.params.id), 10);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID.' });
      return;
    }

    await pool.query(
      `DELETE FROM letter_likes WHERE session_id = $1 AND letter_id = $2`,
      [sessionId, letterId]
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
        l.session_id, 
        MAX(l.display_name) as username, 
        COUNT(ll.session_id)::int AS total_likes, 
        COUNT(DISTINCT l.id)::int AS letters_count
      FROM letters l
      LEFT JOIN letter_likes ll ON ll.letter_id = l.id AND ll.session_id != l.session_id
      GROUP BY l.session_id
      ORDER BY total_likes DESC, letters_count DESC
      LIMIT 10
    `);

    const leaderboard = result.rows.map((row, index) => {
      const likes = parseInt(row.total_likes || '0', 10);
      return {
        rankPosition: index + 1,
        userId: row.session_id,
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
