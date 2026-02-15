import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

// ── Mock users ───────────────────────────────────────────────────────────────

const { mockRegularUser, mockAdminUser } = vi.hoisted(() => ({
  mockRegularUser: {
    id: 'user-uuid-123',
    email: 'user@example.com',
    displayName: 'Regular User',
    role: 'user',
    subscriptionTier: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  mockAdminUser: {
    id: 'admin-uuid-456',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    subscriptionTier: 'pro',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}));

// ── Service-level mocks (avoids fragile DB-level mocking of complex SQL) ──

const mockGetSystemHealth = vi.hoisted(() => vi.fn());
const mockGetPublishErrors = vi.hoisted(() => vi.fn());
const mockGetApiCosts = vi.hoisted(() => vi.fn());
const mockGetUsers = vi.hoisted(() => vi.fn());
const mockGetUserDetail = vi.hoisted(() => vi.fn());
const mockAdjustUserQuota = vi.hoisted(() => vi.fn());
const mockGetExpiringTokens = vi.hoisted(() => vi.fn());
const mockGetAuditLogs = vi.hoisted(() => vi.fn());

vi.mock('./admin.service', () => ({
  getSystemHealth: (...args: unknown[]) => mockGetSystemHealth(...args),
  getPublishErrors: (...args: unknown[]) => mockGetPublishErrors(...args),
  getApiCosts: (...args: unknown[]) => mockGetApiCosts(...args),
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
  getUserDetail: (...args: unknown[]) => mockGetUserDetail(...args),
  adjustUserQuota: (...args: unknown[]) => mockAdjustUserQuota(...args),
  getExpiringTokens: (...args: unknown[]) => mockGetExpiringTokens(...args),
  getAuditLogs: (...args: unknown[]) => mockGetAuditLogs(...args),
  logAuditAction: vi.fn(),
}));

// ── DB mock (for Passport deserializeUser only) ──────────────────────────────

vi.mock('../../db/index', () => ({
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
        id: 'admin-uuid-456',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'admin',
        subscriptionTier: 'pro',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// ── Other mocks (required for app initialization) ────────────────────────────

vi.mock('express-rate-limit', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../config/passport-instagram', () => ({
  registerInstagramStrategy: vi.fn(),
}));

vi.mock('../../middleware/requireActiveSubscription.middleware', () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../services/r2.service', () => ({
  deleteUserFiles: vi.fn(),
  uploadBuffer: vi.fn(),
  generatePresignedDownloadUrl: vi.fn(),
  generatePresignedUploadUrl: vi.fn(),
  deleteFile: vi.fn(),
  buildGeneratedImageKey: vi.fn(),
}));

vi.mock('../../services/stripe.service', () => ({
  cancelSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
  createBillingPortalSession: vi.fn(),
  updateSubscriptionPrice: vi.fn(),
  getCustomerInvoices: vi.fn(),
  getCustomerPaymentMethod: vi.fn(),
}));

vi.mock('../../services/costTracker', () => ({
  logCost: vi.fn().mockResolvedValue(undefined),
}));

// ── Auth helpers ─────────────────────────────────────────────────────────────

async function getAdminAgent() {
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
      email: 'admin@example.com',
      password: 'securePass123',
      displayName: 'Admin User',
    });

  // Persistent mock for deserializeUser → admin user
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockAdminUser]),
      }),
    }),
  });

  const freshCsrf = await agent.get('/api/auth/csrf-token');
  return { agent, csrfToken: freshCsrf.body.data.csrfToken };
}

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

  // Registration should return regular user (not admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any).returning.mockImplementationOnce(() => [mockRegularUser]);

  const agent = request.agent(app);
  const csrfRes = await agent.get('/api/auth/csrf-token');
  const csrfToken = csrfRes.body.data.csrfToken;

  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfToken)
    .send({
      email: 'user@example.com',
      password: 'securePass123',
      displayName: 'Regular User',
    });

  // Persistent mock for deserializeUser → regular user
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockRegularUser]),
      }),
    }),
  });

  const freshCsrf = await agent.get('/api/auth/csrf-token');
  return { agent, csrfToken: freshCsrf.body.data.csrfToken };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 7.1 System Health ────────────────────────────────

  describe('GET /api/admin/health', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/admin/health');
      expect(res.status).toBe(401);
    });

    it('should return 403 when not admin', async () => {
      const { agent } = await getAuthenticatedAgent();
      const res = await agent.get('/api/admin/health');
      expect(res.status).toBe(403);
    });

    it('should return system health metrics', async () => {
      const { agent } = await getAdminAgent();

      const healthData = {
        publishSuccessRate: 95,
        publishedCount: 190,
        failedCount: 10,
        activeUsersToday: 42,
        totalUsers: 500,
        totalContent: 2000,
        costToday: 12.5,
      };
      mockGetSystemHealth.mockResolvedValue(healthData);

      const res = await agent.get('/api/admin/health');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(healthData);
    });
  });

  // ── 7.2 Publishing Errors ───────────────────────────

  describe('GET /api/admin/errors', () => {
    it('should return 403 when not admin', async () => {
      const { agent } = await getAuthenticatedAgent();
      const res = await agent.get('/api/admin/errors');
      expect(res.status).toBe(403);
    });

    it('should return error list', async () => {
      const { agent } = await getAdminAgent();

      const errorData = {
        rows: [
          {
            id: 'job-1',
            userId: 'u-1',
            userEmail: 'user@example.com',
            contentItemId: 'c-1',
            contentType: 'reel',
            platform: 'instagram',
            errorMessage: 'Token expired',
            errorCode: 'TOKEN_EXPIRED',
            attemptCount: 3,
            createdAt: '2026-02-10T00:00:00.000Z',
            updatedAt: '2026-02-10T01:00:00.000Z',
          },
        ],
        total: 1,
      };
      mockGetPublishErrors.mockResolvedValue(errorData);

      const res = await agent.get('/api/admin/errors');
      expect(res.status).toBe(200);
      expect(res.body.data.rows).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('should pass query filters to service', async () => {
      const { agent } = await getAdminAgent();

      mockGetPublishErrors.mockResolvedValue({ rows: [], total: 0 });

      await agent.get('/api/admin/errors?platform=instagram&dateFrom=2026-01-01&dateTo=2026-02-01');

      expect(mockGetPublishErrors).toHaveBeenCalledWith({
        platform: 'instagram',
        dateFrom: '2026-01-01',
        dateTo: '2026-02-01',
        limit: undefined,
        offset: undefined,
      });
    });
  });

  // ── 7.3 API Costs ───────────────────────────────────

  describe('GET /api/admin/costs', () => {
    it('should return cost data', async () => {
      const { agent } = await getAdminAgent();

      const costData = {
        byService: [{ service: 'openai', totalCost: 25.5, requestCount: 100 }],
        byUser: [
          {
            userId: 'u-1',
            userEmail: 'user@test.com',
            displayName: 'Test',
            subscriptionTier: 'pro',
            totalCost: 10.0,
            requestCount: 40,
          },
        ],
        dailyTrend: [{ date: '2026-02-14', totalCost: 5.0, requestCount: 20 }],
      };
      mockGetApiCosts.mockResolvedValue(costData);

      const res = await agent.get('/api/admin/costs');
      expect(res.status).toBe(200);
      expect(res.body.data.byService).toHaveLength(1);
      expect(res.body.data.byUser).toHaveLength(1);
      expect(res.body.data.dailyTrend).toHaveLength(1);
    });
  });

  // ── 7.4 User Management ────────────────────────────

  describe('GET /api/admin/users', () => {
    it('should return user list', async () => {
      const { agent } = await getAdminAgent();

      const userData = {
        rows: [
          {
            id: 'u-1',
            email: 'user@test.com',
            displayName: 'Test User',
            role: 'user',
            subscriptionTier: 'free',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
      };
      mockGetUsers.mockResolvedValue(userData);

      const res = await agent.get('/api/admin/users');
      expect(res.status).toBe(200);
      expect(res.body.data.rows).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user detail', async () => {
      const { agent } = await getAdminAgent();

      const detailData = {
        id: 'u-1',
        email: 'user@test.com',
        displayName: 'Test User',
        role: 'user',
        subscriptionTier: 'free',
        quota: { creditsUsed: 5, creditsLimit: 100 },
        platforms: [],
        contentCount: 10,
        totalCost: 2.5,
      };
      mockGetUserDetail.mockResolvedValue(detailData);

      const res = await agent.get('/api/admin/users/u-1');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('u-1');
      expect(res.body.data.contentCount).toBe(10);
    });

    it('should return 404 for unknown user', async () => {
      const { agent } = await getAdminAgent();

      mockGetUserDetail.mockResolvedValue(null);

      const res = await agent.get('/api/admin/users/unknown-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/users/:id/quota', () => {
    it('should adjust user quota', async () => {
      const { agent, csrfToken } = await getAdminAgent();

      const quotaResult = {
        id: 'q-1',
        userId: 'u-1',
        creditsLimit: 200,
        platformsLimit: 5,
        creditsUsed: 10,
        platformsConnected: 2,
      };
      mockAdjustUserQuota.mockResolvedValue(quotaResult);

      const res = await agent
        .patch('/api/admin/users/u-1/quota')
        .set('X-CSRF-Token', csrfToken)
        .send({ creditsLimit: 200 });

      expect(res.status).toBe(200);
      expect(mockAdjustUserQuota).toHaveBeenCalledWith('admin-uuid-456', 'u-1', {
        creditsLimit: 200,
        platformsLimit: undefined,
      });
    });

    it('should return 400 for empty body', async () => {
      const { agent, csrfToken } = await getAdminAgent();

      const res = await agent
        .patch('/api/admin/users/u-1/quota')
        .set('X-CSRF-Token', csrfToken)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── 7.5 Token Management ───────────────────────────

  describe('GET /api/admin/tokens/expiring', () => {
    it('should return expiring tokens', async () => {
      const { agent } = await getAdminAgent();

      const tokenData = [
        {
          id: 'pc-1',
          userId: 'u-1',
          userEmail: 'user@test.com',
          platform: 'instagram',
          platformUsername: 'testuser',
          tokenExpiresAt: '2026-02-20T00:00:00.000Z',
          connectedAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockGetExpiringTokens.mockResolvedValue(tokenData);

      const res = await agent.get('/api/admin/tokens/expiring');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].platform).toBe('instagram');
    });
  });

  // ── Audit Logs ─────────────────────────────────────

  describe('GET /api/admin/audit-logs', () => {
    it('should return audit log entries', async () => {
      const { agent } = await getAdminAgent();

      const auditData = [
        {
          id: 'al-1',
          actorId: 'admin-uuid-456',
          actorEmail: 'admin@example.com',
          action: 'adjust_quota',
          targetType: 'user',
          targetId: 'u-1',
          metadata: { creditsLimit: 200 },
          createdAt: '2026-02-14T00:00:00.000Z',
        },
      ];
      mockGetAuditLogs.mockResolvedValue(auditData);

      const res = await agent.get('/api/admin/audit-logs');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe('adjust_quota');
    });
  });
});
