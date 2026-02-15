# Story 8-1: Account Deletion with Cascade

## Status: Done

## What Was Built

Implemented GDPR-compliant account deletion (FR28, NFR29). Users can permanently delete their account via the Settings page, which cascades to all related data: Stripe subscription, R2 files, and all database records.

## Key Files

### Backend
- **`apps/api/src/features/gdpr/gdpr.service.ts`** — `deleteAccount(userId)`:
  1. Cancels Stripe subscription (non-fatal on failure)
  2. Deletes all R2 files under `users/{userId}/` (non-fatal on failure)
  3. Deletes user from DB — cascade via `onDelete: 'cascade'` on all FK references
- **`apps/api/src/features/gdpr/gdpr.controller.ts`** — `handleDeleteAccount`: calls service, destroys session, clears cookie
- **`apps/api/src/features/gdpr/gdpr.routes.ts`** — `DELETE /api/gdpr/account` with rate limit (3/hour), auth, CSRF

### Frontend
- **`apps/web/src/features/auth/pages/SettingsPage.tsx`** — "Data & Privacy" section with:
  - "Delete my account" button opens AlertDialog
  - Requires typing "DELETE" to confirm
  - Calls `DELETE /api/gdpr/account`, logs out on success

### Database Cascade
All tables reference `users.id` with `onDelete: 'cascade'`:
- `contentItems`, `platformConnections`, `subscriptions`, `quotaUsage`, `publishJobs`, `apiCostLogs`, `auditLogs`, `tvScans`

### Tests
- **`apps/api/src/features/gdpr/gdpr.test.ts`** — 5 tests:
  - 401 when not authenticated
  - Deletes account with active Stripe subscription
  - Deletes account without subscription (no Stripe call)
  - Handles Stripe cancellation failure gracefully
  - Handles R2 deletion failure gracefully
- **`apps/web/src/features/auth/pages/SettingsPage.test.tsx`** — 3 tests:
  - Renders Data & Privacy section with buttons
  - Opens delete dialog on click
  - Delete button disabled until "DELETE" is typed

## Verification
- TypeScript: 0 errors
- API tests: 230/232 pass (2 pre-existing in render.job.test.ts)
- Web tests: 298/298 pass

## Architecture Notes
- Non-fatal error handling: Stripe and R2 failures are logged but don't prevent account deletion
- Session destruction happens after DB deletion to ensure data is removed even if session cleanup fails
- Rate limited to 3 requests/hour to prevent abuse
- Database cascade ensures no orphaned records
