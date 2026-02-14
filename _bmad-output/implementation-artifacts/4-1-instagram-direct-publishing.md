# Story 4-1: Instagram Direct Publishing — Free Tier

**Status:** done
**Epic:** 4 — Multi-Platform Distribution
**Depends on:** Story 1-6 (Social Media OAuth Connection), Epic 2 (Auto-Montage), Epic 3 (Content Creation)

## Overview

Enable free-tier users to publish content (posts, carousels, reels) directly to Instagram via the Instagram Graph API Container flow. Includes full publish pipeline: database schema, Instagram API integration, BullMQ job worker, REST endpoints, and frontend publish dialog with polling status.

## Acceptance Criteria

| AC  | Criterion              | Details                                                             |
| --- | ---------------------- | ------------------------------------------------------------------- |
| AC1 | Publish to Instagram   | User can publish draft content to connected Instagram account       |
| AC2 | Container API Flow     | Uses Instagram Container API: create → poll → publish → permalink   |
| AC3 | Content Type Support   | Supports post (single image), carousel, and reel publishing         |
| AC4 | Status Tracking        | Publish jobs tracked in DB with status polling on frontend          |
| AC5 | Error Handling         | Failed publishes retry 3x with exponential backoff via BullMQ       |
| AC6 | Platform Gating        | Only Instagram available for free tier; other platforms show lock    |
| AC7 | Connection Check       | Publish button requires active Instagram connection                  |

## Implementation Plan

See plan file: `C:\Users\Utilisateur\.claude\plans\cozy-churning-aurora.md`

---

## Dev Agent Record

### Files Created
- `apps/api/src/db/schema/publishJobs.ts` — publish_jobs table with publishStatusEnum, 3 indexes
- `apps/api/migrations/0004_clumsy_the_watchers.sql` — Migration for publish_jobs + api_cost_logs tables
- `apps/api/src/features/publishing/publishing.service.ts` — publishToInstagram, getPublishStatus, listPlatformConnections
- `apps/api/src/features/publishing/publishing.controller.ts` — publishContentHandler, getPublishStatusHandler, listPlatformConnectionsHandler
- `apps/api/src/jobs/publish.job.ts` — processPublishJob worker with type-specific flows (post/carousel/reel), startPublishWorker
- `apps/api/src/features/publishing/publishing.test.ts` — 9 API tests
- `apps/web/src/features/content/hooks/usePublishContent.ts` — useMutation for POST publish
- `apps/web/src/features/content/hooks/usePublishStatus.ts` — Polling hook (3s interval while pending/publishing)
- `apps/web/src/features/content/hooks/usePlatformConnections.ts` — Uses existing GET /api/auth/connections
- `apps/web/src/features/content/components/PublishConfirmDialog.tsx` — Modal with 6 platforms, Instagram available, others locked
- `apps/web/src/features/content/components/PublishConfirmDialog.test.tsx` — 9 tests

### Files Modified
- `apps/api/src/db/schema/index.ts` — Added `export * from './publishJobs'`
- `apps/api/src/services/instagram.service.ts` — Added 5 publishing functions: createMediaContainer, checkContainerStatus, pollContainerUntilReady, publishContainer, getMediaPermalink
- `apps/api/src/jobs/queues.ts` — Added PublishJobData interface, getPublishQueue singleton, addPublishJob helper
- `apps/api/src/features/content/content.routes.ts` — Added publishLimiter, POST /:id/publish, GET /:id/publish-status routes
- `apps/api/src/index.ts` — Import and start publish worker alongside render worker
- `apps/web/src/features/content/pages/ContentPreviewPage.tsx` — Integrated publish hooks, dialog, status-aware button states
- `apps/web/src/features/content/pages/ContentPreviewPage.test.tsx` — Updated with new hook mocks + 3 new publish tests
- `packages/shared/src/schemas/content.schema.ts` — Added publishContentSchema
- `packages/shared/src/index.ts` — Exported publishContentSchema and PublishContentInput

### Reused Infrastructure (no changes needed)
- `apps/api/src/features/auth/platformConnection.routes.ts` — Existing GET /api/auth/connections endpoint
- `apps/api/src/lib/encryption.ts` — AES-256-GCM encrypt/decrypt for access tokens
- `apps/api/src/lib/resilience.ts` — withRetry, withTimeout utilities
- `apps/api/src/services/costTracker.ts` — logCost for tracking API usage
- `apps/api/src/services/r2.service.ts` — generatePresignedDownloadUrl for media URLs

### Test Results
- API: 133 tests pass (14 files, +9 new publishing tests)
- Web: 174 tests pass (23 files, +17 new tests), 1 pre-existing failure (layout.test.tsx sidebar toggle — unrelated)
- TypeScript: 0 errors on both apps/api and apps/web

### Architecture Notes
- **Instagram Container API flow**: createContainer → pollStatus (3s intervals, max 40 attempts) → publish → getPermalink
- **Carousel publishing**: creates child containers first, then parent with children IDs
- **BullMQ publish queue**: 3 attempts, exponential backoff (5s initial), concurrency 2
- **Status transitions**: draft → scheduled (on enqueue) → publishing (worker picks up) → published/failed
- **Frontend polling**: usePublishStatus polls every 3s while status is pending/publishing/retrying, auto-stops on published/failed
