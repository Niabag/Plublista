import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

vi.mock('../lib/resilience', () => ({
  withRetry: vi.fn().mockImplementation((fn) => fn()),
  withTimeout: vi.fn().mockImplementation((fn) => fn()),
}));

vi.mock('./costTracker', () => ({
  logCost: vi.fn().mockResolvedValue(undefined),
}));

describe('claude.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCopy', () => {
    it('generates copy with narrative context', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              caption: 'Amazing video!',
              hashtags: ['content', 'viral'],
              hookText: 'Wait for it',
              ctaText: 'Follow for more',
            }),
          },
        ],
        usage: { input_tokens: 500, output_tokens: 200 },
      });

      const { generateCopy } = await import('./claude.service');
      const result = await generateCopy('user-1', 'reel', 'dynamic', {
        narrative: 'An exciting journey through the city',
        transcript: 'Hello everyone, today we explore...',
        suggestedMood: 'upbeat',
      });

      expect(result.caption).toBe('Amazing video!');
      expect(result.hashtags).toEqual(['content', 'viral']);
      expect(result.hookText).toBe('Wait for it');
      expect(result.ctaText).toBe('Follow for more');

      // Verify context was included in prompt
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      expect(prompt).toContain('Narrative: An exciting journey through the city');
      expect(prompt).toContain('Transcript excerpt:');
      expect(prompt).toContain('Mood: upbeat');
    });

    it('generates copy without context (backward compatible)', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              caption: 'Check this out!',
              hashtags: ['cool'],
              hookText: 'Wow',
              ctaText: 'Like and share',
            }),
          },
        ],
        usage: { input_tokens: 300, output_tokens: 100 },
      });

      const { generateCopy } = await import('./claude.service');
      const result = await generateCopy('user-1', 'carousel', 'cinematic');

      expect(result.caption).toBe('Check this out!');

      // Verify no context block in prompt
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      expect(prompt).not.toContain('Narrative:');
      expect(prompt).not.toContain('Context:');
    });

    it('throws on invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json at all' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const { generateCopy } = await import('./claude.service');
      await expect(generateCopy('user-1', 'reel', 'dynamic')).rejects.toThrow(
        'Claude returned invalid JSON',
      );
    });

    it('sanitizes hashtags and enforces max lengths', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              caption: 'A'.repeat(3000), // exceeds 2200
              hashtags: ['#valid', 'also_valid', '', 123, 'extra1', 'extra2'],
              hookText: 'B'.repeat(100), // exceeds 50
              ctaText: 'C'.repeat(100), // exceeds 80
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 100 },
      });

      const { generateCopy } = await import('./claude.service');
      const result = await generateCopy('user-1', 'reel', 'dynamic');

      expect(result.caption.length).toBe(2200);
      expect(result.hookText.length).toBe(50);
      expect(result.ctaText.length).toBe(80);
      expect(result.hashtags).toEqual(['valid', 'also_valid', 'extra1', 'extra2']);
    });
  });
});
