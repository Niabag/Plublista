# Story 5-2: Content Scheduling — Implementation Artifact

## Summary

Implemented end-to-end content scheduling allowing users to schedule content for future publication via a calendar-based dialog. A BullMQ cron job polls every 60 seconds for due scheduled posts and dispatches them to the appropriate publish queue (direct Instagram for free tier, Ayrshare for paid multi-platform).

## Changes

### Shared Package

| File | Change |
|------|--------|
| `packages/shared/src/schemas/content.schema.ts` | Added `scheduleContentSchema` (platforms + ISO scheduledAt) and `ScheduleContentInput` type |
| `packages/shared/src/index.ts` | Exported new schema and type |

### Backend (apps/api)

| File | Change |
|------|--------|
| `src/features/publishing/publishing.service.ts` | Added `scheduleContent()`, `cancelSchedule()`, `getDueScheduledJobs()` |
| `src/features/publishing/publishing.controller.ts` | Added `scheduleContentHandler` and `cancelScheduleHandler` |
| `src/features/content/content.routes.ts` | Added `POST /:id/schedule` and `DELETE /:id/schedule` routes |
| `src/jobs/schedule.job.ts` | **New** — BullMQ cron worker (60s interval), queries due jobs, dispatches to publish queues |
| `src/index.ts` | Registered `startScheduleWorker()` |
| `src/db/db.test.ts` | Updated column count (18 → 19) to include `scheduledAt` |
| `src/jobs/schedule.job.test.ts` | **New** — 5 tests |

### Frontend (apps/web)

| File | Change |
|------|--------|
| `src/features/content/components/ScheduleDialog.tsx` | **New** — Calendar + hour/minute selects, platform selection, free-tier locking |
| `src/features/content/components/ScheduleDialog.test.tsx` | **New** — 9 tests |
| `src/features/content/hooks/useScheduleContent.ts` | **New** — schedule + cancel mutations with query invalidation |
| `src/features/content/pages/ContentPreviewPage.tsx` | Wired ScheduleDialog, scheduled state detection, Cancel Schedule button |
| `src/features/content/pages/ContentPreviewPage.test.tsx` | Added useScheduleContent mock, schedule dialog tests |

## Architecture Decisions

- **Cron over delayed jobs**: BullMQ repeatable job (every 60s) instead of delayed jobs to avoid TTL issues for long delays. Ensures content publishes within 60 seconds of scheduled time (NFR7).
- **Calendar UI**: shadcn Calendar + hour/minute selects for better UX and date enforcement (tomorrow+ minimum).
- **Object onConfirm signature**: `{ scheduledAt, platforms }` as single object to match API contract.

## Test Results

- **API**: 18 files, 179 tests — all pass
- **Web**: 29 files, 227 tests — all pass
- **TypeScript**: 0 errors in both apps

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/content-items/:id/schedule` | Schedule content (`{ platforms, scheduledAt }`) |
| DELETE | `/api/content-items/:id/schedule` | Cancel scheduled content |
