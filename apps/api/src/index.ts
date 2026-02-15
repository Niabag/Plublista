import 'dotenv/config';
import app from './app.js';
import { probeRedis } from './config/redis.js';

const port = parseInt(process.env.PORT || '3001', 10);

app.listen(port, async () => {
  console.log(`[api] Server running on http://localhost:${port}`);

  // Probe Redis once — sets the availability flag for queues
  const redisOk = await probeRedis();

  if (redisOk) {
    const { startRenderWorker } = await import('./jobs/render.job.js');
    const { startPublishWorker, startAyrshareWorker } = await import('./jobs/publish.job.js');
    const { startScheduleWorker } = await import('./jobs/schedule.job.js');
    const { startCleanupWorker } = await import('./jobs/cleanup.job.js');
    startRenderWorker();
    startPublishWorker();
    startAyrshareWorker();
    startScheduleWorker();
    startCleanupWorker();
    console.log('[api] BullMQ workers started (render, publish, ayrshare, schedule, cleanup)');
  } else {
    console.warn('[api] Redis not reachable — BullMQ workers & job queuing disabled');
  }
});
