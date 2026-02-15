import Stripe from 'stripe';
import type { SubscriptionTier } from '@publista/shared';
import { AppError } from '../lib/errors';
import { logCost } from './costTracker';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getStripeClient(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Stripe is not configured', 503);
  }
  return new Stripe(STRIPE_SECRET_KEY);
}

/** Stripe Price IDs from environment — one per paid tier */
const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO,
  business: process.env.STRIPE_PRICE_ID_BUSINESS,
  agency: process.env.STRIPE_PRICE_ID_AGENCY,
};

export async function getOrCreateCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const stripe = getStripeClient();

  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await logCost(userId, 'stripe', 'customers.create', 0);
  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  tier: Exclude<SubscriptionTier, 'free'>,
): Promise<{ sessionUrl: string }> {
  const stripe = getStripeClient();
  const priceId = STRIPE_PRICE_IDS[tier];

  if (!priceId) {
    throw new AppError('VALIDATION_ERROR', `Stripe price not configured for tier: ${tier}`, 400);
  }

  const customerId = await getOrCreateCustomer(userId, email);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId, tier },
    },
    client_reference_id: userId,
    metadata: { tier },
    success_url: `${frontendUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/pricing`,
  });

  await logCost(userId, 'stripe', 'checkout.sessions.create', 0);

  if (!session.url) {
    throw new AppError('EXTERNAL_API_ERROR', 'Stripe did not return a checkout URL', 502);
  }

  return { sessionUrl: session.url };
}

export async function createBillingPortalSession(
  customerId: string,
): Promise<{ portalUrl: string }> {
  const stripe = getStripeClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${frontendUrl}/pricing`,
  });

  return { portalUrl: session.url };
}

export async function updateSubscriptionPrice(
  stripeSubscriptionId: string,
  newTier: Exclude<SubscriptionTier, 'free'>,
  userId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  const priceId = STRIPE_PRICE_IDS[newTier];

  if (!priceId) {
    throw new AppError('VALIDATION_ERROR', `Stripe price not configured for tier: ${newTier}`, 400);
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const itemId = subscription.items.data[0]?.id;

  if (!itemId) {
    throw new AppError('EXTERNAL_API_ERROR', 'Stripe subscription has no items', 502);
  }

  const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: 'create_prorations',
    metadata: { userId, tier: newTier },
  });

  await logCost(userId, 'stripe', 'subscriptions.update', 0);
  return updated;
}

export interface InvoiceData {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  description: string;
}

export interface PaymentMethodData {
  type: 'card' | 'other';
  last4?: string;
  brand?: string;
}

export async function getCustomerInvoices(
  customerId: string,
  userId: string,
): Promise<InvoiceData[]> {
  const stripe = getStripeClient();

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 100,
  });

  await logCost(userId, 'stripe', 'invoices.list', 0);

  return invoices.data.map((inv) => ({
    id: inv.id,
    date: new Date(inv.created * 1000).toISOString(),
    amount: inv.amount_paid,
    currency: inv.currency.toUpperCase(),
    status: inv.status as InvoiceData['status'],
    invoicePdf: inv.invoice_pdf ?? null,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    description: inv.lines.data[0]?.description ?? 'Subscription',
  }));
}

export async function getCustomerPaymentMethod(
  customerId: string,
  userId: string,
): Promise<PaymentMethodData | null> {
  const stripe = getStripeClient();

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method'],
  });

  await logCost(userId, 'stripe', 'customers.retrieve', 0);

  if (customer.deleted) {
    return null;
  }

  const pm = customer.invoice_settings?.default_payment_method;

  if (!pm || typeof pm === 'string') {
    return null;
  }

  if (pm.type === 'card' && pm.card) {
    return {
      type: 'card',
      last4: pm.card.last4,
      brand: pm.card.brand,
    };
  }

  return { type: 'other' };
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Stripe webhook secret not configured', 503);
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(stripeSubscriptionId);
}
