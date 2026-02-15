# Story 7-5: Token Refresh Management

## Status: Done

## What Was Built

Implemented token expiry monitoring for admin users. Admin dashboard shows platform connection tokens expiring within a configurable window (default 7 days), plus an audit log viewer.

## Key Files

### Backend
- **`apps/api/src/features/admin/admin.service.ts`**:
  - `getExpiringTokens(daysUntilExpiry)` — inner join platformConnections → users, filters by tokenExpiresAt <= threshold
  - `getAuditLogs(filters)` — paginated audit log with actor email (inner join), ordered by most recent
  - `logAuditAction(...)` — utility to insert audit log entries
- **`apps/api/src/features/admin/admin.controller.ts`** — `expiringTokens`, `auditLogsList`
- **`apps/api/src/features/admin/admin.routes.ts`**:
  - `GET /api/admin/tokens/expiring` — with optional `days` query param
  - `GET /api/admin/audit-logs` — with optional `limit`/`offset`

### Frontend
- **`apps/web/src/features/admin/pages/AdminPage.tsx`** — `TokensTab` component:
  - Shows count of expiring tokens
  - Table: User, Platform, Username, Expires
  - Color-coded: red + "(Expired)" for past tokens, yellow for upcoming
  - Empty state: "No expiring tokens"

### Tests
- **`apps/api/src/features/admin/admin.test.ts`** — 2 tests:
  - GET /tokens/expiring returns expiring tokens
  - GET /audit-logs returns audit log entries
- **`apps/web/src/features/admin/pages/AdminPage.test.tsx`** — 1 test:
  - Renders Tokens tab with expiring token data

## Verification
- TypeScript: 0 errors
- API tests: 244/246 pass (2 pre-existing)
- Web tests: 303/303 pass
