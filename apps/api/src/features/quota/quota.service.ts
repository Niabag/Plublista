import { QUOTA_LIMITS } from '@plublista/shared';
import type { SubscriptionTier } from '@plublista/shared';
import { getOrCreateQuotaUsage } from './quotaUsage.service';

export async function getUserQuota(userId: string, subscriptionTier: SubscriptionTier) {
  const usage = await getOrCreateQuotaUsage(userId, subscriptionTier);
  const limits = QUOTA_LIMITS[subscriptionTier];

  const pct = (used: number, limit: number) =>
    limit > 0 ? Math.round((used / limit) * 100) : 0;

  return {
    tier: subscriptionTier,
    quotas: [
      {
        resource: 'reels' as const,
        used: usage.reelsUsed,
        limit: limits.reels,
        percentage: pct(usage.reelsUsed, limits.reels),
      },
      {
        resource: 'carousels' as const,
        used: usage.carouselsUsed,
        limit: limits.carousels,
        percentage: pct(usage.carouselsUsed, limits.carousels),
      },
      {
        resource: 'aiImages' as const,
        used: usage.aiImagesUsed,
        limit: limits.aiImages,
        percentage: pct(usage.aiImagesUsed, limits.aiImages),
      },
    ],
    period: {
      start: usage.periodStart,
      end: usage.periodEnd,
    },
  };
}
