import type { Request, Response, NextFunction } from 'express';
import type Stripe from 'stripe';
import { createCheckoutSession, constructWebhookEvent, createBillingPortalSession } from '../../services/stripe.service';
import {
  handleCheckoutCompleted,
  getSubscription,
  changePlan,
  cancelPendingDowngrade,
  getBillingDetails,
  recordStripeEvent,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} from './billing.service';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string; email: string }).id;
    const email = (req.user as { id: string; email: string }).email;
    const { tier } = req.body;

    const result = await createCheckoutSession(userId, email, tier);
    res.json({ data: { url: result.sessionUrl } });
  } catch (err) {
    next(err);
  }
}

export async function getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const subscription = await getSubscription(userId);
    res.json({ data: subscription });
  } catch (err) {
    next(err);
  }
}

export async function portalSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const subscription = await getSubscription(userId);

    if (!subscription) {
      throw new AppError('NOT_FOUND', 'No active subscription found', 404);
    }

    const result = await createBillingPortalSession(subscription.stripeCustomerId);
    res.json({ data: { url: result.portalUrl } });
  } catch (err) {
    next(err);
  }
}

export async function changePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const { tier } = req.body;

    const result = await changePlan(userId, tier);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function cancelPendingDowngradeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;

    const result = await cancelPendingDowngrade(userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getBillingDetailsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await getBillingDetails(userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new AppError('VALIDATION_ERROR', 'Missing stripe-signature header', 400);
    }

    const event = constructWebhookEvent(req.body as Buffer, signature);

    // Idempotency check — skip if we've already processed this event
    const isNew = await recordStripeEvent(event.id, event.type);
    if (!isNew) {
      logger.info({ stripeEventId: event.id, eventType: event.type }, 'Duplicate Stripe event, skipping');
      res.json({ received: true });
      return;
    }

    logger.info({ stripeEventId: event.id, eventType: event.type }, 'Stripe webhook received');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        logger.info({ eventType: event.type }, 'Unhandled Stripe event type');
        break;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
