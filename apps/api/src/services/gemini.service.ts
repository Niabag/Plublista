import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import fs from 'node:fs';
import { withRetry, withTimeout } from '../lib/resilience';
import { AppError } from '../lib/errors';
import { logCost } from './costTracker';

// --- Singleton clients (lazy init) ---

let client: GoogleGenerativeAI | null = null;
let fileManager: GoogleAIFileManager | null = null;

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new AppError('EXTERNAL_API_ERROR', 'GOOGLE_AI_API_KEY is not configured', 500);
  }
  return apiKey;
}

function getClient(): GoogleGenerativeAI {
  if (!client) client = new GoogleGenerativeAI(getApiKey());
  return client;
}

function getFileManager(): GoogleAIFileManager {
  if (!fileManager) fileManager = new GoogleAIFileManager(getApiKey());
  return fileManager;
}

// --- Interfaces ---

export interface NarrativeSegment {
  clipIndex: number;
  startSec: number;
  endSec: number;
  narrativeRole: 'hook' | 'development' | 'climax' | 'conclusion';
  energyLevel: 'low' | 'medium' | 'high';
  transcriptExcerpt: string;
}

export interface NarrativeAnalysis {
  orderedSegments: NarrativeSegment[];
  overallNarrative: string;
  suggestedMood: string;
}

export interface ClipInput {
  localPath: string;
  index: number;
  durationSec: number;
}

export interface TranscriptInput {
  clipIndex: number;
  segments: Array<{ text: string; start: number; end: number }>;
}

export interface SilenceInput {
  clipIndex: number;
  silences: Array<{ startSec: number; endSec: number }>;
}

export interface RmsInput {
  clipIndex: number;
  profile: Array<{ timeSec: number; rmsDb: number }>;
}

// --- Constants ---

const MAX_INLINE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const FILE_POLL_INTERVAL_MS = 2000;
const FILE_POLL_TIMEOUT_MS = 120_000;
const MODEL_NAME = 'gemini-2.5-pro';

// Gemini 2.5 Pro pricing (per million tokens)
const INPUT_COST_PER_M_TOKENS = 1.25;
const OUTPUT_COST_PER_M_TOKENS = 10.0;

// --- Helpers ---

async function prepareClipPart(
  clip: ClipInput,
): Promise<{ part: Part; uploadedFileName?: string }> {
  const stats = fs.statSync(clip.localPath);

  if (stats.size <= MAX_INLINE_SIZE_BYTES) {
    const data = fs.readFileSync(clip.localPath);
    return {
      part: {
        inlineData: {
          data: data.toString('base64'),
          mimeType: 'video/mp4',
        },
      },
    };
  }

  // Large file → upload via FileManager
  const fm = getFileManager();
  const uploadResult = await fm.uploadFile(clip.localPath, {
    mimeType: 'video/mp4',
    displayName: `clip-${clip.index}`,
  });

  // Poll until file is ACTIVE
  const deadline = Date.now() + FILE_POLL_TIMEOUT_MS;
  let file = uploadResult.file;
  while (file.state === FileState.PROCESSING) {
    if (Date.now() > deadline) {
      throw new AppError(
        'EXTERNAL_API_ERROR',
        `Gemini file processing timed out for clip ${clip.index}`,
        504,
      );
    }
    await new Promise((r) => setTimeout(r, FILE_POLL_INTERVAL_MS));
    file = await fm.getFile(file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new AppError(
      'EXTERNAL_API_ERROR',
      `Gemini file processing failed for clip ${clip.index}`,
      502,
    );
  }

  return {
    part: {
      fileData: {
        fileUri: file.uri,
        mimeType: file.mimeType,
      },
    },
    uploadedFileName: file.name,
  };
}

function buildPrompt(
  clips: ClipInput[],
  transcripts: TranscriptInput[],
  silences: SilenceInput[],
  rmsProfiles: RmsInput[],
  style: string,
  targetDuration: number,
): string {
  const transcriptText = transcripts
    .map((t) => {
      const lines = t.segments
        .map((s) => `  [${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.text}`)
        .join('\n');
      return `Clip ${t.clipIndex}:\n${lines || '  (no speech detected)'}`;
    })
    .join('\n\n');

  const silenceText = silences
    .map((s) => {
      const regions = s.silences
        .map((r) => `${r.startSec.toFixed(1)}-${r.endSec.toFixed(1)}s`)
        .join(', ');
      return `Clip ${s.clipIndex}: ${regions || 'no silence detected'}`;
    })
    .join('\n');

  const rmsText = rmsProfiles
    .map((r) => {
      const avgRms =
        r.profile.length > 0
          ? (r.profile.reduce((sum, p) => sum + p.rmsDb, 0) / r.profile.length).toFixed(1)
          : 'N/A';
      return `Clip ${r.clipIndex}: avg RMS = ${avgRms} dB`;
    })
    .join('\n');

  return `You are a professional video editor creating a ${style} social media montage.

## Available Clips
${clips.map((c) => `Clip ${c.index}: ${c.durationSec.toFixed(1)}s`).join('\n')}

## Transcriptions (word-level timestamps)
${transcriptText}

## Silence Regions (good cut points)
${silenceText}

## Audio Energy (RMS levels)
${rmsText}

## Instructions
Create a compelling ${style} montage targeting ${targetDuration}s total duration.

Rules:
- Select the most engaging segments from the clips
- Order segments to create a coherent narrative arc (hook → development → climax → conclusion)
- Prefer cutting at silence boundaries or between words (never mid-word)
- The startSec/endSec must be within the clip's actual duration
- Each segment should be at least 2 seconds long
- energyLevel should reflect the audio RMS: low (<-25dB), medium (-25 to -15dB), high (>-15dB)
- Segments can come from the same clip multiple times if needed
- Total segment durations should sum close to ${targetDuration}s (±10%)

Respond with ONLY valid JSON matching this schema:
{
  "orderedSegments": [
    {
      "clipIndex": number,
      "startSec": number,
      "endSec": number,
      "narrativeRole": "hook" | "development" | "climax" | "conclusion",
      "energyLevel": "low" | "medium" | "high",
      "transcriptExcerpt": "brief text from this segment"
    }
  ],
  "overallNarrative": "one-sentence description of the montage story",
  "suggestedMood": "one or two words describing the mood for background music"
}`;
}

function calculateCost(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * INPUT_COST_PER_M_TOKENS +
    (completionTokens / 1_000_000) * OUTPUT_COST_PER_M_TOKENS
  );
}

// --- Main function ---

export async function analyzeVideoNarrative(
  userId: string,
  clips: ClipInput[],
  transcripts: TranscriptInput[],
  silences: SilenceInput[],
  rmsProfiles: RmsInput[],
  style: string,
  targetDuration: number,
): Promise<NarrativeAnalysis> {
  const preparations = await Promise.all(clips.map((clip) => prepareClipPart(clip)));
  const uploadedFileNames = preparations
    .map((p) => p.uploadedFileName)
    .filter((name): name is string => !!name);

  try {
    const textPrompt = buildPrompt(
      clips,
      transcripts,
      silences,
      rmsProfiles,
      style,
      targetDuration,
    );

    const parts: Part[] = [];
    for (let i = 0; i < preparations.length; i++) {
      parts.push({ text: `[Clip ${clips[i].index}]` });
      parts.push(preparations[i].part);
    }
    parts.push({ text: textPrompt });

    const model = getClient().getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await withRetry(
      () =>
        withTimeout(async () => {
          return model.generateContent({ contents: [{ role: 'user', parts }] });
        }, 180_000),
      { maxRetries: 1, backoffMs: 5000 },
    );

    const responseText = result.response.text();
    let analysis: NarrativeAnalysis;
    try {
      analysis = JSON.parse(responseText) as NarrativeAnalysis;
    } catch {
      throw new AppError(
        'EXTERNAL_API_ERROR',
        'Gemini returned invalid JSON for narrative analysis',
        502,
      );
    }

    if (!Array.isArray(analysis.orderedSegments) || analysis.orderedSegments.length === 0) {
      throw new AppError('EXTERNAL_API_ERROR', 'Gemini returned empty segments', 502);
    }

    // Track cost from usage metadata
    const usage = result.response.usageMetadata;
    const costUsd = usage
      ? calculateCost(usage.promptTokenCount ?? 0, usage.candidatesTokenCount ?? 0)
      : 0.05; // fallback estimate
    await logCost(userId, 'gemini', 'video-analysis', costUsd);

    return analysis;
  } finally {
    // Best-effort cleanup of uploaded files
    if (uploadedFileNames.length > 0) {
      const fm = getFileManager();
      await Promise.allSettled(uploadedFileNames.map((name) => fm.deleteFile(name)));
    }
  }
}
