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

const mockDraftItem = {
  id: 'content-uuid-1',
  userId: 'test-uuid-123',
  type: 'post',
  status: 'draft',
  mediaUrls: ['users/test-uuid-123/uploads/photo.jpg'],
  caption: 'Test caption',
  hashtags: ['test'],
};

const mockPublishedItem = {
  ...mockDraftItem,
  status: 'published',
};

const mockConnection = {
  id: 'conn-uuid-1',
  platformUserId: 'ig-user-123',
};

const mockPublishJob = {
  id: 'job-uuid-1',
  platform: 'instagram',
  status: 'pending',
  publishedUrl: null,
  errorMessage: null,
  attemptCount: 0,
  publishedAt: null,
  createdAt: new Date().toISOString(),
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

// Mock render queue
vi.mock('../../jobs/queues', () => ({
  addRenderJob: vi.fn().mockResolvedValue('mock-job-id'),
  addPublishJob: vi.fn().mockResolvedValue('mock-publish-job-id'),
  addAyrsharePublishJob: vi.fn().mockResolvedValue('mock-ayrshare-job-id'),
}));

// Mock requireActiveSubscription — tested separately in billing.test.ts
vi.mock('../../middleware/requireActiveSubscription.middleware', () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock claude service
vi.mock('../../services/claude.service', () => ({
  generateCopy: vi.fn().mockResolvedValue({
    caption: 'Generated caption',
    hashtags: ['gen'],
    hookText: 'Hook',
    ctaText: 'CTA',
  }),
}));

// Mock R2 service
vi.mock('../../services/r2.service', () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue({
    presignedUrl: 'https://r2.example.com/presigned-upload-url',
    fileKey: 'users/test-uuid-123/uploads/abc-test.mp4',
  }),
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned-download-url'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  uploadBuffer: vi.fn().mockResolvedValue(undefined),
  buildGeneratedImageKey: vi.fn().mockReturnValue('users/test-uuid-123/generated/content-uuid-1/abc.webp'),
}));

// Mock fal.service
vi.mock('../../services/fal.service', () => ({
  generateImage: vi.fn(),
}));

// Mock quota service (credit-based)
vi.mock('../../services/quota.service', () => ({
  checkAndDecrementCredits: vi.fn(),
  restoreCredits: vi.fn(),
}));

// Mock encryption
vi.mock('../../lib/encryption', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-token'),
  decrypt: vi.fn().mockReturnValue('decrypted-token'),
}));

// Mock ayrshare service
vi.mock('../../services/ayrshare.service', () => ({
  createProfile: vi.fn().mockResolvedValue({ profileKey: 'mock-profile-key', refUrl: 'https://ayrshare.com/connect' }),
  getConnectedPlatforms: vi.fn().mockResolvedValue(['instagram', 'youtube']),
  publishPost: vi.fn().mockResolvedValue({ id: 'ayrshare-post-1', postIds: [] }),
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

  // Get a fresh CSRF token
  const freshCsrf = await agent.get('/api/auth/csrf-token');
  const freshToken = freshCsrf.body.data.csrfToken;

  return { agent, csrfToken: freshToken };
}

describe('Publishing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/content-items/:id/publish', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid platform name', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['snapchat'] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty platforms array', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: [] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when content item not found', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // getUserTier
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ subscriptionTier: 'free', ayrshareProfileKey: null }]),
          }),
        }),
      });
      // content item query — not found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(404);
    });

    it('should return 400 when content is not draft', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // getUserTier
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ subscriptionTier: 'free', ayrshareProfileKey: null }]),
          }),
        }),
      });
      // content item — already published
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPublishedItem]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('draft or failed');
    });

    it('should return 400 when Instagram not connected', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // getUserTier
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ subscriptionTier: 'free', ayrshareProfileKey: null }]),
          }),
        }),
      });
      // content item — draft
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDraftItem]),
          }),
        }),
      });
      // platform connection — not found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Instagram');
    });

    it('should return 202 when retrying failed content', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockFailedItem = { ...mockDraftItem, status: 'failed' };

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // getUserTier
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ subscriptionTier: 'free', ayrshareProfileKey: null }]),
          }),
        }),
      });
      // content item — failed
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockFailedItem]),
          }),
        }),
      });
      // platform connection — found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConnection]),
          }),
        }),
      });

      // Mock insert for publish job
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'retry-job-1' }]),
        }),
      });

      // Mock update for content item status
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(202);
      expect(res.body.data.publishJobId).toBe('retry-job-1');
    });

    it('should return 202 on successful publish request', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // getUserTier
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ subscriptionTier: 'free', ayrshareProfileKey: null }]),
          }),
        }),
      });
      // content item — draft
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDraftItem]),
          }),
        }),
      });
      // platform connection — found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConnection]),
          }),
        }),
      });

      // Mock insert for publish job
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'job-uuid-1' }]),
        }),
      });

      // Mock update for content item status
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/publish')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(202);
      expect(res.body.data.publishJobId).toBe('job-uuid-1');
    });
  });

  describe('POST /api/content-items/:id/schedule', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'], scheduledAt: new Date(Date.now() + 86400000).toISOString() });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid platform', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['snapchat'], scheduledAt: new Date(Date.now() + 86400000).toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing scheduledAt', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when scheduledAt is too soon', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken)
        .send({
          platforms: ['instagram'],
          scheduledAt: new Date(Date.now() + 60000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('5 minutes');
    });

    it('should return 404 when content item not found', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // content item — not found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken)
        .send({
          platforms: ['instagram'],
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(404);
    });

    it('should return 202 on successful schedule for free user Instagram', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // content item — draft
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDraftItem]),
          }),
        }),
      });
      // getUserTier
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ subscriptionTier: 'free', ayrshareProfileKey: null }]),
          }),
        }),
      });
      // platform connection — found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConnection]),
          }),
        }),
      });

      // Mock insert for publish job
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'scheduled-job-1' }]),
        }),
      });

      // Mock update for content item status
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const scheduledAt = new Date(Date.now() + 86400000).toISOString();
      const res = await agent
        .post('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken)
        .send({ platforms: ['instagram'], scheduledAt });

      expect(res.status).toBe(202);
      expect(res.body.data.publishJobIds).toContain('scheduled-job-1');
      expect(res.body.data.scheduledAt).toBeDefined();
    });
  });

  describe('DELETE /api/content-items/:id/schedule', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .delete('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should return 404 when content item not found', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // content item — not found
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await agent
        .delete('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(404);
    });

    it('should return 400 when content is not scheduled', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // content item — draft (not scheduled)
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDraftItem]),
          }),
        }),
      });

      const res = await agent
        .delete('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('scheduled');
    });

    it('should return 200 on successful cancel', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockScheduledItem = { ...mockDraftItem, status: 'scheduled' };

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // content item — scheduled
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockScheduledItem]),
          }),
        }),
      });

      // Mock delete for publish jobs
      (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      // Mock update for content item status back to draft
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .delete('/api/content-items/content-uuid-1/schedule')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });
  });

  describe('GET /api/content-items/:id/publish-status', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const res = await agent.get('/api/content-items/content-uuid-1/publish-status');
      expect(res.status).toBe(401);
    });

    it('should return publish job status', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // publish jobs query
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPublishJob]),
            }),
          }),
        }),
      });

      const res = await agent.get('/api/content-items/content-uuid-1/publish-status');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].status).toBe('pending');
    });

    it('should return empty array when no publish jobs', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      // deserializeUser
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      // publish jobs — empty
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const res = await agent.get('/api/content-items/content-uuid-1/publish-status');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
