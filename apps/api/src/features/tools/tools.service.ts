import Anthropic from '@anthropic-ai/sdk';
import { withRetry, withTimeout } from '../../lib/resilience';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function stripCodeFences(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

export interface HashtagResult {
  highVolume: string[];
  medium: string[];
  niche: string[];
}

export async function generateHashtags(topic: string): Promise<HashtagResult> {
  return withRetry(
    () =>
      withTimeout(async () => {
        const response = await getClient().messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: `Generate 30 optimized Instagram hashtags for this topic/niche: "${topic}"

Categorize them into 3 groups of exactly 10:
- highVolume: popular hashtags with high reach (100K+ posts)
- medium: mid-range hashtags (10K-100K posts)
- niche: specific hashtags for targeted reach (<10K posts)

Each hashtag must start with #. Return ONLY valid JSON:
{"highVolume": ["#tag1", ...], "medium": ["#tag1", ...], "niche": ["#tag1", ...]}`,
            },
          ],
        });

        const raw = response.content[0].type === 'text' ? response.content[0].text : '';
        const parsed = JSON.parse(stripCodeFences(raw)) as HashtagResult;

        // Ensure exactly 10 per category
        parsed.highVolume = parsed.highVolume.slice(0, 10);
        parsed.medium = parsed.medium.slice(0, 10);
        parsed.niche = parsed.niche.slice(0, 10);

        return parsed;
      }, 15000),
    { maxRetries: 1, backoffMs: 1000 },
  );
}

export async function generateCaptions(
  topic: string,
  tone: string,
  platform: string,
): Promise<{ captions: string[] }> {
  return withRetry(
    () =>
      withTimeout(async () => {
        const response = await getClient().messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Generate 5 caption variations for a ${platform} post about: "${topic}"

Tone: ${tone}
Platform: ${platform}

Each caption should:
- Be optimized for ${platform} engagement
- Include relevant emojis
- End with a call-to-action
- Be adapted to the "${tone}" tone

Return ONLY valid JSON: {"captions": ["caption1", "caption2", "caption3", "caption4", "caption5"]}`,
            },
          ],
        });

        const raw = response.content[0].type === 'text' ? response.content[0].text : '';
        const parsed = JSON.parse(stripCodeFences(raw)) as { captions: string[] };
        parsed.captions = parsed.captions.slice(0, 5);
        return parsed;
      }, 15000),
    { maxRetries: 1, backoffMs: 1000 },
  );
}

export interface TimeSlot {
  day: number;
  hour: number;
  score: number;
}

export async function generateBestTimes(
  platform: string,
  niche: string,
): Promise<{ slots: TimeSlot[] }> {
  return withRetry(
    () =>
      withTimeout(async () => {
        const response = await getClient().messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Recommend the best times to post on ${platform} for the "${niche}" niche.

Return a weekly schedule as a JSON array of time slots. Each slot has:
- day: 0-6 (Monday=0, Sunday=6)
- hour: 0-8 (mapping to 6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h, 22h)
- score: 0-100 (higher = better time to post)

Include 15-25 slots with the best times. Return ONLY valid JSON:
{"slots": [{"day": 0, "hour": 3, "score": 85}, ...]}`,
            },
          ],
        });

        const raw = response.content[0].type === 'text' ? response.content[0].text : '';
        const parsed = JSON.parse(stripCodeFences(raw)) as { slots: TimeSlot[] };

        // Clamp scores
        parsed.slots = parsed.slots.map((s) => ({
          day: Math.max(0, Math.min(6, s.day)),
          hour: Math.max(0, Math.min(8, s.hour)),
          score: Math.max(0, Math.min(100, s.score)),
        }));

        return parsed;
      }, 15000),
    { maxRetries: 1, backoffMs: 1000 },
  );
}
