import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import {
  users,
  contentItems,
  platformConnections,
  subscriptions,
  quotaUsage,
  publishJobs,
  apiCostLogs,
  auditLogs,
  tvScans,
} from '../../db/schema/index';
import { deleteUserFiles, uploadBuffer, generatePresignedDownloadUrl } from '../../services/r2.service';
import { cancelSubscription } from '../../services/stripe.service';
import { logger } from '../../lib/logger';

// ──────────────────────────────────────────────────
// Story 8.1 — Account Deletion with Cascade
// ──────────────────────────────────────────────────

export async function deleteAccount(userId: string): Promise<void> {
  // 1. Cancel Stripe subscription if exists
  const [sub] = await db
    .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub?.stripeSubscriptionId) {
    try {
      await cancelSubscription(sub.stripeSubscriptionId);
    } catch (err) {
      logger.warn({ userId, err }, 'Failed to cancel Stripe subscription during account deletion');
    }
  }

  // 2. Delete all user files from R2
  try {
    const deleted = await deleteUserFiles(userId);
    logger.info({ userId, filesDeleted: deleted }, 'R2 files cleaned up');
  } catch (err) {
    logger.warn({ userId, err }, 'Failed to delete R2 files during account deletion');
  }

  // 3. Delete user from DB — cascade handles related tables
  await db.delete(users).where(eq(users.id, userId));

  logger.info({ userId }, 'Account deleted');
}

// ──────────────────────────────────────────────────
// Story 8.2 — Data Export
// ──────────────────────────────────────────────────

const EXPORT_DOWNLOAD_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

export async function exportUserData(userId: string): Promise<{ downloadUrl: string }> {
  // Gather all user data in parallel
  const [
    [user],
    userContentItems,
    userPlatforms,
    [subscription],
    userQuotaUsage,
    userPublishJobs,
    userCostLogs,
    userAuditLogs,
    userTvScans,
  ] = await Promise.all([
    db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      onboardingCompletedAt: users.onboardingCompletedAt,
    }).from(users).where(eq(users.id, userId)).limit(1),

    db.select({
      id: contentItems.id,
      type: contentItems.type,
      title: contentItems.title,
      status: contentItems.status,
      style: contentItems.style,
      format: contentItems.format,
      duration: contentItems.duration,
      caption: contentItems.caption,
      hashtags: contentItems.hashtags,
      hookText: contentItems.hookText,
      ctaText: contentItems.ctaText,
      scheduledAt: contentItems.scheduledAt,
      createdAt: contentItems.createdAt,
      updatedAt: contentItems.updatedAt,
    }).from(contentItems).where(eq(contentItems.userId, userId)),

    db.select({
      platform: platformConnections.platform,
      platformUsername: platformConnections.platformUsername,
      connectedAt: platformConnections.connectedAt,
    }).from(platformConnections).where(eq(platformConnections.userId, userId)),

    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1),

    db.select({
      periodStart: quotaUsage.periodStart,
      periodEnd: quotaUsage.periodEnd,
      creditsUsed: quotaUsage.creditsUsed,
      creditsLimit: quotaUsage.creditsLimit,
      platformsConnected: quotaUsage.platformsConnected,
      platformsLimit: quotaUsage.platformsLimit,
    }).from(quotaUsage).where(eq(quotaUsage.userId, userId)),

    db.select({
      id: publishJobs.id,
      platform: publishJobs.platform,
      status: publishJobs.status,
      publishedUrl: publishJobs.publishedUrl,
      scheduledAt: publishJobs.scheduledAt,
      publishedAt: publishJobs.publishedAt,
      createdAt: publishJobs.createdAt,
    }).from(publishJobs).where(eq(publishJobs.userId, userId)),

    db.select({
      service: apiCostLogs.service,
      endpoint: apiCostLogs.endpoint,
      costUsd: apiCostLogs.costUsd,
      createdAt: apiCostLogs.createdAt,
    }).from(apiCostLogs).where(eq(apiCostLogs.userId, userId)),

    db.select({
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs).where(eq(auditLogs.actorId, userId)),

    db.select({
      source: tvScans.source,
      campaign: tvScans.campaign,
      scanDate: tvScans.scanDate,
      scannedAt: tvScans.scannedAt,
    }).from(tvScans).where(eq(tvScans.userId, userId)),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: user ?? null,
    contentItems: userContentItems,
    platformConnections: userPlatforms,
    subscription: subscription
      ? {
          tier: subscription.tier,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          createdAt: subscription.createdAt,
        }
      : null,
    quotaUsage: userQuotaUsage,
    publishJobs: userPublishJobs,
    apiCostLogs: userCostLogs,
    auditLogs: userAuditLogs,
    tvScans: userTvScans,
  };

  // Upload JSON to R2
  const fileKey = `exports/${userId}/${Date.now()}-data-export.json`;
  const buffer = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
  await uploadBuffer(fileKey, buffer, 'application/json');

  // Generate 7-day presigned download URL
  const downloadUrl = await generatePresignedDownloadUrl(fileKey, EXPORT_DOWNLOAD_EXPIRY);

  logger.info({ userId }, 'Data export generated');
  return { downloadUrl };
}
