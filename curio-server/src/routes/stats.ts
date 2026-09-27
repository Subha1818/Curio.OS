import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/stats/me - returns personalized stats for logged-in user
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    // 1. Fetch user data
    const userRes = await pool.query(
      `SELECT id, username, email, wallpaper_id, created_at, bio
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = userRes.rows[0];

    // 2. Count notes (handle if table doesn't exist yet)
    let notesCount = 0;
    try {
      const notesRes = await pool.query(
        `SELECT COUNT(*) as count FROM notes WHERE user_id = $1`,
        [userId]
      );
      notesCount = parseInt(notesRes.rows[0]?.count || '0', 10);
    } catch {
      // Notes table may not be migrated yet in this stage
      notesCount = 0;
    }

    // 3. Compute days since account creation
    const createdDate = new Date(user.created_at);
    const diffMs = Date.now() - createdDate.getTime();
    const daysSinceJoined = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // 4. Login streak & OS stats
    // We can simulate an active streak of 1-3 days or compute based on created_at
    const loginStreak = Math.min(daysSinceJoined, 3);

    res.status(200).json({
      username: user.username,
      email: user.email,
      wallpaper: user.wallpaper_id || 'cosmic-aurora',
      createdAt: user.created_at,
      daysSinceJoined,
      notesCount,
      loginStreak,
      shell: 'curio-zsh 2.5',
      kernel: 'Curio.Kernel (Browser Edition)',
      memory: '48.2 MB / 1024 MB',
      uptime: `${daysSinceJoined}d ${(Math.floor((diffMs / (1000 * 60 * 60)) % 24))}h`,
      packages: '14 (curio-pkg)',
      role: 'Cutiepie Administrator',
    });
  } catch (err) {
    console.error('Error fetching stats/me:', err);
    res.status(500).json({ error: 'Failed to retrieve user statistics.' });
  }
});

export default router;
