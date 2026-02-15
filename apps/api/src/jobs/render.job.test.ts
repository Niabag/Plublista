import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock filesystem operations
vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('fake-rendered-video')),
  },
}));

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

const mockNarrative = {
  orderedSegments: [
    { clipIndex: 0, startSec: 0, endSec: 5, narrativeRole: 'hook', energyLevel: 'high', transcriptExcerpt: 'Hello' },
    { clipIndex: 1, startSec: 2, endSec: 8, narrativeRole: 'development', energyLevel: 'medium', transcriptExcerpt: 'World' },
  ],
  overallNarrative: 'An exciting montage',
  suggestedMood: 'upbeat',
};

const mockCopy = {
  caption: 'Check out this amazing reel!',
  hashtags: ['content', 'reel', 'viral'],
  hookText: 'Wait for it...',
  ctaText: 'Follow for more!',
};

const mockTranscript = {
  segments: [{ text: 'Hello world', start: 0, end: 2, words: [] }],
  language: 'en',
};

vi.mock('../services/gemini.service', () => ({
  analyzeVideoNarrative: vi.fn().mockResolvedValue(mockNarrative),
}));

vi.mock('../services/claude.service', () => ({
  generateCopy: vi.fn().mockResolvedValue(mockCopy),
}));

vi.mock('../services/fal.service', () => ({
  transcribeAudio: vi.fn().mockResolvedValue(mockTranscript),
  generateMusic: vi.fn().mockResolvedValue({ musicUrl: 'https://music.example.com/track.mp3', costUsd: 0.01 }),
}));

vi.mock('../services/r2.service', () => ({
  buildFileKey: vi.fn().mockReturnValue('users/user-1/renders/render.mp4'),
  downloadBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-clip-data')),
  uploadBuffer: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://presigned.example.com/clip'),
}));

vi.mock('../services/ffmpeg.service', () => ({
  createTempDir: vi.fn().mockResolvedValue('/tmp/publista-render/content-1'),
  cleanupTempDir: vi.fn().mockResolvedValue(undefined),
  getVideoDuration: vi.fn().mockResolvedValue(10),
  getNativeFramerate: vi.fn().mockResolvedValue(29.97),
  detectSilence: vi.fn().mockResolvedValue([{ startSec: 5, endSec: 6 }]),
  getRmsProfile: vi.fn().mockResolvedValue([{ timeSec: 0, rmsDb: -20 }]),
  selectTransition: vi.fn().mockReturnValue({ xfade: 'slideleft', duration: 0.4 }),
  composeVideoV2: vi.fn().mockImplementation(async (_timeline: unknown, tempDir: string) => {
    return tempDir + '/output.mp4';
  }),
}));

vi.mock('../services/quota.service', () => ({
  restoreCredits: vi.fn().mockResolvedValue(undefined),
}));

// Mock global fetch (used for music download)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

// Mock BullMQ Worker
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

const testData = {
  userId: 'user-1',
  contentItemId: 'content-1',
  contentType: 'reel',
  clipUrls: ['clip1.mp4', 'clip2.mp4'],
  style: 'dynamic',
  format: '9:16',
  duration: 30,
  musicPrompt: 'upbeat energetic',
};

describe('render.job v2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start render worker without errors', async () => {
    const { startRenderWorker } = await import('./render.job');
    const worker = startRenderWorker();
    expect(worker).toBeDefined();
  });

  it('runs full v2 pipeline: transcribe → gemini → timeline → render → upload → cleanup rushes', async () => {
    const { processRenderJob } = await import('./render.job');
    const { analyzeVideoNarrative } = await import('../services/gemini.service');
    const { transcribeAudio } = await import('../services/fal.service');
    const { composeVideoV2 } = await import('../services/ffmpeg.service');
    const { uploadBuffer, deleteFile } = await import('../services/r2.service');
    const { generateCopy } = await import('../services/claude.service');

    await processRenderJob(testData);

    // Step 1: Transcription called for each clip
    expect(transcribeAudio).toHaveBeenCalledTimes(2);

    // Step 2: Gemini narrative analysis
    expect(analyzeVideoNarrative).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ index: 0 }),
        expect.objectContaining({ index: 1 }),
      ]),
      expect.any(Array), // transcripts
      expect.any(Array), // silences
      expect.any(Array), // rmsProfiles
      'dynamic',
      30,
    );

    // Step 4: FFmpeg render
    expect(composeVideoV2).toHaveBeenCalled();

    // Step 5a: Upload
    expect(uploadBuffer).toHaveBeenCalled();

    // Step 5b: Rush deletion
    expect(deleteFile).toHaveBeenCalledWith('clip1.mp4');
    expect(deleteFile).toHaveBeenCalledWith('clip2.mp4');

    // Step 5c: Copy generation with transcript context
    expect(generateCopy).toHaveBeenCalledWith(
      'user-1', 'reel', 'dynamic',
      expect.objectContaining({
        narrative: 'An exciting montage',
        suggestedMood: 'upbeat',
      }),
    );
  });

  it('continues when transcription fails (graceful degradation)', async () => {
    const { transcribeAudio } = await import('../services/fal.service');
    (transcribeAudio as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Whisper API timeout'));

    const { processRenderJob } = await import('./render.job');
    const { analyzeVideoNarrative } = await import('../services/gemini.service');

    // Pipeline should complete despite transcription failure
    await processRenderJob(testData);

    // Gemini should still be called (with empty transcripts)
    expect(analyzeVideoNarrative).toHaveBeenCalled();
  });

  it('continues when copy generation fails (graceful degradation)', async () => {
    const { generateCopy } = await import('../services/claude.service');
    (generateCopy as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Claude unavailable'));

    const { processRenderJob } = await import('./render.job');
    const { db } = await import('../db/index');

    await processRenderJob(testData);

    // DB update should have null copy fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db as any).set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        caption: null,
        hashtags: [],
        hookText: null,
        ctaText: null,
        mediaUrls: [], // rushes cleared
      }),
    );
  });

  it('continues when music generation fails (graceful degradation)', async () => {
    const { generateMusic } = await import('../services/fal.service');
    (generateMusic as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Music API down'));

    const { processRenderJob } = await import('./render.job');
    const { composeVideoV2 } = await import('../services/ffmpeg.service');

    await processRenderJob(testData);

    // Render should still be called (with null musicPath)
    expect(composeVideoV2).toHaveBeenCalledWith(
      expect.objectContaining({ musicPath: null }),
      expect.any(String),
    );
  });

  it('sets mediaUrls to empty array after rush deletion', async () => {
    const { processRenderJob } = await import('./render.job');
    const { db } = await import('../db/index');

    await processRenderJob(testData);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db as any).set).toHaveBeenCalledWith(
      expect.objectContaining({ mediaUrls: [] }),
    );
  });

  it('cleans up temp directory even on failure', async () => {
    const { analyzeVideoNarrative } = await import('../services/gemini.service');
    (analyzeVideoNarrative as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Gemini failed'));

    const { processRenderJob } = await import('./render.job');
    const { cleanupTempDir } = await import('../services/ffmpeg.service');

    await expect(processRenderJob(testData)).rejects.toThrow('Gemini failed');

    // Temp dir should still be cleaned up
    expect(cleanupTempDir).toHaveBeenCalled();
  });
});
