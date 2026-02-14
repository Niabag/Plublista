import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { scan, stats, leaderboard } from './tv.controller';

const tvLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
      statusCode: 429,
    },
  },
});

const scanSchema = z.object({
  source: z.string().max(100).optional(),
  campaign: z.string().max(255).optional(),
});

const router = Router();

// Record a scan — requires auth + CSRF
router.post('/scan', tvLimiter, requireAuth, csrfSynchronisedProtection, validate(scanSchema), scan);

// Get user's TV Hunter stats — requires auth
router.get('/stats', tvLimiter, requireAuth, stats);

// Public leaderboard — no auth needed
router.get('/leaderboard', tvLimiter, leaderboard);

export default router;
