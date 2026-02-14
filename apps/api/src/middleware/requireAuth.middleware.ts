import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }
  next();
}
