import { Queue } from 'bullmq';
import { getRedisConfig, isRedisAvailable } from '../config/redis';

export interface RenderJobData {
  userId: string;
  contentItemId: string;
  contentType: string;
  clipUrls: string[];
  style: string;
  format: string;
  duration: number;
  musicPrompt: string;
}

let renderQueue: Queue<RenderJobData> | null = null;

export function getRenderQueue(): Queue<RenderJobData> {
  if (!isRedisAvailable()) {
    throw new Error('Redis is not available — cannot queue jobs');
  }
  if (!renderQueue) {
    renderQueue = new Queue<RenderJobData>('render', {
      connection: getRedisConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
  }
  return renderQueue;
}

export async function addRenderJob(data: RenderJobData): Promise<string> {
  const job = await getRenderQueue().add('render:auto-montage', data);
  return job.id ?? '';
}

// --- Publish Queue ---

export interface PublishJobData {
  publishJobId: string;
  userId: string;
  contentItemId: string;
}

let publishQueue: Queue<PublishJobData> | null = null;

export function getPublishQueue(): Queue<PublishJobData> {
  if (!isRedisAvailable()) {
    throw new Error('Redis is not available — cannot queue jobs');
  }
  if (!publishQueue) {
    publishQueue = new Queue<PublishJobData>('publish', {
      connection: getRedisConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'custom' },
      },
    });
  }
  return publishQueue;
}

export async function addPublishJob(data: PublishJobData): Promise<string> {
  const job = await getPublishQueue().add('publish:instagram', data);
  return job.id ?? '';
}

// --- Ayrshare Publish Queue ---

export interface AyrsharePublishJobData {
  publishJobIds: string[];
  platforms: string[];
  userId: string;
  contentItemId: string;
}

let ayrshareQueue: Queue<AyrsharePublishJobData> | null = null;

export function getAyrshareQueue(): Queue<AyrsharePublishJobData> {
  if (!isRedisAvailable()) {
    throw new Error('Redis is not available — cannot queue jobs');
  }
  if (!ayrshareQueue) {
    ayrshareQueue = new Queue<AyrsharePublishJobData>('ayrshare', {
      connection: getRedisConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'custom' },
      },
    });
  }
  return ayrshareQueue;
}

export async function addAyrsharePublishJob(data: AyrsharePublishJobData): Promise<string> {
  const job = await getAyrshareQueue().add('publish:ayrshare', data);
  return job.id ?? '';
}

// --- Cleanup Queue ---

export interface CleanupJobData {
  type: 'orphan-rushes';
}

let cleanupQueue: Queue<CleanupJobData> | null = null;

export function getCleanupQueue(): Queue<CleanupJobData> {
  if (!isRedisAvailable()) {
    throw new Error('Redis is not available — cannot queue jobs');
  }
  if (!cleanupQueue) {
    cleanupQueue = new Queue<CleanupJobData>('cleanup', {
      connection: getRedisConfig(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    });
  }
  return cleanupQueue;
}
