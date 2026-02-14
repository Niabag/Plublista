import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index';
import { quotaUsage } from '../../db/schema/index';
import { QUOTA_LIMITS } from '@plublista/shared';
import type { SubscriptionTier } from '@plublista/shared';

/** Platform limits per tier (stored in quota_usage for future use) */
const PLATFORM_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  business: 10,
  agency: 25,
};

function getCurrentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    periodStart: start.toISOString().split('T')[0]!,
    periodEnd: end.toISOString().split('T')[0]!,
  };
}

export async function getOrCreateQuotaUsage(userId: string, tier: SubscriptionTier) {
  const { periodStart, periodEnd } = getCurrentPeriod();
  const limits = QUOTA_LIMITS[tier];

  const [existing] = await db
    .select()
    .from(quotaUsage)
    .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.periodStart, periodStart)))
    .limit(1);

  if (existing) return existing;

  const [record] = await db
    .insert(quotaUsage)
    .values({
      userId,
      periodStart,
      periodEnd,
      reelsUsed: 0,
      reelsLimit: limits.reels,
      carouselsUsed: 0,
      carouselsLimit: limits.carousels,
      aiImagesUsed: 0,
      aiImagesLimit: limits.aiImages,
      platformsConnected: 0,
      platformsLimit: PLATFORM_LIMITS[tier],
    })
    .onConflictDoNothing()
    .returning();

  // Handle race condition: another request may have inserted first
  if (!record) {
    const [raced] = await db
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.periodStart, periodStart)))
      .limit(1);
    return raced!;
  }

  return record;
}

export type QuotaResourceName = 'reels' | 'carousels' | 'aiImages';

export async function incrementUsage(userId: string, tier: SubscriptionTier, resource: QuotaResourceName) {
  const usage = await getOrCreateQuotaUsage(userId, tier);

  const updateMap = {
    reels: { reelsUsed: sql`${quotaUsage.reelsUsed} + 1` },
    carousels: { carouselsUsed: sql`${quotaUsage.carouselsUsed} + 1` },
    aiImages: { aiImagesUsed: sql`${quotaUsage.aiImagesUsed} + 1` },
  } as const;

  await db
    .update(quotaUsage)
    .set(updateMap[resource])
    .where(eq(quotaUsage.id, usage.id));
}

export async function checkQuota(userId: string, tier: SubscriptionTier, resource: QuotaResourceName): Promise<boolean> {
  const usage = await getOrCreateQuotaUsage(userId, tier);

  const checks: Record<QuotaResourceName, () => boolean> = {
    reels: () => usage.reelsUsed < usage.reelsLimit,
    carousels: () => usage.carouselsUsed < usage.carouselsLimit,
    aiImages: () => usage.aiImagesUsed < usage.aiImagesLimit,
  };

  return checks[resource]();
}
