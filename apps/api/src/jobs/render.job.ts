import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { getRedisConfig } from '../config/redis';
import { db } from '../db/index';
import { contentItems } from '../db/schema/index';
import { analyzeClips, generateCopy, type GeneratedCopy } from '../services/claude.service';
import { generateMusic } from '../services/fal.service';
import { composeVideo, createTempDir, cleanupTempDir, type LocalTimeline } from '../services/ffmpeg.service';
import { buildFileKey, downloadBuffer, uploadBuffer } from '../services/r2.service';
import { restoreCredits } from '../services/quota.service';
import { PermanentRenderError, classifyError } from './errors';
import type { RenderJobData } from './queues';

export async function processRenderJob(data: RenderJobData): Promise<void> {
  const { userId, contentItemId, contentType, clipUrls, style, format, duration, musicPrompt } = data;

  // Status already set to 'generating' by content.service before queue dispatch
  console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Render started');

  // Step 1: Analyze clips with Claude
  const analysis = await analyzeClips(userId, clipUrls, style);

  console.info(
    JSON.stringify({ userId, contentItemId, hookClip: analysis.hookClip }, null, 0),
    'Clip analysis complete',
  );

  // Step 2: Generate music via Fal.ai — graceful degradation
  let musicResult: { musicUrl: string } | null = null;
  try {
    musicResult = await generateMusic(userId, musicPrompt || 'upbeat energetic', duration);
    console.info(
      JSON.stringify({ userId, contentItemId, musicUrl: musicResult.musicUrl }, null, 0),
      'Music generation complete',
    );
  } catch (err) {
    console.error(
      JSON.stringify({ userId, contentItemId, error: (err as Error).message }, null, 0),
      'Music generation failed — continuing without music',
    );
  }

  // Step 3: Generate AI copy — graceful degradation
  let copyResult: GeneratedCopy | null = null;
  try {
    copyResult = await generateCopy(userId, contentType, style, analysis);
    console.info(
      JSON.stringify({ userId, contentItemId }, null, 0),
      'Copy generation complete',
    );
  } catch (err) {
    console.error(
      JSON.stringify({ userId, contentItemId, error: (err as Error).message }, null, 0),
      'Copy generation failed — continuing without copy',
    );
  }

  // Step 4: Compose edit timeline from analysis
  // Start with best moments from Claude
  const rawSegments = analysis.bestMoments.map((m) => ({
    clipUrl: m.clipUrl,
    startSec: m.startSec,
    endSec: m.endSec,
  }));

  // Calculate total covered duration
  const coveredDuration = rawSegments.reduce((sum, s) => sum + (s.endSec - s.startSec), 0);

  // If segments don't fill the target duration, pad with full clip coverage
  let finalSegments = rawSegments;
  if (coveredDuration < duration) {
    // Build a list of all clip URLs (deduplicated, preserving order)
    const allClips = [...new Set(clipUrls)];

    // For each clip, find time ranges NOT already covered by bestMoments
    const fillerSegments: typeof rawSegments = [];
    for (const clipUrl of allClips) {
      // Get existing segments for this clip, sorted by start time
      const existing = rawSegments
        .filter((s) => s.clipUrl === clipUrl)
        .sort((a, b) => a.startSec - b.startSec);

      // Find gaps — we assume each clip could be up to `duration` seconds long
      // (we don't know actual duration, so use the target as upper bound)
      let cursor = 0;
      for (const seg of existing) {
        if (seg.startSec > cursor) {
          fillerSegments.push({ clipUrl, startSec: cursor, endSec: seg.startSec });
        }
        cursor = Math.max(cursor, seg.endSec);
      }
      // Add remaining time after last segment
      if (cursor < duration) {
        fillerSegments.push({ clipUrl, startSec: cursor, endSec: duration });
      }
    }

    // Merge best moments + fillers, sorted by clip then time
    finalSegments = [...rawSegments, ...fillerSegments].sort((a, b) => {
      const clipDiff = clipUrls.indexOf(a.clipUrl) - clipUrls.indexOf(b.clipUrl);
      return clipDiff !== 0 ? clipDiff : a.startSec - b.startSec;
    });

    console.info(
      JSON.stringify({
        userId, contentItemId,
        coveredDuration: Math.round(coveredDuration),
        targetDuration: duration,
        fillersAdded: fillerSegments.length,
      }, null, 0),
      'Timeline padded with filler segments to reach target duration',
    );
  }

  const timeline = {
    hookClip: analysis.hookClip,
    hookDuration: 1.7,
    segments: finalSegments,
    totalDuration: duration,
    format,
    musicUrl: musicResult?.musicUrl ?? null,
  };

  console.info(
    JSON.stringify({ userId, contentItemId, segmentCount: timeline.segments.length }, null, 0),
    'Timeline composed',
  );

  // Step 5: Render video with FFmpeg
  const tempDir = await createTempDir(contentItemId);

  try {
    // 5a: Download all unique clips from R2 to temp dir
    const uniqueClipUrls = [...new Set(timeline.segments.map((s) => s.clipUrl))];
    const clipPathMap = new Map<string, string>();

    for (let i = 0; i < uniqueClipUrls.length; i++) {
      const clipUrl = uniqueClipUrls[i];
      const ext = path.extname(clipUrl) || '.mp4';
      const localPath = path.join(tempDir, `clip_${i}${ext}`);

      const buffer = await downloadBuffer(clipUrl);
      await fsp.writeFile(localPath, buffer);
      clipPathMap.set(clipUrl, localPath);

      console.info(
        JSON.stringify({ userId, contentItemId, clipIndex: i, size: buffer.length }, null, 0),
        'Clip downloaded from R2',
      );
    }

    // 5b: Download music if available (external URL)
    let musicPath: string | null = null;
    if (musicResult?.musicUrl) {
      try {
        const musicResp = await fetch(musicResult.musicUrl);
        if (musicResp.ok) {
          const musicBuffer = Buffer.from(await musicResp.arrayBuffer());
          musicPath = path.join(tempDir, 'music.mp3');
          await fsp.writeFile(musicPath, musicBuffer);
          console.info(
            JSON.stringify({ userId, contentItemId }, null, 0),
            'Music downloaded',
          );
        }
      } catch (err) {
        console.error(
          JSON.stringify({ userId, contentItemId, error: (err as Error).message }, null, 0),
          'Music download failed — continuing without music',
        );
      }
    }

    // 5c: Build local timeline
    const localTimeline: LocalTimeline = {
      segments: timeline.segments.map((s) => ({
        localPath: clipPathMap.get(s.clipUrl)!,
        startSec: s.startSec,
        endSec: s.endSec,
      })),
      totalDuration: timeline.totalDuration,
      format: timeline.format,
      style,
      musicPath,
    };

    // 5d: Run FFmpeg composition
    const outputPath = await composeVideo(localTimeline, tempDir);

    console.info(
      JSON.stringify({ userId, contentItemId }, null, 0),
      'FFmpeg composition complete',
    );

    // Step 6: Upload rendered video to R2
    const outputBuffer = await fsp.readFile(outputPath);
    const generatedMediaKey = buildFileKey(userId, `${contentItemId}-render.mp4`);
    await uploadBuffer(generatedMediaKey, outputBuffer, 'video/mp4');

    console.info(
      JSON.stringify({ userId, contentItemId, key: generatedMediaKey, size: outputBuffer.length }, null, 0),
      'Rendered video uploaded to R2',
    );

    // Step 7: Update DB — status draft, set generated media key, music URL, and AI copy
    await db
      .update(contentItems)
      .set({
        status: 'draft',
        generatedMediaUrl: generatedMediaKey,
        musicUrl: musicResult?.musicUrl || null,
        caption: copyResult?.caption ?? null,
        hashtags: copyResult?.hashtags ?? [],
        hookText: copyResult?.hookText ?? null,
        ctaText: copyResult?.ctaText ?? null,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, contentItemId));

    console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Render pipeline complete');
  } finally {
    await cleanupTempDir(tempDir);
  }
}

let worker: Worker | null = null;

export function startRenderWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<RenderJobData>(
    'render',
    async (job) => {
      await processRenderJob(job.data);
    },
    {
      connection: getRedisConfig(),
      concurrency: 2,
    },
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;

    const { userId, contentItemId } = job.data;
    const category = classifyError(err);

    console.error(
      JSON.stringify({ userId, contentItemId, error: err.message, attempt: job.attemptsMade, category }, null, 0),
      'Render job failed',
    );

    // Discard remaining retries for permanent errors
    if (err instanceof PermanentRenderError || category === 'permanent') {
      job.discard();
      await restoreCredits(userId, 'createReel');
      await db
        .update(contentItems)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(contentItems.id, contentItemId));

      console.error(
        JSON.stringify({ userId, contentItemId }, null, 0),
        'Render job failed permanently — credits restored, status set to failed',
      );
      return;
    }

    // If all retries exhausted, mark as failed and restore credits
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await restoreCredits(userId, 'createReel');
      await db
        .update(contentItems)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(contentItems.id, contentItemId));

      console.error(
        JSON.stringify({ userId, contentItemId }, null, 0),
        'Render job failed permanently — credits restored, status set to failed',
      );
    }
  });

  worker.on('completed', (job) => {
    if (!job) return;
    console.info(
      JSON.stringify({ userId: job.data.userId, contentItemId: job.data.contentItemId }, null, 0),
      'Render job completed successfully',
    );
  });

  return worker;
}
