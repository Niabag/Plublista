import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { quotaUsage } from '../db/schema/index';
import { users } from '../db/schema/users';
import { AppError } from '../lib/errors';
import { QUOTA_LIMITS, type SubscriptionTier } from '@plublista/shared';

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

type QuotaResource = 'ai_images' | 'carousels';

function getQuotaColumn(resource: QuotaResource) {
  if (resource === 'ai_images') {
    return {
      used: quotaUsage.aiImagesUsed,
      limit: quotaUsage.aiImagesLimit,
      jsKey: 'aiImagesUsed' as const,
      label: 'Monthly AI image quota reached',
    };
  }
  return {
    used: quotaUsage.carouselsUsed,
    limit: quotaUsage.carouselsLimit,
    jsKey: 'carouselsUsed' as const,
    label: 'Monthly carousel quota reached',
  };
}

function getInitialUsage(resource: QuotaResource, amount: number) {
  if (resource === 'ai_images') {
    return { aiImagesUsed: amount, carouselsUsed: 0 };
  }
  return { aiImagesUsed: 0, carouselsUsed: amount };
}

export async function checkAndDecrementQuota(
  userId: string,
  resource: QuotaResource,
  amount: number,
): Promise<void> {
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
  const limits = QUOTA_LIMITS[tier];
  const col = getQuotaColumn(resource);

  const { periodStart, periodEnd } = getCurrentPeriod();

  // 2. Try atomic increment with WHERE guard (prevents TOCTOU race)
  const updated = await db
    .update(quotaUsage)
    .set({ [col.jsKey]: sql`${col.used} + ${amount}` })
    .where(
      and(
        eq(quotaUsage.userId, userId),
        eq(quotaUsage.periodStart, periodStart),
        sql`${col.used} + ${amount} <= ${col.limit}`,
      ),
    )
    .returning({ id: quotaUsage.id });

  if (updated.length > 0) {
    return; // Atomic increment succeeded
  }

  // 3. Row might not exist yet — create with onConflictDoNothing to handle races
  const initialUsage = getInitialUsage(resource, amount);
  const [inserted] = await db
    .insert(quotaUsage)
    .values({
      userId,
      periodStart,
      periodEnd,
      reelsUsed: 0,
      reelsLimit: limits.reels,
      carouselsUsed: initialUsage.carouselsUsed,
      carouselsLimit: limits.carousels,
      aiImagesUsed: initialUsage.aiImagesUsed,
      aiImagesLimit: limits.aiImages,
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
    .set({ [col.jsKey]: sql`${col.used} + ${amount}` })
    .where(
      and(
        eq(quotaUsage.userId, userId),
        eq(quotaUsage.periodStart, periodStart),
        sql`${col.used} + ${amount} <= ${col.limit}`,
      ),
    )
    .returning({ id: quotaUsage.id });

  if (retried.length === 0) {
    throw new AppError('QUOTA_EXCEEDED', col.label, 429);
  }
}

export async function restoreQuota(
  userId: string,
  resource: QuotaResource,
  amount: number,
): Promise<void> {
  const { periodStart } = getCurrentPeriod();
  const col = getQuotaColumn(resource);

  await db
    .update(quotaUsage)
    .set({ [col.jsKey]: sql`GREATEST(${col.used} - ${amount}, 0)` })
    .where(
      and(
        eq(quotaUsage.userId, userId),
        eq(quotaUsage.periodStart, periodStart),
      ),
    );
}
