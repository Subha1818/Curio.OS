import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All notes routes require authentication
router.use(authMiddleware);

// ── GET /api/notes ────────────────────────────────────────────────────────────
// Fetch all notes for the authenticated user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const result = await pool.query(
      `SELECT id, user_id, content, pinned, tags, created_at, updated_at
       FROM notes
       WHERE user_id = $1
       ORDER BY pinned DESC, created_at DESC`,
      [userId]
    );

    res.status(200).json({ notes: result.rows });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// ── POST /api/notes ───────────────────────────────────────────────────────────
// Create a new note
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { content, pinned = false, tags = [] } = req.body as {
      content?: string;
      pinned?: boolean;
      tags?: string[];
    };

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Note content cannot be empty.' });
      return;
    }

    // Ensure tags is string array
    const validTags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];

    const result = await pool.query(
      `INSERT INTO notes (user_id, content, pinned, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, content, pinned, tags, created_at, updated_at`,
      [userId, content.trim(), Boolean(pinned), validTags]
    );

    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// ── PUT /api/notes/:id ────────────────────────────────────────────────────────
// Update an existing note
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;
    const { content, pinned, tags } = req.body as {
      content?: string;
      pinned?: boolean;
      tags?: string[];
    };

    // Verify ownership
    const checkRes = await pool.query(
      `SELECT id FROM notes WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ error: 'Note not found or unauthorized.' });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        res.status(400).json({ error: 'Note content cannot be empty.' });
        return;
      }
      updates.push(`content = $${paramIdx++}`);
      values.push(content.trim());
    }

    if (pinned !== undefined) {
      updates.push(`pinned = $${paramIdx++}`);
      values.push(Boolean(pinned));
    }

    if (tags !== undefined) {
      const validTags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
      updates.push(`tags = $${paramIdx++}`);
      values.push(validTags);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);
    values.push(userId);

    const result = await pool.query(
      `UPDATE notes
       SET ${updates.join(', ')}
       WHERE id = $${paramIdx++} AND user_id = $${paramIdx++}
       RETURNING id, user_id, content, pinned, tags, created_at, updated_at`,
      values
    );

    res.status(200).json({ note: result.rows[0] });
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// ── DELETE /api/notes/:id ─────────────────────────────────────────────────────
// Delete a note
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM notes
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found or unauthorized.' });
      return;
    }

    res.status(200).json({ message: 'Note deleted successfully.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

export default router;
