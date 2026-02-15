import { fal } from '@fal-ai/client';
import { withRetry, withTimeout } from '../lib/resilience';
import { AppError } from '../lib/errors';
import { logCost } from './costTracker';

let configured = false;

function ensureConfigured(): void {
  if (!configured) {
    fal.config({ credentials: process.env.FAL_AI_API_KEY });
    configured = true;
  }
}

export interface ImageResult {
  imageUrl: string;
  costUsd: number;
}

export async function generateImage(
  userId: string,
  prompt: string,
): Promise<ImageResult> {
  ensureConfigured();

  const result = await withRetry(
    () =>
      withTimeout(async () => {
        const response = await fal.subscribe('fal-ai/flux/dev', {
          input: { prompt },
        });

        const data = response.data as Record<string, unknown> | undefined;
        const images = Array.isArray(data?.images) ? data.images : [];
        const firstImage = images[0] as Record<string, unknown> | undefined;
        const imageUrl = typeof firstImage?.url === 'string' ? firstImage.url : '';

        if (!imageUrl) {
          throw new AppError('EXTERNAL_API_ERROR', 'Fal.ai returned no image URL', 502);
        }

        // Flux image generation pricing: ~$0.025 per image
        const costUsd = 0.025;
        await logCost(userId, 'fal', 'flux-image', costUsd);

        return { imageUrl, costUsd };
      }, 30000),
    { maxRetries: 2, backoffMs: 2000 },
  );

  return result;
}

export interface WhisperXWord {
  word: string;
  start: number;
  end: number;
  score: number;
}

export interface WhisperXSegment {
  text: string;
  start: number;
  end: number;
  words: WhisperXWord[];
}

export interface WhisperXResult {
  segments: WhisperXSegment[];
  language: string;
}

export async function transcribeAudio(
  userId: string,
  audioUrl: string,
): Promise<WhisperXResult> {
  ensureConfigured();

  const result = await withRetry(
    () =>
      withTimeout(async () => {
        const response = await fal.subscribe('fal-ai/whisper', {
          input: {
            audio_url: audioUrl,
            task: 'transcribe',
            chunk_level: 'segment',
            version: '3',
          },
        });

        const data = response.data as Record<string, unknown> | undefined;
        const chunks = Array.isArray(data?.chunks) ? data.chunks : [];
        const language = typeof data?.language === 'string' ? data.language : 'unknown';

        const segments: WhisperXSegment[] = chunks.map(
          (chunk: Record<string, unknown>) => {
            const timestamp = Array.isArray(chunk.timestamp) ? chunk.timestamp : [];
            const rawWords = Array.isArray(chunk.words) ? chunk.words : [];

            return {
              text: typeof chunk.text === 'string' ? chunk.text : '',
              start: typeof timestamp[0] === 'number' ? timestamp[0] : 0,
              end: typeof timestamp[1] === 'number' ? timestamp[1] : 0,
              words: rawWords.map((w: Record<string, unknown>) => ({
                word: typeof w.word === 'string' ? w.word : '',
                start: typeof w.start === 'number' ? w.start : 0,
                end: typeof w.end === 'number' ? w.end : 0,
                score: typeof w.score === 'number' ? w.score : 0,
              })),
            };
          },
        );

        // ~$0.01 per minute of audio (flat estimate per call)
        const costUsd = 0.01;
        await logCost(userId, 'fal', 'whisperx', costUsd);

        return { segments, language };
      }, 120_000),
    { maxRetries: 2, backoffMs: 2000 },
  );

  return result;
}

export interface MusicResult {
  musicUrl: string;
  costUsd: number;
}

export async function generateMusic(
  userId: string,
  mood: string,
  durationSec: number,
): Promise<MusicResult> {
  ensureConfigured();

  const result = await withRetry(
    () =>
      withTimeout(async () => {
        const response = await fal.subscribe('cassetteai/music-generator', {
          input: {
            prompt: `${mood} background music for social media content`,
            duration: durationSec,
          },
        });

        const data = response.data as Record<string, unknown> | undefined;
        const musicUrl = typeof data?.audio_url === 'string' ? data.audio_url : '';

        // CassetteAI pricing: ~$0.01 per generation (hardcoded — update if pricing changes)
        const costUsd = 0.01;
        await logCost(userId, 'fal', 'cassetteai', costUsd);

        return { musicUrl, costUsd };
      }, 60000),
    { maxRetries: 2, backoffMs: 2000 },
  );

  return result;
}
