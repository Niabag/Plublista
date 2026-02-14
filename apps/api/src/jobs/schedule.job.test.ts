import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDueScheduledJobs = vi.fn();
const mockGetUserTier = vi.fn();
const mockAddPublishJob = vi.fn();
const mockAddAyrsharePublishJob = vi.fn();

vi.mock('../features/publishing/publishing.service', () => ({
  getDueScheduledJobs: (...args: unknown[]) => mockGetDueScheduledJobs(...args),
  getUserTier: (...args: unknown[]) => mockGetUserTier(...args),
}));

vi.mock('./queues', () => ({
  addPublishJob: (...args: unknown[]) => mockAddPublishJob(...args),
  addAyrsharePublishJob: (...args: unknown[]) => mockAddAyrsharePublishJob(...args),
}));

vi.mock('../config/redis', () => ({
  getRedisConfig: () => ({ host: 'localhost', port: 6379, maxRetriesPerRequest: null }),
}));

describe('processScheduleCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do nothing when no due jobs exist', async () => {
    mockGetDueScheduledJobs.mockResolvedValue([]);

    const { processScheduleCheck } = await import('./schedule.job');
    await processScheduleCheck();

    expect(mockAddPublishJob).not.toHaveBeenCalled();
    expect(mockAddAyrsharePublishJob).not.toHaveBeenCalled();
  });

  it('should dispatch free user Instagram job to direct publish queue', async () => {
    mockGetDueScheduledJobs.mockResolvedValue([
      {
        id: 'job-1',
        userId: 'user-1',
        contentItemId: 'content-1',
        platform: 'instagram',
      },
    ]);
    mockGetUserTier.mockResolvedValue({
      subscriptionTier: 'free',
      ayrshareProfileKey: null,
    });
    mockAddPublishJob.mockResolvedValue('queued-job-1');

    const { processScheduleCheck } = await import('./schedule.job');
    await processScheduleCheck();

    expect(mockAddPublishJob).toHaveBeenCalledWith({
      publishJobId: 'job-1',
      userId: 'user-1',
      contentItemId: 'content-1',
    });
    expect(mockAddAyrsharePublishJob).not.toHaveBeenCalled();
  });

  it('should dispatch paid user jobs to Ayrshare queue', async () => {
    mockGetDueScheduledJobs.mockResolvedValue([
      {
        id: 'job-1',
        userId: 'user-1',
        contentItemId: 'content-1',
        platform: 'instagram',
      },
      {
        id: 'job-2',
        userId: 'user-1',
        contentItemId: 'content-1',
        platform: 'youtube',
      },
    ]);
    mockGetUserTier.mockResolvedValue({
      subscriptionTier: 'starter',
      ayrshareProfileKey: 'enc-key',
    });
    mockAddAyrsharePublishJob.mockResolvedValue('queued-ayrshare-1');

    const { processScheduleCheck } = await import('./schedule.job');
    await processScheduleCheck();

    expect(mockAddAyrsharePublishJob).toHaveBeenCalledWith({
      publishJobIds: ['job-1', 'job-2'],
      platforms: ['instagram', 'youtube'],
      userId: 'user-1',
      contentItemId: 'content-1',
    });
    expect(mockAddPublishJob).not.toHaveBeenCalled();
  });

  it('should group jobs by contentItemId', async () => {
    mockGetDueScheduledJobs.mockResolvedValue([
      { id: 'job-1', userId: 'user-1', contentItemId: 'content-1', platform: 'instagram' },
      { id: 'job-2', userId: 'user-2', contentItemId: 'content-2', platform: 'instagram' },
    ]);
    mockGetUserTier.mockResolvedValue({ subscriptionTier: 'free', ayrshareProfileKey: null });
    mockAddPublishJob.mockResolvedValue('ok');

    const { processScheduleCheck } = await import('./schedule.job');
    await processScheduleCheck();

    expect(mockAddPublishJob).toHaveBeenCalledTimes(2);
  });

  it('should continue processing other jobs when one fails', async () => {
    mockGetDueScheduledJobs.mockResolvedValue([
      { id: 'job-1', userId: 'user-1', contentItemId: 'content-1', platform: 'instagram' },
      { id: 'job-2', userId: 'user-2', contentItemId: 'content-2', platform: 'instagram' },
    ]);
    mockGetUserTier
      .mockRejectedValueOnce(new Error('User not found'))
      .mockResolvedValueOnce({ subscriptionTier: 'free', ayrshareProfileKey: null });
    mockAddPublishJob.mockResolvedValue('ok');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { processScheduleCheck } = await import('./schedule.job');
    await processScheduleCheck();

    // Second job should still be dispatched
    expect(mockAddPublishJob).toHaveBeenCalledTimes(1);
    expect(mockAddPublishJob).toHaveBeenCalledWith(expect.objectContaining({ contentItemId: 'content-2' }));

    consoleSpy.mockRestore();
  });
});
