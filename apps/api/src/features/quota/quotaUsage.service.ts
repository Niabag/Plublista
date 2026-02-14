import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { quotaUsage } from '../../db/schema/index';
import { CREDIT_LIMITS } from '@plublista/shared';
import type { SubscriptionTier } from '@plublista/shared';

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

export async function getOrCreateCreditUsage(userId: string, tier: SubscriptionTier) {
  const { periodStart, periodEnd } = getCurrentPeriod();

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
      creditsUsed: 0,
      creditsLimit: CREDIT_LIMITS[tier],
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
