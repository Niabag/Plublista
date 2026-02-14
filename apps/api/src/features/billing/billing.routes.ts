import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { checkoutSchema } from '@plublista/shared';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { validate } from '../../middleware/validate.middleware';
import { checkout, getSubscriptionStatus, portalSession, changePlanHandler, cancelPendingDowngradeHandler, getBillingDetailsHandler, stripeWebhook } from './billing.controller';

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many billing requests, please try again later',
      statusCode: 429,
    },
  },
});

const router = Router();

router.post(
  '/checkout',
  billingLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(checkoutSchema),
  checkout,
);

router.get('/subscription', billingLimiter, requireAuth, getSubscriptionStatus);

router.post(
  '/portal',
  billingLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  portalSession,
);

router.post(
  '/change-plan',
  billingLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(checkoutSchema),
  changePlanHandler,
);

router.post(
  '/cancel-downgrade',
  billingLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  cancelPendingDowngradeHandler,
);

router.get('/details', billingLimiter, requireAuth, getBillingDetailsHandler);

// Stripe webhook — NO auth, NO CSRF (Stripe signature verification only)
// Body must be raw Buffer — handled via express.raw() in app.ts
router.post('/webhook', stripeWebhook);

export default router;
