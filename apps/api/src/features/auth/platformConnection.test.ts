import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

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

// Mock the service functions for platform connections
vi.mock('./platformConnection.service', () => ({
  getUserConnections: vi.fn(),
  getConnection: vi.fn(),
  disconnectPlatform: vi.fn(),
}));

import { getUserConnections, disconnectPlatform } from './platformConnection.service';

const mockUser = {
  id: 'test-uuid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  subscriptionTier: 'free',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper: authenticate and get session
async function getAuthenticatedAgent() {
  const { db } = await import('../../db/index');

  // Reset db.select to default chain behavior so register's "check existing" query works
  (db.select as ReturnType<typeof vi.fn>)
    .mockReturnThis()
    // Factory-like defaults for register
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // No existing user
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

  // Set persistent mock for deserializeUser on subsequent requests
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockUser]),
      }),
    }),
  });

  // Fetch a fresh CSRF token after registration (the original was consumed by the POST)
  const freshCsrfRes = await agent.get('/api/auth/csrf-token');
  const freshCsrfToken = freshCsrfRes.body.data.csrfToken;

  return { agent, csrfToken: freshCsrfToken };
}

describe('GET /api/auth/connections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    const agent = request.agent(app);
    const res = await agent.get('/api/auth/connections');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return connected platforms for authenticated user', async () => {
    const { agent } = await getAuthenticatedAgent();

    vi.mocked(getUserConnections).mockResolvedValueOnce([
      {
        id: 'conn-1',
        platform: 'instagram' as const,
        platformUserId: '12345',
        platformUsername: 'testuser',
        connectedAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ]);

    const res = await agent.get('/api/auth/connections');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].platform).toBe('instagram');
    // Verify tenant isolation: service called with correct userId
    expect(getUserConnections).toHaveBeenCalledWith('test-uuid-123');
  });

  it('should return empty array when no connections exist', async () => {
    const { agent } = await getAuthenticatedAgent();

    vi.mocked(getUserConnections).mockResolvedValueOnce([]);

    const res = await agent.get('/api/auth/connections');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(getUserConnections).toHaveBeenCalledWith('test-uuid-123');
  });
});

describe('DELETE /api/auth/connections/:platform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await agent
      .delete('/api/auth/connections/instagram')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(401);
  });

  it('should disconnect a connected platform', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    vi.mocked(disconnectPlatform).mockResolvedValueOnce(true);

    const res = await agent
      .delete('/api/auth/connections/instagram')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('instagram disconnected');
    // Verify tenant isolation: service called with correct userId and platform
    expect(disconnectPlatform).toHaveBeenCalledWith('test-uuid-123', 'instagram');
  });

  it('should return 404 for non-existent connection', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    vi.mocked(disconnectPlatform).mockResolvedValueOnce(false);

    const res = await agent
      .delete('/api/auth/connections/instagram')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for invalid platform name', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .delete('/api/auth/connections/invalid-platform')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should require CSRF token', async () => {
    const { agent } = await getAuthenticatedAgent();

    const res = await agent.delete('/api/auth/connections/instagram');

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
