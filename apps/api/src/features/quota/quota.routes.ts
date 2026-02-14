import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { getQuota } from './quota.controller';

const router = Router();

const quotaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.get('/', quotaLimiter, requireAuth, getQuota);

export default router;
