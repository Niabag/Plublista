import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { subscriptions } from '../db/schema/index';
import { AppError } from '../lib/errors';

export async function requireActiveSubscription(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const userId = (req.user as { id: string }).id;

  const [sub] = await db
    .select({ suspendedAt: subscriptions.suspendedAt })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  // No subscription = free tier = not suspended
  if (!sub) {
    return next();
  }

  if (sub.suspendedAt) {
    return next(
      new AppError(
        'ACCOUNT_SUSPENDED',
        'Your account is suspended due to failed payment. Please update your payment method to restore access.',
        402,
      ),
    );
  }

  next();
}
