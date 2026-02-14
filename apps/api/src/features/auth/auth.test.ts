import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

// Mock the database module to avoid requiring DATABASE_URL
vi.mock('../../db/index', () => {
  const store: Record<string, unknown>[] = [];

  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        return store.filter(() => false); // No existing users by default
      }),
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
    },
    __store: store,
  };
});

// Mock rate limiter to avoid 429 across test suites
vi.mock('express-rate-limit', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock bcrypt for faster tests
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('POST /api/auth/register', () => {
  let csrfToken: string;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    agent = request.agent(app);
    // Get CSRF token first
    const csrfRes = await agent.get('/api/auth/csrf-token');
    csrfToken = csrfRes.body.data.csrfToken;
  });

  it('should register a user with valid data and return 201', async () => {
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'test@example.com',
        password: 'securePass123',
        displayName: 'Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe('test-uuid-123');
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.displayName).toBe('Test User');
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.subscriptionTier).toBe('free');
  });

  it('should not include passwordHash in response', async () => {
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'test@example.com',
        password: 'securePass123',
        displayName: 'Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.password_hash).toBeUndefined();
  });

  it('should set session cookie on successful registration', async () => {
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'test@example.com',
        password: 'securePass123',
        displayName: 'Test User',
      });

    expect(res.status).toBe(201);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = Array.isArray(cookies)
      ? cookies.find((c: string) => c.includes('connect.sid'))
      : cookies;
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
  });

  it('should return 409 CONFLICT for duplicate email', async () => {
    // Override the mock to simulate existing user
    const { db } = await import('../../db/index');
    const limitMock = vi.fn().mockResolvedValueOnce([{ id: 'existing-user' }]);
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: limitMock,
        }),
      }),
    });

    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'existing@example.com',
        password: 'securePass123',
        displayName: 'Existing User',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toBe('This email is already registered');
  });

  it('should return 400 VALIDATION_ERROR for invalid email', async () => {
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'not-an-email',
        password: 'securePass123',
        displayName: 'Test User',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR for short password', async () => {
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'test@example.com',
        password: 'short',
        displayName: 'Test User',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR for missing displayName', async () => {
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: 'test@example.com',
        password: 'securePass123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  let csrfToken: string;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf-token');
    csrfToken = csrfRes.body.data.csrfToken;
  });

  it('should login with valid credentials and return user data', async () => {
    const { db } = await import('../../db/index');
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'test-uuid-123',
              email: 'test@example.com',
              passwordHash: '$2b$12$hashedpassword',
              displayName: 'Test User',
              role: 'user',
              subscriptionTier: 'free',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      }),
    });

    const res = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'test@example.com', password: 'securePass123' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('should set session cookie on successful login', async () => {
    const { db } = await import('../../db/index');
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'test-uuid-123',
              email: 'test@example.com',
              passwordHash: '$2b$12$hashedpassword',
              displayName: 'Test User',
              role: 'user',
              subscriptionTier: 'free',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      }),
    });

    const res = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'test@example.com', password: 'securePass123' });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = Array.isArray(cookies)
      ? cookies.find((c: string) => c.includes('connect.sid'))
      : cookies;
    expect(sessionCookie).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const { db } = await import('../../db/index');
    const bcryptMod = await import('bcrypt');

    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'test-uuid-123',
              email: 'test@example.com',
              passwordHash: '$2b$12$hashedpassword',
              displayName: 'Test User',
              role: 'user',
              subscriptionTier: 'free',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      }),
    });
    (bcryptMod.default.compare as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const res = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'test@example.com', password: 'wrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'nonexistent@example.com', password: 'securePass123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'not-an-email', password: 'securePass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject login without CSRF token', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'securePass123' });

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout and return success message', async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await agent
      .post('/api/auth/logout')
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Logged out');
  });
});

describe('GET /api/auth/me', () => {
  it('should return 401 when not authenticated', async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return user data when authenticated', async () => {
    const agent = request.agent(app);
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

    // Mock deserializeUser's db query for the /me request
    const { db } = await import('../../db/index');
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
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
        }),
      }),
    });

    const meRes = await agent.get('/api/auth/me');

    expect(meRes.status).toBe(200);
    expect(meRes.body.data).toBeDefined();
    expect(meRes.body.data.email).toBe('test@example.com');
  });
});
