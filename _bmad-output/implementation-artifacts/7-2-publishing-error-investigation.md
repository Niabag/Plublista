# Story 7-2: Publishing Error Investigation

## Status: Done

## What Was Built

Implemented publishing error investigation for admin users (FR26). Admin dashboard displays a paginated, filterable list of failed publish jobs with user, content type, platform, error details, and attempt count.

## Key Files

### Backend
- **`apps/api/src/features/admin/admin.service.ts`** — `getPublishErrors(filters)`:
  - Inner joins `publishJobs` → `users` → `contentItems` for enriched error rows
  - Filters: platform, dateFrom, dateTo, limit, offset
  - Returns `{ rows, total }` with COUNT for pagination
- **`apps/api/src/features/admin/admin.controller.ts`** — `publishErrors`: parses query params, calls service
- **`apps/api/src/features/admin/admin.routes.ts`** — `GET /api/admin/errors`

### Frontend
- **`apps/web/src/features/admin/pages/AdminPage.tsx`** — `ErrorsTab` component:
  - Table with columns: User, Type, Platform, Error, Attempts, Date
  - Shows total count of failed jobs
  - Empty state: "No publishing errors"

### Tests
- **`apps/api/src/features/admin/admin.test.ts`** — 3 tests:
  - 403 when not admin
  - Returns error list with rows and total
  - Passes query filters (platform, dateFrom, dateTo) to service
- **`apps/web/src/features/admin/pages/AdminPage.test.tsx`** — 1 test:
  - Renders Errors tab with table and error data

## Verification
- TypeScript: 0 errors
- API tests: 244/246 pass (2 pre-existing)
- Web tests: 303/303 pass
