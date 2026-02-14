import type { SubscriptionTier } from '../types/user.types.js';

export interface TierQuotaLimits {
  reels: number;
  carousels: number;
  aiImages: number;
}

export const QUOTA_LIMITS: Record<SubscriptionTier, TierQuotaLimits> = {
  free: { reels: 3, carousels: 3, aiImages: 5 },
  starter: { reels: 15, carousels: 15, aiImages: 30 },
  pro: { reels: 50, carousels: 50, aiImages: 100 },
  business: { reels: 150, carousels: 150, aiImages: 300 },
  agency: { reels: 500, carousels: 500, aiImages: 1000 },
};
