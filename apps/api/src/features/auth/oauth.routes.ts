import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { initiateInstagramOAuth, handleInstagramCallback } from './oauth.controller';

const router = Router();

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OAuth requests, please try again later',
      statusCode: 429,
    },
  },
});

// Initiate Instagram OAuth — GET (redirect, no CSRF needed)
router.get('/oauth/instagram', oauthLimiter, initiateInstagramOAuth);

// Instagram OAuth callback — GET (redirect from Instagram)
router.get('/oauth/instagram/callback', handleInstagramCallback);

export default router;
