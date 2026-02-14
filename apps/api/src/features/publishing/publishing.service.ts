import { eq, and, desc, isNotNull, lte } from 'drizzle-orm';
import { db } from '../../db/index';
import { contentItems, platformConnections, publishJobs } from '../../db/schema/index';
import { users } from '../../db/schema/users';
import { AppError } from '../../lib/errors';
import { encrypt, decrypt } from '../../lib/encryption';
import { generatePresignedDownloadUrl } from '../../services/r2.service';
import { addPublishJob, addAyrsharePublishJob } from '../../jobs/queues';
import { createProfile, getConnectedPlatforms } from '../../services/ayrshare.service';

export async function publishToInstagram(userId: string, contentItemId: string) {
  // 1. Get content item (ownership + status check)
  const [item] = await db
    .select({
      id: contentItems.id,
      type: contentItems.type,
      status: contentItems.status,
      mediaUrls: contentItems.mediaUrls,
      caption: contentItems.caption,
      hashtags: contentItems.hashtags,
    })
    .from(contentItems)
    .where(and(eq(contentItems.id, contentItemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new AppError('NOT_FOUND', 'Content item not found', 404);
  }

  if (item.status !== 'draft' && item.status !== 'failed') {
    throw new AppError('VALIDATION_ERROR', 'Only draft or failed content can be published', 400);
  }

  // 2. Check Instagram connection
  const [connection] = await db
    .select({
      id: platformConnections.id,
      platformUserId: platformConnections.platformUserId,
    })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, userId),
        eq(platformConnections.platform, 'instagram'),
      ),
    )
    .limit(1);

  if (!connection) {
    throw new AppError('VALIDATION_ERROR', 'Instagram account not connected. Connect your account in Settings.', 400);
  }

  // 3. Create publish job record
  const [publishJob] = await db
    .insert(publishJobs)
    .values({
      userId,
      contentItemId,
      platform: 'instagram',
      status: 'pending',
    })
    .returning({ id: publishJobs.id });

  // 4. Update content item status to scheduled
  await db
    .update(contentItems)
    .set({ status: 'scheduled', updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId));

  // 5. Enqueue BullMQ job
  await addPublishJob({
    publishJobId: publishJob.id,
    userId,
    contentItemId,
  });

  return { publishJobId: publishJob.id };
}

export async function getPublishStatus(userId: string, contentItemId: string) {
  const jobs = await db
    .select({
      id: publishJobs.id,
      platform: publishJobs.platform,
      status: publishJobs.status,
      publishedUrl: publishJobs.publishedUrl,
      errorMessage: publishJobs.errorMessage,
      attemptCount: publishJobs.attemptCount,
      publishedAt: publishJobs.publishedAt,
      createdAt: publishJobs.createdAt,
    })
    .from(publishJobs)
    .where(
      and(
        eq(publishJobs.contentItemId, contentItemId),
        eq(publishJobs.userId, userId),
      ),
    )
    .orderBy(desc(publishJobs.createdAt))
    .limit(5);

  return jobs;
}

export async function getUserTier(userId: string) {
  const [user] = await db
    .select({
      subscriptionTier: users.subscriptionTier,
      ayrshareProfileKey: users.ayrshareProfileKey,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }
  return user;
}

export async function publishToMultiplePlatforms(
  userId: string,
  contentItemId: string,
  platforms: string[],
) {
  // 1. Check subscription tier
  const user = await getUserTier(userId);
  if (user.subscriptionTier === 'free') {
    throw new AppError('VALIDATION_ERROR', 'Multi-platform publishing requires a paid plan', 402);
  }

  // 2. Get content item (ownership + status check)
  const [item] = await db
    .select({
      id: contentItems.id,
      status: contentItems.status,
    })
    .from(contentItems)
    .where(and(eq(contentItems.id, contentItemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new AppError('NOT_FOUND', 'Content item not found', 404);
  }

  if (item.status !== 'draft' && item.status !== 'failed') {
    throw new AppError('VALIDATION_ERROR', 'Only draft or failed content can be published', 400);
  }

  // 3. Get/create Ayrshare profile
  let profileKey: string;
  if (!user.ayrshareProfileKey) {
    const profile = await createProfile(userId);
    const encryptedKey = encrypt(profile.profileKey);
    await db
      .update(users)
      .set({ ayrshareProfileKey: encryptedKey, updatedAt: new Date() })
      .where(eq(users.id, userId));
    profileKey = profile.profileKey;
  } else {
    profileKey = decrypt(user.ayrshareProfileKey);
  }

  // 4. Check which platforms are connected
  const connectedPlatforms = await getConnectedPlatforms(profileKey);
  const missingPlatforms = platforms.filter((p) => !connectedPlatforms.includes(p));
  if (missingPlatforms.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Platform(s) not connected: ${missingPlatforms.join(', ')}. Connect them in Settings.`,
      400,
    );
  }

  // 5. Create one publish_job per platform
  const publishJobIds: string[] = [];
  for (const platform of platforms) {
    const [job] = await db
      .insert(publishJobs)
      .values({
        userId,
        contentItemId,
        platform: platform as 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'linkedin' | 'x',
        status: 'pending',
      })
      .returning({ id: publishJobs.id });
    publishJobIds.push(job.id);
  }

  // 6. Update content item status to scheduled
  await db
    .update(contentItems)
    .set({ status: 'scheduled', updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId));

  // 7. Enqueue BullMQ job
  await addAyrsharePublishJob({
    publishJobIds,
    platforms,
    userId,
    contentItemId,
  });

  return { publishJobIds };
}

export async function getAyrshareConnectionUrl(userId: string) {
  const user = await getUserTier(userId);
  if (user.subscriptionTier === 'free') {
    throw new AppError('VALIDATION_ERROR', 'Multi-platform publishing requires a paid plan', 402);
  }

  let profileKey: string;
  let refUrl: string | undefined;

  if (!user.ayrshareProfileKey) {
    const profile = await createProfile(userId);
    const encryptedKey = encrypt(profile.profileKey);
    await db
      .update(users)
      .set({ ayrshareProfileKey: encryptedKey, updatedAt: new Date() })
      .where(eq(users.id, userId));
    profileKey = profile.profileKey;
    refUrl = profile.refUrl;
  } else {
    profileKey = decrypt(user.ayrshareProfileKey);
  }

  const connectedPlatforms = await getConnectedPlatforms(profileKey);

  return {
    connectUrl: refUrl ?? null,
    connectedPlatforms,
  };
}

export async function listPlatformConnections(userId: string) {
  const connections = await db
    .select({
      id: platformConnections.id,
      platform: platformConnections.platform,
      platformUsername: platformConnections.platformUsername,
      connectedAt: platformConnections.connectedAt,
    })
    .from(platformConnections)
    .where(eq(platformConnections.userId, userId));

  return connections;
}

export async function scheduleContent(
  userId: string,
  contentItemId: string,
  platforms: string[],
  scheduledAt: string,
) {
  // 1. Validate scheduledAt is at least 5 minutes in the future
  const scheduledDate = new Date(scheduledAt);
  const minDate = new Date(Date.now() + 5 * 60 * 1000);
  if (scheduledDate <= minDate) {
    throw new AppError('VALIDATION_ERROR', 'Scheduled time must be at least 5 minutes in the future', 400);
  }

  // 2. Get content item (ownership + status check)
  const [item] = await db
    .select({
      id: contentItems.id,
      status: contentItems.status,
    })
    .from(contentItems)
    .where(and(eq(contentItems.id, contentItemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new AppError('NOT_FOUND', 'Content item not found', 404);
  }

  if (item.status !== 'draft' && item.status !== 'failed') {
    throw new AppError('VALIDATION_ERROR', 'Only draft or failed content can be scheduled', 400);
  }

  // 3. Validate platform connections
  // For free users: only Instagram direct allowed
  const user = await getUserTier(userId);
  if (platforms.length === 1 && platforms[0] === 'instagram' && user.subscriptionTier === 'free') {
    // Free user scheduling Instagram — check direct connection
    const [connection] = await db
      .select({ id: platformConnections.id })
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.userId, userId),
          eq(platformConnections.platform, 'instagram'),
        ),
      )
      .limit(1);

    if (!connection) {
      throw new AppError('VALIDATION_ERROR', 'Instagram account not connected. Connect your account in Settings.', 400);
    }
  } else if (user.subscriptionTier !== 'free') {
    // Paid user — validate via Ayrshare
    if (user.ayrshareProfileKey) {
      const profileKey = decrypt(user.ayrshareProfileKey);
      const connectedPlatforms = await getConnectedPlatforms(profileKey);
      const missingPlatforms = platforms.filter((p) => !connectedPlatforms.includes(p));
      if (missingPlatforms.length > 0) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Platform(s) not connected: ${missingPlatforms.join(', ')}. Connect them in Settings.`,
          400,
        );
      }
    }
  } else {
    throw new AppError('VALIDATION_ERROR', 'Multi-platform publishing requires a paid plan', 402);
  }

  // 4. Create publish job records with scheduledAt
  const publishJobIds: string[] = [];
  for (const platform of platforms) {
    const [job] = await db
      .insert(publishJobs)
      .values({
        userId,
        contentItemId,
        platform: platform as 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'linkedin' | 'x',
        status: 'pending',
        scheduledAt: scheduledDate,
      })
      .returning({ id: publishJobs.id });
    publishJobIds.push(job.id);
  }

  // 5. Update content item status to scheduled
  await db
    .update(contentItems)
    .set({ status: 'scheduled', updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId));

  return { publishJobIds, scheduledAt: scheduledDate.toISOString() };
}

export async function cancelSchedule(userId: string, contentItemId: string) {
  // 1. Verify ownership
  const [item] = await db
    .select({ id: contentItems.id, status: contentItems.status })
    .from(contentItems)
    .where(and(eq(contentItems.id, contentItemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new AppError('NOT_FOUND', 'Content item not found', 404);
  }

  if (item.status !== 'scheduled') {
    throw new AppError('VALIDATION_ERROR', 'Only scheduled content can be cancelled', 400);
  }

  // 2. Delete pending scheduled publish jobs
  await db
    .delete(publishJobs)
    .where(
      and(
        eq(publishJobs.contentItemId, contentItemId),
        eq(publishJobs.userId, userId),
        eq(publishJobs.status, 'pending'),
        isNotNull(publishJobs.scheduledAt),
      ),
    );

  // 3. Revert content status to draft
  await db
    .update(contentItems)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId));

  return { status: 'cancelled' };
}

export async function getDueScheduledJobs() {
  const now = new Date();
  const dueJobs = await db
    .select({
      id: publishJobs.id,
      userId: publishJobs.userId,
      contentItemId: publishJobs.contentItemId,
      platform: publishJobs.platform,
    })
    .from(publishJobs)
    .where(
      and(
        eq(publishJobs.status, 'pending'),
        isNotNull(publishJobs.scheduledAt),
        lte(publishJobs.scheduledAt, now),
      ),
    );

  return dueJobs;
}
