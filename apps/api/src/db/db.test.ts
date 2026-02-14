import { describe, it, expect } from 'vitest';
import { users, userRoleEnum, subscriptionTierEnum, contentItems, contentTypeEnum, contentStatusEnum, quotaUsage, subscriptions, subscriptionStatusEnum, stripeEvents } from './schema/index';
import { getTableColumns } from 'drizzle-orm';

describe('Database schema', () => {
  describe('users table', () => {
    it('has all required columns', () => {
      const columns = getTableColumns(users);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('passwordHash');
      expect(columnNames).toContain('displayName');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('subscriptionTier');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
      expect(columnNames).toContain('onboardingCompletedAt');
      expect(columnNames).toContain('ayrshareProfileKey');
      expect(columnNames).toHaveLength(10);
    });

    it('maps to correct SQL column names', () => {
      const columns = getTableColumns(users);

      expect(columns.id.name).toBe('id');
      expect(columns.email.name).toBe('email');
      expect(columns.passwordHash.name).toBe('password_hash');
      expect(columns.displayName.name).toBe('display_name');
      expect(columns.role.name).toBe('role');
      expect(columns.subscriptionTier.name).toBe('subscription_tier');
      expect(columns.createdAt.name).toBe('created_at');
      expect(columns.updatedAt.name).toBe('updated_at');
    });
  });

  describe('userRoleEnum', () => {
    it('has correct enum values', () => {
      expect(userRoleEnum.enumValues).toEqual(['user', 'admin']);
    });
  });

  describe('subscriptionTierEnum', () => {
    it('has correct enum values', () => {
      expect(subscriptionTierEnum.enumValues).toEqual([
        'free',
        'starter',
        'pro',
        'business',
        'agency',
      ]);
    });
  });

  describe('contentItems table', () => {
    it('has all required columns', () => {
      const columns = getTableColumns(contentItems);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('style');
      expect(columnNames).toContain('format');
      expect(columnNames).toContain('duration');
      expect(columnNames).toContain('mediaUrls');
      expect(columnNames).toContain('generatedMediaUrl');
      expect(columnNames).toContain('caption');
      expect(columnNames).toContain('hashtags');
      expect(columnNames).toContain('hookText');
      expect(columnNames).toContain('ctaText');
      expect(columnNames).toContain('musicUrl');
      expect(columnNames).toContain('musicPrompt');
      expect(columnNames).toContain('scheduledAt');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
      expect(columnNames).toHaveLength(19);
    });

    it('maps to correct SQL column names', () => {
      const columns = getTableColumns(contentItems);

      expect(columns.id.name).toBe('id');
      expect(columns.userId.name).toBe('user_id');
      expect(columns.type.name).toBe('type');
      expect(columns.mediaUrls.name).toBe('media_urls');
      expect(columns.generatedMediaUrl.name).toBe('generated_media_url');
      expect(columns.hookText.name).toBe('hook_text');
      expect(columns.ctaText.name).toBe('cta_text');
      expect(columns.musicUrl.name).toBe('music_url');
      expect(columns.musicPrompt.name).toBe('music_prompt');
      expect(columns.createdAt.name).toBe('created_at');
      expect(columns.updatedAt.name).toBe('updated_at');
    });
  });

  describe('contentTypeEnum', () => {
    it('has correct enum values', () => {
      expect(contentTypeEnum.enumValues).toEqual(['reel', 'carousel', 'post']);
    });
  });

  describe('contentStatusEnum', () => {
    it('has correct enum values', () => {
      expect(contentStatusEnum.enumValues).toEqual([
        'draft',
        'generating',
        'scheduled',
        'published',
        'failed',
        'retrying',
      ]);
    });
  });

  describe('subscriptionStatusEnum', () => {
    it('has correct enum values', () => {
      expect(subscriptionStatusEnum.enumValues).toEqual([
        'trialing',
        'active',
        'past_due',
        'canceled',
        'incomplete',
      ]);
    });
  });

  describe('subscriptions table', () => {
    it('has all required columns', () => {
      const columns = getTableColumns(subscriptions);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('stripeCustomerId');
      expect(columnNames).toContain('stripeSubscriptionId');
      expect(columnNames).toContain('tier');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('trialEndsAt');
      expect(columnNames).toContain('currentPeriodStart');
      expect(columnNames).toContain('currentPeriodEnd');
      expect(columnNames).toContain('pendingTier');
      expect(columnNames).toContain('pendingTierEffectiveDate');
      expect(columnNames).toContain('failedPaymentRetries');
      expect(columnNames).toContain('suspendedAt');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
      expect(columnNames).toHaveLength(15);
    });

    it('maps to correct SQL column names', () => {
      const columns = getTableColumns(subscriptions);

      expect(columns.id.name).toBe('id');
      expect(columns.userId.name).toBe('user_id');
      expect(columns.stripeCustomerId.name).toBe('stripe_customer_id');
      expect(columns.stripeSubscriptionId.name).toBe('stripe_subscription_id');
      expect(columns.tier.name).toBe('tier');
      expect(columns.status.name).toBe('status');
      expect(columns.trialEndsAt.name).toBe('trial_ends_at');
      expect(columns.currentPeriodStart.name).toBe('current_period_start');
      expect(columns.currentPeriodEnd.name).toBe('current_period_end');
      expect(columns.pendingTier.name).toBe('pending_tier');
      expect(columns.pendingTierEffectiveDate.name).toBe('pending_tier_effective_date');
      expect(columns.failedPaymentRetries.name).toBe('failed_payment_retries');
      expect(columns.suspendedAt.name).toBe('suspended_at');
      expect(columns.createdAt.name).toBe('created_at');
      expect(columns.updatedAt.name).toBe('updated_at');
    });
  });

  describe('stripeEvents table', () => {
    it('has all required columns', () => {
      const columns = getTableColumns(stripeEvents);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('stripeEventId');
      expect(columnNames).toContain('eventType');
      expect(columnNames).toContain('processedAt');
      expect(columnNames).toHaveLength(4);
    });

    it('maps to correct SQL column names', () => {
      const columns = getTableColumns(stripeEvents);

      expect(columns.id.name).toBe('id');
      expect(columns.stripeEventId.name).toBe('stripe_event_id');
      expect(columns.eventType.name).toBe('event_type');
      expect(columns.processedAt.name).toBe('processed_at');
    });
  });

  describe('quotaUsage table', () => {
    it('has all required columns', () => {
      const columns = getTableColumns(quotaUsage);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('periodStart');
      expect(columnNames).toContain('periodEnd');
      expect(columnNames).toContain('creditsUsed');
      expect(columnNames).toContain('creditsLimit');
      expect(columnNames).toContain('platformsConnected');
      expect(columnNames).toContain('platformsLimit');
      expect(columnNames).toHaveLength(8);
    });

    it('maps to correct SQL column names', () => {
      const columns = getTableColumns(quotaUsage);

      expect(columns.userId.name).toBe('user_id');
      expect(columns.periodStart.name).toBe('period_start');
      expect(columns.periodEnd.name).toBe('period_end');
      expect(columns.creditsUsed.name).toBe('credits_used');
      expect(columns.creditsLimit.name).toBe('credits_limit');
      expect(columns.platformsConnected.name).toBe('platforms_connected');
      expect(columns.platformsLimit.name).toBe('platforms_limit');
    });
  });
});
