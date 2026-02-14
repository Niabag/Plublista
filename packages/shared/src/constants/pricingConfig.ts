import type { SubscriptionTier } from '../types/user.types.js';
import { CREDIT_LIMITS } from './creditCosts.js';

export interface PricingTierConfig {
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  credits: number;
}

export const PRICING_CONFIG: Record<SubscriptionTier, PricingTierConfig> = {
  free: {
    name: 'Free',
    priceMonthly: 0,
    currency: 'EUR',
    features: [
      'Instagram direct publishing',
      `${CREDIT_LIMITS.free} credits / month`,
      'Watermark on content',
    ],
    credits: CREDIT_LIMITS.free,
  },
  starter: {
    name: 'Starter',
    priceMonthly: 29,
    currency: 'EUR',
    features: [
      'Multi-platform publishing',
      `${CREDIT_LIMITS.starter} credits / month`,
      'No watermark',
      '7-day free trial',
    ],
    credits: CREDIT_LIMITS.starter,
  },
  pro: {
    name: 'Pro',
    priceMonthly: 79,
    currency: 'EUR',
    features: [
      'Multi-platform publishing',
      `${CREDIT_LIMITS.pro} credits / month`,
      'No watermark',
      'Priority support',
      '7-day free trial',
    ],
    credits: CREDIT_LIMITS.pro,
  },
  business: {
    name: 'Business',
    priceMonthly: 199,
    currency: 'EUR',
    features: [
      'Multi-platform publishing',
      `${CREDIT_LIMITS.business.toLocaleString()} credits / month`,
      'No watermark',
      'Priority support',
      '7-day free trial',
    ],
    credits: CREDIT_LIMITS.business,
  },
  agency: {
    name: 'Agency',
    priceMonthly: 499,
    currency: 'EUR',
    features: [
      'Multi-platform publishing',
      `${CREDIT_LIMITS.agency.toLocaleString()} credits / month`,
      'No watermark',
      'Dedicated support',
      '7-day free trial',
    ],
    credits: CREDIT_LIMITS.agency,
  },
};

/** Ordered tiers for pricing page display */
export const TIER_ORDER: SubscriptionTier[] = ['free', 'starter', 'pro', 'business', 'agency'];

/** Returns the index of a tier in TIER_ORDER. Higher index = higher tier. */
export function tierIndex(tier: SubscriptionTier): number {
  return TIER_ORDER.indexOf(tier);
}

/** Determine whether changing from one tier to another is an upgrade, downgrade, or same. */
export function getTierChangeDirection(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier,
): 'upgrade' | 'downgrade' | 'same' {
  const current = tierIndex(currentTier);
  const target = tierIndex(newTier);
  if (target > current) return 'upgrade';
  if (target < current) return 'downgrade';
  return 'same';
}
