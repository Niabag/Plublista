# Story 6-6: Stripe Webhook Processing

## Status: Done

## What Was Built

Implemented idempotent processing of Stripe subscription lifecycle events (FR36). The webhook endpoint now handles 5 event types with structured Pino logging and duplicate event detection via a dedicated `stripe_events` table.

## Key Changes

### New Files
- **`apps/api/src/lib/logger.ts`** — Pino structured logger (`LOG_LEVEL` env variable)
- **`apps/api/src/db/schema/stripeEvents.ts`** — Idempotency table (4 columns: `id`, `stripe_event_id` (unique), `event_type`, `processed_at`)

### Modified Files
- **`apps/api/src/db/schema/index.ts`** — Added `stripeEvents` export
- **`apps/api/src/features/billing/billing.service.ts`** — Added 6 functions:
  - `recordStripeEvent()` — INSERT with `onConflictDoNothing().returning()` for atomic idempotency
  - `mapStripeStatus()` — Maps Stripe status strings to our subscription status enum
  - `handleSubscriptionUpdated()` — Updates subscription status/tier, applies pending downgrade if due
  - `handleSubscriptionDeleted()` — Cancels subscription, reverts user to free tier
  - `handleInvoicePaymentSucceeded()` — Sets status to active, applies pending downgrade if due
  - `handleInvoicePaymentFailed()` — Sets status to past_due
  - Replaced `console.warn` with `logger.warn` in `handleCheckoutCompleted`
- **`apps/api/src/features/billing/billing.controller.ts`** — Expanded webhook handler:
  - Idempotency check before processing
  - 5 event type cases: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
  - Pino structured logging for all events

### Tests
- **`apps/api/src/db/db.test.ts`** — Added `stripeEvents` table assertions (4 columns, SQL name mapping)
- **`apps/api/src/features/billing/billing.test.ts`** — Updated 2 existing + added 5 new webhook tests:
  - Idempotency: duplicate event returns 200 without re-processing
  - `customer.subscription.updated`: updates status + tier
  - `customer.subscription.deleted`: sets canceled, reverts to free
  - `invoice.payment_succeeded`: sets active
  - `invoice.payment_failed`: sets past_due

### Dependencies
- Added `pino` to `apps/api`

## Verification
- TypeScript: 0 errors in both `apps/api` and `apps/web`
- API tests: 220/222 pass (2 pre-existing failures in `render.job.test.ts`)
- Web tests: 290/290 pass

## Architecture Notes
- Idempotency uses the same `onConflictDoNothing().returning()` pattern as `quotaUsage.service.ts`
- Pending downgrade is applied during `subscription.updated` and `invoice.payment_succeeded` events when effective date has passed
- `handleSubscriptionDeleted` always reverts to free tier (no partial cancellation)
- Story 6-7 will add retry count tracking and account suspension on `invoice.payment_failed`
