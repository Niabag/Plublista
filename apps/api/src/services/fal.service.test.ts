import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();

vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: mockSubscribe,
  },
}));

vi.mock('../lib/resilience', () => ({
  withRetry: vi.fn().mockImplementation((fn) => fn()),
  withTimeout: vi.fn().mockImplementation((fn) => fn()),
}));

vi.mock('./costTracker', () => ({
  logCost: vi.fn().mockResolvedValue(undefined),
}));

describe('fal.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FAL_AI_API_KEY = 'test-key';
  });

  describe('transcribeAudio', () => {
    it('parses whisper response with segments', async () => {
      mockSubscribe.mockResolvedValue({
        data: {
          chunks: [
            {
              text: 'Hello everyone',
              timestamp: [0.0, 2.5],
              words: [
                { word: 'Hello', start: 0.0, end: 0.8, score: 0.95 },
                { word: 'everyone', start: 0.9, end: 2.5, score: 0.92 },
              ],
            },
            {
              text: 'Welcome to the show',
              timestamp: [3.0, 5.5],
              words: [],
            },
          ],
          language: 'en',
        },
      });

      const { transcribeAudio } = await import('./fal.service');
      const result = await transcribeAudio('user-1', 'https://r2.example.com/clip.mp4');

      expect(result.language).toBe('en');
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]).toEqual({
        text: 'Hello everyone',
        start: 0.0,
        end: 2.5,
        words: [
          { word: 'Hello', start: 0.0, end: 0.8, score: 0.95 },
          { word: 'everyone', start: 0.9, end: 2.5, score: 0.92 },
        ],
      });
      expect(result.segments[1].words).toEqual([]);
    });

    it('handles empty chunks gracefully', async () => {
      mockSubscribe.mockResolvedValue({
        data: { chunks: [], language: 'unknown' },
      });

      const { transcribeAudio } = await import('./fal.service');
      const result = await transcribeAudio('user-1', 'https://r2.example.com/silent.mp4');

      expect(result.segments).toEqual([]);
      expect(result.language).toBe('unknown');
    });

    it('handles missing data fields defensively', async () => {
      mockSubscribe.mockResolvedValue({ data: {} });

      const { transcribeAudio } = await import('./fal.service');
      const result = await transcribeAudio('user-1', 'https://r2.example.com/clip.mp4');

      expect(result.segments).toEqual([]);
      expect(result.language).toBe('unknown');
    });

    it('tracks cost via logCost', async () => {
      mockSubscribe.mockResolvedValue({
        data: { chunks: [], language: 'en' },
      });

      const { transcribeAudio } = await import('./fal.service');
      const { logCost } = await import('./costTracker');

      await transcribeAudio('user-1', 'https://r2.example.com/clip.mp4');

      expect(logCost).toHaveBeenCalledWith('user-1', 'fal', 'whisperx', 0.01);
    });
  });

  describe('generateImage', () => {
    it('returns image URL on success', async () => {
      mockSubscribe.mockResolvedValue({
        data: {
          images: [{ url: 'https://fal.ai/output/image.webp' }],
        },
      });

      const { generateImage } = await import('./fal.service');
      const result = await generateImage('user-1', 'a beautiful sunset');

      expect(result.imageUrl).toBe('https://fal.ai/output/image.webp');
      expect(result.costUsd).toBe(0.025);
    });

    it('throws when no image URL returned', async () => {
      mockSubscribe.mockResolvedValue({ data: { images: [] } });

      const { generateImage } = await import('./fal.service');
      await expect(generateImage('user-1', 'test')).rejects.toThrow('Fal.ai returned no image URL');
    });
  });

  describe('generateMusic', () => {
    it('returns music URL on success', async () => {
      mockSubscribe.mockResolvedValue({
        data: { audio_url: 'https://fal.ai/output/music.mp3' },
      });

      const { generateMusic } = await import('./fal.service');
      const result = await generateMusic('user-1', 'upbeat', 30);

      expect(result.musicUrl).toBe('https://fal.ai/output/music.mp3');
      expect(result.costUsd).toBe(0.01);
    });
  });
});
