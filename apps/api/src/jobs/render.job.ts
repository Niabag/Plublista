import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { getRedisConfig } from '../config/redis';
import { db } from '../db/index';
import { contentItems } from '../db/schema/index';
import { analyzeClips, generateCopy, type GeneratedCopy } from '../services/claude.service';
import { generateMusic } from '../services/fal.service';
import { buildFileKey } from '../services/r2.service';
import type { RenderJobData } from './queues';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  // Step 2: Generate music via Fal.ai
  const musicResult = await generateMusic(userId, musicPrompt || 'upbeat energetic', duration);

  console.info(
    JSON.stringify({ userId, contentItemId, musicUrl: musicResult.musicUrl }, null, 0),
    'Music generation complete',
  );

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
  const timeline = {
    hookClip: analysis.hookClip,
    hookDuration: 1.7,
    segments: analysis.bestMoments.map((m) => ({
      clipUrl: m.clipUrl,
      startSec: m.startSec,
      endSec: m.endSec,
      cutDuration: Math.min(m.endSec - m.startSec, 5),
    })),
    totalDuration: duration,
    format,
    musicUrl: musicResult.musicUrl,
  };

  console.info(
    JSON.stringify({ userId, contentItemId, segmentCount: timeline.segments.length }, null, 0),
    'Timeline composed',
  );

  // Step 5: Render video (PLACEHOLDER — real Remotion/FFmpeg rendering in follow-up story)
  await sleep(2000);

  console.info(
    JSON.stringify({ userId, contentItemId }, null, 0),
    'Render step complete (placeholder)',
  );

  // Step 6: Generate file key for rendered output (placeholder — no actual file uploaded yet)
  const generatedMediaKey = buildFileKey(userId, `${contentItemId}-render.mp4`);

  // Step 7: Update DB — status draft, set generated media key, music URL, and AI copy
  await db
    .update(contentItems)
    .set({
      status: 'draft',
      generatedMediaUrl: generatedMediaKey,
      musicUrl: musicResult.musicUrl || null,
      caption: copyResult?.caption ?? null,
      hashtags: copyResult?.hashtags ?? [],
      hookText: copyResult?.hookText ?? null,
      ctaText: copyResult?.ctaText ?? null,
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, contentItemId));

  console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Render pipeline complete');
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
    console.error(
      JSON.stringify({ userId, contentItemId, error: err.message, attempt: job.attemptsMade }, null, 0),
      'Render job failed',
    );

    // If all retries exhausted, mark as failed
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await db
        .update(contentItems)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(contentItems.id, contentItemId));

      console.error(
        JSON.stringify({ userId, contentItemId }, null, 0),
        'Render job failed permanently — status set to failed',
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
