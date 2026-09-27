import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// PUT /api/users/settings
// Update theme_settings json and optionally wallpaper_id
router.put('/settings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { themeSettings, wallpaperId } = req.body as {
      themeSettings?: Record<string, unknown>;
      wallpaperId?: string;
    };

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (themeSettings !== undefined) {
      updates.push(`theme_settings = $${paramIdx++}`);
      values.push(JSON.stringify(themeSettings));
    }

    if (wallpaperId !== undefined) {
      updates.push(`wallpaper_id = $${paramIdx++}`);
      values.push(wallpaperId);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No settings provided to update.' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING id, username, email, wallpaper_id, theme_settings`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const row = result.rows[0];
    res.status(200).json({
      message: 'Settings updated successfully.',
      wallpaperId: row.wallpaper_id,
      themeSettings: row.theme_settings,
    });
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;
