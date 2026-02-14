import type { Request, Response, NextFunction } from 'express';
import { getUserQuota } from './quota.service';
import type { SubscriptionTier } from '@plublista/shared';

export async function getQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as { id: string; subscriptionTier: SubscriptionTier };
    const quota = await getUserQuota(user.id, user.subscriptionTier);
    res.json({ data: quota });
  } catch (err) {
    next(err);
  }
}
