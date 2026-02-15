import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { presignedUrlRequestSchema } from '@publista/shared';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { validate } from '../../middleware/validate.middleware';
import { getPresignedUrl } from './upload.controller';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many upload requests, please try again later',
      statusCode: 429,
    },
  },
});

const router = Router();

router.post(
  '/presigned-url',
  uploadLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(presignedUrlRequestSchema),
  getPresignedUrl,
);

export default router;
