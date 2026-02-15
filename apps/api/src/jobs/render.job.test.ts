import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies
vi.mock('../config/redis', () => ({
  getRedisConfig: vi.fn().mockReturnValue({ host: 'localhost', port: 6379, maxRetriesPerRequest: null }),
}));

vi.mock('../db/index', () => ({
  db: {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../db/schema/index', () => ({
  contentItems: { id: 'id', status: 'status' },
}));

const mockAnalysis = {
  hookClip: 'clip1.mp4',
  bestMoments: [
    { clipUrl: 'clip1.mp4', startSec: 0, endSec: 3, score: 95 },
    { clipUrl: 'clip2.mp4', startSec: 1, endSec: 5, score: 80 },
  ],
  qualityScores: [
    { clipUrl: 'clip1.mp4', score: 90 },
    { clipUrl: 'clip2.mp4', score: 75 },
  ],
};

const mockCopy = {
  caption: 'Check out this amazing reel!',
  hashtags: ['content', 'reel', 'viral'],
  hookText: 'Wait for it...',
  ctaText: 'Follow for more!',
};

vi.mock('../services/claude.service', () => ({
  analyzeClips: vi.fn().mockResolvedValue(mockAnalysis),
  generateCopy: vi.fn().mockResolvedValue(mockCopy),
}));

vi.mock('../services/fal.service', () => ({
  generateMusic: vi.fn().mockResolvedValue({ musicUrl: 'https://music.example.com/track.mp3', costUsd: 0.01 }),
}));

vi.mock('../services/r2.service', () => ({
  buildFileKey: vi.fn().mockReturnValue('users/user-1/renders/render.mp4'),
  downloadBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-clip-data')),
  uploadBuffer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/ffmpeg.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/ffmpeg.service')>();
  return {
    ...actual,
    composeVideo: vi.fn().mockImplementation(async (_timeline: unknown, tempDir: string) => {
      const fsp = (await import('node:fs/promises')).default;
      const path = (await import('node:path')).default;
      const outputPath = path.join(tempDir, 'output.mp4');
      await fsp.writeFile(outputPath, Buffer.from('fake-rendered-video'));
      return outputPath;
    }),
  };
});

vi.mock('../services/quota.service', () => ({
  restoreCredits: vi.fn().mockResolvedValue(undefined),
}));

// Mock global fetch (used for music download)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

// Mock BullMQ Worker to avoid real Redis connection
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    close: vi.fn(),
  })),
}));

describe('render.job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start render worker without errors', async () => {
    const { startRenderWorker } = await import('./render.job');
    const worker = startRenderWorker();
    expect(worker).toBeDefined();
  });

  it('should call analyzeClips, generateCopy, and generateMusic in pipeline', async () => {
    const { analyzeClips, generateCopy } = await import('../services/claude.service');
    const { generateMusic } = await import('../services/fal.service');
    const { processRenderJob } = await import('./render.job');

    await processRenderJob({
      userId: 'user-1',
      contentItemId: 'content-1',
      contentType: 'reel',
      clipUrls: ['clip1.mp4', 'clip2.mp4'],
      style: 'dynamic',
      format: '9:16',
      duration: 30,
      musicPrompt: 'upbeat energetic',
    });

    expect(analyzeClips).toHaveBeenCalledWith('user-1', ['clip1.mp4', 'clip2.mp4'], 'dynamic');
    expect(generateMusic).toHaveBeenCalledWith('user-1', 'upbeat energetic', 30);
    expect(generateCopy).toHaveBeenCalledWith('user-1', 'reel', 'dynamic', mockAnalysis);
  });

  it('should continue pipeline when generateCopy fails (graceful degradation)', async () => {
    const { generateCopy } = await import('../services/claude.service');
    const { db } = await import('../db/index');
    const { processRenderJob } = await import('./render.job');

    // Make generateCopy throw for this call
    (generateCopy as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Claude API unavailable'));

    // Pipeline should complete despite copy failure
    await processRenderJob({
      userId: 'user-1',
      contentItemId: 'content-1',
      contentType: 'reel',
      clipUrls: ['clip1.mp4', 'clip2.mp4'],
      style: 'dynamic',
      format: '9:16',
      duration: 30,
      musicPrompt: 'upbeat energetic',
    });

    // Verify DB update was called with null copy fields (graceful fallback)
    expect(db.update).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db as any).set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        caption: null,
        hashtags: [],
        hookText: null,
        ctaText: null,
      }),
    );
  });
});
