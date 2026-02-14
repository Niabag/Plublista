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

const mockQuotaUsage = {
  id: 'quota-uuid-1',
  userId: 'test-uuid-123',
  periodStart: '2025-05-01',
  periodEnd: '2025-05-31',
  creditsUsed: 0,
  creditsLimit: 35,
  platformsConnected: 0,
  platformsLimit: 1,
};

// Mock the database module
vi.mock('../../db/index', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
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
      delete: vi.fn().mockReturnThis(),
    },
  };
});

// Mock quotaUsage service to isolate quota endpoint testing
vi.mock('./quotaUsage.service', () => ({
  getOrCreateCreditUsage: vi.fn().mockResolvedValue({
    id: 'quota-uuid-1',
    userId: 'test-uuid-123',
    periodStart: '2025-05-01',
    periodEnd: '2025-05-31',
    creditsUsed: 0,
    creditsLimit: 35,
    platformsConnected: 0,
    platformsLimit: 1,
  }),
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

  return { agent };
}

describe('GET /api/quotas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    const agent = request.agent(app);
    const res = await agent.get('/api/quotas');

    expect(res.status).toBe(401);
  });

  it('should return quota data for authenticated user', async () => {
    const { agent } = await getAuthenticatedAgent();

    const res = await agent.get('/api/quotas');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.tier).toBe('free');
    expect(res.body.data.creditsUsed).toBe(0);
    expect(res.body.data.creditsLimit).toBe(35);
    expect(res.body.data.percentage).toBe(0);
    expect(res.body.data.period).toBeDefined();
    expect(res.body.data.period.start).toBeDefined();
    expect(res.body.data.period.end).toBeDefined();
  });

  it('should return correct free tier credit limits', async () => {
    const { agent } = await getAuthenticatedAgent();

    const res = await agent.get('/api/quotas');

    expect(res.body.data.tier).toBe('free');
    expect(res.body.data.creditsUsed).toBe(0);
    expect(res.body.data.creditsLimit).toBe(35);
    expect(res.body.data.percentage).toBe(0);
  });

  it('should return correct percentage when usage exists', async () => {
    const { getOrCreateCreditUsage } = await import('./quotaUsage.service');
    (getOrCreateCreditUsage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockQuotaUsage,
      creditsUsed: 10,
    });

    const { agent } = await getAuthenticatedAgent();
    const res = await agent.get('/api/quotas');

    expect(res.body.data.creditsUsed).toBe(10);
    expect(res.body.data.creditsLimit).toBe(35);
    expect(res.body.data.percentage).toBe(29);
  });
});
