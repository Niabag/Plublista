import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../lib/errors';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(
        new AppError(
          'VALIDATION_ERROR',
          `Validation failed: ${fieldErrors.map((e) => e.message).join(', ')}`,
          400,
          fieldErrors,
        ),
      );
    }
    req.body = result.data;
    next();
  };
}
