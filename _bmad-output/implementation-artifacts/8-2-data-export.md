# Story 8-2: Data Export

## Status: Done

## What Was Built

Implemented GDPR-compliant data export (FR29, NFR30). Users can export all their personal data as a JSON file, accessible via a 7-day presigned download URL.

## Key Files

### Backend
- **`apps/api/src/features/gdpr/gdpr.service.ts`** — `exportUserData(userId)`:
  1. Queries 9 tables in parallel via `Promise.all`:
     - User profile (no passwordHash), content items, platform connections (no tokens), subscription, quota usage, publish jobs, API cost logs, audit logs, TV scans
  2. Serializes to JSON and uploads to R2 at `exports/{userId}/{timestamp}-data-export.json`
  3. Generates 7-day presigned download URL
- **`apps/api/src/features/gdpr/gdpr.controller.ts`** — `handleExportData`: calls service, returns `{ downloadUrl }`
- **`apps/api/src/features/gdpr/gdpr.routes.ts`** — `POST /api/gdpr/export` with rate limit (3/hour), auth, CSRF

### Frontend
- **`apps/web/src/features/auth/pages/SettingsPage.tsx`** — "Export my data" button:
  - Calls `POST /api/gdpr/export`
  - Opens download URL in new tab
  - Shows toast on success/error

### Tests
- **`apps/api/src/features/gdpr/gdpr.test.ts`** — 3 tests:
  - 401 when not authenticated
  - Exports user data and returns download URL (verifies R2 upload + presigned URL)
  - Handles user with no data gracefully (empty arrays still produce valid JSON)

## Verification
- TypeScript: 0 errors
- API tests: 230/232 pass (2 pre-existing in render.job.test.ts)
- Web tests: 298/298 pass

## Architecture Notes
- Sensitive data excluded: `passwordHash` and platform `accessToken`/`refreshToken` are never included in exports
- Parallel queries for performance (9 tables queried simultaneously)
- Export files stored in R2 with 7-day expiry — no permanent storage of export copies
- Rate limited to 3 requests/hour to prevent abuse
