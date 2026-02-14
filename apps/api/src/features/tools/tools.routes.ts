import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { hashtagGenerator, captionGenerator, bestTimeToPost } from './tools.controller';

// Public tools — strict rate limiting (5 requests per hour per IP)
const toolsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Limite atteinte. Réessayez dans une heure ou créez un compte gratuit pour plus de requêtes.',
      statusCode: 429,
    },
  },
});

// Validation schemas — inline since these are public-only tools
const hashtagSchema = z.object({
  topic: z.string().min(3).max(500),
});

const captionSchema = z.object({
  topic: z.string().min(3).max(500),
  tone: z.enum(['Pro', 'Casual', 'Fun']),
  platform: z.enum(['Instagram', 'TikTok', 'LinkedIn', 'YouTube']),
});

const bestTimeSchema = z.object({
  platform: z.enum(['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook']),
  niche: z.string().min(2).max(100),
});

const router = Router();

// No requireAuth, no CSRF — these are public endpoints
router.post('/hashtag-generator', toolsLimiter, validate(hashtagSchema), hashtagGenerator);
router.post('/caption-generator', toolsLimiter, validate(captionSchema), captionGenerator);
router.post('/best-time-to-post', toolsLimiter, validate(bestTimeSchema), bestTimeToPost);

export default router;
