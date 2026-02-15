import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { handleDeleteAccount, handleExportData } from './gdpr.controller';

const router = Router();

const gdprLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
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

// DELETE /api/gdpr/account — Story 8.1
router.delete(
  '/account',
  gdprLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  handleDeleteAccount,
);

// POST /api/gdpr/export — Story 8.2
router.post(
  '/export',
  gdprLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  handleExportData,
);

export default router;
