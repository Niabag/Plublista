# Story 6-2: Subscription Management (Upgrade/Downgrade)

## Summary
Added plan change functionality allowing subscribed users to upgrade (immediate with Stripe proration) or downgrade (deferred to end of billing period) their subscription tier. Includes pending downgrade cancellation.

## Changes

### Backend — Database
- **`apps/api/src/db/schema/subscriptions.ts`** — Added 2 nullable columns to `subscriptions` table:
  - `pendingTier` — target tier for a scheduled downgrade
  - `pendingTierEffectiveDate` — timestamp when the downgrade applies (= currentPeriodEnd)

### Backend — Stripe Service
- **`apps/api/src/services/stripe.service.ts`** — Added `updateSubscriptionPrice(stripeSubscriptionId, newTier, userId)`:
  - Retrieves Stripe subscription to get `items[0].id`
  - Calls `stripe.subscriptions.update()` with new price ID and `proration_behavior: 'create_prorations'`
  - Logs cost via `logCost`, returns updated Stripe subscription

### Backend — Billing Service
- **`apps/api/src/features/billing/billing.service.ts`** — Refactored and extended:
  - **Extracted** `updateQuotaLimitsForTier(userId, tier)` as reusable helper
  - **Added** `changePlan(userId, newTier)` — validates subscription state, determines direction via `getTierChangeDirection()`, dispatches to upgrade or downgrade flow
  - **Upgrade path**: Calls `updateSubscriptionPrice()` immediately, updates subscription record (tier, clears pending fields, updates period dates), updates user tier, updates quotas
  - **Downgrade path**: Stores `pendingTier` and `pendingTierEffectiveDate` without touching Stripe — user keeps current tier until period end (Story 6-6 webhook will apply the change)
  - **Added** `cancelPendingDowngrade(userId)` — clears pending downgrade fields

### Backend — Controller & Routes
- **`apps/api/src/features/billing/billing.controller.ts`** — Added `changePlanHandler` and `cancelPendingDowngradeHandler`
- **`apps/api/src/features/billing/billing.routes.ts`** — Added:
  - `POST /change-plan` — billingLimiter, requireAuth, csrfSynchronisedProtection, validate(checkoutSchema)
  - `POST /cancel-downgrade` — billingLimiter, requireAuth, csrfSynchronisedProtection

### Shared Package
- **`packages/shared/src/constants/pricingConfig.ts`** — Added tier comparison utilities:
  - `tierIndex(tier)` — returns position in `TIER_ORDER` array
  - `getTierChangeDirection(from, to)` — returns `'upgrade' | 'downgrade' | 'same'`
- **`packages/shared/src/index.ts`** — Exported `tierIndex`, `getTierChangeDirection`

### Frontend — Hooks
- **`apps/web/src/features/billing/hooks/useSubscription.ts`** — Added `pendingTier` and `pendingTierEffectiveDate` to `Subscription` interface
- **`apps/web/src/features/billing/hooks/useChangePlan.ts`** — New mutation hook: POST `/api/billing/change-plan`, shows upgrade/downgrade toast, invalidates subscription + session queries
- **`apps/web/src/features/billing/hooks/useCancelDowngrade.ts`** — New mutation hook: POST `/api/billing/cancel-downgrade`, invalidates subscription query

### Frontend — PricingPage Overhaul
- **`apps/web/src/features/billing/pages/PricingPage.tsx`** — Major overhaul:
  - Extracted `getButtonConfig()` function with 6 button states: Current Plan, Free (disabled), Downgrade Pending, Start Free Trial (no subscription), Upgrade (emerald green), Downgrade (outline)
  - Added pending downgrade amber banner with "Cancel Downgrade" button
  - Loading states: "Upgrading...", "Processing...", "Redirecting...", "Canceling..."

## Test Results
- **API**: 206/206 passed (10 new change-plan + cancel-downgrade tests)
- **Web**: 268/268 passed (9 new PricingPage tests for subscribed states + pending banner)
- **TypeScript**: 0 errors in both apps

## New/Updated Tests
- **`apps/api/src/features/billing/billing.test.ts`** — Added 10 tests:
  - POST /change-plan: 401 unauth, 400 invalid tier, 404 no subscription, 400 same tier, upgrade (calls Stripe mock + returns upgrade direction), downgrade (does NOT call Stripe + sets pendingTier)
  - POST /cancel-downgrade: 401 unauth, 404 no subscription, 400 no pending downgrade, success (clears pending fields)
- **`apps/web/src/features/billing/pages/PricingPage.test.tsx`** — Added 9 tests across 3 new describe blocks:
  - Subscribed Starter user: Current Plan, 3 Upgrade buttons, changePlan click, no trial buttons
  - Subscribed Pro user: 1 Downgrade + 2 Upgrade, downgrade click
  - Pending downgrade: banner renders, "Downgrade Pending" disabled button, cancel downgrade click

## Architecture Decisions
- **Upgrades = immediate**: Stripe subscription updated with proration, local DB updated in same request. User gets new tier limits immediately.
- **Downgrades = deferred**: Only stores intent locally (`pendingTier` + `pendingTierEffectiveDate`). Stripe subscription remains unchanged. User keeps current tier benefits until period end. Story 6-6 webhook (`invoice.paid` / `customer.subscription.updated`) will apply the actual tier change.
- **Reused `checkoutSchema`**: Same `{ tier }` Zod validation for both checkout and change-plan endpoints.
- **`getTierChangeDirection` in shared package**: Used by both backend (billing.service) and frontend (PricingPage) to determine upgrade/downgrade/same direction.
