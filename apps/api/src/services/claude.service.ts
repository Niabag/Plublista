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

/** Strip markdown code fences (```json ... ```) that Claude may wrap around JSON. */
function stripCodeFences(text: string): string {
  // Match closed fences first
  const closed = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (closed) return closed[1].trim();
  // Handle unclosed fences (truncated response)
  const open = text.match(/```(?:json)?\s*([\s\S]*)/);
  if (open) return open[1].trim();
  return text.trim();
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
  context?: {
    narrative?: string;
    transcript?: string;
    suggestedMood?: string;
  },
): Promise<GeneratedCopy> {
  const contextParts: string[] = [];
  if (context?.narrative) contextParts.push(`Narrative: ${context.narrative}`);
  if (context?.transcript) contextParts.push(`Transcript excerpt: ${context.transcript.slice(0, 500)}`);
  if (context?.suggestedMood) contextParts.push(`Mood: ${context.suggestedMood}`);
  const contextBlock = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join('\n')}` : '';

  const result = await withRetry(
    () =>
      withTimeout(async () => {
        const response = await getClient().messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Generate social media copy for a ${contentType} in "${style}" style.${contextBlock}

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

        const raw =
          response.content[0].type === 'text' ? response.content[0].text : '';
        const text = stripCodeFences(raw);

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
