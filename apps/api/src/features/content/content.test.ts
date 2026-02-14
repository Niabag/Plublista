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

const mockContentItem = {
  id: 'content-uuid-1',
  userId: 'test-uuid-123',
  type: 'reel',
  title: 'Test Reel',
  status: 'draft',
  style: null,
  format: null,
  duration: null,
  mediaUrls: ['users/test-uuid-123/uploads/abc-video.mp4'],
  generatedMediaUrl: null,
  caption: null,
  hashtags: [],
  hookText: null,
  ctaText: null,
  musicUrl: null,
  musicPrompt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
}));

// Mock claude service for copy generation — vi.hoisted so it's available in vi.mock factory
const mockGeneratedCopy = vi.hoisted(() => ({
  caption: 'An amazing reel you need to see!',
  hashtags: ['content', 'reel', 'viral'],
  hookText: 'Wait for it...',
  ctaText: 'Follow for more!',
}));

vi.mock('../../services/claude.service', () => ({
  generateCopy: vi.fn().mockResolvedValue(mockGeneratedCopy),
}));

// Mock R2 service for delete and upload operations
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

// Mock fal.service for image generation
const mockGenerateImage = vi.hoisted(() => vi.fn());
vi.mock('../../services/fal.service', () => ({
  generateImage: (...args: unknown[]) => mockGenerateImage(...args),
}));

// Mock quota service
const mockCheckAndDecrementQuota = vi.hoisted(() => vi.fn());
const mockRestoreQuota = vi.hoisted(() => vi.fn());
vi.mock('../../services/quota.service', () => ({
  checkAndDecrementQuota: (...args: unknown[]) => mockCheckAndDecrementQuota(...args),
  restoreQuota: (...args: unknown[]) => mockRestoreQuota(...args),
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

describe('Content Items API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/content-items', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'reel',
          mediaUrls: ['users/test/uploads/video.mp4'],
        });

      expect(res.status).toBe(401);
    });

    it('should create a content item with valid data', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock the insert().values().returning() chain for content creation
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockContentItem]),
        }),
      });

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'reel',
          title: 'Test Reel',
          mediaUrls: ['https://r2.example.com/users/test/uploads/video.mp4'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.type).toBe('reel');
    });

    it('should return 400 for missing required fields', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid content type', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'invalid',
          mediaUrls: ['https://r2.example.com/users/test/uploads/video.mp4'],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty mediaUrls', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'reel',
          mediaUrls: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/content-items', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const res = await agent.get('/api/content-items');
      expect(res.status).toBe(401);
    });

    it('should return list of content items', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock for the list query — override the persistent deserializeUser mock for this specific call
      const originalMock = (db.select as ReturnType<typeof vi.fn>).getMockImplementation();
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser call
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // listContentItems call
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([mockContentItem]),
            }),
          }),
        });

      const res = await agent.get('/api/content-items');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/content-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const res = await agent.get('/api/content-items/content-uuid-1');
      expect(res.status).toBe(401);
    });

    it('should return a content item by id', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockContentItem]),
            }),
          }),
        });

      const res = await agent.get('/api/content-items/content-uuid-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe('content-uuid-1');
    });

    it('should return 404 when content item not found', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — not found
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const res = await agent.get('/api/content-items/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/content-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .delete('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should delete a content item', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // deleteContentItem ownership check
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'content-uuid-1',
                mediaUrls: ['users/test/uploads/video.mp4'],
                generatedMediaUrl: null,
              }]),
            }),
          }),
        });

      (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await agent
        .delete('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe('content-uuid-1');
    });

    it('should return 404 when deleting non-existent content item', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // deleteContentItem ownership check — not found
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const res = await agent
        .delete('/api/content-items/nonexistent-id')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/content-items/:id/status', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const res = await agent.get('/api/content-items/content-uuid-1/status');
      expect(res.status).toBe(401);
    });

    it('should return status and generatedMediaUrl', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ ...mockContentItem, status: 'generating' }]),
            }),
          }),
        });

      const res = await agent.get('/api/content-items/content-uuid-1/status');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('generating');
      expect(res.body.data.generatedMediaUrl).toBeNull();
    });

    it('should return 404 when content item not found', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — not found
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const res = await agent.get('/api/content-items/nonexistent-id/status');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/content-items/:id/generate-copy', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-copy')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should regenerate copy for a draft content item', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — draft item
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ ...mockContentItem, status: 'draft' }]),
            }),
          }),
        });

      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-copy')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.caption).toBe(mockGeneratedCopy.caption);
      expect(res.body.data.hashtags).toEqual(mockGeneratedCopy.hashtags);
      expect(res.body.data.hookText).toBe(mockGeneratedCopy.hookText);
      expect(res.body.data.ctaText).toBe(mockGeneratedCopy.ctaText);
    });

    it('should return 404 when content item not found', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — not found
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const res = await agent
        .post('/api/content-items/nonexistent-id/generate-copy')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 when content item is not in draft status', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — generating status (not draft)
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ ...mockContentItem, status: 'generating' }]),
            }),
          }),
        });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-copy')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/content-items/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .patch('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken)
        .send({ caption: 'Updated caption' });

      expect(res.status).toBe(401);
    });

    it('should update text fields for a draft content item', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // getContentItem (ownership check)
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
              limit: vi.fn().mockResolvedValue([{ ...mockContentItem, status: 'draft' }]),
            }),
          }),
        });

      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      // Return updated item after update
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              ...mockContentItem,
              status: 'draft',
              caption: 'Updated caption',
            }]),
          }),
        }),
      });

      const res = await agent
        .patch('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken)
        .send({ caption: 'Updated caption' });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.caption).toBe('Updated caption');
    });

    it('should return 404 when content item not found', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

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

      const res = await agent
        .patch('/api/content-items/nonexistent-id')
        .set('X-CSRF-Token', csrfToken)
        .send({ caption: 'Updated caption' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 when content item is not in draft status', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

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
              limit: vi.fn().mockResolvedValue([{ ...mockContentItem, status: 'generating' }]),
            }),
          }),
        });

      const res = await agent
        .patch('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken)
        .send({ caption: 'Updated caption' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid field values', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .patch('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken)
        .send({ caption: 'x'.repeat(2201) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty body', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .patch('/api/content-items/content-uuid-1')
        .set('X-CSRF-Token', csrfToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/content-items/:id/generate-image', () => {
    beforeEach(() => {
      mockGenerateImage.mockResolvedValue({
        imageUrl: 'https://fal.ai/output/generated.webp',
        costUsd: 0.05,
      });
      mockCheckAndDecrementQuota.mockResolvedValue(undefined);
      // Mock global fetch for downloading generated image from Fal.ai
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      }));
    });

    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A beautiful sunset' });

      expect(res.status).toBe(401);
    });

    it('should generate an image for a valid content item', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — ownership check
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockContentItem]),
            }),
          }),
        });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A beautiful sunset over the ocean' });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.imageUrl).toBeDefined();
    });

    it('should return 404 when content item not found', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock
        .mockReturnValueOnce({
          // deserializeUser
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // getContentItem — not found
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const res = await agent
        .post('/api/content-items/nonexistent-id/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A sunset' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 429 when quota is exceeded', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');
      const { AppError: AppErrorClass } = await import('../../lib/errors');

      mockCheckAndDecrementQuota.mockRejectedValueOnce(
        new AppErrorClass('QUOTA_EXCEEDED', 'Monthly AI image quota reached', 429),
      );

      // Override select chain: deserializeUser → getContentItem
      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock
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
              limit: vi.fn().mockResolvedValue([mockContentItem]),
            }),
          }),
        });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A sunset' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
    });

    it('should return 400 for missing prompt', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Need deserializeUser to pass auth before validation
      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty prompt', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Need deserializeUser to pass auth before validation
      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for prompt exceeding max length', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Need deserializeUser to pass auth before validation
      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/content-uuid-1/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'x'.repeat(1001) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/content-items (carousel)', () => {
    it('should return 400 for carousel with fewer than 2 slides', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'carousel',
          mediaUrls: ['users/test/uploads/image1.jpg'],
          format: '1:1',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create a carousel with 2+ slides', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockCarouselItem = {
        ...mockContentItem,
        type: 'carousel',
        format: '1:1',
        mediaUrls: ['users/test/uploads/img1.jpg', 'users/test/uploads/img2.jpg'],
      };

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCarouselItem]),
        }),
      });

      // Mock the update for auto-copy generation
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'carousel',
          mediaUrls: ['users/test/uploads/img1.jpg', 'users/test/uploads/img2.jpg'],
          format: '1:1',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.type).toBe('carousel');
    });

    it('should return 400 for carousel with more than 20 slides', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const mediaUrls = Array.from({ length: 21 }, (_, i) => `users/test/uploads/img${i}.jpg`);

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'carousel',
          mediaUrls,
          format: '1:1',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/content-items (post)', () => {
    it('should create a post with exactly 1 image', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockPostItem = {
        ...mockContentItem,
        type: 'post',
        format: '1:1',
        mediaUrls: ['users/test/uploads/photo.jpg'],
      };

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPostItem]),
        }),
      });

      // Mock the update for auto-copy generation
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'post',
          mediaUrls: ['users/test/uploads/photo.jpg'],
          format: '1:1',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.type).toBe('post');
    });

    it('should return 400 for post with 2+ images', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'post',
          mediaUrls: ['users/test/uploads/img1.jpg', 'users/test/uploads/img2.jpg'],
          format: '1:1',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for post with 0 images', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/content-items')
        .set('X-CSRF-Token', csrfToken)
        .send({
          type: 'post',
          mediaUrls: [],
          format: '1:1',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/content-items/generate-image (standalone)', () => {
    beforeEach(() => {
      mockGenerateImage.mockResolvedValue({
        imageUrl: 'https://fal.ai/output/generated.webp',
        costUsd: 0.05,
      });
      mockCheckAndDecrementQuota.mockResolvedValue(undefined);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      }));
    });

    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/content-items/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A sunset' });

      expect(res.status).toBe(401);
    });

    it('should generate a standalone image', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A beautiful product photo' });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.imageUrl).toBeDefined();
      expect(res.body.data.fileKey).toBeDefined();
    });

    it('should return 429 when quota is exceeded', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');
      const { AppError: AppErrorClass } = await import('../../lib/errors');

      mockCheckAndDecrementQuota.mockRejectedValueOnce(
        new AppErrorClass('QUOTA_EXCEEDED', 'Monthly AI image quota reached', 429),
      );

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({ prompt: 'A sunset' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
    });

    it('should return 400 for missing prompt', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const selectMock = db.select as ReturnType<typeof vi.fn>;
      selectMock.mockReset();
      selectMock.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const res = await agent
        .post('/api/content-items/generate-image')
        .set('X-CSRF-Token', csrfToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
