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
  reelsUsed: 0,
  reelsLimit: 3,
  carouselsUsed: 0,
  carouselsLimit: 3,
  aiImagesUsed: 0,
  aiImagesLimit: 5,
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
  getOrCreateQuotaUsage: vi.fn().mockResolvedValue({
    id: 'quota-uuid-1',
    userId: 'test-uuid-123',
    periodStart: '2025-05-01',
    periodEnd: '2025-05-31',
    reelsUsed: 0,
    reelsLimit: 3,
    carouselsUsed: 0,
    carouselsLimit: 3,
    aiImagesUsed: 0,
    aiImagesLimit: 5,
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
    expect(res.body.data.quotas).toHaveLength(3);
    expect(res.body.data.period).toBeDefined();
    expect(res.body.data.period.start).toBeDefined();
    expect(res.body.data.period.end).toBeDefined();
  });

  it('should return correct free tier limits', async () => {
    const { agent } = await getAuthenticatedAgent();

    const res = await agent.get('/api/quotas');

    const quotas = res.body.data.quotas;
    const reels = quotas.find((q: { resource: string }) => q.resource === 'reels');
    const carousels = quotas.find((q: { resource: string }) => q.resource === 'carousels');
    const aiImages = quotas.find((q: { resource: string }) => q.resource === 'aiImages');

    expect(reels).toEqual({ resource: 'reels', used: 0, limit: 3, percentage: 0 });
    expect(carousels).toEqual({ resource: 'carousels', used: 0, limit: 3, percentage: 0 });
    expect(aiImages).toEqual({ resource: 'aiImages', used: 0, limit: 5, percentage: 0 });
  });

  it('should return correct percentage when usage exists', async () => {
    const { getOrCreateQuotaUsage } = await import('./quotaUsage.service');
    (getOrCreateQuotaUsage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockQuotaUsage,
      reelsUsed: 1,
      carouselsUsed: 2,
      aiImagesUsed: 3,
    });

    const { agent } = await getAuthenticatedAgent();
    const res = await agent.get('/api/quotas');

    const quotas = res.body.data.quotas;
    const reels = quotas.find((q: { resource: string }) => q.resource === 'reels');
    const carousels = quotas.find((q: { resource: string }) => q.resource === 'carousels');
    const aiImages = quotas.find((q: { resource: string }) => q.resource === 'aiImages');

    expect(reels.used).toBe(1);
    expect(reels.percentage).toBe(33);
    expect(carousels.used).toBe(2);
    expect(carousels.percentage).toBe(67);
    expect(aiImages.used).toBe(3);
    expect(aiImages.percentage).toBe(60);
  });
});
