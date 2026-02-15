import { Worker } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { getRedisConfig } from '../config/redis';
import { db } from '../db/index';
import { contentItems, platformConnections, publishJobs } from '../db/schema/index';
import { decrypt } from '../lib/encryption';
import { generatePresignedDownloadUrl } from '../services/r2.service';
import { logCost } from '../services/costTracker';
import {
  createMediaContainer,
  pollContainerUntilReady,
  publishContainer,
  getMediaPermalink,
} from '../services/instagram.service';
import { users } from '../db/schema/users';
import { publishPost } from '../services/ayrshare.service';
import type { PublishJobData, AyrsharePublishJobData } from './queues';
import { classifyError, PermanentPublishError } from './errors';
import { convertMediaForPlatform } from '../services/mediaConversion.service';
import { applyWatermarkToAll } from '../services/watermark.service';
import { checkAndDecrementCredits, restoreCredits } from '../services/quota.service';

function buildCaption(caption: string | null, hashtags: string[]): string {
  const parts: string[] = [];
  if (caption) parts.push(caption);
  if (hashtags.length > 0) {
    parts.push(hashtags.map((h) => `#${h}`).join(' '));
  }
  return parts.join('\n\n');
}

export async function processPublishJob(data: PublishJobData): Promise<void> {
  const { publishJobId, userId, contentItemId } = data;

  // 1. Update publish job status to 'publishing'
  await db
    .update(publishJobs)
    .set({ status: 'publishing', updatedAt: new Date() })
    .where(eq(publishJobs.id, publishJobId));

  // 2. Load content item
  const [item] = await db
    .select({
      type: contentItems.type,
      mediaUrls: contentItems.mediaUrls,
      caption: contentItems.caption,
      hashtags: contentItems.hashtags,
      generatedMediaUrl: contentItems.generatedMediaUrl,
    })
    .from(contentItems)
    .where(and(eq(contentItems.id, contentItemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) throw new Error('Content item not found');

  // 3. Load platform connection + decrypt token
  const [connection] = await db
    .select({
      accessToken: platformConnections.accessToken,
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

  if (!connection) throw new Error('Instagram connection not found');

  const accessToken = decrypt(connection.accessToken);
  const igUserId = connection.platformUserId;

  // 3b. Load user subscription tier
  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error('User not found');

  // 3c. Apply watermark for free-tier image content
  let mediaKeys = item.mediaUrls as string[];
  const isImageContent = item.type === 'post' || item.type === 'carousel';

  if (user.subscriptionTier === 'free' && isImageContent) {
    try {
      mediaKeys = await applyWatermarkToAll(mediaKeys, userId, contentItemId);
      console.info(
        JSON.stringify({ userId, contentItemId, count: mediaKeys.length }),
        'Watermark applied to images',
      );
    } catch (err) {
      console.error(
        JSON.stringify({ userId, contentItemId, error: (err as Error).message }),
        'Watermark failed, using original images',
      );
      mediaKeys = item.mediaUrls as string[];
    }
  }

  // 4. Generate presigned URLs for media
  const mediaUrls = mediaKeys;
  const presignedUrls = await Promise.all(
    mediaUrls.map((key) => generatePresignedDownloadUrl(key)),
  );

  const caption = buildCaption(item.caption, item.hashtags as string[]);

  // 5. Publish based on content type
  let containerId: string;

  try {
    if (item.type === 'post') {
      // Single image post
      const container = await createMediaContainer(accessToken, igUserId, {
        image_url: presignedUrls[0],
        caption,
      });
      containerId = container.id;
    } else if (item.type === 'carousel') {
      // Carousel: create children first, then parent
      const childIds: string[] = [];
      for (const url of presignedUrls) {
        const child = await createMediaContainer(accessToken, igUserId, {
          image_url: url,
          is_carousel_item: true,
        });
        childIds.push(child.id);
      }

      const carousel = await createMediaContainer(accessToken, igUserId, {
        media_type: 'CAROUSEL',
        children: childIds,
        caption,
      });
      containerId = carousel.id;
    } else {
      // Reel (video) — use generatedMediaUrl if available, otherwise first mediaUrl
      const videoKey = item.generatedMediaUrl ?? mediaUrls[0];
      const videoUrl = await generatePresignedDownloadUrl(videoKey);

      const container = await createMediaContainer(accessToken, igUserId, {
        video_url: videoUrl,
        caption,
        media_type: 'REELS',
      });
      containerId = container.id;
    }

    // 6. Poll until container is ready
    await pollContainerUntilReady(accessToken, containerId);
  } catch (err) {
    const category = classifyError(err as Error);

    if (category === 'format') {
      // Convert unsupported media formats and update DB for next retry
      const conversions = await convertMediaForPlatform(mediaUrls, userId, contentItemId);
      if (conversions.size > 0) {
        const updatedKeys = mediaUrls.map((key) => conversions.get(key) ?? key);
        await db
          .update(contentItems)
          .set({ mediaUrls: updatedKeys, updatedAt: new Date() })
          .where(eq(contentItems.id, contentItemId));
      }
    }

    if (category === 'permanent') {
      throw new PermanentPublishError((err as Error).message);
    }

    throw err;
  }

  // 7. Publish
  const published = await publishContainer(accessToken, igUserId, containerId);

  // 8. Get permalink
  let permalink = '';
  try {
    permalink = await getMediaPermalink(accessToken, published.id);
  } catch {
    // Non-fatal — permalink fetch failure doesn't block publishing
    permalink = `https://www.instagram.com/p/${published.id}`;
  }

  // 9. Update publish job as published
  await db
    .update(publishJobs)
    .set({
      status: 'published',
      publishedUrl: permalink,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(publishJobs.id, publishJobId));

  // 10. Update content item status
  await db
    .update(contentItems)
    .set({ status: 'published', updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId));

  // 11. Log cost (Instagram API is free)
  await logCost(userId, 'instagram', 'media_publish', 0);

  console.info(
    JSON.stringify({ userId, contentItemId, publishJobId, permalink }, null, 0),
    'Publish to Instagram complete',
  );
}

export async function processAyrsharePublishJob(data: AyrsharePublishJobData): Promise<void> {
  const { publishJobIds, platforms, userId, contentItemId } = data;

  // 0. Deduct credits for Ayrshare platforms (1 credit per platform)
  await checkAndDecrementCredits(userId, 'publishAyrshare', platforms.length);

  // 1. Update all publish jobs to 'publishing'
  for (const jobId of publishJobIds) {
    await db
      .update(publishJobs)
      .set({ status: 'publishing', updatedAt: new Date() })
      .where(eq(publishJobs.id, jobId));
  }

  // 2. Load content item
  const [item] = await db
    .select({
      type: contentItems.type,
      format: contentItems.format,
      mediaUrls: contentItems.mediaUrls,
      caption: contentItems.caption,
      hashtags: contentItems.hashtags,
      generatedMediaUrl: contentItems.generatedMediaUrl,
    })
    .from(contentItems)
    .where(and(eq(contentItems.id, contentItemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) throw new Error('Content item not found');

  // 3. Load user + decrypt Ayrshare profile key
  const [user] = await db
    .select({ ayrshareProfileKey: users.ayrshareProfileKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.ayrshareProfileKey) throw new Error('Ayrshare profile not configured');
  const profileKey = decrypt(user.ayrshareProfileKey);

  // 4. Generate presigned URLs for media
  const mediaKeys = item.mediaUrls as string[];
  const presignedUrls = await Promise.all(
    mediaKeys.map((key) => generatePresignedDownloadUrl(key, 7200)), // 2h expiry for Ayrshare
  );

  // If reel with generated video, use that instead
  if (item.type === 'reel' && item.generatedMediaUrl) {
    const videoUrl = await generatePresignedDownloadUrl(item.generatedMediaUrl, 7200);
    presignedUrls.length = 0;
    presignedUrls.push(videoUrl);
  }

  const caption = buildCaption(item.caption, item.hashtags as string[]);

  // 5. Build Ayrshare params
  const shortsYouTube = item.format === '9:16' && platforms.includes('youtube');

  // 6. Call Ayrshare API
  const result = await publishPost(profileKey, {
    post: caption,
    platforms,
    mediaUrls: presignedUrls,
    shortsYouTube: shortsYouTube || undefined,
    videoTitle: item.type === 'reel' ? (item.caption?.slice(0, 100) ?? 'Video') : undefined,
  });

  // 7. Update each publish job based on results
  let successCount = 0;
  for (const platformResult of result.postIds) {
    const jobIdx = platforms.indexOf(platformResult.platform);
    if (jobIdx === -1) continue;
    const jobId = publishJobIds[jobIdx];

    if (platformResult.status === 'success') {
      successCount++;
      await db
        .update(publishJobs)
        .set({
          status: 'published',
          publishedUrl: platformResult.postUrl ?? null,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(publishJobs.id, jobId));
    } else {
      await db
        .update(publishJobs)
        .set({
          status: 'failed',
          errorMessage: platformResult.error ?? 'Publishing failed',
          errorCode: 'AYRSHARE_ERROR',
          updatedAt: new Date(),
        })
        .where(eq(publishJobs.id, jobId));
    }
  }

  // 8. Update content item status
  const contentStatus = successCount > 0 ? 'published' : 'failed';
  await db
    .update(contentItems)
    .set({ status: contentStatus, updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId));

  // 9. Log cost
  await logCost(userId, 'ayrshare', 'POST /post', 0.02 * platforms.length);

  console.info(
    JSON.stringify({ userId, contentItemId, platforms, successCount, total: platforms.length }),
    'Ayrshare publish complete',
  );
}

let worker: Worker | null = null;

export function startPublishWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<PublishJobData>(
    'publish',
    async (job) => {
      await processPublishJob(job.data);
    },
    {
      connection: getRedisConfig(),
      concurrency: 2,
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          const delays = [60_000, 300_000, 900_000]; // 1min, 5min, 15min
          return delays[attemptsMade - 1] ?? 900_000;
        },
      },
    },
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;

    const { publishJobId, userId, contentItemId } = job.data;
    const category = classifyError(err);
    const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 3);
    const shouldFail = isExhausted || category === 'permanent';

    console.error(
      JSON.stringify({ userId, contentItemId, publishJobId, error: err.message, attempt: job.attemptsMade, category }, null, 0),
      'Publish job failed',
    );

    // Update publish job with error
    await db
      .update(publishJobs)
      .set({
        status: shouldFail ? 'failed' : 'retrying',
        errorMessage: err.message,
        errorCode: category === 'format' ? 'MEDIA_FORMAT_ERROR' : undefined,
        attemptCount: job.attemptsMade,
        updatedAt: new Date(),
      })
      .where(eq(publishJobs.id, publishJobId));

    if (shouldFail) {
      // Mark content item as failed
      await db
        .update(contentItems)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(contentItems.id, contentItemId));

      // Skip remaining retries for permanent errors
      if (category === 'permanent' && !isExhausted) {
        await job.discard();
      }

      console.error(
        JSON.stringify({ userId, contentItemId, publishJobId, category }, null, 0),
        'Publish job failed permanently',
      );
    } else {
      // Content is retrying — let the user know
      await db
        .update(contentItems)
        .set({ status: 'retrying', updatedAt: new Date() })
        .where(eq(contentItems.id, contentItemId));
    }
  });

  worker.on('completed', (job) => {
    if (!job) return;
    console.info(
      JSON.stringify({ userId: job.data.userId, contentItemId: job.data.contentItemId }, null, 0),
      'Publish job completed successfully',
    );
  });

  return worker;
}

// --- Ayrshare Worker ---

let ayrshareWorker: Worker | null = null;

export function startAyrshareWorker(): Worker {
  if (ayrshareWorker) return ayrshareWorker;

  ayrshareWorker = new Worker<AyrsharePublishJobData>(
    'ayrshare',
    async (job) => {
      await processAyrsharePublishJob(job.data);
    },
    {
      connection: getRedisConfig(),
      concurrency: 2,
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          const delays = [60_000, 300_000, 900_000]; // 1min, 5min, 15min
          return delays[attemptsMade - 1] ?? 900_000;
        },
      },
    },
  );

  ayrshareWorker.on('failed', async (job, err) => {
    if (!job) return;

    const { publishJobIds, userId, contentItemId, platforms } = job.data;
    const category = classifyError(err);
    const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 3);
    const shouldFail = isExhausted || category === 'permanent';

    console.error(
      JSON.stringify({ userId, contentItemId, platforms, error: err.message, attempt: job.attemptsMade, category }),
      'Ayrshare publish job failed',
    );

    // Update all publish jobs with error
    for (const jobId of publishJobIds) {
      await db
        .update(publishJobs)
        .set({
          status: shouldFail ? 'failed' : 'retrying',
          errorMessage: err.message,
          errorCode: category === 'format' ? 'MEDIA_FORMAT_ERROR' : undefined,
          attemptCount: job.attemptsMade,
          updatedAt: new Date(),
        })
        .where(eq(publishJobs.id, jobId));
    }

    if (shouldFail) {
      // Restore credits on permanent failure
      await restoreCredits(userId, 'publishAyrshare', platforms.length);

      await db
        .update(contentItems)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(contentItems.id, contentItemId));

      if (category === 'permanent' && !isExhausted) {
        await job.discard();
      }
    } else {
      await db
        .update(contentItems)
        .set({ status: 'retrying', updatedAt: new Date() })
        .where(eq(contentItems.id, contentItemId));
    }
  });

  ayrshareWorker.on('completed', (job) => {
    if (!job) return;
    console.info(
      JSON.stringify({ userId: job.data.userId, contentItemId: job.data.contentItemId, platforms: job.data.platforms }),
      'Ayrshare publish job completed',
    );
  });

  return ayrshareWorker;
}
