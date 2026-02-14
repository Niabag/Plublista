import type { SubscriptionTier } from '../types/user.types.js';

export const CREDIT_COSTS = {
  createReel: 5,
  createCarousel: 1,
  generateAiImage: 3,
  regenerateCopy: 1,
  publishAyrshare: 1,
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

export const CREDIT_LIMITS: Record<SubscriptionTier, number> = {
  free: 35,
  starter: 200,
  pro: 700,
  business: 2_000,
  agency: 7_000,
};
