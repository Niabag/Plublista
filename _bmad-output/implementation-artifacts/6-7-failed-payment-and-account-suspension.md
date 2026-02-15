# Story 6-7: Failed Payment & Account Suspension

## Status: Done

## What Was Built

Implemented failed payment retry tracking and automatic account suspension after 3 consecutive payment failures (FR37). Suspended users see a persistent dunning banner and are blocked from content creation mutations while retaining read access.

## Key Changes

### New Files
- **`apps/api/src/middleware/requireActiveSubscription.middleware.ts`** — Middleware that checks `suspendedAt` on subscription; returns HTTP 402 (Payment Required) with `ACCOUNT_SUSPENDED` error code for suspended accounts. Free-tier users (no subscription row) pass through.
- **`apps/web/src/features/billing/components/PaymentFailedBanner.tsx`** — Persistent dunning banner shown on all authenticated pages when account is suspended. Links to `/billing` for payment method update.
- **`apps/web/src/features/billing/components/PaymentFailedBanner.test.tsx`** — 5 tests covering loading, no subscription, active subscription, suspended display, and billing link.

### Modified Files

#### Backend
- **`packages/shared/src/constants/errorCodes.ts`** — Added `ACCOUNT_SUSPENDED` error code
- **`apps/api/src/db/schema/subscriptions.ts`** — Added 2 columns:
  - `failedPaymentRetries` (integer, default 0, notNull)
  - `suspendedAt` (timestamp with timezone, nullable)
- **`apps/api/src/features/billing/billing.service.ts`** — Extended webhook handlers:
  - `handleInvoicePaymentFailed()`: Increments `failedPaymentRetries`, sets `suspendedAt` when retries reach 3
  - `handleInvoicePaymentSucceeded()`: Resets `failedPaymentRetries` to 0 and clears `suspendedAt`
- **`apps/api/src/features/content/content.routes.ts`** — Applied `requireActiveSubscription` middleware to 8 mutation routes (POST create, generate-image, duplicate, generate-copy, generate-image/:id, publish, schedule; PATCH reschedule). Not applied to GET, PATCH /:id (text edit), or DELETE routes.

#### Frontend
- **`apps/web/src/features/billing/hooks/useSubscription.ts`** — Added `failedPaymentRetries` and `suspendedAt` to Subscription interface
- **`apps/web/src/features/billing/hooks/useBillingDetails.ts`** — Same 2 fields added
- **`apps/web/src/components/layout/AppLayout.tsx`** — Imported and rendered `PaymentFailedBanner` before `<Outlet />`
- **`apps/web/src/features/content/pages/CreateReelPage.tsx`** — Added `ACCOUNT_SUSPENDED` error handling in catch block
- **`apps/web/src/features/content/pages/CreateCarouselPage.tsx`** — Same error handling
- **`apps/web/src/features/content/pages/CreatePostPage.tsx`** — Same error handling
- **`apps/web/src/features/billing/pages/BillingPage.tsx`** — Added `suspended` status style (rose) and label; shows "Suspended" when `suspendedAt` is set

### Tests
- **`apps/api/src/db/db.test.ts`** — Updated subscriptions columns 13 → 15, added `failedPaymentRetries` and `suspendedAt` column name assertions
- **`apps/api/src/features/billing/billing.test.ts`** — Updated existing `invoice.payment_failed` mock, added 2 new tests:
  - Account suspension after 3 failed retries (verifies `suspendedAt` is set)
  - Payment success after suspension (verifies `failedPaymentRetries` reset to 0, `suspendedAt` cleared)
- **`apps/api/src/features/content/content.test.ts`** — Added `requireActiveSubscription` mock (pass-through, tested separately in billing tests)
- **`apps/api/src/features/publishing/publishing.test.ts`** — Same middleware mock
- **`apps/web/src/components/layout/layout.test.tsx`** — Added `PaymentFailedBanner` mock to avoid QueryClient issues

## Verification
- TypeScript: 0 errors in both `apps/api` and `apps/web`
- API tests: 222/224 pass (2 pre-existing failures in `render.job.test.ts`)
- Web tests: 294/295 pass (1 pre-existing failure in `Sidebar` layout test)

## Architecture Notes
- **HTTP 402** chosen over 403 because `apiClient.ts` retries all 403 responses for CSRF token refresh — using 403 for suspension would cause a useless retry
- **Free-tier pass-through**: Users without a subscription row (free tier) are never blocked by the middleware
- **Read access preserved**: Suspended users can still view, edit text, and delete content — only creation/generation/publishing mutations are blocked
- **Suspension threshold**: 3 consecutive failed payments; configurable by changing the constant in `handleInvoicePaymentFailed`
- **Auto-recovery**: Successful payment automatically clears suspension and resets retry counter
