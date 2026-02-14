import type { Request, Response, NextFunction } from 'express';
import {
  publishToInstagram,
  publishToMultiplePlatforms,
  getPublishStatus,
  listPlatformConnections,
  getUserTier,
  getAyrshareConnectionUrl,
  scheduleContent,
  cancelSchedule,
} from './publishing.service';

export async function publishContentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const contentItemId = req.params.id as string;
    const { platforms } = req.body as { platforms: string[] };

    // Free user publishing single Instagram → direct Graph API
    if (platforms.length === 1 && platforms[0] === 'instagram') {
      const user = await getUserTier(userId);
      if (user.subscriptionTier === 'free') {
        const result = await publishToInstagram(userId, contentItemId);
        return res.status(202).json({ data: result });
      }
    }

    // Paid user → Ayrshare for any platform combination
    const result = await publishToMultiplePlatforms(userId, contentItemId, platforms);
    res.status(202).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPublishStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const contentItemId = req.params.id as string;

    const jobs = await getPublishStatus(userId, contentItemId);
    res.json({ data: jobs });
  } catch (err) {
    next(err);
  }
}

export async function listPlatformConnectionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const connections = await listPlatformConnections(userId);
    res.json({ data: connections });
  } catch (err) {
    next(err);
  }
}

export async function getAyrshareConnectionUrlHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await getAyrshareConnectionUrl(userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function scheduleContentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const contentItemId = req.params.id as string;
    const { platforms, scheduledAt } = req.body as { platforms: string[]; scheduledAt: string };

    const result = await scheduleContent(userId, contentItemId, platforms, scheduledAt);
    res.status(202).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function cancelScheduleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const contentItemId = req.params.id as string;

    const result = await cancelSchedule(userId, contentItemId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
