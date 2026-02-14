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
  onboardingCompletedAt: null,
};

function mockSelectUser(db: Record<string, unknown>, user: Record<string, unknown> | null = mockUser) {
  (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(user ? [user] : []),
      }),
    }),
  });
}

function mockUpdateUser(db: Record<string, unknown>, user: Record<string, unknown>) {
  (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([user]),
      }),
    }),
  });
}

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
      returning: vi.fn().mockImplementation(() => {
        return [
          {
            id: 'test-uuid-123',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'user',
            subscriptionTier: 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
            onboardingCompletedAt: null,
          },
        ];
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    },
  };
});

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

async function createAuthenticatedAgent() {
  const agent = request.agent(app);

  // Get CSRF token
  const csrfRes = await agent.get('/api/auth/csrf-token');
  const csrfToken = csrfRes.body.data.csrfToken;

  // Register to establish session
  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfToken)
    .send({
      email: 'test@example.com',
      password: 'securePass123',
      displayName: 'Test User',
    });

  // Mock deserializeUser for CSRF re-fetch (so session stays valid)
  const { db } = await import('../../db/index');
  mockSelectUser(db as unknown as Record<string, unknown>);

  // Get fresh CSRF token (POST rotates the token)
  const freshCsrf = await agent.get('/api/auth/csrf-token');
  const freshToken = freshCsrf.body.data.csrfToken;

  return { agent, csrfToken: freshToken };
}

describe('POST /api/auth/onboarding/complete', () => {
  let agent: ReturnType<typeof request.agent>;
  let csrfToken: string;

  beforeEach(async () => {
    const result = await createAuthenticatedAgent();
    agent = result.agent;
    csrfToken = result.csrfToken;
  });

  it('should require authentication', async () => {
    const unauthAgent = request.agent(app);
    const csrfRes = await unauthAgent.get('/api/auth/csrf-token');
    const token = csrfRes.body.data.csrfToken;

    const res = await unauthAgent
      .post('/api/auth/onboarding/complete')
      .set('X-CSRF-Token', token);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should require CSRF token', async () => {
    const res = await agent.post('/api/auth/onboarding/complete');

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should complete onboarding and return updated user', async () => {
    const { db } = await import('../../db/index');
    const dbObj = db as unknown as Record<string, unknown>;

    // Mock deserializeUser for this request
    mockSelectUser(dbObj);

    // Mock completeOnboarding update
    const completedAt = new Date('2026-02-13T12:00:00Z');
    mockUpdateUser(dbObj, { ...mockUser, onboardingCompletedAt: completedAt });

    const res = await agent
      .post('/api/auth/onboarding/complete')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe('test-uuid-123');
    expect(res.body.data.onboardingCompletedAt).toBeDefined();
  });

  it('should be idempotent (calling again returns user)', async () => {
    const { db } = await import('../../db/index');
    const dbObj = db as unknown as Record<string, unknown>;
    const completedAt = new Date('2026-02-13T12:00:00Z');

    // Mock deserializeUser (user already has onboarding completed)
    mockSelectUser(dbObj, { ...mockUser, onboardingCompletedAt: completedAt });

    // Mock the update (idempotent — still returns the same timestamp)
    mockUpdateUser(dbObj, { ...mockUser, onboardingCompletedAt: completedAt });

    const res = await agent
      .post('/api/auth/onboarding/complete')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompletedAt).toBeDefined();
  });
});

describe('GET /api/auth/me — includes onboardingCompletedAt', () => {
  it('should include onboardingCompletedAt in response', async () => {
    const { agent } = await createAuthenticatedAgent();
    const { db } = await import('../../db/index');

    // Mock deserializeUser for /me request
    mockSelectUser(db as unknown as Record<string, unknown>);

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('onboardingCompletedAt');
    expect(res.body.data.onboardingCompletedAt).toBeNull();
  });
});

describe('Register returns onboardingCompletedAt: null', () => {
  it('should return onboardingCompletedAt as null on registration', async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'new@example.com',
        password: 'securePass123',
        displayName: 'New User',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.onboardingCompletedAt).toBeNull();
  });
});
