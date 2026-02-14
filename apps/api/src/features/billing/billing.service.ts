import { eq, and } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db } from '../../db/index';
import { subscriptions, users, quotaUsage, stripeEvents } from '../../db/schema/index';
import { CREDIT_LIMITS, getTierChangeDirection } from '@plublista/shared';
import type { SubscriptionTier } from '@plublista/shared';
import { updateSubscriptionPrice, getCustomerInvoices, getCustomerPaymentMethod } from '../../services/stripe.service';
import type { InvoiceData, PaymentMethodData } from '../../services/stripe.service';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';

/** Platform limits per tier (mirrors quotaUsage.service.ts) */
const PLATFORM_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  business: 10,
  agency: 25,
};

/** Reusable helper to update credit limits for a user's current billing period */
export async function updateQuotaLimitsForTier(userId: string, tier: SubscriptionTier) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]!;

  await db
    .update(quotaUsage)
    .set({
      creditsLimit: CREDIT_LIMITS[tier],
      platformsLimit: PLATFORM_LIMITS[tier],
    })
    .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.periodStart, periodStart)));
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const tier = session.metadata?.tier as SubscriptionTier | undefined;

  if (!userId || !tier) {
    logger.warn('Checkout session missing client_reference_id or tier metadata');
    return;
  }

  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? '';

  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;

  // Upsert subscription record
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        tier,
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        pendingTier: null,
        pendingTierEffectiveDate: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      tier,
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  // Update user tier
  await db
    .update(users)
    .set({ subscriptionTier: tier, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Update quota limits for current period
  await updateQuotaLimitsForTier(userId, tier);
}

export async function getSubscription(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return sub ?? null;
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);

  if (!sub) {
    throw new AppError('NOT_FOUND', 'Subscription not found', 404);
  }

  return sub;
}

export async function changePlan(
  userId: string,
  newTier: Exclude<SubscriptionTier, 'free'>,
) {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    throw new AppError('NOT_FOUND', 'No active subscription found', 404);
  }

  if (!subscription.stripeSubscriptionId) {
    throw new AppError('VALIDATION_ERROR', 'Subscription has no Stripe subscription ID', 400);
  }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    throw new AppError('VALIDATION_ERROR', 'Can only change plan on active or trialing subscriptions', 400);
  }

  const direction = getTierChangeDirection(
    subscription.tier as SubscriptionTier,
    newTier,
  );

  if (direction === 'same') {
    throw new AppError('VALIDATION_ERROR', 'You are already on this plan', 400);
  }

  if (direction === 'upgrade') {
    // Immediate: update Stripe + local DB
    const updated = await updateSubscriptionPrice(
      subscription.stripeSubscriptionId,
      newTier,
      userId,
    );

    await db
      .update(subscriptions)
      .set({
        tier: newTier,
        pendingTier: null,
        pendingTierEffectiveDate: null,
        currentPeriodStart: new Date(updated.items.data[0].current_period_start * 1000),
        currentPeriodEnd: new Date(updated.items.data[0].current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    await db
      .update(users)
      .set({ subscriptionTier: newTier, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await updateQuotaLimitsForTier(userId, newTier);

    return { direction: 'upgrade' as const, newTier, effectiveNow: true };
  }

  // Downgrade: store intent, don't touch Stripe yet
  const effectiveDate = subscription.currentPeriodEnd ?? new Date();

  await db
    .update(subscriptions)
    .set({
      pendingTier: newTier,
      pendingTierEffectiveDate: effectiveDate,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  return {
    direction: 'downgrade' as const,
    newTier,
    effectiveNow: false,
    effectiveDate,
  };
}

export async function cancelPendingDowngrade(userId: string) {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    throw new AppError('NOT_FOUND', 'No active subscription found', 404);
  }

  if (!subscription.pendingTier) {
    throw new AppError('VALIDATION_ERROR', 'No pending downgrade to cancel', 400);
  }

  await db
    .update(subscriptions)
    .set({
      pendingTier: null,
      pendingTierEffectiveDate: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  return { canceled: true, currentTier: subscription.tier };
}

export async function getBillingDetails(userId: string) {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    return { subscription: null, invoices: [], paymentMethod: null };
  }

  const [invoices, paymentMethod] = await Promise.all([
    getCustomerInvoices(subscription.stripeCustomerId, userId),
    getCustomerPaymentMethod(subscription.stripeCustomerId, userId),
  ]);

  return { subscription, invoices, paymentMethod };
}

// ──────────────────────────────────────────────────
// Stripe webhook helpers (Story 6-6)
// ──────────────────────────────────────────────────

/** Record a Stripe event for idempotency. Returns true if new, false if duplicate. */
export async function recordStripeEvent(eventId: string, eventType: string): Promise<boolean> {
  const [inserted] = await db
    .insert(stripeEvents)
    .values({ stripeEventId: eventId, eventType })
    .onConflictDoNothing()
    .returning({ id: stripeEvents.id });

  return !!inserted;
}

/** Map Stripe subscription status to our enum */
export function mapStripeStatus(
  stripeStatus: string,
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' {
  const mapping: Record<string, 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'> = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete',
    unpaid: 'past_due',
    paused: 'canceled',
  };
  return mapping[stripeStatus] ?? 'incomplete';
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;
  const status = mapStripeStatus(subscription.status);
  const tier = (subscription.metadata?.tier as SubscriptionTier) ?? undefined;

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!existing) {
    logger.warn({ stripeSubscriptionId }, 'Subscription not found for update event');
    return;
  }

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  let effectiveTier = existing.tier as SubscriptionTier;

  // Apply pending downgrade if effective date has passed and subscription is active
  if (
    existing.pendingTier &&
    existing.pendingTierEffectiveDate &&
    status === 'active' &&
    new Date() >= new Date(existing.pendingTierEffectiveDate)
  ) {
    effectiveTier = existing.pendingTier as SubscriptionTier;
    updates.tier = effectiveTier;
    updates.pendingTier = null;
    updates.pendingTierEffectiveDate = null;
  } else if (tier && tier !== existing.tier) {
    effectiveTier = tier;
    updates.tier = tier;
  }

  await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.id, existing.id));

  // Update user tier + quota if tier changed
  if (updates.tier) {
    await db
      .update(users)
      .set({ subscriptionTier: effectiveTier, updatedAt: new Date() })
      .where(eq(users.id, existing.userId));

    await updateQuotaLimitsForTier(existing.userId, effectiveTier);
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!existing) {
    logger.warn({ stripeSubscriptionId }, 'Subscription not found for deleted event');
    return;
  }

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      pendingTier: null,
      pendingTierEffectiveDate: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing.id));

  // Revert user to free tier
  await db
    .update(users)
    .set({ subscriptionTier: 'free', updatedAt: new Date() })
    .where(eq(users.id, existing.userId));

  await updateQuotaLimitsForTier(existing.userId, 'free');
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeCustomerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? '';

  if (!stripeCustomerId) {
    logger.warn('Invoice payment succeeded but missing customer ID');
    return;
  }

  let existing;
  try {
    existing = await getSubscriptionByStripeCustomerId(stripeCustomerId);
  } catch {
    logger.warn({ stripeCustomerId }, 'No subscription found for invoice.payment_succeeded');
    return;
  }

  const updates: Record<string, unknown> = {
    status: 'active',
    failedPaymentRetries: 0,
    suspendedAt: null,
    updatedAt: new Date(),
  };

  let effectiveTier = existing.tier as SubscriptionTier;

  // Apply pending downgrade if effective date has passed
  if (
    existing.pendingTier &&
    existing.pendingTierEffectiveDate &&
    new Date() >= new Date(existing.pendingTierEffectiveDate)
  ) {
    effectiveTier = existing.pendingTier as SubscriptionTier;
    updates.tier = effectiveTier;
    updates.pendingTier = null;
    updates.pendingTierEffectiveDate = null;
  }

  await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.id, existing.id));

  // Update user tier + quota if tier changed
  if (updates.tier) {
    await db
      .update(users)
      .set({ subscriptionTier: effectiveTier, updatedAt: new Date() })
      .where(eq(users.id, existing.userId));

    await updateQuotaLimitsForTier(existing.userId, effectiveTier);
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? '';

  if (!stripeCustomerId) {
    logger.warn('Invoice payment failed but missing customer ID');
    return;
  }

  let existing;
  try {
    existing = await getSubscriptionByStripeCustomerId(stripeCustomerId);
  } catch {
    logger.warn({ stripeCustomerId }, 'No subscription found for invoice.payment_failed');
    return;
  }

  const newRetryCount = (existing.failedPaymentRetries ?? 0) + 1;
  const updates: Record<string, unknown> = {
    status: 'past_due',
    failedPaymentRetries: newRetryCount,
    updatedAt: new Date(),
  };

  if (newRetryCount >= 3 && !existing.suspendedAt) {
    updates.suspendedAt = new Date();
    logger.info(
      { userId: existing.userId, retries: newRetryCount },
      'Account suspended after 3 failed payment retries',
    );
  } else {
    logger.info(
      { userId: existing.userId, retries: newRetryCount },
      'Payment retry failed',
    );
  }

  await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.id, existing.id));
}
