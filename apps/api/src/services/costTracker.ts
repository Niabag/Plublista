import { eq, and, gte } from 'drizzle-orm';
import { db } from '../db/index';
import { apiCostLogs } from '../db/schema/index';
import type { apiServiceEnum } from '../db/schema/apiCostLogs';

type ApiService = (typeof apiServiceEnum.enumValues)[number];

export async function logCost(
  userId: string,
  service: ApiService,
  endpoint: string,
  costUsd: number,
): Promise<void> {
  await db.insert(apiCostLogs).values({
    userId,
    service,
    endpoint,
    costUsd: costUsd.toFixed(4),
  });
}

export async function getUserCosts(userId: string, since?: Date) {
  const where = since
    ? and(eq(apiCostLogs.userId, userId), gte(apiCostLogs.createdAt, since))
    : eq(apiCostLogs.userId, userId);

  return db.select().from(apiCostLogs).where(where);
}
