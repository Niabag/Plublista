# Story 4-4: Auto-Retry & Format Conversion

## Status: Complete

## Summary

Implemented intelligent retry logic with custom backoff timing (1min/5min/15min), error classification (transient/format/permanent), automatic .webp→.jpg media format conversion on format errors, and `'retrying'` content status propagation to the frontend.

## Changes

### Shared Package
- **`packages/shared/src/types/content.types.ts`** — Added `'retrying'` to `ContentStatus` union type

### Database
- **`apps/api/src/db/schema/contentItems.ts`** — Added `'retrying'` to `contentStatusEnum`
- **`apps/api/migrations/0006_nasty_sharon_carter.sql`** — Migration: `ALTER TYPE "public"."content_status" ADD VALUE 'retrying'`

### Backend — Error Classification
- **`apps/api/src/jobs/errors.ts`** (new) — Error classification module:
  - `PermanentPublishError` — thrown for permanent errors to skip retries
  - `MediaFormatError` — thrown for format errors with original file key
  - `classifyError(error)` — categorizes errors as `transient | format | permanent | unknown` using regex patterns

### Backend — Media Conversion
- **`apps/api/src/services/mediaConversion.service.ts`** (new) — Sharp-based media conversion:
  - `isWebpFile(fileKey)` — checks if file is .webp
  - `convertWebpToJpg(fileKey, userId, contentItemId)` — downloads from R2, converts via sharp, uploads as .jpg
  - `convertMediaForPlatform(mediaKeys, userId, contentItemId)` — batch convert .webp files

### Backend — R2 Service
- **`apps/api/src/services/r2.service.ts`** — Added `downloadBuffer(fileKey)` function

### Backend — Queue & Workers
- **`apps/api/src/jobs/queues.ts`** — Changed publish and ayrshare queue backoff to `{ type: 'custom' }`
- **`apps/api/src/jobs/publish.job.ts`** — Major updates:
  - Custom backoff strategy: `[60_000, 300_000, 900_000]` (1min, 5min, 15min) on both workers
  - `processPublishJob`: try/catch around Instagram API calls with error classification
    - Format errors: trigger media conversion, update `mediaUrls` in DB for next retry
    - Permanent errors: wrap in `PermanentPublishError` to trigger `job.discard()`
  - Both `on('failed')` handlers: error classification, content status `'retrying'`, `job.discard()` for permanent errors

### Frontend
- **`apps/web/src/features/content/components/StatusBadge.tsx`** — Added `retrying` config: amber background + `animate-pulse`

### Tests
- **`apps/api/src/jobs/errors.test.ts`** (new) — 19 tests for error classification
- **`apps/api/src/services/mediaConversion.service.test.ts`** (new) — 5 tests for media conversion
- **`apps/api/src/db/db.test.ts`** — Updated contentStatusEnum assertion
- **`apps/web/src/features/content/components/StatusBadge.test.tsx`** — Added retrying badge + pulse tests

## Test Results
- **API**: 159 tests pass (16 files)
- **Web**: 207 tests pass (26 files) — 1 pre-existing failure (layout.test.tsx, unrelated)
- **TypeScript**: 0 errors on both apps

## Acceptance Criteria Met
- [x] Custom backoff: 1min → 5min → 15min (3 attempts)
- [x] Error classification: transient (retry), format (convert + retry), permanent (fail immediately)
- [x] .webp → .jpg conversion on format error, next retry uses converted file
- [x] Permanent errors skip remaining retries via `job.discard()`
- [x] Content item status set to `'retrying'` during retries
- [x] StatusBadge displays amber pulsing "Retrying" badge
- [x] DB migration adds `'retrying'` to content_status enum
