import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Try httpOnly cookie first, then Authorization header as fallback
    let token: string | undefined;

    if (req.cookies?.curio_token) {
      token = req.cookies.curio_token as string;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      res.status(401).json({ error: 'No authentication token provided.' });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}
