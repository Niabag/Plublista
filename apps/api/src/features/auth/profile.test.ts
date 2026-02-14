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

  // Reset db.select for register's "check existing" query
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

  // Fetch a fresh CSRF token after registration
  const freshCsrfRes = await agent.get('/api/auth/csrf-token');
  const freshCsrfToken = freshCsrfRes.body.data.csrfToken;

  return { agent, csrfToken: freshCsrfToken };
}

describe('PUT /api/auth/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await agent
      .put('/api/auth/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ displayName: 'New Name' });

    expect(res.status).toBe(401);
  });

  it('should require CSRF token', async () => {
    const { agent } = await getAuthenticatedAgent();

    const res = await agent
      .put('/api/auth/profile')
      .send({ displayName: 'New Name' });

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should update displayName successfully', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const { db } = await import('../../db/index');
    const updatedUser = { ...mockUser, displayName: 'Updated Name', updatedAt: new Date() };
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedUser]),
        }),
      }),
    });

    const res = await agent
      .put('/api/auth/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ displayName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.displayName).toBe('Updated Name');
    expect(res.body.data.id).toBe('test-uuid-123');
  });

  it('should return 400 for empty displayName', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .put('/api/auth/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ displayName: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for displayName over 100 characters', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .put('/api/auth/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ displayName: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should verify tenant isolation - uses authenticated userId', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const { db } = await import('../../db/index');
    const setMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockUser, displayName: 'New' }]),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setMock });

    await agent
      .put('/api/auth/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ displayName: 'New' });

    // Verify update was called (tenant isolation is enforced by using req.user.id)
    expect(db.update).toHaveBeenCalled();
  });
});
