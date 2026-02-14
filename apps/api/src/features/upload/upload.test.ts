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
      delete: vi.fn().mockReturnThis(),
    },
  };
});

// Mock R2 service
vi.mock('../../services/r2.service', () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue({
    presignedUrl: 'https://r2.example.com/presigned-upload-url',
    fileKey: 'users/test-uuid-123/uploads/abc-test.mp4',
  }),
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned-download-url'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
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

  // Get a fresh CSRF token for subsequent POST requests
  const freshCsrf = await agent.get('/api/auth/csrf-token');
  const freshToken = freshCsrf.body.data.csrfToken;

  return { agent, csrfToken: freshToken };
}

describe('POST /api/upload/presigned-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await agent
      .post('/api/upload/presigned-url')
      .set('X-CSRF-Token', csrfToken)
      .send({
        fileName: 'test.mp4',
        contentType: 'video/mp4',
        fileSize: 1024,
      });

    expect(res.status).toBe(401);
  });

  it('should return presigned URL for valid request', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .post('/api/upload/presigned-url')
      .set('X-CSRF-Token', csrfToken)
      .send({
        fileName: 'test.mp4',
        contentType: 'video/mp4',
        fileSize: 1024,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.presignedUrl).toBeDefined();
    expect(res.body.data.fileKey).toBeDefined();
  });

  it('should reject unsupported file types', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .post('/api/upload/presigned-url')
      .set('X-CSRF-Token', csrfToken)
      .send({
        fileName: 'test.exe',
        contentType: 'application/x-msdownload',
        fileSize: 1024,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject oversized files for free tier', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .post('/api/upload/presigned-url')
      .set('X-CSRF-Token', csrfToken)
      .send({
        fileName: 'large.mp4',
        contentType: 'video/mp4',
        fileSize: 300 * 1024 * 1024, // 300MB > free tier 200MB
      });

    expect(res.status).toBe(413);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('should accept valid image types', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    for (const contentType of ['image/jpeg', 'image/png', 'image/webp']) {
      const res = await agent
        .post('/api/upload/presigned-url')
        .set('X-CSRF-Token', csrfToken)
        .send({
          fileName: 'image.jpg',
          contentType,
          fileSize: 1024,
        });

      expect(res.status).toBe(200);
    }
  });

  it('should accept valid video types', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    for (const contentType of ['video/mp4', 'video/quicktime', 'video/webm']) {
      const res = await agent
        .post('/api/upload/presigned-url')
        .set('X-CSRF-Token', csrfToken)
        .send({
          fileName: 'video.mp4',
          contentType,
          fileSize: 1024,
        });

      expect(res.status).toBe(200);
    }
  });

  it('should reject request without CSRF token', async () => {
    const { agent } = await getAuthenticatedAgent();

    const res = await agent
      .post('/api/upload/presigned-url')
      .send({
        fileName: 'test.mp4',
        contentType: 'video/mp4',
        fileSize: 1024,
      });

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should return 400 for missing required fields', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const res = await agent
      .post('/api/upload/presigned-url')
      .set('X-CSRF-Token', csrfToken)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
