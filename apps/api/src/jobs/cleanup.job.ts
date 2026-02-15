import { Worker, Queue } from 'bullmq';
import { and, isNotNull, sql } from 'drizzle-orm';
import { getRedisConfig } from '../config/redis';
import { db } from '../db/index';
import { contentItems } from '../db/schema/index';
import { deleteFile } from '../services/r2.service';
import type { CleanupJobData } from './queues';

const CLEANUP_QUEUE_NAME = 'cleanup';
const STALE_THRESHOLD_HOURS = 6;

export async function processCleanup(): Promise<void> {
  // Find items with:
  // - generatedMediaUrl set (render completed)
  // - mediaUrls non-empty (rushes still present)
  // - updatedAt older than 6 hours
  const threshold = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);

  const staleItems = await db
    .select({
      id: contentItems.id,
      mediaUrls: contentItems.mediaUrls,
    })
    .from(contentItems)
    .where(
      and(
        isNotNull(contentItems.generatedMediaUrl),
        sql`jsonb_array_length(${contentItems.mediaUrls}) > 0`,
        sql`${contentItems.updatedAt} < ${threshold}`,
      ),
    );

  if (staleItems.length === 0) return;

  console.info(
    JSON.stringify({ staleCount: staleItems.length }, null, 0),
    'Cleanup: found stale rushes to delete',
  );

  for (const item of staleItems) {
    const urls = item.mediaUrls ?? [];
    let deletedCount = 0;

    for (const key of urls) {
      try {
        await deleteFile(key);
        deletedCount++;
      } catch (err) {
        console.warn(
          JSON.stringify({ contentItemId: item.id, key, error: (err as Error).message }, null, 0),
          'Cleanup: rush deletion failed (will retry next cycle)',
        );
      }
    }

    // Clear mediaUrls in DB if all files deleted
    if (deletedCount === urls.length) {
      await db
        .update(contentItems)
        .set({ mediaUrls: [], updatedAt: new Date() })
        .where(sql`${contentItems.id} = ${item.id}`);
    }

    console.info(
      JSON.stringify({ contentItemId: item.id, deleted: deletedCount, total: urls.length }, null, 0),
      'Cleanup: processed item',
    );
  }
}

let worker: Worker | null = null;
let queue: Queue | null = null;

export function startCleanupWorker(): Worker {
  if (worker) return worker;

  const connection = getRedisConfig();

  queue = new Queue(CLEANUP_QUEUE_NAME, { connection });

  // Repeatable job every 6 hours
  queue.add(
    'cleanup-orphan-rushes',
    { type: 'orphan-rushes' } satisfies CleanupJobData,
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  worker = new Worker<CleanupJobData>(
    CLEANUP_QUEUE_NAME,
    async () => {
      await processCleanup();
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('failed', (_job, err) => {
    console.error(
      JSON.stringify({ error: err.message }, null, 0),
      'Cleanup job failed',
    );
  });

  return worker;
}
