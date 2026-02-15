import { CREDIT_LIMITS } from '@publista/shared';
import type { SubscriptionTier } from '@publista/shared';
import { getOrCreateCreditUsage } from './quotaUsage.service';

export async function getUserQuota(userId: string, subscriptionTier: SubscriptionTier) {
  const usage = await getOrCreateCreditUsage(userId, subscriptionTier);
  const limit = CREDIT_LIMITS[subscriptionTier];

  const pct = (used: number, max: number) =>
    max > 0 ? Math.round((used / max) * 100) : 0;

  return {
    tier: subscriptionTier,
    creditsUsed: usage.creditsUsed,
    creditsLimit: limit,
    percentage: pct(usage.creditsUsed, limit),
    period: {
      start: usage.periodStart,
      end: usage.periodEnd,
    },
  };
}
