import ffmpeg from 'fluent-ffmpeg';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const RENDER_DIR = path.join(os.tmpdir(), 'publista-render');

const FORMAT_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
};

/** FFmpeg xfade transition name + duration per montage style */
const STYLE_TRANSITIONS: Record<string, { xfade: string; duration: number }> = {
  dynamic:   { xfade: 'slideleft', duration: 0.3 },
  cinematic: { xfade: 'dissolve',  duration: 1.0 },
  ugc:       { xfade: 'fade',      duration: 0.15 },
  tutorial:  { xfade: 'fadeblack', duration: 0.5 },
  hype:      { xfade: 'radial',    duration: 0.2 },
};

export interface LocalTimeline {
  segments: Array<{
    localPath: string;
    startSec: number;
    endSec: number;
  }>;
  totalDuration: number;
  format: string;
  style: string;
  musicPath: string | null;
}

export async function createTempDir(contentItemId: string): Promise<string> {
  const dir = path.join(RENDER_DIR, contentItemId);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fsp.rm(tempDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

function runFfmpeg(command: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    command
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

/**
 * Normalize a single clip segment: trim, scale+pad to target resolution,
 * uniform codec/framerate, strip audio.
 */
async function normalizeSegment(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
  width: number,
  height: number,
): Promise<void> {
  const duration = endSec - startSec;

  const command = ffmpeg(inputPath)
    .setStartTime(startSec)
    .setDuration(duration)
    .videoFilters([
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
    ])
    .outputOptions([
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ac', '2',
      '-ar', '44100',
    ])
    .output(outputPath);

  await runFfmpeg(command);
}

/** Get the actual duration of a video file via ffprobe */
async function getVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

/**
 * Concat segments with xfade transitions using raw ffmpeg CLI.
 * For N segments, generates N-1 xfade filters chained together.
 */
async function concatWithTransitions(
  normalizedPaths: string[],
  segDurations: number[],
  transitionName: string,
  transitionDur: number,
  outputPath: string,
): Promise<void> {
  if (normalizedPaths.length === 1) {
    // Single segment — just copy
    await fsp.copyFile(normalizedPaths[0], outputPath);
    return;
  }

  // Build filter_complex string with chained xfade filters
  const filterParts: string[] = [];
  let prevLabel = '[0:v]';
  let cumulativeDur = segDurations[0];

  for (let i = 1; i < normalizedPaths.length; i++) {
    const offset = Math.max(0, cumulativeDur - transitionDur);
    const outLabel = i === normalizedPaths.length - 1 ? '[vout]' : `[v${i}]`;

    filterParts.push(
      `${prevLabel}[${i}:v]xfade=transition=${transitionName}:duration=${transitionDur}:offset=${offset.toFixed(3)}${outLabel}`,
    );

    prevLabel = outLabel;
    cumulativeDur = offset + segDurations[i];
  }

  // Build audio concat filter: concat all audio streams
  const audioInputs = normalizedPaths.map((_, i) => `[${i}:a]`).join('');
  filterParts.push(
    `${audioInputs}concat=n=${normalizedPaths.length}:v=0:a=1[aout]`,
  );

  const filterComplex = filterParts.join(';');

  // Build ffmpeg args
  const args: string[] = [];
  for (const p of normalizedPaths) {
    args.push('-i', p);
  }
  args.push(
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-y',
    outputPath,
  );

  await execFileAsync('ffmpeg', args, { timeout: 300_000 });
}

/**
 * Concat segments with simple concat demuxer (no transitions).
 */
async function concatSimple(
  normalizedPaths: string[],
  outputPath: string,
  tempDir: string,
): Promise<void> {
  const concatListPath = path.join(tempDir, 'concat.txt');
  const concatContent = normalizedPaths
    .map((p) => `file '${p.replace(/\\/g, '/')}'`)
    .join('\n');
  await fsp.writeFile(concatListPath, concatContent, 'utf-8');

  const command = ffmpeg()
    .input(concatListPath)
    .inputOptions(['-f', 'concat', '-safe', '0'])
    .outputOptions(['-c', 'copy'])
    .output(outputPath);

  await runFfmpeg(command);
}

/**
 * Compose a final video from normalized segments + optional music.
 * Returns the path to the output mp4 file.
 */
export async function composeVideo(
  timeline: LocalTimeline,
  tempDir: string,
): Promise<string> {
  const { width, height } = FORMAT_RESOLUTIONS[timeline.format] ?? FORMAT_RESOLUTIONS['9:16'];
  const transition = STYLE_TRANSITIONS[timeline.style] ?? STYLE_TRANSITIONS['dynamic'];

  // Step 1: Normalize each segment
  const normalizedPaths: string[] = [];
  const segDurations: number[] = [];

  for (let i = 0; i < timeline.segments.length; i++) {
    const seg = timeline.segments[i];
    const outPath = path.join(tempDir, `segment_${i}.mp4`);

    await normalizeSegment(
      seg.localPath,
      outPath,
      seg.startSec,
      seg.endSec,
      width,
      height,
    );

    normalizedPaths.push(outPath);

    // Get actual duration from ffprobe (more reliable than endSec-startSec)
    const actualDur = await getVideoDuration(outPath);
    segDurations.push(actualDur);
  }

  // Step 2: Concat with transitions or simple concat
  const concatOutputPath = path.join(tempDir, 'concat.mp4');

  if (normalizedPaths.length > 1 && transition.duration > 0) {
    await concatWithTransitions(
      normalizedPaths,
      segDurations,
      transition.xfade,
      transition.duration,
      concatOutputPath,
    );
  } else {
    await concatSimple(normalizedPaths, concatOutputPath, tempDir);
  }

  // Step 3: Trim to target duration
  const trimmedPath = path.join(tempDir, 'trimmed.mp4');

  const trimCommand = ffmpeg(concatOutputPath)
    .setDuration(timeline.totalDuration)
    .outputOptions(['-c', 'copy'])
    .output(trimmedPath);

  await runFfmpeg(trimCommand);

  // Step 4: Overlay music if available
  const outputPath = path.join(tempDir, 'output.mp4');

  if (timeline.musicPath && fs.existsSync(timeline.musicPath)) {
    const musicCommand = ffmpeg()
      .input(trimmedPath)
      .input(timeline.musicPath)
      .outputOptions([
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-shortest',
      ])
      .output(outputPath);

    await runFfmpeg(musicCommand);
  } else {
    // No music — just rename trimmed file
    await fsp.rename(trimmedPath, outputPath);
  }

  return outputPath;
}
