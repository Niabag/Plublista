import { execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const RENDER_DIR = path.join(os.tmpdir(), 'publista-render');

export const FORMAT_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
};

// --- Interfaces ---

export interface LocalTimelineV2 {
  segments: Array<{
    localPath: string;
    startSec: number;
    endSec: number;
    transitionToNext: { xfade: string; duration: number } | null;
  }>;
  totalDuration: number;
  format: string;
  musicPath: string | null;
  nativeFramerate: number;
}

// --- Temp dir management ---

export async function createTempDir(contentItemId: string): Promise<string> {
  const dir = path.join(RENDER_DIR, contentItemId);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fsp.rm(tempDir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
}

// --- Probing ---

export async function getVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

export async function getNativeFramerate(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=r_frame_rate',
    '-of', 'csv=p=0',
    filePath,
  ]);
  const [num, den] = stdout.trim().split('/').map(Number);
  const fps = den ? num / den : num;
  return isFinite(fps) && fps > 0 ? fps : 30;
}

// --- Audio analysis ---

export async function detectSilence(
  inputPath: string,
  thresholdDb = -30,
  minDuration = 0.3,
): Promise<Array<{ startSec: number; endSec: number }>> {
  const { stderr } = await execFileAsync(
    'ffmpeg',
    [
      '-i', inputPath,
      '-af', `silencedetect=noise=${thresholdDb}dB:d=${minDuration}`,
      '-vn', '-f', 'null', '-',
    ],
    { timeout: 60_000, maxBuffer: 5 * 1024 * 1024 },
  );

  const silences: Array<{ startSec: number; endSec: number }> = [];
  let currentStart: number | null = null;

  for (const line of stderr.split('\n')) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    if (startMatch) {
      currentStart = parseFloat(startMatch[1]);
    }
    const endMatch = line.match(/silence_end:\s*([\d.]+)/);
    if (endMatch && currentStart !== null) {
      silences.push({ startSec: currentStart, endSec: parseFloat(endMatch[1]) });
      currentStart = null;
    }
  }

  return silences;
}

export async function getRmsProfile(
  inputPath: string,
  windowSec = 0.5,
): Promise<Array<{ timeSec: number; rmsDb: number }>> {
  const { stderr } = await execFileAsync(
    'ffmpeg',
    ['-i', inputPath, '-vn', '-af', 'ebur128=peak=none', '-f', 'null', '-'],
    { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
  );

  // ebur128 outputs: [Parsed_ebur128_0 @ ...] t: 0.5  TARGET:...  M: -25.3 S:...
  const rawValues: Array<{ timeSec: number; lufs: number }> = [];
  for (const line of stderr.split('\n')) {
    const match = line.match(/\bt:\s*([\d.]+)\s.*\bM:\s*([-\d.]+)/);
    if (match) {
      const timeSec = parseFloat(match[1]);
      const lufs = parseFloat(match[2]);
      if (isFinite(timeSec) && isFinite(lufs)) {
        rawValues.push({ timeSec, lufs });
      }
    }
  }

  // Average into desired window size
  const profile: Array<{ timeSec: number; rmsDb: number }> = [];
  let windowStart = 0;
  let windowValues: number[] = [];

  for (const v of rawValues) {
    while (v.timeSec >= windowStart + windowSec) {
      if (windowValues.length > 0) {
        const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
        profile.push({ timeSec: windowStart, rmsDb: avg });
      }
      windowStart += windowSec;
      windowValues = [];
    }
    windowValues.push(v.lufs);
  }

  if (windowValues.length > 0) {
    const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    profile.push({ timeSec: windowStart, rmsDb: avg });
  }

  return profile;
}

// --- Transition selection ---

export function selectTransition(avgRmsDb: number): { xfade: string; duration: number } {
  if (avgRmsDb < -25) return { xfade: 'dissolve', duration: 0.8 };
  if (avgRmsDb < -15) return { xfade: 'slideleft', duration: 0.4 };
  return { xfade: 'fade', duration: 0.01 }; // hard cut (imperceptible)
}

// --- Compose v2 ---

async function normalizeSegment(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
  width: number,
  height: number,
  fps: number,
): Promise<void> {
  const duration = endSec - startSec;
  await execFileAsync(
    'ffmpeg',
    [
      '-loglevel', 'warning',
      '-ss', startSec.toFixed(3),
      '-i', inputPath,
      '-t', duration.toFixed(3),
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'high', '-crf', '23', '-pix_fmt', 'yuv420p',
      '-r', fps.toFixed(2),
      '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-ar', '44100',
      '-y', outputPath,
    ],
    { timeout: 300_000, maxBuffer: 10 * 1024 * 1024 },
  );
}

export async function composeVideoV2(
  timeline: LocalTimelineV2,
  tempDir: string,
): Promise<string> {
  const { width, height } = FORMAT_RESOLUTIONS[timeline.format] ?? FORMAT_RESOLUTIONS['9:16'];
  const fps = timeline.nativeFramerate;

  // Step 1: Normalize each segment (trim + scale + keep audio)
  const normalizedPaths: string[] = [];
  const segDurations: number[] = [];

  for (let i = 0; i < timeline.segments.length; i++) {
    const seg = timeline.segments[i];
    const outPath = path.join(tempDir, `segment_${i}.mp4`);
    console.info(`[composeV2] Normalizing segment ${i + 1}/${timeline.segments.length}: ${seg.startSec}s-${seg.endSec}s from clip ${seg.localPath}`);
    try {
      await normalizeSegment(seg.localPath, outPath, seg.startSec, seg.endSec, width, height, fps);
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? '';
      console.error(`[composeV2] Normalize segment ${i} failed:`, (err as Error).message, stderr.slice(-500));
      throw err;
    }
    const segDur = await getVideoDuration(outPath);
    normalizedPaths.push(outPath);
    segDurations.push(segDur);
    console.info(`[composeV2] Segment ${i} normalized: ${segDur.toFixed(2)}s`);
  }

  // Step 2: Build filter_complex and compose
  const outputPath = path.join(tempDir, 'output.mp4');
  const hasMusic = !!(timeline.musicPath && fs.existsSync(timeline.musicPath));
  const musicInputIndex = normalizedPaths.length;

  const args: string[] = ['-loglevel', 'warning'];
  for (const p of normalizedPaths) args.push('-i', p);
  if (hasMusic) args.push('-i', timeline.musicPath!);

  const filterParts: string[] = [];
  let videoOutLabel: string;
  let audioOutLabel: string;

  if (normalizedPaths.length === 1) {
    // Single segment — pass video through, loudnorm audio
    videoOutLabel = '0:v';
    filterParts.push('[0:a]loudnorm=I=-14:TP=-1.5:LRA=11[anorm]');
    audioOutLabel = '[anorm]';
  } else {
    // --- Video xfade chain (adaptive transitions) ---
    let prevVideoLabel = '[0:v]';
    let cumulativeDur = segDurations[0];

    for (let i = 1; i < normalizedPaths.length; i++) {
      const trans = timeline.segments[i - 1].transitionToNext;
      const transName = trans?.xfade ?? 'fade';
      const transDur = Math.max(0.01, Math.min(trans?.duration ?? 0.01, cumulativeDur - 0.01));
      const offset = Math.max(0, cumulativeDur - transDur);
      const isLast = i === normalizedPaths.length - 1;
      const outLabel = isLast ? '[vout]' : `[v${i}]`;

      filterParts.push(
        `${prevVideoLabel}[${i}:v]xfade=transition=${transName}:duration=${transDur.toFixed(3)}:offset=${offset.toFixed(3)}${outLabel}`,
      );
      prevVideoLabel = outLabel;
      cumulativeDur = offset + segDurations[i];
    }
    videoOutLabel = '[vout]';

    // --- Audio crossfade chain (matching video transitions) ---
    let prevAudioLabel = '[0:a]';
    for (let i = 1; i < normalizedPaths.length; i++) {
      const trans = timeline.segments[i - 1].transitionToNext;
      const transDur = Math.max(0.01, trans?.duration ?? 0.01);
      const isLast = i === normalizedPaths.length - 1;
      const outLabel = isLast ? '[araw]' : `[a${i}]`;

      filterParts.push(
        `${prevAudioLabel}[${i}:a]acrossfade=d=${transDur.toFixed(3)}:c1=tri:c2=tri${outLabel}`,
      );
      prevAudioLabel = outLabel;
    }

    // Loudnorm on concatenated audio
    filterParts.push('[araw]loudnorm=I=-14:TP=-1.5:LRA=11[anorm]');
    audioOutLabel = '[anorm]';
  }

  // Optional music mix at -15dB under voice
  if (hasMusic) {
    filterParts.push(`[${musicInputIndex}:a]volume=-15dB[mvol]`);
    filterParts.push(`${audioOutLabel}[mvol]amix=inputs=2:duration=first[afinal]`);
    audioOutLabel = '[afinal]';
  }

  args.push('-filter_complex', filterParts.join(';'));
  args.push('-map', videoOutLabel, '-map', audioOutLabel);

  if (normalizedPaths.length === 1) {
    args.push('-c:v', 'copy');
  } else {
    args.push(
      '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-r', fps.toFixed(2),
    );
  }
  args.push('-c:a', 'aac', '-b:a', '192k');
  args.push('-t', timeline.totalDuration.toFixed(3));
  args.push('-y', outputPath);

  console.info(`[composeV2] Running final compose with ${normalizedPaths.length} segments, music=${!!hasMusic}`);
  console.info(`[composeV2] Filter: ${filterParts.join('; ')}`);

  try {
    await execFileAsync('ffmpeg', args, { timeout: 600_000, maxBuffer: 50 * 1024 * 1024 });
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? '';
    console.error('[composeV2] Final compose failed:', (err as Error).message);
    console.error('[composeV2] FFmpeg stderr (last 1000):', stderr.slice(-1000));
    throw err;
  }

  console.info('[composeV2] Compose complete:', outputPath);
  return outputPath;
}
