import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { platformConnections } from '../../db/schema/index';
import type { Platform } from '@publista/shared';

export async function getUserConnections(userId: string) {
  const results = await db
    .select({
      id: platformConnections.id,
      platform: platformConnections.platform,
      platformUserId: platformConnections.platformUserId,
      platformUsername: platformConnections.platformUsername,
      connectedAt: platformConnections.connectedAt,
      tokenExpiresAt: platformConnections.tokenExpiresAt,
    })
    .from(platformConnections)
    .where(eq(platformConnections.userId, userId));

  return results;
}

export async function getConnection(userId: string, platform: Platform) {
  const results = await db
    .select()
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, userId),
        eq(platformConnections.platform, platform),
      ),
    )
    .limit(1);

  return results[0] || null;
}

export async function disconnectPlatform(userId: string, platform: Platform) {
  const result = await db
    .delete(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, userId),
        eq(platformConnections.platform, platform),
      ),
    )
    .returning({ id: platformConnections.id });

  return result.length > 0;
}
