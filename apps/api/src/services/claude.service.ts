import Anthropic from '@anthropic-ai/sdk';
import { withRetry, withTimeout } from '../lib/resilience';
import { AppError } from '../lib/errors';
import { logCost } from './costTracker';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export interface ClipAnalysis {
  hookClip: string;
  bestMoments: Array<{ clipUrl: string; startSec: number; endSec: number; score: number }>;
  qualityScores: Array<{ clipUrl: string; score: number }>;
}

export async function analyzeClips(
  userId: string,
  clipUrls: string[],
  style: string,
): Promise<ClipAnalysis> {
  const result = await withRetry(
    () =>
      withTimeout(async () => {
        const response = await getClient().messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Analyze these video clips for an auto-montage in "${style}" style.
Clip URLs: ${clipUrls.join(', ')}

Return a JSON object with:
- hookClip: URL of the clip with the best hook potential (first 1.7s)
- bestMoments: array of {clipUrl, startSec, endSec, score} for the best segments
- qualityScores: array of {clipUrl, score} rating each clip 0-100

Respond with ONLY valid JSON, no markdown.`,
            },
          ],
        });

        if (!response.content.length) {
          throw new AppError('EXTERNAL_API_ERROR', 'Claude returned empty response', 502);
        }

        const text =
          response.content[0].type === 'text' ? response.content[0].text : '';

        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new AppError('EXTERNAL_API_ERROR', 'Claude returned invalid JSON', 502);
        }

        const obj = parsed as Record<string, unknown>;
        if (
          typeof obj?.hookClip !== 'string' ||
          !Array.isArray(obj?.bestMoments) ||
          !Array.isArray(obj?.qualityScores)
        ) {
          throw new AppError('EXTERNAL_API_ERROR', 'Claude returned unexpected response structure', 502);
        }

        const analysis = parsed as ClipAnalysis;

        // Estimate cost: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const estimatedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

        await logCost(userId, 'claude', 'messages', estimatedCost);

        return analysis;
      }, 30000),
    { maxRetries: 2, backoffMs: 1000 },
  );

  return result;
}

export interface GeneratedCopy {
  caption: string;
  hashtags: string[];
  hookText: string;
  ctaText: string;
}

export async function generateCopy(
  userId: string,
  contentType: string,
  style: string,
  clipAnalysis?: ClipAnalysis,
): Promise<GeneratedCopy> {
  const clipContext = clipAnalysis
    ? `\nContext: The video features a hook from "${clipAnalysis.hookClip}" with ${clipAnalysis.bestMoments.length} key segments.`
    : '';

  const result = await withRetry(
    () =>
      withTimeout(async () => {
        const response = await getClient().messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Generate social media copy for a ${contentType} in "${style}" style.${clipContext}

Return ONLY valid JSON with these exact fields:
- caption: engaging caption for Instagram (max 2200 characters)
- hashtags: array of 3-5 relevant hashtag words (without # prefix)
- hookText: attention-grabbing text for the first frame (max 50 characters)
- ctaText: clear call-to-action text (max 80 characters)

Respond with ONLY valid JSON, no markdown.`,
            },
          ],
        });

        if (!response.content.length) {
          throw new AppError('EXTERNAL_API_ERROR', 'Claude returned empty response', 502);
        }

        const text =
          response.content[0].type === 'text' ? response.content[0].text : '';

        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new AppError('EXTERNAL_API_ERROR', 'Claude returned invalid JSON for copy', 502);
        }

        const obj = parsed as Record<string, unknown>;
        if (
          typeof obj?.caption !== 'string' ||
          !Array.isArray(obj?.hashtags) ||
          typeof obj?.hookText !== 'string' ||
          typeof obj?.ctaText !== 'string'
        ) {
          throw new AppError('EXTERNAL_API_ERROR', 'Claude returned unexpected copy structure', 502);
        }

        const copy = parsed as GeneratedCopy;

        // Enforce max lengths
        copy.caption = copy.caption.slice(0, 2200);
        copy.hookText = copy.hookText.slice(0, 50);
        copy.ctaText = copy.ctaText.slice(0, 80);

        // Sanitize hashtags: strip #, filter invalid, limit count
        copy.hashtags = copy.hashtags
          .filter((h): h is string => typeof h === 'string')
          .map((h) => h.replace(/^#/, '').trim())
          .filter((h) => h.length > 0)
          .slice(0, 5);

        // Estimate cost: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const estimatedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

        await logCost(userId, 'claude', 'messages', estimatedCost);

        return copy;
      }, 10000),
    { maxRetries: 2, backoffMs: 1000 },
  );

  return result;
}
