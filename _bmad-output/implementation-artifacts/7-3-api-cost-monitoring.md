# Story 7-3: API Cost Monitoring

## Status: Done

## What Was Built

Implemented API cost monitoring for admin users (FR27). Admin dashboard shows cost breakdown by service, top users by cost, and daily cost trend with visual bar chart.

## Key Files

### Backend
- **`apps/api/src/features/admin/admin.service.ts`** — `getApiCosts(filters)`:
  - 3 queries: cost by service (GROUP BY), cost by user (INNER JOIN + GROUP BY, top 20), daily trend (GROUP BY date)
  - Uses COALESCE + SUM for cost aggregation, `::date` cast for daily bucketing
- **`apps/api/src/features/admin/admin.controller.ts`** — `apiCosts`: parses `days` query param
- **`apps/api/src/features/admin/admin.routes.ts`** — `GET /api/admin/costs`

### Frontend
- **`apps/web/src/features/admin/pages/AdminPage.tsx`** — `CostsTab` component:
  - "Cost by Service (30 days)" — cards with service name, cost, request count
  - "Top Users by Cost" — table with user, tier, cost, requests
  - "Daily Trend" — scrollable table with proportional bar chart per day

### Tests
- **`apps/api/src/features/admin/admin.test.ts`** — 1 test:
  - Returns cost data with byService, byUser, dailyTrend arrays
- **`apps/web/src/features/admin/pages/AdminPage.test.tsx`** — 1 test:
  - Renders Costs tab with section headings and data

## Verification
- TypeScript: 0 errors
- API tests: 244/246 pass (2 pre-existing)
- Web tests: 303/303 pass
