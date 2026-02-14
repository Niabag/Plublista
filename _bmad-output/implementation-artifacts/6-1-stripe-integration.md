# Story 6-1: Stripe Integration & Plan Checkout

## Summary
Integrated Stripe Checkout for plan upgrades with 7-day free trial, added a `subscriptions` database table, billing backend feature (checkout, subscription status, billing portal, webhook), and a frontend Pricing page.

## Changes

### Backend — Database
- **`apps/api/src/db/schema/subscriptions.ts`** — New `subscriptions` table with `subscriptionStatusEnum` (`trialing`, `active`, `past_due`, `canceled`, `incomplete`). Columns: id, userId (FK → users), stripeCustomerId, stripeSubscriptionId (unique), tier, status, trialEndsAt, currentPeriodStart, currentPeriodEnd, timestamps. Indexed on userId.
- **`apps/api/src/db/schema/index.ts`** — Exports new table.

### Backend — Stripe Service
- **`apps/api/src/services/stripe.service.ts`** — Stripe client wrapper with:
  - `getOrCreateCustomer(userId, email)` — Finds or creates Stripe customer
  - `createCheckoutSession(userId, email, tier)` — Creates Checkout session with subscription mode, 7-day trial, success/cancel URLs, client_reference_id
  - `createBillingPortalSession(customerId)` — Creates billing portal for subscription management
  - `constructWebhookEvent(payload, signature)` — Verifies webhook signature

### Backend — Billing Feature
- **`apps/api/src/features/billing/billing.service.ts`** — Business logic:
  - `handleCheckoutCompleted(session)` — Upserts subscription record, updates user tier, adjusts quota limits
  - `getSubscription(userId)` — Returns subscription or null
  - `getSubscriptionByStripeCustomerId(customerId)` — Lookup by Stripe customer ID
- **`apps/api/src/features/billing/billing.controller.ts`** — Request handlers for checkout, subscription status, portal session, stripe webhook
- **`apps/api/src/features/billing/billing.routes.ts`** — Routes:
  - `POST /checkout` — Auth + CSRF + validation, creates Stripe Checkout session
  - `GET /subscription` — Auth, returns current subscription info
  - `POST /portal` — Auth + CSRF, creates billing portal session
  - `POST /webhook` — No auth/CSRF (Stripe signature verification)
- **`apps/api/src/app.ts`** — Mounted `/api/billing` routes, added `express.raw()` for webhook path before `express.json()`.

### Shared Package
- **`packages/shared/src/schemas/billing.schema.ts`** — `checkoutSchema` (tier: starter|pro|business|agency), `CheckoutInput` type
- **`packages/shared/src/constants/pricingConfig.ts`** — `PRICING_CONFIG` per-tier config (name, priceMonthly EUR, features[], quotas), `TIER_ORDER` array. Prices: Free €0, Starter €29, Pro €79, Business €199, Agency €499.

### Frontend — Billing Feature
- **`apps/web/src/features/billing/hooks/useCheckout.ts`** — Mutation: POST /api/billing/checkout, redirects to Stripe on success
- **`apps/web/src/features/billing/hooks/useSubscription.ts`** — Query: GET /api/billing/subscription, key `['subscription']`
- **`apps/web/src/features/billing/pages/PricingPage.tsx`** — 5 tier cards in responsive grid. Current plan highlighted with ring. "Popular" badge on Pro. "Start Free Trial" buttons for paid tiers.
- **`apps/web/src/features/billing/pages/CheckoutSuccessPage.tsx`** — Success confirmation with check icon, invalidates session to refresh tier, dashboard link.
- **`apps/web/src/router.tsx`** — Added `/pricing` and `/pricing/success` routes
- **`apps/web/src/components/layout/Sidebar.tsx`** — Added CreditCard "Pricing" nav item in bottomItems before Settings

### Configuration
- **`.env.example`** — Added Stripe env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_STARTER|PRO|BUSINESS|AGENCY`

## Test Results
- **API**: 196/196 passed (14 new billing tests)
- **Web**: 259/259 passed (11 new billing tests — 8 PricingPage + 3 CheckoutSuccessPage)
- **TypeScript**: 0 errors in both apps

## New Test Files
- `apps/api/src/features/billing/billing.test.ts` — 14 tests: checkout (401 unauth, 400 invalid tier, 400 free tier, 200 valid tier, all paid tiers), subscription (401 unauth, 200 null, 200 found), portal (401 unauth, 404 no sub, 200 portal URL), webhook (400 missing signature, 200 checkout completed, 200 unhandled event)
- `apps/web/src/features/billing/pages/PricingPage.test.tsx` — 8 tests: 5 tier cards, names+prices, current plan button, trial buttons, popular badge, checkout click, heading, ring highlight
- `apps/web/src/features/billing/pages/CheckoutSuccessPage.test.tsx` — 3 tests: success message, dashboard link, session invalidation

## Architecture Decisions
- **No frontend Stripe SDK** — Uses server-side Checkout redirect (no `@stripe/stripe-js`). Simpler, PCI-compliant, no client-side card handling.
- **Raw body for webhook** — `express.raw()` mounted specifically for `/api/billing/webhook` path BEFORE `express.json()` to preserve Buffer for Stripe signature verification.
- **Stripe Price IDs from env** — Each paid tier maps to a `STRIPE_PRICE_ID_*` environment variable, allowing different price IDs per environment (test/prod).
- **7-day free trial** — Set via `subscription_data.trial_period_days` in Checkout session. Status starts as `trialing`.
