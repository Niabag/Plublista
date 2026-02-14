import type { Request, Response, NextFunction } from 'express';
import { recordScan, getUserStats, getLeaderboard } from './tv.service';

export async function scan(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const { source, campaign } = req.body as { source?: string; campaign?: string };
    const result = await recordScan(userId, source, campaign);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await getUserStats(userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function leaderboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getLeaderboard();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
