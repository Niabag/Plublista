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

// Mock stripe service
const mockCreateCheckoutSession = vi.hoisted(() => vi.fn());
const mockConstructWebhookEvent = vi.hoisted(() => vi.fn());
const mockCreateBillingPortalSession = vi.hoisted(() => vi.fn());
const mockUpdateSubscriptionPrice = vi.hoisted(() => vi.fn());
const mockGetCustomerInvoices = vi.hoisted(() => vi.fn());
const mockGetCustomerPaymentMethod = vi.hoisted(() => vi.fn());
vi.mock('../../services/stripe.service', () => ({
  createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
  constructWebhookEvent: (...args: unknown[]) => mockConstructWebhookEvent(...args),
  createBillingPortalSession: (...args: unknown[]) => mockCreateBillingPortalSession(...args),
  updateSubscriptionPrice: (...args: unknown[]) => mockUpdateSubscriptionPrice(...args),
  getCustomerInvoices: (...args: unknown[]) => mockGetCustomerInvoices(...args),
  getCustomerPaymentMethod: (...args: unknown[]) => mockGetCustomerPaymentMethod(...args),
}));

// Mock cost tracker
vi.mock('../../services/costTracker', () => ({
  logCost: vi.fn().mockResolvedValue(undefined),
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

describe('Billing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/billing/checkout', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/billing/checkout')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'starter' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid tier', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/billing/checkout')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'invalid-tier' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when tier is free', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/billing/checkout')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'free' });

      expect(res.status).toBe(400);
    });

    it('should return checkout URL for valid tier', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      mockCreateCheckoutSession.mockResolvedValueOnce({
        sessionUrl: 'https://checkout.stripe.com/session-123',
      });

      const res = await agent
        .post('/api/billing/checkout')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'starter' });

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBe('https://checkout.stripe.com/session-123');
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        'test-uuid-123',
        'test@example.com',
        'starter',
      );
    });

    it('should work for all paid tiers', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      for (const tier of ['starter', 'pro', 'business', 'agency']) {
        mockCreateCheckoutSession.mockResolvedValueOnce({
          sessionUrl: `https://checkout.stripe.com/${tier}-session`,
        });

        const res = await agent
          .post('/api/billing/checkout')
          .set('X-CSRF-Token', csrfToken)
          .send({ tier });

        expect(res.status).toBe(200);
        expect(res.body.data.url).toBe(`https://checkout.stripe.com/${tier}-session`);
      }
    });
  });

  describe('GET /api/billing/subscription', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/billing/subscription');
      expect(res.status).toBe(401);
    });

    it('should return null when no subscription exists', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (no subscription found)
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

      const res = await agent.get('/api/billing/subscription');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should return subscription when one exists', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockSub = {
        id: 'sub-uuid-1',
        userId: 'test-uuid-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        tier: 'starter',
        status: 'trialing',
        trialEndsAt: new Date().toISOString(),
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock: deserializeUser + getSubscription
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
              limit: vi.fn().mockResolvedValue([mockSub]),
            }),
          }),
        });

      const res = await agent.get('/api/billing/subscription');

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: 'sub-uuid-1',
        tier: 'starter',
        status: 'trialing',
      });
    });
  });

  describe('POST /api/billing/portal', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/billing/portal')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should return 404 when no subscription exists', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (no subscription)
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
        .post('/api/billing/portal')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(404);
    });

    it('should return portal URL when subscription exists', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockSub = {
        id: 'sub-uuid-1',
        userId: 'test-uuid-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        tier: 'starter',
        status: 'active',
      };

      // Mock: deserializeUser + getSubscription
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
              limit: vi.fn().mockResolvedValue([mockSub]),
            }),
          }),
        });

      mockCreateBillingPortalSession.mockResolvedValueOnce({
        portalUrl: 'https://billing.stripe.com/portal-session-123',
      });

      const res = await agent
        .post('/api/billing/portal')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBe('https://billing.stripe.com/portal-session-123');
      expect(mockCreateBillingPortalSession).toHaveBeenCalledWith('cus_123');
    });
  });

  describe('POST /api/billing/webhook', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'checkout.session.completed' }));

      expect(res.status).toBe(400);
    });

    it('should return 200 and process checkout.session.completed event', async () => {
      const { db } = await import('../../db/index');

      const mockSession = {
        client_reference_id: 'test-uuid-123',
        metadata: { tier: 'starter' },
        customer: 'cus_123',
        subscription: 'sub_123',
      };

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_checkout_1',
        type: 'checkout.session.completed',
        data: { object: mockSession },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-1' }]),
          }),
        }),
      });

      // Mock: subscription lookup (none found) + insert + user update + quota update
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      (db.update as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'checkout.session.completed' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(mockConstructWebhookEvent).toHaveBeenCalled();
    });

    it('should skip processing for duplicate events (idempotency)', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_duplicate_1',
        type: 'checkout.session.completed',
        data: { object: {} },
      });

      // Mock: recordStripeEvent INSERT returns empty (conflict = duplicate)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'checkout.session.completed' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      // No handleCheckoutCompleted call — db.select should NOT have been called for subscription lookup
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should handle customer.subscription.updated event', async () => {
      const { db } = await import('../../db/index');

      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        metadata: { tier: 'pro' },
      };

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_sub_updated_1',
        type: 'customer.subscription.updated',
        data: { object: mockSubscription },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-2' }]),
          }),
        }),
      });

      // Mock: subscription lookup by stripeSubscriptionId
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'sub-uuid-1',
              userId: 'test-uuid-123',
              tier: 'starter',
              status: 'active',
              pendingTier: null,
              pendingTierEffectiveDate: null,
            }]),
          }),
        }),
      });

      // Mock: subscription update + user update + quota update (tier changed)
      (db.update as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'customer.subscription.updated' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it('should handle customer.subscription.deleted event', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_sub_deleted_1',
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_123', status: 'canceled', metadata: {} } },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-3' }]),
          }),
        }),
      });

      // Mock: subscription lookup
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'sub-uuid-1',
              userId: 'test-uuid-123',
              tier: 'pro',
              status: 'active',
            }]),
          }),
        }),
      });

      // Mock: subscription update (canceled) + user update (free) + quota update
      (db.update as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'customer.subscription.deleted' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_inv_success_1',
        type: 'invoice.payment_succeeded',
        data: { object: { customer: 'cus_123' } },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-4' }]),
          }),
        }),
      });

      // Mock: subscription lookup by stripeCustomerId
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'sub-uuid-1',
              userId: 'test-uuid-123',
              tier: 'pro',
              status: 'past_due',
              pendingTier: null,
              pendingTierEffectiveDate: null,
            }]),
          }),
        }),
      });

      // Mock: subscription update (status → active)
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'invoice.payment_succeeded' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it('should handle invoice.payment_failed event', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_inv_fail_1',
        type: 'invoice.payment_failed',
        data: { object: { customer: 'cus_456' } },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-5' }]),
          }),
        }),
      });

      // Mock: subscription lookup by stripeCustomerId
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'sub-uuid-2',
              userId: 'test-uuid-456',
              tier: 'starter',
              status: 'active',
              failedPaymentRetries: 0,
              suspendedAt: null,
            }]),
          }),
        }),
      });

      // Mock: subscription update (status → past_due, retries → 1)
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'invoice.payment_failed' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it('should suspend account after 3 failed payment retries', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_inv_fail_3',
        type: 'invoice.payment_failed',
        data: { object: { customer: 'cus_456' } },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-suspend' }]),
          }),
        }),
      });

      // Mock: subscription lookup — already at 2 retries
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'sub-uuid-2',
              userId: 'test-uuid-456',
              tier: 'starter',
              status: 'active',
              failedPaymentRetries: 2,
              suspendedAt: null,
            }]),
          }),
        }),
      });

      // Mock: subscription update (retries → 3, suspendedAt set)
      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: mockSet,
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'invoice.payment_failed' })));

      expect(res.status).toBe(200);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          failedPaymentRetries: 3,
          suspendedAt: expect.any(Date),
        }),
      );
    });

    it('should reset retries and clear suspension on payment success', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_inv_success_restore',
        type: 'invoice.payment_succeeded',
        data: { object: { customer: 'cus_456' } },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-restore' }]),
          }),
        }),
      });

      // Mock: subscription lookup — was suspended
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'sub-uuid-2',
              userId: 'test-uuid-456',
              tier: 'starter',
              status: 'past_due',
              failedPaymentRetries: 3,
              suspendedAt: new Date('2026-02-10'),
              pendingTier: null,
              pendingTierEffectiveDate: null,
            }]),
          }),
        }),
      });

      // Mock: subscription update (status → active, retries reset, suspension cleared)
      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: mockSet,
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'invoice.payment_succeeded' })));

      expect(res.status).toBe(200);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          failedPaymentRetries: 0,
          suspendedAt: null,
        }),
      );
    });

    it('should return 200 for unhandled event types', async () => {
      const { db } = await import('../../db/index');

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_unhandled_1',
        type: 'invoice.paid',
        data: { object: {} },
      });

      // Mock: recordStripeEvent INSERT (new event)
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'se-6' }]),
          }),
        }),
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'sig_valid_123')
        .send(Buffer.from(JSON.stringify({ type: 'invoice.paid' })));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });
  });

  describe('POST /api/billing/change-plan', () => {
    const mockActiveSub = {
      id: 'sub-uuid-1',
      userId: 'test-uuid-123',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      tier: 'starter',
      status: 'active',
      currentPeriodEnd: new Date('2026-03-01'),
      pendingTier: null,
      pendingTierEffectiveDate: null,
    };

    const mockStripeUpdated = {
      id: 'sub_123',
      items: {
        data: [{
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        }],
      },
    };

    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/billing/change-plan')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'pro' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid tier', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();

      const res = await agent
        .post('/api/billing/change-plan')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'invalid-tier' });

      expect(res.status).toBe(400);
    });

    it('should return 404 when no subscription exists', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (no sub)
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
        .post('/api/billing/change-plan')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'pro' });

      expect(res.status).toBe(404);
    });

    it('should return 400 when requesting same tier', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (starter)
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
              limit: vi.fn().mockResolvedValue([mockActiveSub]),
            }),
          }),
        });

      const res = await agent
        .post('/api/billing/change-plan')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'starter' }); // same as mockActiveSub.tier

      expect(res.status).toBe(400);
    });

    it('should upgrade immediately and return direction: upgrade', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (starter → upgrading to pro)
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
              limit: vi.fn().mockResolvedValue([mockActiveSub]),
            }),
          }),
        });

      mockUpdateSubscriptionPrice.mockResolvedValueOnce(mockStripeUpdated);

      // Mock: 3 db.update calls (subscription, user, quotaUsage)
      (db.update as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        });

      const res = await agent
        .post('/api/billing/change-plan')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'pro' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        direction: 'upgrade',
        newTier: 'pro',
        effectiveNow: true,
      });
      expect(mockUpdateSubscriptionPrice).toHaveBeenCalledWith('sub_123', 'pro', 'test-uuid-123');
    });

    it('should schedule downgrade without calling Stripe', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockProSub = { ...mockActiveSub, tier: 'pro' };

      // Mock: deserializeUser + getSubscription (pro → downgrading to starter)
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
              limit: vi.fn().mockResolvedValue([mockProSub]),
            }),
          }),
        });

      // Mock: 1 db.update (subscription — set pendingTier)
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/billing/change-plan')
        .set('X-CSRF-Token', csrfToken)
        .send({ tier: 'starter' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        direction: 'downgrade',
        newTier: 'starter',
        effectiveNow: false,
      });
      expect(res.body.data.effectiveDate).toBeDefined();
      expect(mockUpdateSubscriptionPrice).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/billing/cancel-downgrade', () => {
    it('should return 401 when not authenticated', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfRes.body.data.csrfToken;

      const res = await agent
        .post('/api/billing/cancel-downgrade')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
    });

    it('should return 404 when no subscription exists', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (no sub)
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
        .post('/api/billing/cancel-downgrade')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(404);
    });

    it('should return 400 when no pending downgrade exists', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockSubNoPending = {
        id: 'sub-uuid-1',
        userId: 'test-uuid-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        tier: 'pro',
        status: 'active',
        pendingTier: null,
        pendingTierEffectiveDate: null,
      };

      // Mock: deserializeUser + getSubscription (no pending)
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
              limit: vi.fn().mockResolvedValue([mockSubNoPending]),
            }),
          }),
        });

      const res = await agent
        .post('/api/billing/cancel-downgrade')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(400);
    });

    it('should clear pending downgrade and return success', async () => {
      const { agent, csrfToken } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockSubWithPending = {
        id: 'sub-uuid-1',
        userId: 'test-uuid-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        tier: 'pro',
        status: 'active',
        pendingTier: 'starter',
        pendingTierEffectiveDate: new Date('2026-03-01'),
      };

      // Mock: deserializeUser + getSubscription (with pending)
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
              limit: vi.fn().mockResolvedValue([mockSubWithPending]),
            }),
          }),
        });

      // Mock: db.update (clear pending fields)
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const res = await agent
        .post('/api/billing/cancel-downgrade')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        canceled: true,
        currentTier: 'pro',
      });
    });
  });

  describe('GET /api/billing/details', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/billing/details');
      expect(res.status).toBe(401);
    });

    it('should return null subscription for free user', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      // Mock: deserializeUser + getSubscription (no sub)
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

      const res = await agent.get('/api/billing/details');

      expect(res.status).toBe(200);
      expect(res.body.data.subscription).toBeNull();
      expect(res.body.data.invoices).toEqual([]);
      expect(res.body.data.paymentMethod).toBeNull();
      expect(mockGetCustomerInvoices).not.toHaveBeenCalled();
    });

    it('should return billing details with subscription, invoices, and payment method', async () => {
      const { agent } = await getAuthenticatedAgent();
      const { db } = await import('../../db/index');

      const mockSub = {
        id: 'sub-uuid-1',
        userId: 'test-uuid-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date('2026-03-01').toISOString(),
      };

      const mockInvoices = [
        {
          id: 'inv_1',
          date: '2026-02-01T00:00:00.000Z',
          amount: 7900,
          currency: 'EUR',
          status: 'paid',
          invoicePdf: 'https://pay.stripe.com/invoice/inv_1.pdf',
          hostedInvoiceUrl: 'https://invoice.stripe.com/inv_1',
          description: 'Pro plan',
        },
      ];

      const mockPaymentMethod = { type: 'card', last4: '4242', brand: 'visa' };

      // Mock: deserializeUser + getSubscription
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
              limit: vi.fn().mockResolvedValue([mockSub]),
            }),
          }),
        });

      mockGetCustomerInvoices.mockResolvedValueOnce(mockInvoices);
      mockGetCustomerPaymentMethod.mockResolvedValueOnce(mockPaymentMethod);

      const res = await agent.get('/api/billing/details');

      expect(res.status).toBe(200);
      expect(res.body.data.subscription).toMatchObject({ tier: 'pro', status: 'active' });
      expect(res.body.data.invoices).toHaveLength(1);
      expect(res.body.data.invoices[0]).toMatchObject({
        id: 'inv_1',
        amount: 7900,
        status: 'paid',
      });
      expect(res.body.data.paymentMethod).toMatchObject({
        type: 'card',
        last4: '4242',
        brand: 'visa',
      });
      expect(mockGetCustomerInvoices).toHaveBeenCalledWith('cus_123', 'test-uuid-123');
      expect(mockGetCustomerPaymentMethod).toHaveBeenCalledWith('cus_123', 'test-uuid-123');
    });
  });
});
