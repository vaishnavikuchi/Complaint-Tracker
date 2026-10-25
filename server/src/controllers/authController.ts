import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Controller for Admin Authentication
 * Handles POST /api/auth/login
 */
export function login(req: Request, res: Response): void {
  const { username, password } = req.body;

  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    res.status(401).json({ error: 'Invalid admin credentials.' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'complaint-tracker-super-secret-key-2026';
  const token = jwt.sign(
    {
      username,
      role: 'admin',
    },
    secret,
    { expiresIn: '8h' }
  );

  res.status(200).json({
    token,
    user: {
      username,
      role: 'admin',
    },
  });
}
