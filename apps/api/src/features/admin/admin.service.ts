import { eq, sql, and, gte, lte, desc, count } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema/users';
import { contentItems } from '../../db/schema/contentItems';
import { publishJobs } from '../../db/schema/publishJobs';
import { apiCostLogs } from '../../db/schema/apiCostLogs';
import { quotaUsage } from '../../db/schema/quotaUsage';
import { platformConnections } from '../../db/schema/platformConnections';
import { auditLogs } from '../../db/schema/auditLogs';

// ─── 7.1 System Health ──────────────────────────────────────────────────────

export async function getSystemHealth() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total publish jobs (last 30 days)
  const [publishStats] = await db
    .select({
      total: count(),
      published: sql<number>`COUNT(*) FILTER (WHERE ${publishJobs.status} = 'published')`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${publishJobs.status} = 'failed')`,
    })
    .from(publishJobs)
    .where(gte(publishJobs.createdAt, thirtyDaysAgo));

  // Active users today (users who created content today)
  const [activeToday] = await db
    .select({ value: sql<number>`COUNT(DISTINCT ${contentItems.userId})` })
    .from(contentItems)
    .where(gte(contentItems.createdAt, todayStart));

  // Total users
  const [totalUsers] = await db.select({ value: count() }).from(users);

  // Total content items
  const [totalContent] = await db.select({ value: count() }).from(contentItems);

  // API costs today
  const [costToday] = await db
    .select({ value: sql<number>`COALESCE(SUM(${apiCostLogs.costUsd}::numeric), 0)` })
    .from(apiCostLogs)
    .where(gte(apiCostLogs.createdAt, todayStart));

  const total = publishStats?.total ?? 0;
  const published = Number(publishStats?.published ?? 0);
  const failed = Number(publishStats?.failed ?? 0);
  const successRate = total > 0 ? Math.round((published / total) * 100) : 100;

  return {
    publishSuccessRate: successRate,
    publishedCount: published,
    failedCount: failed,
    activeUsersToday: Number(activeToday?.value ?? 0),
    totalUsers: totalUsers?.value ?? 0,
    totalContent: totalContent?.value ?? 0,
    costToday: Number(costToday?.value ?? 0),
  };
}

// ─── 7.2 Publishing Errors ──────────────────────────────────────────────────

export async function getPublishErrors(filters: {
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const { platform, dateFrom, dateTo, limit = 50, offset = 0 } = filters;

  const conditions = [eq(publishJobs.status, 'failed')];

  if (platform) {
    conditions.push(eq(publishJobs.platform, platform as 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'linkedin' | 'x'));
  }
  if (dateFrom) {
    conditions.push(gte(publishJobs.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    conditions.push(lte(publishJobs.createdAt, new Date(dateTo)));
  }

  const rows = await db
    .select({
      id: publishJobs.id,
      userId: publishJobs.userId,
      userEmail: users.email,
      contentItemId: publishJobs.contentItemId,
      contentType: contentItems.type,
      platform: publishJobs.platform,
      errorMessage: publishJobs.errorMessage,
      errorCode: publishJobs.errorCode,
      attemptCount: publishJobs.attemptCount,
      createdAt: publishJobs.createdAt,
      updatedAt: publishJobs.updatedAt,
    })
    .from(publishJobs)
    .innerJoin(users, eq(users.id, publishJobs.userId))
    .innerJoin(contentItems, eq(contentItems.id, publishJobs.contentItemId))
    .where(and(...conditions))
    .orderBy(desc(publishJobs.updatedAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ value: count() })
    .from(publishJobs)
    .where(and(...conditions));

  return { rows, total: total?.value ?? 0 };
}

// ─── 7.3 API Cost Monitoring ────────────────────────────────────────────────

export async function getApiCosts(filters: { days?: number }) {
  const { days = 30 } = filters;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Cost per service
  const costByService = await db
    .select({
      service: apiCostLogs.service,
      totalCost: sql<number>`COALESCE(SUM(${apiCostLogs.costUsd}::numeric), 0)`,
      requestCount: count(),
    })
    .from(apiCostLogs)
    .where(gte(apiCostLogs.createdAt, since))
    .groupBy(apiCostLogs.service);

  // Cost per user (top 20)
  const costByUser = await db
    .select({
      userId: apiCostLogs.userId,
      userEmail: users.email,
      displayName: users.displayName,
      subscriptionTier: users.subscriptionTier,
      totalCost: sql<number>`COALESCE(SUM(${apiCostLogs.costUsd}::numeric), 0)`,
      requestCount: count(),
    })
    .from(apiCostLogs)
    .innerJoin(users, eq(users.id, apiCostLogs.userId))
    .where(gte(apiCostLogs.createdAt, since))
    .groupBy(apiCostLogs.userId, users.email, users.displayName, users.subscriptionTier)
    .orderBy(sql`SUM(${apiCostLogs.costUsd}::numeric) DESC`)
    .limit(20);

  // Daily cost trend
  const dailyTrend = await db
    .select({
      date: sql<string>`${apiCostLogs.createdAt}::date`,
      totalCost: sql<number>`COALESCE(SUM(${apiCostLogs.costUsd}::numeric), 0)`,
      requestCount: count(),
    })
    .from(apiCostLogs)
    .where(gte(apiCostLogs.createdAt, since))
    .groupBy(sql`${apiCostLogs.createdAt}::date`)
    .orderBy(sql`${apiCostLogs.createdAt}::date`);

  return {
    byService: costByService.map((r) => ({
      service: r.service,
      totalCost: Number(r.totalCost),
      requestCount: r.requestCount,
    })),
    byUser: costByUser.map((r) => ({
      userId: r.userId,
      userEmail: r.userEmail,
      displayName: r.displayName,
      subscriptionTier: r.subscriptionTier,
      totalCost: Number(r.totalCost),
      requestCount: r.requestCount,
    })),
    dailyTrend: dailyTrend.map((r) => ({
      date: r.date,
      totalCost: Number(r.totalCost),
      requestCount: r.requestCount,
    })),
  };
}

// ─── 7.4 User Management ───────────────────────────────────────────────────

export async function getUsers(filters: {
  search?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, tier, limit = 50, offset = 0 } = filters;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${users.email} ILIKE ${'%' + search + '%'} OR ${users.displayName} ILIKE ${'%' + search + '%'})`,
    );
  }
  if (tier) {
    conditions.push(eq(users.subscriptionTier, tier as 'free' | 'starter' | 'pro' | 'business' | 'agency'));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db.select({ value: count() }).from(users).where(whereClause);

  return { rows, total: total?.value ?? 0 };
}

export async function getUserDetail(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  // Quota usage
  const quota = await db
    .select()
    .from(quotaUsage)
    .where(eq(quotaUsage.userId, userId))
    .orderBy(desc(quotaUsage.periodStart))
    .limit(1);

  // Connected platforms
  const platforms = await db
    .select({
      platform: platformConnections.platform,
      platformUsername: platformConnections.platformUsername,
      connectedAt: platformConnections.connectedAt,
      tokenExpiresAt: platformConnections.tokenExpiresAt,
    })
    .from(platformConnections)
    .where(eq(platformConnections.userId, userId));

  // Content count
  const [contentCount] = await db
    .select({ value: count() })
    .from(contentItems)
    .where(eq(contentItems.userId, userId));

  // API cost total
  const [costTotal] = await db
    .select({ value: sql<number>`COALESCE(SUM(${apiCostLogs.costUsd}::numeric), 0)` })
    .from(apiCostLogs)
    .where(eq(apiCostLogs.userId, userId));

  return {
    ...user,
    quota: quota[0] ?? null,
    platforms,
    contentCount: contentCount?.value ?? 0,
    totalCost: Number(costTotal?.value ?? 0),
  };
}

export async function adjustUserQuota(
  adminId: string,
  userId: string,
  updates: { creditsLimit?: number; platformsLimit?: number },
) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  // Get current quota row
  const [current] = await db
    .select()
    .from(quotaUsage)
    .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.periodStart, periodStart)))
    .limit(1);

  if (!current) {
    throw new Error('No quota record found for current period');
  }

  const updateData: Record<string, number> = {};
  if (updates.creditsLimit !== undefined) updateData.creditsLimit = updates.creditsLimit;
  if (updates.platformsLimit !== undefined) updateData.platformsLimit = updates.platformsLimit;

  await db
    .update(quotaUsage)
    .set(updateData)
    .where(eq(quotaUsage.id, current.id));

  // Audit log
  await db.insert(auditLogs).values({
    actorId: adminId,
    action: 'adjust_quota',
    targetType: 'user',
    targetId: userId,
    metadata: { previous: { creditsLimit: current.creditsLimit, platformsLimit: current.platformsLimit }, updated: updates },
  });

  return { ...current, ...updateData };
}

// ─── 7.5 Token Management ──────────────────────────────────────────────────

export async function getExpiringTokens(daysUntilExpiry = 7) {
  const threshold = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);

  return db
    .select({
      id: platformConnections.id,
      userId: platformConnections.userId,
      userEmail: users.email,
      platform: platformConnections.platform,
      platformUsername: platformConnections.platformUsername,
      tokenExpiresAt: platformConnections.tokenExpiresAt,
      connectedAt: platformConnections.connectedAt,
    })
    .from(platformConnections)
    .innerJoin(users, eq(users.id, platformConnections.userId))
    .where(lte(platformConnections.tokenExpiresAt, threshold))
    .orderBy(platformConnections.tokenExpiresAt);
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export async function logAuditAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    targetType,
    targetId: targetId ?? null,
    metadata: metadata ?? null,
  });
}

export async function getAuditLogs(filters: { limit?: number; offset?: number }) {
  const { limit = 50, offset = 0 } = filters;

  const rows = await db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      actorEmail: users.email,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}
