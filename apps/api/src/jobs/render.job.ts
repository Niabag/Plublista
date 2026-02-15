import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { getRedisConfig } from '../config/redis';
import { db } from '../db/index';
import { contentItems } from '../db/schema/index';
import { generateCopy, type GeneratedCopy } from '../services/claude.service';
import { transcribeAudio, type WhisperXResult } from '../services/fal.service';
import { generateMusic } from '../services/fal.service';
import {
  analyzeVideoNarrative,
  type ClipInput,
  type TranscriptInput,
  type SilenceInput,
  type RmsInput,
  type NarrativeAnalysis,
} from '../services/gemini.service';
import {
  composeVideoV2,
  createTempDir,
  cleanupTempDir,
  getVideoDuration,
  getNativeFramerate,
  detectSilence,
  getRmsProfile,
  selectTransition,
  type LocalTimelineV2,
} from '../services/ffmpeg.service';
import {
  buildFileKey,
  downloadBuffer,
  uploadBuffer,
  deleteFile,
  generatePresignedDownloadUrl,
} from '../services/r2.service';
import { restoreCredits } from '../services/quota.service';
import { PermanentRenderError, classifyError } from './errors';
import type { RenderJobData } from './queues';

export async function processRenderJob(data: RenderJobData): Promise<void> {
  const { userId, contentItemId, contentType, clipUrls, style, format, duration, musicPrompt } =
    data;

  console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Render v2 started');

  // STEP 0: Download clips from R2 → temp dir
  const tempDir = await createTempDir(contentItemId);

  try {
    const uniqueClipKeys = [...new Set(clipUrls)];
    const localClips: Array<{ key: string; localPath: string; index: number }> = [];

    for (let i = 0; i < uniqueClipKeys.length; i++) {
      const key = uniqueClipKeys[i];
      const ext = path.extname(key) || '.mp4';
      const localPath = path.join(tempDir, `clip_${i}${ext}`);
      const buffer = await downloadBuffer(key);
      await fsp.writeFile(localPath, buffer);
      localClips.push({ key, localPath, index: i });
    }

    console.info(
      JSON.stringify({ userId, contentItemId, clipCount: localClips.length }, null, 0),
      'Clips downloaded',
    );

    // Get native framerate from first clip
    const nativeFramerate = await getNativeFramerate(localClips[0].localPath);

    // STEP 1: PARALLEL EXTRACTION (per clip)
    const clipInputs: ClipInput[] = [];
    const transcripts: TranscriptInput[] = [];
    const silences: SilenceInput[] = [];
    const rmsProfiles: RmsInput[] = [];

    await Promise.all(
      localClips.map(async (clip) => {
        const clipDuration = await getVideoDuration(clip.localPath);
        clipInputs.push({
          localPath: clip.localPath,
          index: clip.index,
          durationSec: clipDuration,
        });

        // Transcription (graceful — continue with empty on failure)
        let transcript: WhisperXResult = { segments: [], language: 'unknown' };
        try {
          const presignedUrl = await generatePresignedDownloadUrl(clip.key, 900);
          transcript = await transcribeAudio(userId, presignedUrl);
        } catch (err) {
          console.warn(
            JSON.stringify({ userId, contentItemId, clipIndex: clip.index, error: (err as Error).message }, null, 0),
            'Transcription failed — continuing with empty transcript',
          );
        }
        transcripts.push({
          clipIndex: clip.index,
          segments: transcript.segments.map((s) => ({
            text: s.text,
            start: s.start,
            end: s.end,
          })),
        });

        // Silence detection (graceful)
        let clipSilences: Array<{ startSec: number; endSec: number }> = [];
        try {
          clipSilences = await detectSilence(clip.localPath);
        } catch (err) {
          console.warn(
            JSON.stringify({ userId, contentItemId, clipIndex: clip.index, error: (err as Error).message }, null, 0),
            'Silence detection failed — continuing without silence data',
          );
        }
        silences.push({ clipIndex: clip.index, silences: clipSilences });

        // RMS energy profile (graceful)
        let profile: Array<{ timeSec: number; rmsDb: number }> = [];
        try {
          profile = await getRmsProfile(clip.localPath);
        } catch (err) {
          console.warn(
            JSON.stringify({ userId, contentItemId, clipIndex: clip.index, error: (err as Error).message }, null, 0),
            'RMS profile failed — continuing without energy data',
          );
        }
        rmsProfiles.push({ clipIndex: clip.index, profile });
      }),
    );

    // Sort by clip index for consistency
    clipInputs.sort((a, b) => a.index - b.index);
    transcripts.sort((a, b) => a.clipIndex - b.clipIndex);
    silences.sort((a, b) => a.clipIndex - b.clipIndex);
    rmsProfiles.sort((a, b) => a.clipIndex - b.clipIndex);

    console.info(
      JSON.stringify({ userId, contentItemId }, null, 0),
      'Step 1 complete: parallel extraction done',
    );

    // STEP 2: NARRATIVE ANALYSIS (Gemini)
    const narrative: NarrativeAnalysis = await analyzeVideoNarrative(
      userId,
      clipInputs,
      transcripts,
      silences,
      rmsProfiles,
      style,
      duration,
    );

    console.info(
      JSON.stringify({
        userId, contentItemId,
        segmentCount: narrative.orderedSegments.length,
        mood: narrative.suggestedMood,
      }, null, 0),
      'Step 2 complete: narrative analysis done',
    );

    // STEP 3: BUILD INTELLIGENT TIMELINE
    const clipPathMap = new Map(localClips.map((c) => [c.index, c.localPath]));

    const timelineSegments: LocalTimelineV2['segments'] = narrative.orderedSegments.map(
      (seg, i) => {
        // Select transition based on RMS at the cut point
        const clipRms = rmsProfiles.find((r) => r.clipIndex === seg.clipIndex);
        let avgRmsAtCut = -20; // default medium
        if (clipRms && clipRms.profile.length > 0) {
          // Get RMS values around the end of this segment (the cut point)
          const cutTime = seg.endSec;
          const nearby = clipRms.profile.filter(
            (p) => Math.abs(p.timeSec - cutTime) <= 1.0,
          );
          if (nearby.length > 0) {
            avgRmsAtCut = nearby.reduce((sum, p) => sum + p.rmsDb, 0) / nearby.length;
          }
        }

        const isLast = i === narrative.orderedSegments.length - 1;
        const transition = isLast ? null : selectTransition(avgRmsAtCut);

        return {
          localPath: clipPathMap.get(seg.clipIndex)!,
          startSec: seg.startSec,
          endSec: seg.endSec,
          transitionToNext: transition,
        };
      },
    );

    // STEP 3b: MUSIC (graceful)
    let musicPath: string | null = null;
    try {
      const musicResult = await generateMusic(
        userId,
        narrative.suggestedMood || musicPrompt || 'upbeat energetic',
        duration,
      );
      if (musicResult.musicUrl) {
        const musicResp = await fetch(musicResult.musicUrl);
        if (musicResp.ok) {
          const musicBuffer = Buffer.from(await musicResp.arrayBuffer());
          musicPath = path.join(tempDir, 'music.mp3');
          await fsp.writeFile(musicPath, musicBuffer);
        }
      }
      console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Music generated');
    } catch (err) {
      console.warn(
        JSON.stringify({ userId, contentItemId, error: (err as Error).message }, null, 0),
        'Music generation failed — continuing without music',
      );
    }

    const timeline: LocalTimelineV2 = {
      segments: timelineSegments,
      totalDuration: duration,
      format,
      musicPath,
      nativeFramerate,
    };

    console.info(
      JSON.stringify({ userId, contentItemId, segmentCount: timeline.segments.length }, null, 0),
      'Step 3 complete: intelligent timeline built',
    );

    // STEP 4: PRO RENDER
    const outputPath = await composeVideoV2(timeline, tempDir);

    console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Step 4 complete: pro render done');

    // STEP 5: FINALIZATION
    // 5a: Upload rendered output to R2
    const outputBuffer = await fsp.readFile(outputPath);
    const generatedMediaKey = buildFileKey(userId, `${contentItemId}-render.mp4`);
    await uploadBuffer(generatedMediaKey, outputBuffer, 'video/mp4');

    console.info(
      JSON.stringify({ userId, contentItemId, key: generatedMediaKey, size: outputBuffer.length }, null, 0),
      'Rendered video uploaded to R2',
    );

    // 5b: DELETE raw rushes from R2 (best-effort)
    for (const key of clipUrls) {
      try {
        await deleteFile(key);
      } catch (err) {
        console.warn(
          JSON.stringify({ userId, contentItemId, key, error: (err as Error).message }, null, 0),
          'Rush deletion failed — cleanup job will retry',
        );
      }
    }

    // 5c: Generate AI copy with transcript context (graceful)
    let copyResult: GeneratedCopy | null = null;
    try {
      const transcriptText = transcripts
        .flatMap((t) => t.segments.map((s) => s.text))
        .join(' ')
        .trim();

      copyResult = await generateCopy(userId, contentType, style, {
        narrative: narrative.overallNarrative,
        transcript: transcriptText,
        suggestedMood: narrative.suggestedMood,
      });
      console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Copy generated');
    } catch (err) {
      console.warn(
        JSON.stringify({ userId, contentItemId, error: (err as Error).message }, null, 0),
        'Copy generation failed — continuing without captions',
      );
    }

    // 5d: Update DB
    await db
      .update(contentItems)
      .set({
        status: 'draft',
        generatedMediaUrl: generatedMediaKey,
        mediaUrls: [], // rushes deleted
        caption: copyResult?.caption ?? null,
        hashtags: copyResult?.hashtags ?? [],
        hookText: copyResult?.hookText ?? null,
        ctaText: copyResult?.ctaText ?? null,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, contentItemId));

    console.info(JSON.stringify({ userId, contentItemId }, null, 0), 'Render v2 pipeline complete');
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

    const { userId, contentItemId, clipUrls } = job.data;
    const category = classifyError(err);

    console.error(
      JSON.stringify({ userId, contentItemId, error: err.message, attempt: job.attemptsMade, category }, null, 0),
      'Render job failed',
    );

    const isFinal =
      err instanceof PermanentRenderError ||
      category === 'permanent' ||
      job.attemptsMade >= (job.opts.attempts ?? 3);

    if (!isFinal) return;

    if (err instanceof PermanentRenderError || category === 'permanent') {
      job.discard();
    }

    await restoreCredits(userId, 'createReel');

    // Delete raw clips from R2 to free storage
    for (const key of clipUrls) {
      try {
        await deleteFile(key);
      } catch (delErr) {
        console.warn(
          JSON.stringify({ contentItemId, key, error: (delErr as Error).message }, null, 0),
          'Failed to delete rush on render failure',
        );
      }
    }

    await db
      .update(contentItems)
      .set({ status: 'failed', mediaUrls: [], updatedAt: new Date() })
      .where(eq(contentItems.id, contentItemId));

    console.error(
      JSON.stringify({ userId, contentItemId, rushesDeleted: clipUrls.length }, null, 0),
      'Render job failed permanently — credits restored, rushes cleaned up',
    );
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
