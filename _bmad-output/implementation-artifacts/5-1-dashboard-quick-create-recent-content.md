# Story 5-1: Dashboard with Quick-Create & Recent Content

## Status: Complete

## Summary

Replaced the placeholder DashboardPage with a full dashboard composed of three sections: Quick-Create buttons (New Reel, New Carousel, New Post), a Quota Overview widget, and a Recent Content grid. Frontend-only story — all backend endpoints already existed.

## Changes

### Frontend — DashboardPage
- **`apps/web/src/features/dashboard/pages/DashboardPage.tsx`** (rewritten):
  - **Quick Create section**: 3-column responsive grid with Link cards to `/create/reel`, `/create/carousel`, `/create/post` — reuses CreatePage styling pattern
  - **Quota Overview section**: `QuotaIndicator` component in a bordered card — handles its own loading/error states
  - **Recent Content section**: `useContentList()` hook + `ContentCard` components in a responsive grid (`1/2/3/4` columns)
  - `ContentSkeletonGrid` — 8 `animate-pulse` skeleton cards during loading
  - `EmptyState` — centered icon + message + CTA Link to `/create`
  - `ErrorState` — error message + retry button
  - Limits display to 8 most recent items, shows "View all" link to `/library` when more exist

### Tests
- **`apps/web/src/features/dashboard/pages/DashboardPage.test.tsx`** (new) — 7 tests:
  1. Renders quick-create links with correct hrefs
  2. Renders QuotaIndicator widget
  3. Shows skeleton loading state when content is pending
  4. Displays content cards when items are returned
  5. Shows empty state with CTA when no content exists
  6. Shows error state with retry button when loading fails
  7. Limits display to 8 items and shows View all link

## Test Results
- **Web**: 216 tests pass (28 files) — 1 pre-existing failure (layout.test.tsx, unrelated)
- **TypeScript**: 0 errors

## Acceptance Criteria Met
- [x] AC1 — Quick-Create Buttons: "New Reel", "New Carousel", "New Post" linking to creation pages
- [x] AC2 — Recent Content Grid: visual card grid using ContentCard, ordered by creation date
- [x] AC3 — Content Card Info: thumbnail, title, status badge, type icon, creation date
- [x] AC4 — Quota Widget: QuotaIndicator with color-coded progress bars
- [x] AC5 — Loading States: skeleton states while content loads
- [x] AC6 — Responsive Grid: 1 col mobile, 2 tablet, 3 desktop, 4 xl
- [x] AC7 — Empty State: friendly message with CTA to create content
- [x] AC8 — Tests: 7 tests covering all dashboard scenarios

## Reused Components
| Component | Location |
|-----------|----------|
| `ContentCard` | `apps/web/src/features/content/components/ContentCard.tsx` |
| `QuotaIndicator` | `apps/web/src/features/auth/components/QuotaIndicator.tsx` |
| `useContentList` | `apps/web/src/features/content/hooks/useContentList.ts` |
| `StatusBadge` | `apps/web/src/features/content/components/StatusBadge.tsx` (via ContentCard) |
