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
        const response = await fal.subscribe('cassetteai/music-gen', {
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
