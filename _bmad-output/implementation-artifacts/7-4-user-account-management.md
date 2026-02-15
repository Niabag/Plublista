# Story 7-4: User Account Management

## Status: Done

## What Was Built

Implemented user account management for admin users. Admin dashboard provides user listing with search, user detail view, and quota adjustment with audit logging.

## Key Files

### Backend
- **`apps/api/src/features/admin/admin.service.ts`**:
  - `getUsers(filters)` — paginated user list with search (ILIKE) and tier filter
  - `getUserDetail(userId)` — full user profile + quota + platforms + content count + total cost
  - `adjustUserQuota(adminId, userId, updates)` — updates quota limits + inserts audit log
- **`apps/api/src/features/admin/admin.controller.ts`** — `listUsers`, `userDetail`, `adjustQuota`
- **`apps/api/src/features/admin/admin.routes.ts`**:
  - `GET /api/admin/users` — list with search/tier params
  - `GET /api/admin/users/:id` — detail view
  - `PATCH /api/admin/users/:id/quota` — validated with Zod schema (.refine for non-empty body)

### Frontend
- **`apps/web/src/features/admin/pages/AdminPage.tsx`** — `UsersTab` component:
  - Search input for email/name filtering
  - Table: User, Role, Tier, Signed Up, Actions
  - Inline quota adjustment: "Adjust Quota" → input + Save/Cancel
  - Uses `useMutation` for PATCH + query invalidation on success

### Tests
- **`apps/api/src/features/admin/admin.test.ts`** — 5 tests:
  - GET /users returns user list
  - GET /users/:id returns user detail
  - GET /users/:id returns 404 for unknown user
  - PATCH /users/:id/quota adjusts quota (verifies adminId + userId forwarded)
  - PATCH /users/:id/quota returns 400 for empty body (Zod refine)
- **`apps/web/src/features/admin/pages/AdminPage.test.tsx`** — 1 test:
  - Renders Users tab with user table

## Verification
- TypeScript: 0 errors
- API tests: 244/246 pass (2 pre-existing)
- Web tests: 303/303 pass

## Architecture Notes
- Zod schema uses `.refine()` to require at least one field (creditsLimit or platformsLimit)
- Quota adjustment creates audit log with previous + updated values
