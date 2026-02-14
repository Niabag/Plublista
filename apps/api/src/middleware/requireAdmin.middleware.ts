import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }

  const user = req.user as { id: string; role: string };
  if (user.role !== 'admin') {
    return next(new AppError('FORBIDDEN', 'Admin access required', 403));
  }

  next();
}
