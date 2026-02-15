# Story 7-1: Admin Dashboard — System Health

## Status: Done

## What Was Built

Implemented system health monitoring for admin users (FR25). Admin dashboard displays key metrics: publish success rate, published/failed counts (30d), active users today, total users, total content items, and today's API cost.

## Key Files

### Backend
- **`apps/api/src/features/admin/admin.service.ts`** — `getSystemHealth()`:
  - 5 parallel DB queries: publish stats (COUNT + COUNT FILTER), active users today (COUNT DISTINCT), total users, total content, API cost today (SUM + COALESCE)
  - Computes success rate from published/total ratio
- **`apps/api/src/features/admin/admin.controller.ts`** — `systemHealth`: calls service, returns `{ data }`
- **`apps/api/src/features/admin/admin.routes.ts`** — `GET /api/admin/health` behind `requireAdmin`

### Middleware
- **`apps/api/src/middleware/requireAdmin.middleware.ts`** — checks `isAuthenticated()` (401) + `role === 'admin'` (403)

### Frontend
- **`apps/web/src/features/admin/pages/AdminPage.tsx`** — `HealthTab` component:
  - Fetches `GET /api/admin/health` via TanStack Query
  - Displays 7 stat cards in responsive grid
  - Color-coded: green for high success rate, red for failures

### Tests
- **`apps/api/src/features/admin/admin.test.ts`** — 3 tests:
  - 401 when not authenticated
  - 403 when not admin
  - Returns system health metrics (service-level mock)
- **`apps/web/src/features/admin/pages/AdminPage.test.tsx`** — 1 test:
  - Renders Health tab by default with metrics

## Verification
- TypeScript: 0 errors
- API tests: 244/246 pass (2 pre-existing in render.job.test.ts)
- Web tests: 303/303 pass

## Architecture Notes
- All admin routes share `adminLimiter` (200 req/15min) + `requireAdmin` middleware
- Service-level mocking in tests avoids fragile DB-level mocking of complex SQL (COUNT FILTER, COALESCE, etc.)
- Two auth helpers: `getAdminAgent()` (role: 'admin') and `getAuthenticatedAgent()` (role: 'user')
