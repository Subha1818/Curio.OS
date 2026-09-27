import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import path from 'path';

import authRoutes from './routes/auth';
import statsRoutes from './routes/stats';
import secretRoutes from './routes/secret';
import notesRoutes from './routes/notes';
import usersRoutes from './routes/users';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// ── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile) or from allowed list
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true, // Required for httpOnly cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static Files (Audio Tracks & Public Assets) ────────
const publicDir = path.join(__dirname, '../public');
app.use('/tracks', express.static(path.join(publicDir, 'tracks')));
app.use(express.static(publicDir));

// ── Health Check ──────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'Curio.OS API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/secret', secretRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/users', usersRoutes);

// ── 404 Fallthrough ────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found. This is Curio.OS API.' });
});

// ── Error Handler ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ✨ Curio.OS API Server running
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 http://localhost:${PORT}
  📍 /api/auth/register
  📍 /api/auth/login
  📍 /api/auth/logout
  📍 /api/auth/me
  📍 /api/auth/settings (PATCH)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🗄️  Neon Postgres: connected
  🔒 CORS allowed: ${CORS_ORIGINS.join(', ')}
  `);
});

export default app;
