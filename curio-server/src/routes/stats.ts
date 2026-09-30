import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { getRankFromLikes } from './letters';

const router = Router();

// GET /api/stats/me - returns personalized stats for current session
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    let lettersPosted = 0;
    let likesReceived = 0;
    let username = 'Anonymous';
    
    if (sessionId) {
      try {
        const lettersRes = await pool.query(
          `SELECT COUNT(*)::int as count, MAX(display_name) as name FROM letters WHERE session_id = $1`,
          [sessionId]
        );
        lettersPosted = parseInt(lettersRes.rows[0]?.count || '0', 10);
        if (lettersRes.rows[0]?.name) {
          username = lettersRes.rows[0].name;
        }

        const likesRes = await pool.query(
          `SELECT COUNT(*)::int as count 
           FROM letter_likes ll
           JOIN letters l ON ll.letter_id = l.id
           WHERE l.session_id = $1 AND ll.session_id != l.session_id`,
          [sessionId]
        );
        likesReceived = parseInt(likesRes.rows[0]?.count || '0', 10);
      } catch (dbErr) {
        console.error('Error fetching letter stats:', dbErr);
      }
    }

    const rank = getRankFromLikes(likesReceived);

    res.status(200).json({
      username,
      lettersPosted,
      likesReceived,
      rank,
      shell: 'curio-zsh 2.5',
      kernel: 'Curio.Kernel (Browser Edition)',
      memory: '48.2 MB / 1024 MB',
      uptime: `Continuous`,
      packages: '14 (curio-pkg)',
      role: 'Mystery Visitor',
    });
  } catch (err) {
    console.error('Error fetching stats/me:', err);
    res.status(500).json({ error: 'Failed to retrieve statistics.' });
  }
});

export default router;
