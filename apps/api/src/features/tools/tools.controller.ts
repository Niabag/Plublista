import type { Request, Response, NextFunction } from 'express';
import { generateHashtags, generateCaptions, generateBestTimes } from './tools.service';

export async function hashtagGenerator(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic } = req.body as { topic: string };
    const result = await generateHashtags(topic);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function captionGenerator(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic, tone, platform } = req.body as { topic: string; tone: string; platform: string };
    const result = await generateCaptions(topic, tone, platform);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function bestTimeToPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { platform, niche } = req.body as { platform: string; niche: string };
    const result = await generateBestTimes(platform, niche);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
