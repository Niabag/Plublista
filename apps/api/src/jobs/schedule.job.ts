import { Worker, Queue } from 'bullmq';
import { getRedisConfig } from '../config/redis';
import { getDueScheduledJobs, getUserTier } from '../features/publishing/publishing.service';
import { addPublishJob, addAyrsharePublishJob } from './queues';

const SCHEDULE_QUEUE_NAME = 'schedule-checker';

export async function processScheduleCheck(): Promise<void> {
  const dueJobs = await getDueScheduledJobs();

  if (dueJobs.length === 0) return;

  // Group by contentItemId
  const grouped = new Map<string, typeof dueJobs>();
  for (const job of dueJobs) {
    const existing = grouped.get(job.contentItemId) ?? [];
    existing.push(job);
    grouped.set(job.contentItemId, existing);
  }

  for (const [contentItemId, jobs] of grouped) {
    const { userId } = jobs[0];
    const platforms = jobs.map((j) => j.platform);

    try {
      // Determine routing: free user single Instagram → direct, else Ayrshare
      if (platforms.length === 1 && platforms[0] === 'instagram') {
        const user = await getUserTier(userId);
        if (user.subscriptionTier === 'free') {
          await addPublishJob({
            publishJobId: jobs[0].id,
            userId,
            contentItemId,
          });
          console.info(
            JSON.stringify({ userId, contentItemId }, null, 0),
            'Scheduled job dispatched to Instagram direct queue',
          );
          continue;
        }
      }

      // Paid user or multi-platform → Ayrshare
      await addAyrsharePublishJob({
        publishJobIds: jobs.map((j) => j.id),
        platforms,
        userId,
        contentItemId,
      });
      console.info(
        JSON.stringify({ userId, contentItemId, platforms }, null, 0),
        'Scheduled job dispatched to Ayrshare queue',
      );
    } catch (err) {
      console.error(
        JSON.stringify({ userId, contentItemId, error: (err as Error).message }, null, 0),
        'Failed to dispatch scheduled job',
      );
    }
  }
}

let worker: Worker | null = null;
let queue: Queue | null = null;

export function startScheduleWorker(): Worker {
  if (worker) return worker;

  const connection = getRedisConfig();

  queue = new Queue(SCHEDULE_QUEUE_NAME, { connection });

  // Add repeatable job that fires every 60 seconds
  queue.add(
    'check-due-posts',
    {},
    {
      repeat: { every: 60_000 },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  worker = new Worker(
    SCHEDULE_QUEUE_NAME,
    async () => {
      await processScheduleCheck();
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('failed', (_job, err) => {
    console.error(
      JSON.stringify({ error: err.message }, null, 0),
      'Schedule checker job failed',
    );
  });

  return worker;
}
