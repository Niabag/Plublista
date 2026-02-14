import type { Request, Response, NextFunction } from 'express';
import {
  getSystemHealth,
  getPublishErrors,
  getApiCosts,
  getUsers,
  getUserDetail,
  adjustUserQuota,
  getExpiringTokens,
  getAuditLogs,
} from './admin.service';

export async function systemHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getSystemHealth();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function publishErrors(req: Request, res: Response, next: NextFunction) {
  try {
    const { platform, dateFrom, dateTo, limit, offset } = req.query as Record<string, string>;
    const data = await getPublishErrors({
      platform,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function apiCosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = req.query as Record<string, string>;
    const data = await getApiCosts({ days: days ? parseInt(days) : undefined });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, tier, limit, offset } = req.query as Record<string, string>;
    const data = await getUsers({
      search,
      tier,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function userDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id as string;
    const data = await getUserDetail(userId);
    if (!data) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 } });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function adjustQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = (req.user as { id: string }).id;
    const userId = req.params.id as string;
    const { creditsLimit, platformsLimit } = req.body as {
      creditsLimit?: number;
      platformsLimit?: number;
    };
    const data = await adjustUserQuota(adminId, userId, { creditsLimit, platformsLimit });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function expiringTokens(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = req.query as Record<string, string>;
    const data = await getExpiringTokens(days ? parseInt(days) : undefined);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function auditLogsList(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, offset } = req.query as Record<string, string>;
    const data = await getAuditLogs({
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
