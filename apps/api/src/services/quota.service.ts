import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { quotaUsage } from '../db/schema/index';
import { users } from '../db/schema/users';
import { AppError } from '../lib/errors';
import { CREDIT_COSTS, CREDIT_LIMITS } from '@plublista/shared';
import type { CreditOperation, SubscriptionTier } from '@plublista/shared';

const PLATFORM_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  business: 10,
  agency: 25,
};

function getCurrentPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    periodStart: start.toISOString().split('T')[0],
    periodEnd: end.toISOString().split('T')[0],
  };
}

function getValidatedTier(raw: string): SubscriptionTier {
  const validTiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'business', 'agency'];
  if (validTiers.includes(raw as SubscriptionTier)) {
    return raw as SubscriptionTier;
  }
  throw new AppError('INTERNAL_ERROR', `Invalid subscription tier: ${raw}`, 500);
}

export async function checkAndDecrementCredits(
  userId: string,
  operation: CreditOperation,
  multiplier = 1,
): Promise<void> {
  const cost = CREDIT_COSTS[operation] * multiplier;

  // 1. Get user's subscription tier
  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const tier = getValidatedTier(user.subscriptionTier);
  const { periodStart, periodEnd } = getCurrentPeriod();

  // 2. Try atomic increment with WHERE guard (prevents TOCTOU race)
  const updated = await db
    .update(quotaUsage)
    .set({ creditsUsed: sql`${quotaUsage.creditsUsed} + ${cost}` })
    .where(
      and(
        eq(quotaUsage.userId, userId),
        eq(quotaUsage.periodStart, periodStart),
        sql`${quotaUsage.creditsUsed} + ${cost} <= ${quotaUsage.creditsLimit}`,
      ),
    )
    .returning({ id: quotaUsage.id });

  if (updated.length > 0) {
    return; // Atomic increment succeeded
  }

  // 3. Row might not exist yet — create with onConflictDoNothing to handle races
  const [inserted] = await db
    .insert(quotaUsage)
    .values({
      userId,
      periodStart,
      periodEnd,
      creditsUsed: cost,
      creditsLimit: CREDIT_LIMITS[tier],
      platformsConnected: 0,
      platformsLimit: PLATFORM_LIMITS[tier],
    })
    .onConflictDoNothing()
    .returning({ id: quotaUsage.id });

  if (inserted) {
    return; // New row created with initial usage
  }

  // 4. Row exists but INSERT raced — retry atomic increment
  const retried = await db
    .update(quotaUsage)
    .set({ creditsUsed: sql`${quotaUsage.creditsUsed} + ${cost}` })
    .where(
      and(
        eq(quotaUsage.userId, userId),
        eq(quotaUsage.periodStart, periodStart),
        sql`${quotaUsage.creditsUsed} + ${cost} <= ${quotaUsage.creditsLimit}`,
      ),
    )
    .returning({ id: quotaUsage.id });

  if (retried.length === 0) {
    throw new AppError('QUOTA_EXCEEDED', 'Not enough credits. Upgrade your plan for more.', 429);
  }
}

export async function restoreCredits(
  userId: string,
  operation: CreditOperation,
  multiplier = 1,
): Promise<void> {
  const cost = CREDIT_COSTS[operation] * multiplier;
  const { periodStart } = getCurrentPeriod();

  await db
    .update(quotaUsage)
    .set({ creditsUsed: sql`GREATEST(${quotaUsage.creditsUsed} - ${cost}, 0)` })
    .where(
      and(
        eq(quotaUsage.userId, userId),
        eq(quotaUsage.periodStart, periodStart),
      ),
    );
}
