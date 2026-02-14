# Story 6-4: Quota Enforcement System

## Implementation Summary

Enforced credit-based quotas on content creation (reels, carousels) and duplication. Posts have no quota. On quota exhaustion, the API returns HTTP 429 with `QUOTA_EXCEEDED` code and an upgrade CTA message. Frontend pages display a toast with the server's message.

## What Was Done

### Backend

1. **`apps/api/src/services/quota.service.ts`** — Updated the `QUOTA_EXCEEDED` error message from `'Not enough credits'` to `'Not enough credits. Upgrade your plan for more.'` to include an upgrade CTA.

2. **`apps/api/src/features/content/content.service.ts`** — Added credit check to `duplicateContentItem()`. The function now calls `checkAndDecrementCredits(userId, creditOp)` before inserting the duplicate, and `restoreCredits()` on failure. (`createContentItem()` already had credit enforcement for reels and carousels.)

### Frontend

3. **`apps/web/src/features/content/pages/CreateReelPage.tsx`** — Updated catch block to detect `QUOTA_EXCEEDED` error code and display the server's message via `toast.error()`.

4. **`apps/web/src/features/content/pages/CreateCarouselPage.tsx`** — Same QUOTA_EXCEEDED handling pattern.

5. **`apps/web/src/features/content/hooks/useDuplicateContent.ts`** — Updated `onError` callback to detect `QUOTA_EXCEEDED` and show upgrade CTA toast.

### Tests

6. **`apps/api/src/features/content/content.test.ts`** — Fixed mock names (`checkAndDecrementQuota` → `checkAndDecrementCredits`, `restoreQuota` → `restoreCredits`). Added 6 new tests:
   - `should return 429 when reel credit quota is exceeded`
   - `should return 429 when carousel credit quota is exceeded`
   - `should call checkAndDecrementCredits with createReel for reel creation`
   - `should call checkAndDecrementCredits with createCarousel for carousel creation`
   - `should not check credits for post creation`
   - `should return 429 when duplicating with exceeded quota`

7. **`apps/api/src/db/db.test.ts`** — Fixed quota_usage table assertions from old per-resource columns (12 columns) to new credit-based columns (8 columns: creditsUsed, creditsLimit, platformsConnected, platformsLimit).

8. **`apps/api/src/features/quota/quota.test.ts`** — Updated mock from `getOrCreateQuotaUsage` to `getOrCreateCreditUsage`, updated mock data to credit-based format, updated assertions to match new `getUserQuota` response shape (`creditsUsed`, `creditsLimit`, `percentage`).

## Architecture Notes

- The codebase uses a **unified credit system** (not per-resource quotas). Each operation costs a fixed number of credits: `createReel` (5), `createCarousel` (1), `generateAiImage` (3), `regenerateCopy` (1), `publishAyrshare` (1).
- Credit limits per tier: free (35), starter (200), pro (700), business (2000), agency (7000).
- `checkAndDecrementCredits()` uses an atomic SQL `UPDATE ... WHERE creditsUsed + cost <= creditsLimit` to prevent race conditions.
- `restoreCredits()` rolls back on downstream failure using `GREATEST(creditsUsed - cost, 0)`.
- Posts have no credit cost and bypass quota checks entirely.

## Test Results

- **API**: 213/215 tests pass (2 pre-existing failures in `render.job.test.ts` — unrelated `downloadBuffer` mock issue)
- **Web**: 281/281 tests pass
- **TypeScript API**: 0 errors
- **TypeScript Web**: 3 pre-existing errors in `QuotaIndicator.tsx`/`useQuota.ts` (old `QuotaResource`/`QuotaUsage` type references from credit migration)

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/services/quota.service.ts` | Upgrade CTA in error message |
| `apps/api/src/features/content/content.service.ts` | Credit check in `duplicateContentItem()` |
| `apps/web/src/features/content/pages/CreateReelPage.tsx` | QUOTA_EXCEEDED error handling |
| `apps/web/src/features/content/pages/CreateCarouselPage.tsx` | QUOTA_EXCEEDED error handling |
| `apps/web/src/features/content/hooks/useDuplicateContent.ts` | QUOTA_EXCEEDED error handling |
| `apps/api/src/features/content/content.test.ts` | Fixed mocks + 6 new tests |
| `apps/api/src/db/db.test.ts` | Fixed quota column assertions |
| `apps/api/src/features/quota/quota.test.ts` | Fixed to credit-based system |
