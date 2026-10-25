import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    role: 'admin';
  };
}

/**
 * JWT Authentication Middleware for Admin-only routes
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or malformed token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'complaint-tracker-super-secret-key-2026';

  try {
    const decoded = jwt.verify(token, secret) as { username: string; role: 'admin' };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
