import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createContentItemSchema, updateContentTextSchema, imageGenerationSchema, publishContentSchema, scheduleContentSchema } from '@plublista/shared';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { validate } from '../../middleware/validate.middleware';
import { create, get, list, update, remove, getStatus, regenerateCopy, generateImageHandler, generateStandaloneImageHandler } from './content.controller';
import { publishContentHandler, getPublishStatusHandler, getAyrshareConnectionUrlHandler, scheduleContentHandler, cancelScheduleHandler } from '../publishing/publishing.controller';

const contentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
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

const copyGenerateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many copy generation requests, please try again later',
      statusCode: 429,
    },
  },
});

const imageGenerateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many image generation requests, please try again later',
      statusCode: 429,
    },
  },
});

const publishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many publish requests, please try again later',
      statusCode: 429,
    },
  },
});

const router = Router();

router.post(
  '/',
  contentLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(createContentItemSchema),
  create,
);

router.get('/', contentLimiter, requireAuth, list);

// Ayrshare connection URL — MUST be before /:id routes
router.get('/ayrshare-connect', contentLimiter, requireAuth, getAyrshareConnectionUrlHandler);

// Standalone image generation — MUST be before /:id routes
router.post(
  '/generate-image',
  imageGenerateLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(imageGenerationSchema),
  generateStandaloneImageHandler,
);

router.post(
  '/:id/generate-copy',
  copyGenerateLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  regenerateCopy,
);

router.post(
  '/:id/generate-image',
  imageGenerateLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(imageGenerationSchema),
  generateImageHandler,
);

router.patch(
  '/:id',
  contentLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(updateContentTextSchema),
  update,
);

router.post(
  '/:id/publish',
  publishLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(publishContentSchema),
  publishContentHandler,
);

router.post(
  '/:id/schedule',
  publishLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(scheduleContentSchema),
  scheduleContentHandler,
);

router.delete(
  '/:id/schedule',
  publishLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  cancelScheduleHandler,
);

router.get('/:id/publish-status', contentLimiter, requireAuth, getPublishStatusHandler);
router.get('/:id/status', contentLimiter, requireAuth, getStatus);
router.get('/:id', contentLimiter, requireAuth, get);

router.delete(
  '/:id',
  contentLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  remove,
);

export default router;
