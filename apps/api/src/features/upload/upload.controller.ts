import type { Request, Response, NextFunction } from 'express';
import { requestPresignedUrl } from './upload.service';
import type { SubscriptionTier } from '@plublista/shared';

export async function getPresignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const tier = (req.user as { subscriptionTier: SubscriptionTier }).subscriptionTier;

    const result = await requestPresignedUrl(userId, tier, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
