import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock('../config/redis', () => ({
  getRedisConfig: vi.fn().mockReturnValue({ host: 'localhost', port: 6379, maxRetriesPerRequest: null }),
}));

vi.mock('../db/index', () => ({
  db: {
    select: () => ({ from: mockFrom }),
    update: () => ({ set: mockSet }),
  },
}));

vi.mock('../db/schema/index', () => ({
  contentItems: {
    id: 'id',
    mediaUrls: 'media_urls',
    generatedMediaUrl: 'generated_media_url',
    updatedAt: 'updated_at',
  },
}));

vi.mock('../services/r2.service', () => ({
  deleteFile: mockDeleteFile,
}));

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

describe('cleanup.job', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Chain: db.select().from().where()
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdateWhere.mockResolvedValue(undefined);
  });

  it('deletes stale rushes and clears mediaUrls in DB', async () => {
    mockWhere.mockResolvedValue([
      {
        id: 'item-1',
        mediaUrls: ['users/u1/uploads/clip1.mp4', 'users/u1/uploads/clip2.mp4'],
      },
    ]);

    mockDeleteFile.mockResolvedValue(undefined);

    const { processCleanup } = await import('./cleanup.job');
    await processCleanup();

    // Both rush files should be deleted
    expect(mockDeleteFile).toHaveBeenCalledTimes(2);
    expect(mockDeleteFile).toHaveBeenCalledWith('users/u1/uploads/clip1.mp4');
    expect(mockDeleteFile).toHaveBeenCalledWith('users/u1/uploads/clip2.mp4');

    // DB should be updated to clear mediaUrls
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ mediaUrls: [] }),
    );
  });

  it('skips when no stale items found', async () => {
    mockWhere.mockResolvedValue([]);

    const { processCleanup } = await import('./cleanup.job');
    await processCleanup();

    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it('continues when individual file deletion fails', async () => {
    mockWhere.mockResolvedValue([
      {
        id: 'item-1',
        mediaUrls: ['clip1.mp4', 'clip2.mp4'],
      },
    ]);

    // First delete fails, second succeeds
    mockDeleteFile
      .mockRejectedValueOnce(new Error('R2 network error'))
      .mockResolvedValueOnce(undefined);

    const { processCleanup } = await import('./cleanup.job');
    await processCleanup();

    // Both should be attempted
    expect(mockDeleteFile).toHaveBeenCalledTimes(2);

    // DB should NOT be updated (not all files deleted)
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('starts cleanup worker without errors', async () => {
    const { startCleanupWorker } = await import('./cleanup.job');
    const worker = startCleanupWorker();
    expect(worker).toBeDefined();
  });
});
