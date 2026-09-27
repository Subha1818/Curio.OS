import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool';
import { signToken } from '../utils/jwt';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Shared cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

// ─────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { email, password, username }
// ─────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body as {
      email?: string;
      password?: string;
      username?: string;
    };

    // Validation
    if (!email || !password || !username) {
      res.status(400).json({ error: 'email, password, and username are all required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    if (username.length < 2 || username.length > 50) {
      res.status(400).json({ error: 'Username must be 2–50 characters.' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
      return;
    }

    // Check uniqueness
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'That email or username is already taken, cutie.' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, wallpaper_id, theme_settings, created_at`,
      [email.toLowerCase(), username.toLowerCase(), password_hash]
    );

    const user = result.rows[0];

    // Sign JWT
    const token = signToken({
      userId: user.id as string,
      username: user.username as string,
      email: user.email as string,
    });

    // Set httpOnly cookie
    res.cookie('curio_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      message: `Hii ${user.username}! Now you are my cutipie ❤️`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallpaperId: user.wallpaper_id,
        themeSettings: user.theme_settings,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong on our end. Try again?' });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required.' });
      return;
    }

    // Find user
    const result = await pool.query(
      `SELECT id, username, email, password_hash, wallpaper_id, theme_settings, created_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Return 404 so the frontend can auto-switch to register flow
      res.status(404).json({ error: 'No account found with that email. Want to register?' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash as string);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Wrong password, cutie. Try again?' });
      return;
    }

    // Sign JWT
    const token = signToken({
      userId: user.id as string,
      username: user.username as string,
      email: user.email as string,
    });

    // Set httpOnly cookie
    res.cookie('curio_token', token, COOKIE_OPTIONS);

    res.status(200).json({
      message: `Welcome back, ${user.username}! Missed you ❤️`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallpaperId: user.wallpaper_id,
        themeSettings: user.theme_settings,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong on our end. Try again?' });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/auth/logout
// Clears the httpOnly cookie
// ─────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('curio_token', { path: '/' });
  res.status(200).json({ message: 'Logged out. Come back soon! 👋' });
});

// ─────────────────────────────────────────────────────
// GET /api/auth/me
// Returns current user from valid JWT (used to restore session)
// ─────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const result = await pool.query(
      `SELECT id, username, email, wallpaper_id, theme_settings, bio, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.clearCookie('curio_token', { path: '/' });
      res.status(404).json({ error: 'User not found. Cookie cleared.' });
      return;
    }

    const user = result.rows[0];
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallpaperId: user.wallpaper_id,
        themeSettings: user.theme_settings,
        bio: user.bio,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

// ─────────────────────────────────────────────────────
// PATCH /api/auth/settings
// Update wallpaper or theme settings for logged-in user
// ─────────────────────────────────────────────────────
router.patch('/settings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { wallpaperId, themeSettings, bio } = req.body as {
      wallpaperId?: string;
      themeSettings?: object;
      bio?: string;
    };

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (wallpaperId !== undefined) {
      updates.push(`wallpaper_id = $${paramIdx++}`);
      values.push(wallpaperId);
    }
    if (themeSettings !== undefined) {
      updates.push(`theme_settings = $${paramIdx++}`);
      values.push(JSON.stringify(themeSettings));
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIdx++}`);
      values.push(bio);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, username, email, wallpaper_id, theme_settings, bio`,
      values
    );

    res.status(200).json({
      message: 'Settings saved!',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        wallpaperId: result.rows[0].wallpaper_id,
        themeSettings: result.rows[0].theme_settings,
        bio: result.rows[0].bio,
      },
    });
  } catch (err) {
    console.error('PATCH /settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// ─────────────────────────────────────────────────────
// DELETE /api/auth/me
// Delete current user account and cascade delete their notes/data
// ─────────────────────────────────────────────────────
router.delete('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, username`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.clearCookie('curio_token', { path: '/' });
    res.status(200).json({ message: 'Account and associated data deleted successfully.' });
  } catch (err) {
    console.error('DELETE /me error:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

export default router;
