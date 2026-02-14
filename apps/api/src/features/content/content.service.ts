import crypto from 'node:crypto';
import { eq, and, desc, gte, lte, isNotNull } from 'drizzle-orm';
import { db } from '../../db/index';
import { contentItems, publishJobs } from '../../db/schema/index';
import { AppError } from '../../lib/errors';
import { deleteFile, uploadBuffer, buildGeneratedImageKey, generatePresignedDownloadUrl } from '../../services/r2.service';
import { addRenderJob } from '../../jobs/queues';
import { generateCopy } from '../../services/claude.service';
import { generateImage } from '../../services/fal.service';
import { checkAndDecrementCredits, restoreCredits } from '../../services/quota.service';
import type { CreateContentItemInput, UpdateContentTextInput, ImageGenerationInput } from '@plublista/shared';

const contentItemColumns = {
  id: contentItems.id,
  userId: contentItems.userId,
  type: contentItems.type,
  title: contentItems.title,
  status: contentItems.status,
  style: contentItems.style,
  format: contentItems.format,
  duration: contentItems.duration,
  mediaUrls: contentItems.mediaUrls,
  generatedMediaUrl: contentItems.generatedMediaUrl,
  caption: contentItems.caption,
  hashtags: contentItems.hashtags,
  hookText: contentItems.hookText,
  ctaText: contentItems.ctaText,
  musicUrl: contentItems.musicUrl,
  musicPrompt: contentItems.musicPrompt,
  scheduledAt: contentItems.scheduledAt,
  createdAt: contentItems.createdAt,
  updatedAt: contentItems.updatedAt,
};

export async function createContentItem(userId: string, data: CreateContentItemInput) {
  // Credit check before creation
  if (data.type === 'reel') {
    await checkAndDecrementCredits(userId, 'createReel');
  } else if (data.type === 'carousel') {
    await checkAndDecrementCredits(userId, 'createCarousel');
  }

  try {
    const [item] = await db
      .insert(contentItems)
      .values({
        userId,
        type: data.type,
        title: data.title ?? null,
        mediaUrls: data.mediaUrls,
        style: data.style ?? null,
        format: data.format ?? null,
        duration: data.duration ?? null,
        musicPrompt: data.music ?? null,
      })
      .returning(contentItemColumns);

    // Queue render job for reels
    if (data.type === 'reel' && item) {
      try {
        await addRenderJob({
          userId,
          contentItemId: item.id,
          contentType: data.type,
          clipUrls: data.mediaUrls,
          style: data.style ?? 'dynamic',
          format: data.format ?? '9:16',
          duration: data.duration ?? 30,
          musicPrompt: data.music ?? 'auto-match',
        });

        // Update status to generating
        await db
          .update(contentItems)
          .set({ status: 'generating', updatedAt: new Date() })
          .where(eq(contentItems.id, item.id));

        return { ...item, status: 'generating' as const };
      } catch {
        // Redis/queue unavailable — keep item as draft so it's not lost
        console.warn(`Render job skipped for ${item.id} — Redis not available`);
        return item;
      }
    }

    // Auto-generate AI copy for carousels and posts
    if ((data.type === 'carousel' || data.type === 'post') && item) {
      try {
        const copy = await generateCopy(userId, data.type, data.style ?? 'dynamic');
        await db
          .update(contentItems)
          .set({
            caption: copy.caption,
            hashtags: copy.hashtags,
            hookText: copy.hookText,
            ctaText: copy.ctaText,
            updatedAt: new Date(),
          })
          .where(and(eq(contentItems.id, item.id), eq(contentItems.userId, userId)));
        return { ...item, ...copy };
      } catch {
        // Copy generation failure is non-fatal — user can regenerate later
        return item;
      }
    }

    return item;
  } catch (err) {
    // Restore credits on failure
    if (data.type === 'reel') {
      await restoreCredits(userId, 'createReel');
    } else if (data.type === 'carousel') {
      await restoreCredits(userId, 'createCarousel');
    }
    throw err;
  }
}

export async function getContentItem(userId: string, itemId: string) {
  const [item] = await db
    .select(contentItemColumns)
    .from(contentItems)
    .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new AppError('NOT_FOUND', 'Content item not found', 404);
  }

  return item;
}

export async function listContentItems(
  userId: string,
  options?: { from?: string; to?: string },
) {
  const conditions = [eq(contentItems.userId, userId)];

  if (options?.from) {
    conditions.push(gte(contentItems.scheduledAt, new Date(options.from)));
    conditions.push(isNotNull(contentItems.scheduledAt));
  }
  if (options?.to) {
    conditions.push(lte(contentItems.scheduledAt, new Date(options.to)));
  }

  const items = await db
    .select(contentItemColumns)
    .from(contentItems)
    .where(and(...conditions))
    .orderBy(desc(contentItems.createdAt));

  return items;
}

export async function deleteContentItem(userId: string, itemId: string) {
  // First verify ownership
  const [item] = await db
    .select({ id: contentItems.id, mediaUrls: contentItems.mediaUrls, generatedMediaUrl: contentItems.generatedMediaUrl })
    .from(contentItems)
    .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new AppError('NOT_FOUND', 'Content item not found', 404);
  }

  // Delete files from R2
  const urls = item.mediaUrls as string[];
  for (const url of urls) {
    try {
      await deleteFile(url);
    } catch {
      // Log but don't fail — file may already be deleted
    }
  }

  if (item.generatedMediaUrl) {
    try {
      await deleteFile(item.generatedMediaUrl);
    } catch {
      // Log but don't fail
    }
  }

  // Delete from DB
  await db
    .delete(contentItems)
    .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));

  return { id: itemId };
}

export async function rescheduleContentItem(userId: string, itemId: string, scheduledAt: string) {
  const item = await getContentItem(userId, itemId);

  if (item.status !== 'draft' && item.status !== 'scheduled') {
    throw new AppError('VALIDATION_ERROR', 'Only draft or scheduled content can be rescheduled', 400);
  }

  const newDate = new Date(scheduledAt);

  await db
    .update(contentItems)
    .set({ scheduledAt: newDate, updatedAt: new Date() })
    .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));

  // Also update pending publish jobs if content is scheduled
  if (item.status === 'scheduled') {
    await db
      .update(publishJobs)
      .set({ scheduledAt: newDate })
      .where(
        and(
          eq(publishJobs.contentItemId, itemId),
          eq(publishJobs.userId, userId),
          eq(publishJobs.status, 'pending'),
        ),
      );
  }

  return getContentItem(userId, itemId);
}

export async function duplicateContentItem(userId: string, itemId: string) {
  const original = await getContentItem(userId, itemId);

  // Credit check for reels and carousels (posts have no credit cost)
  const creditOp = original.type === 'reel' ? 'createReel' : original.type === 'carousel' ? 'createCarousel' : null;
  if (creditOp) {
    await checkAndDecrementCredits(userId, creditOp);
  }

  try {
    const [copy] = await db
      .insert(contentItems)
      .values({
        userId,
        type: original.type,
        title: original.title ? `${original.title} (copy)` : 'Untitled (copy)',
        status: 'draft',
        style: original.style,
        format: original.format,
        duration: original.duration,
        mediaUrls: original.mediaUrls as string[],
        generatedMediaUrl: original.generatedMediaUrl,
        caption: original.caption,
        hashtags: original.hashtags as string[],
        hookText: original.hookText,
        ctaText: original.ctaText,
        musicUrl: original.musicUrl,
        musicPrompt: original.musicPrompt,
      })
      .returning(contentItemColumns);

    return copy;
  } catch (err) {
    if (creditOp) {
      await restoreCredits(userId, creditOp);
    }
    throw err;
  }
}

export async function updateContentText(userId: string, itemId: string, data: UpdateContentTextInput) {
  const item = await getContentItem(userId, itemId);

  if (item.status !== 'draft') {
    throw new AppError('VALIDATION_ERROR', 'Text can only be edited for draft content', 400);
  }

  const updates: Partial<typeof contentItems.$inferInsert> = { updatedAt: new Date() };
  if (data.caption !== undefined) updates.caption = data.caption;
  if (data.hashtags !== undefined) updates.hashtags = data.hashtags;
  if (data.hookText !== undefined) updates.hookText = data.hookText;
  if (data.ctaText !== undefined) updates.ctaText = data.ctaText;

  await db
    .update(contentItems)
    .set(updates)
    .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));

  return getContentItem(userId, itemId);
}

export async function regenerateContentCopy(userId: string, itemId: string) {
  const item = await getContentItem(userId, itemId);

  if (item.status !== 'draft') {
    throw new AppError('VALIDATION_ERROR', 'Copy can only be regenerated for draft content', 400);
  }

  await checkAndDecrementCredits(userId, 'regenerateCopy');

  const copy = await generateCopy(userId, item.type, item.style ?? 'dynamic');

  await db
    .update(contentItems)
    .set({
      caption: copy.caption,
      hashtags: copy.hashtags,
      hookText: copy.hookText,
      ctaText: copy.ctaText,
      updatedAt: new Date(),
    })
    .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));

  console.info(JSON.stringify({ userId, itemId }, null, 0), 'Copy regeneration complete');

  return {
    caption: copy.caption,
    hashtags: copy.hashtags,
    hookText: copy.hookText,
    ctaText: copy.ctaText,
  };
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function generateContentImage(
  userId: string,
  itemId: string,
  data: ImageGenerationInput,
): Promise<{ imageUrl: string }> {
  // 1. Ownership check
  await getContentItem(userId, itemId);

  // 2. Credit check — atomic decrement before generation
  await checkAndDecrementCredits(userId, 'generateAiImage');

  try {
    // 3. Generate image via Fal.ai
    const result = await generateImage(userId, data.prompt);

    // 4. Validate and download generated image
    const url = new URL(result.imageUrl);
    if (url.protocol !== 'https:') {
      throw new AppError('EXTERNAL_API_ERROR', 'Invalid image URL scheme', 502);
    }

    const response = await fetch(result.imageUrl);
    if (!response.ok) {
      throw new AppError('EXTERNAL_API_ERROR', `Failed to download generated image: ${response.status}`, 502);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      throw new AppError('EXTERNAL_API_ERROR', 'Generated image exceeds size limit', 502);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      throw new AppError('EXTERNAL_API_ERROR', 'Generated image exceeds size limit', 502);
    }

    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to R2 and persist key to content item
    const fileKey = buildGeneratedImageKey(userId, itemId);
    await uploadBuffer(fileKey, buffer, 'image/webp');

    await db
      .update(contentItems)
      .set({ generatedMediaUrl: fileKey, updatedAt: new Date() })
      .where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));

    // 6. Return presigned download URL
    const imageUrl = await generatePresignedDownloadUrl(fileKey);

    return { imageUrl };
  } catch (err) {
    await restoreCredits(userId, 'generateAiImage');
    throw err;
  }
}

export async function generateStandaloneImage(
  userId: string,
  data: ImageGenerationInput,
): Promise<{ imageUrl: string; fileKey: string }> {
  // 1. Credit check — atomic decrement before generation
  await checkAndDecrementCredits(userId, 'generateAiImage');

  try {
    // 2. Generate image via Fal.ai
    const result = await generateImage(userId, data.prompt);

    // 3. Validate URL scheme (SSRF protection)
    const url = new URL(result.imageUrl);
    if (url.protocol !== 'https:') {
      throw new AppError('EXTERNAL_API_ERROR', 'Invalid image URL scheme', 502);
    }

    // 4. Download generated image
    const response = await fetch(result.imageUrl);
    if (!response.ok) {
      throw new AppError('EXTERNAL_API_ERROR', `Failed to download generated image: ${response.status}`, 502);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      throw new AppError('EXTERNAL_API_ERROR', 'Generated image exceeds size limit', 502);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      throw new AppError('EXTERNAL_API_ERROR', 'Generated image exceeds size limit', 502);
    }

    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to R2 under standalone path
    const fileKey = `users/${userId}/generated/standalone/${crypto.randomUUID()}.webp`;
    await uploadBuffer(fileKey, buffer, 'image/webp');

    // 6. Return presigned download URL + fileKey
    const imageUrl = await generatePresignedDownloadUrl(fileKey);

    return { imageUrl, fileKey };
  } catch (err) {
    await restoreCredits(userId, 'generateAiImage');
    throw err;
  }
}
