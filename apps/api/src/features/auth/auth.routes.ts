import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { registerSchema, loginSchema, profileUpdateSchema, changePasswordSchema } from '@publista/shared';
import { validate } from '../../middleware/validate.middleware';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { register, login, logout, getMe, updateProfile, changePassword, completeOnboarding } from './auth.controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
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

router.post(
  '/register',
  authLimiter,
  csrfSynchronisedProtection,
  validate(registerSchema),
  register,
);

router.post(
  '/login',
  authLimiter,
  csrfSynchronisedProtection,
  validate(loginSchema),
  login,
);

router.post('/logout', csrfSynchronisedProtection, logout);

router.get('/me', getMe);

router.put(
  '/profile',
  authLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(profileUpdateSchema),
  updateProfile,
);

router.put(
  '/password',
  authLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  validate(changePasswordSchema),
  changePassword,
);

router.post(
  '/onboarding/complete',
  authLimiter,
  requireAuth,
  csrfSynchronisedProtection,
  completeOnboarding,
);

export default router;
