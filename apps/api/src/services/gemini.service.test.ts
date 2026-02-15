import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateContent = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

vi.mock('@google/generative-ai/server', () => ({
  GoogleAIFileManager: vi.fn().mockImplementation(() => ({
    uploadFile: vi.fn(),
    getFile: vi.fn(),
    deleteFile: mockDeleteFile,
  })),
  FileState: { PROCESSING: 'PROCESSING', ACTIVE: 'ACTIVE', FAILED: 'FAILED' },
}));

vi.mock('../lib/resilience', () => ({
  withRetry: vi.fn().mockImplementation((fn) => fn()),
  withTimeout: vi.fn().mockImplementation((fn) => fn()),
}));

vi.mock('./costTracker', () => ({
  logCost: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs', () => ({
  default: {
    statSync: vi.fn().mockReturnValue({ size: 1024 }), // small file → inline
    readFileSync: vi.fn().mockReturnValue(Buffer.from('fake-video')),
  },
}));

const validNarrative = {
  orderedSegments: [
    {
      clipIndex: 0,
      startSec: 0,
      endSec: 5,
      narrativeRole: 'hook',
      energyLevel: 'high',
      transcriptExcerpt: 'Welcome everyone',
    },
    {
      clipIndex: 1,
      startSec: 2,
      endSec: 8,
      narrativeRole: 'development',
      energyLevel: 'medium',
      transcriptExcerpt: 'Let me show you',
    },
  ],
  overallNarrative: 'An exciting showcase of the product',
  suggestedMood: 'upbeat energetic',
};

describe('gemini.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env var for the service
    process.env.GOOGLE_AI_API_KEY = 'test-key';
  });

  describe('analyzeVideoNarrative', () => {
    it('returns parsed narrative analysis on success', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(validNarrative),
          usageMetadata: { promptTokenCount: 5000, candidatesTokenCount: 500 },
        },
      });

      const { analyzeVideoNarrative } = await import('./gemini.service');
      const result = await analyzeVideoNarrative(
        'user-1',
        [
          { localPath: '/tmp/clip0.mp4', index: 0, durationSec: 10 },
          { localPath: '/tmp/clip1.mp4', index: 1, durationSec: 15 },
        ],
        [
          { clipIndex: 0, segments: [{ text: 'Welcome everyone', start: 0, end: 2 }] },
          { clipIndex: 1, segments: [{ text: 'Let me show you', start: 1, end: 4 }] },
        ],
        [
          { clipIndex: 0, silences: [{ startSec: 5, endSec: 6 }] },
          { clipIndex: 1, silences: [] },
        ],
        [
          { clipIndex: 0, profile: [{ timeSec: 0, rmsDb: -20 }] },
          { clipIndex: 1, profile: [{ timeSec: 0, rmsDb: -15 }] },
        ],
        'dynamic',
        30,
      );

      expect(result.orderedSegments).toHaveLength(2);
      expect(result.overallNarrative).toBe('An exciting showcase of the product');
      expect(result.suggestedMood).toBe('upbeat energetic');
    });

    it('throws on invalid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'This is not valid JSON',
          usageMetadata: null,
        },
      });

      const { analyzeVideoNarrative } = await import('./gemini.service');
      await expect(
        analyzeVideoNarrative(
          'user-1',
          [{ localPath: '/tmp/clip.mp4', index: 0, durationSec: 10 }],
          [], [], [], 'dynamic', 30,
        ),
      ).rejects.toThrow('Gemini returned invalid JSON');
    });

    it('throws on empty segments', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({ orderedSegments: [], overallNarrative: '', suggestedMood: '' }),
          usageMetadata: null,
        },
      });

      const { analyzeVideoNarrative } = await import('./gemini.service');
      await expect(
        analyzeVideoNarrative(
          'user-1',
          [{ localPath: '/tmp/clip.mp4', index: 0, durationSec: 10 }],
          [], [], [], 'dynamic', 30,
        ),
      ).rejects.toThrow('Gemini returned empty segments');
    });

    it('tracks cost via logCost', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(validNarrative),
          usageMetadata: { promptTokenCount: 10000, candidatesTokenCount: 1000 },
        },
      });

      const { analyzeVideoNarrative } = await import('./gemini.service');
      const { logCost } = await import('./costTracker');

      await analyzeVideoNarrative(
        'user-1',
        [{ localPath: '/tmp/clip.mp4', index: 0, durationSec: 10 }],
        [], [], [], 'dynamic', 30,
      );

      expect(logCost).toHaveBeenCalledWith('user-1', 'gemini', 'video-analysis', expect.any(Number));
    });
  });
});
