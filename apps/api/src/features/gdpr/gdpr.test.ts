import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

const mockUser = {
  id: 'test-uuid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  subscriptionTier: 'free',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock the database module
vi.mock('../../db/index', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => []),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockImplementation(() => [
        {
          id: 'test-uuid-123',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'user',
          subscriptionTier: 'free',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    },
  };
});

// Mock R2 service
const mockDeleteUserFiles = vi.hoisted(() => vi.fn());
const mockUploadBuffer = vi.hoisted(() => vi.fn());
const mockGeneratePresignedDownloadUrl = vi.hoisted(() => vi.fn());
vi.mock('../../services/r2.service', () => ({
  deleteUserFiles: (...args: unknown[]) => mockDeleteUserFiles(...args),
  uploadBuffer: (...args: unknown[]) => mockUploadBuffer(...args),
  generatePresignedDownloadUrl: (...args: unknown[]) => mockGeneratePresignedDownloadUrl(...args),
  generatePresignedUploadUrl: vi.fn(),
  deleteFile: vi.fn(),
  buildGeneratedImageKey: vi.fn(),
}));

// Mock Stripe service
const mockCancelSubscription = vi.hoisted(() => vi.fn());
vi.mock('../../services/stripe.service', () => ({
  cancelSubscription: (...args: unknown[]) => mockCancelSubscription(...args),
  createCheckoutSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
  createBillingPortalSession: vi.fn(),
  updateSubscriptionPrice: vi.fn(),
  getCustomerInvoices: vi.fn(),
  getCustomerPaymentMethod: vi.fn(),
}));

// Mock cost tracker
vi.mock('../../services/costTracker', () => ({
  logCost: vi.fn().mockResolvedValue(undefined),
}));

// Mock rate limiter
vi.mock('express-rate-limit', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock passport-instagram strategy
vi.mock('../../config/passport-instagram', () => ({
  registerInstagramStrategy: vi.fn(),
}));

// Mock requireActiveSubscription — not relevant for GDPR routes
vi.mock('../../middleware/requireActiveSubscription.middleware', () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

async function getAuthenticatedAgent() {
  const { db } = await import('../../db/index');

  (db.select as ReturnType<typeof vi.fn>)
    .mockReturnThis()
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

  const agent = request.agent(app);
  const csrfRes = await agent.get('/api/auth/csrf-token');
  const csrfToken = csrfRes.body.data.csrfToken;

  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfToken)
    .send({
      email: 'test@example.com',
      password: 'securePass123',
      displayName: 'Test User',
    });

  // Set persistent mock for deserializeUser
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockUser]),
      }),
    }),
  });

  // Get a fresh CSRF token
  const freshCsrf = await agent.get('/api/auth/csrf-token');
  const freshToken = freshCsrf.body.data.csrfToken;

  return { agent, csrfToken: freshToken };
}

describe('GDPR API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Story 8-1: Account Deletion ──────────────────

  describe('DELETE /api/gdpr/account', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .delete('/api/gdpr/account')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should delete account with active Stripe subscription', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + subscription lookup (has stripeSubscriptionId)
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ stripeSubscriptionId: 'sub_123' }]),
            }),
          }),
        });

      mockCancelSubscription.mockResolvedValue(undefined);
      mockDeleteUserFiles.mockResolvedValue(10);

      // Mock: db.delete(users).where(...)
      (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await agent
        .delete('/api/gdpr/account')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Account deleted');
      expect(mockCancelSubscription).toHaveBeenCalledWith('sub_123');
      expect(mockDeleteUserFiles).toHaveBeenCalledWith('test-uuid-123');
    });

    it('should delete account without subscription', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + subscription lookup (no sub)
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDeleteUserFiles.mockResolvedValue(3);

      // Mock: db.delete
      (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await agent
        .delete('/api/gdpr/account')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Account deleted');
      expect(mockCancelSubscription).not.toHaveBeenCalled();
    });

    it('should handle Stripe cancellation failure gracefully', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + subscription lookup
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ stripeSubscriptionId: 'sub_123' }]),
            }),
          }),
        });

      mockCancelSubscription.mockRejectedValue(new Error('Stripe API error'));
      mockDeleteUserFiles.mockResolvedValue(5);

      // Mock: db.delete
      (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await agent
        .delete('/api/gdpr/account')
        .set('X-CSRF-Token', csrfToken);

      // Should still succeed — Stripe failure is non-fatal
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Account deleted');
    });

    it('should handle R2 deletion failure gracefully', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + subscription lookup (no sub)
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDeleteUserFiles.mockRejectedValue(new Error('R2 connection error'));

      // Mock: db.delete
      (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await agent
        .delete('/api/gdpr/account')
        .set('X-CSRF-Token', csrfToken);

      // Should still succeed — R2 failure is non-fatal
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Account deleted');
    });
  });

  // ── Story 8-2: Data Export ────────────────────────

  describe('POST /api/gdpr/export', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/gdpr/export')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should export user data and return download URL', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockExportUser = {
        id: 'test-uuid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingCompletedAt: null,
      };

      const mockContentItems = [
        { id: 'c-1', type: 'reel', title: 'My Reel', status: 'published', createdAt: new Date() },
      ];

      const mockSub = {
        tier: 'starter',
        status: 'active',
        trialEndsAt: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date('2026-03-15'),
        createdAt: new Date(),
      };

      // Mock: deserializeUser (1st call) + 9 Promise.all queries (2nd–10th calls)
      (db.select as ReturnType<typeof vi.fn>)
        // deserializeUser
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        // Query 1: users (with limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockExportUser]),
            }),
          }),
        })
        // Query 2: contentItems (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockContentItems),
          }),
        })
        // Query 3: platformConnections (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        // Query 4: subscriptions (with limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSub]),
            }),
          }),
        })
        // Query 5: quotaUsage (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        // Query 6: publishJobs (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        // Query 7: apiCostLogs (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        // Query 8: auditLogs (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        // Query 9: tvScans (no limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        });

      mockUploadBuffer.mockResolvedValue(undefined);
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://r2.example.com/exports/download-url');

      const res = await agent
        .post('/api/gdpr/export')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBe('https://r2.example.com/exports/download-url');
      expect(mockUploadBuffer).toHaveBeenCalledWith(
        expect.stringMatching(/^exports\/test-uuid-123\//),
        expect.any(Buffer),
        'application/json',
      );
      expect(mockGeneratePresignedDownloadUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^exports\/test-uuid-123\//),
        7 * 24 * 60 * 60,
      );
    });

    it('should handle user with no data gracefully', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockExportUser = {
        id: 'test-uuid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingCompletedAt: null,
      };

      // Mock: deserializeUser + 9 queries all returning minimal/empty data
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        // Query 1: users
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockExportUser]),
            }),
          }),
        })
        // Queries 2-3: contentItems, platformConnections
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
        // Query 4: subscriptions (with limit)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Queries 5-9: quotaUsage, publishJobs, apiCostLogs, auditLogs, tvScans
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });

      mockUploadBuffer.mockResolvedValue(undefined);
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://r2.example.com/exports/empty-export');

      const res = await agent
        .post('/api/gdpr/export')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBe('https://r2.example.com/exports/empty-export');
    });
  });
});
