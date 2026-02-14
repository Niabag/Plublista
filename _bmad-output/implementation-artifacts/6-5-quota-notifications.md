# Story 6-5: Quota Notifications

## Implementation Summary

Migrated the QuotaIndicator component from the old per-resource quota system to the unified credit-based system, and added an amber warning banner that appears when credit usage reaches 80% with an "Upgrade for more" CTA link.

## What Was Done

### Frontend

1. **`apps/web/src/features/auth/hooks/useQuota.ts`** — Fixed type import from `QuotaUsage` (deleted type) to `CreditUsage`. Resolves pre-existing TS error.

2. **`apps/web/src/features/auth/components/QuotaIndicator.tsx`** — Full rewrite from 3 per-resource progress bars to a single credit usage bar. Shows "Credits: X / Y" with tier badge and "{remaining} credits remaining" text. Color-coded: green (<60%), amber (60-79%), rose (>=80%).

3. **`apps/web/src/features/auth/components/QuotaWarningBanner.tsx`** — New component. Self-contained, uses `useQuota()` internally. Renders an amber `role="alert"` banner when credit usage >= 80% with text "Credit usage at X% — Y credits remaining this month" and a `/pricing` upgrade link. Returns null when loading, error, or below threshold.

4. **`apps/web/src/features/dashboard/pages/DashboardPage.tsx`** — Added `<QuotaWarningBanner />` as first child of page container (above "Quick Create").

5. **`apps/web/src/features/content/pages/CreateReelPage.tsx`** — Added `<QuotaWarningBanner />` after header, before upload zone.

6. **`apps/web/src/features/content/pages/CreateCarouselPage.tsx`** — Added `<QuotaWarningBanner />` after header, before format selector.

7. **`apps/web/src/features/content/pages/CreatePostPage.tsx`** — Added `<QuotaWarningBanner />` after header, before format selector.

### Tests

8. **`apps/web/src/features/auth/components/QuotaIndicator.test.tsx`** — Full rewrite (7 tests): credit bar rendering, accessible progressbar, green/amber/rose thresholds, loading skeleton, error state.

9. **`apps/web/src/features/auth/components/QuotaWarningBanner.test.tsx`** — New test file (5 tests): renders at 80%+, upgrade link to /pricing, hidden below 80%, hidden while loading, hidden on error.

10. **`apps/web/src/features/dashboard/pages/DashboardPage.test.tsx`** — Added QuotaWarningBanner mock.

11. **`apps/web/src/features/content/pages/CreateReelPage.test.tsx`** — Added QuotaWarningBanner mock.

## Architecture Notes

- No backend changes needed — `GET /api/quotas` already returns `{ tier, creditsUsed, creditsLimit, percentage, period }` matching the `CreditUsage` type.
- TanStack Query deduplicates requests: both `QuotaIndicator` and `QuotaWarningBanner` call `useQuota()` on the same page (Dashboard) without causing duplicate API requests.
- The warning banner threshold is 80% — matching the color threshold in `QuotaIndicator` (rose at >=80%).

## Test Results

- **Web**: 36/36 test files pass, 290/290 tests pass
- **API**: 18/19 test files pass, 213/215 tests pass (2 pre-existing failures in `render.job.test.ts`)
- **TypeScript Web**: 0 errors (fixed 3 pre-existing errors)
- **TypeScript API**: 0 errors

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/features/auth/hooks/useQuota.ts` | Type fix (QuotaUsage -> CreditUsage) |
| `apps/web/src/features/auth/components/QuotaIndicator.tsx` | Full rewrite to single credit bar |
| `apps/web/src/features/auth/components/QuotaWarningBanner.tsx` | **New** — amber warning banner at 80% |
| `apps/web/src/features/dashboard/pages/DashboardPage.tsx` | Added QuotaWarningBanner |
| `apps/web/src/features/content/pages/CreateReelPage.tsx` | Added QuotaWarningBanner |
| `apps/web/src/features/content/pages/CreateCarouselPage.tsx` | Added QuotaWarningBanner |
| `apps/web/src/features/content/pages/CreatePostPage.tsx` | Added QuotaWarningBanner |
| `apps/web/src/features/auth/components/QuotaIndicator.test.tsx` | Rewritten (7 tests) |
| `apps/web/src/features/auth/components/QuotaWarningBanner.test.tsx` | **New** (5 tests) |
| `apps/web/src/features/dashboard/pages/DashboardPage.test.tsx` | Added banner mock |
| `apps/web/src/features/content/pages/CreateReelPage.test.tsx` | Added banner mock |
