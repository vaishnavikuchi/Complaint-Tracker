import type { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 * Enforces uniform error format: { "error": "message" }
 */
export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('[GlobalErrorHandler]', err);

  const errorMessage = err instanceof Error ? err.message : 'Internal server error occurred.';
  res.status(500).json({ error: errorMessage });
}

/**
 * 404 handler for undefined API routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
}
