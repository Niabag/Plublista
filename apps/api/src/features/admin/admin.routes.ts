import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAdmin } from '../../middleware/requireAdmin.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import {
  systemHealth,
  publishErrors,
  apiCosts,
  listUsers,
  userDetail,
  adjustQuota,
  expiringTokens,
  auditLogsList,
} from './admin.controller';

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
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

const adjustQuotaSchema = z
  .object({
    creditsLimit: z.number().int().min(0).optional(),
    platformsLimit: z.number().int().min(0).optional(),
  })
  .refine((d) => d.creditsLimit !== undefined || d.platformsLimit !== undefined, {
    message: 'At least one field must be provided',
  });

const router = Router();

// All admin routes require authentication + admin role
router.use(adminLimiter, requireAdmin);

// 7.1 System Health
router.get('/health', systemHealth);

// 7.2 Publishing Errors
router.get('/errors', publishErrors);

// 7.3 API Cost Monitoring
router.get('/costs', apiCosts);

// 7.4 User Management
router.get('/users', listUsers);
router.get('/users/:id', userDetail);
router.patch('/users/:id/quota', validate(adjustQuotaSchema), adjustQuota);

// 7.5 Token Management
router.get('/tokens/expiring', expiringTokens);

// Audit Logs
router.get('/audit-logs', auditLogsList);

export default router;
