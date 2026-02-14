import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    };
    if (err.details) {
      body.details = err.details;
    }
    res.status(err.statusCode).json({ error: body });
    return;
  }

  // Handle CSRF token errors from csrf-sync
  if (err instanceof Error && (err as Error & { code?: string }).code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      error: {
        code: 'INVALID_CSRF_TOKEN',
        message: 'Invalid or missing CSRF token',
        statusCode: 403,
      },
    });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      statusCode: 500,
    },
  });
}
