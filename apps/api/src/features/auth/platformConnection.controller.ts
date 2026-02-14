import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/errors';
import { getUserConnections, disconnectPlatform } from './platformConnection.service';
import type { Platform } from '@plublista/shared';

const VALID_PLATFORMS: Platform[] = ['instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'x'];

export async function listConnections(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return next(new AppError('UNAUTHORIZED', 'Not authenticated', 401));
    }

    const userId = (req.user as { id: string }).id;
    const connections = await getUserConnections(userId);

    res.json({ data: connections });
  } catch (err) {
    next(err);
  }
}

export async function removeConnection(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return next(new AppError('UNAUTHORIZED', 'Not authenticated', 401));
    }

    const platform = req.params.platform as Platform;
    if (!VALID_PLATFORMS.includes(platform)) {
      return next(new AppError('VALIDATION_ERROR', `Invalid platform: ${platform}`, 400));
    }

    const userId = (req.user as { id: string }).id;
    const deleted = await disconnectPlatform(userId, platform);

    if (!deleted) {
      return next(new AppError('NOT_FOUND', `No ${platform} connection found`, 404));
    }

    res.json({ data: { message: `${platform} disconnected` } });
  } catch (err) {
    next(err);
  }
}
