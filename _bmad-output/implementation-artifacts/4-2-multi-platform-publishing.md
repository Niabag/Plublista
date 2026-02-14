# Story 4-2: Multi-Platform Publishing via Ayrshare

**Status:** done
**Epic:** 4 — Multi-Platform Distribution
**Depends on:** Story 4-1 (Instagram Direct Publishing)

## Overview

Enable paid users to publish content to YouTube, TikTok, Facebook, LinkedIn, and X simultaneously via Ayrshare API. Free users continue using the direct Instagram Graph API (Story 4-1). Includes Ayrshare service integration, BullMQ worker, multi-select publish dialog, and real-time per-platform progress tracking.

## Acceptance Criteria

| AC  | Criterion              | Details                                                             |
| --- | ---------------------- | ------------------------------------------------------------------- |
| AC1 | Multi-Platform Publish | Paid users can publish to multiple platforms in a single action      |
| AC2 | Ayrshare Integration   | Uses Ayrshare API with per-user profile keys (encrypted, lazy creation) |
| AC3 | Platform Gating        | Free tier: Instagram only. Paid tiers: all 6 platforms via Ayrshare |
| AC4 | Multi-Select UI        | Publish dialog supports selecting multiple platforms with checkboxes |
| AC5 | Progress Tracking      | Real-time per-platform status dialog (publishing/success/failed)    |
| AC6 | Platform Connection    | Unconnected platforms show "Connect" link (Ayrshare connect URL)    |
| AC7 | Backward Compatible    | Free user + Instagram still uses direct Graph API (unchanged)       |

## Implementation Plan

See plan file: `C:\Users\Utilisateur\.claude\plans\cozy-churning-aurora.md`

---

## Dev Agent Record

### Files Created
- `apps/api/src/services/ayrshare.service.ts` — Ayrshare API client (createProfile, getConnectedPlatforms, publishPost, getPostStatus, retryPost)
- `apps/api/migrations/0005_outgoing_payback.sql` — Migration adding ayrshare_profile_key to users
- `apps/web/src/features/content/components/PublishProgressDialog.tsx` — Real-time per-platform publishing status dialog

### Files Modified
- `apps/api/src/db/schema/users.ts` — Added `ayrshareProfileKey` column (nullable text, encrypted)
- `apps/api/src/db/db.test.ts` — Updated users column count (9 → 10)
- `packages/shared/src/schemas/content.schema.ts` — Changed `platform: z.enum(['instagram'])` to `platforms: z.array(platformEnum).min(1).max(6)`, exported `platformEnum`
- `packages/shared/src/index.ts` — Exported `platformEnum`
- `apps/api/src/features/publishing/publishing.service.ts` — Added `getUserTier()`, `publishToMultiplePlatforms()`, `getAyrshareConnectionUrl()`
- `apps/api/src/features/publishing/publishing.controller.ts` — Updated `publishContentHandler` (routes free→Instagram / paid→Ayrshare), added `getAyrshareConnectionUrlHandler`
- `apps/api/src/jobs/queues.ts` — Added `AyrsharePublishJobData` interface, `getAyrshareQueue()`, `addAyrsharePublishJob()`
- `apps/api/src/jobs/publish.job.ts` — Added `processAyrsharePublishJob()`, `startAyrshareWorker()`
- `apps/api/src/index.ts` — Import and start Ayrshare worker
- `apps/api/src/features/content/content.routes.ts` — Added `/ayrshare-connect` route + import
- `apps/api/src/features/publishing/publishing.test.ts` — Updated to `platforms` array format, added getUserTier mocks, added empty array + invalid platform tests (10 tests)
- `apps/web/src/features/content/components/PublishConfirmDialog.tsx` — Rewritten: multi-select checkboxes, tier-based locking, connectedPlatforms prop, Connect link for Ayrshare
- `apps/web/src/features/content/components/PublishConfirmDialog.test.tsx` — Rewritten: 12 tests for multi-select, tier gating, Connect link, disabled state
- `apps/web/src/features/content/hooks/usePublishContent.ts` — Changed `platform: string` → `platforms: string[]`, dynamic toast
- `apps/web/src/features/content/hooks/usePlatformConnections.ts` — Added Ayrshare query (GET /ayrshare-connect), merged connectedPlatforms, `userTier` param
- `apps/web/src/features/content/hooks/usePublishStatus.ts` — Returns `jobs` array (not just latest), polls while any job active
- `apps/web/src/features/content/pages/ContentPreviewPage.tsx` — Integrated useAuth, PublishProgressDialog, auto-open progress on publish
- `apps/web/src/features/content/pages/ContentPreviewPage.test.tsx` — Added useAuth mock, updated hook mocks for new signatures

### Test Results
- API: 134 tests pass (14 files, +1 new test)
- Web: 177 tests pass (23 files, +3 new tests), 1 pre-existing failure (layout.test.tsx sidebar toggle — unrelated)
- TypeScript: 0 errors on both apps/api and apps/web

### Architecture Notes
- **Routing decision**: Free user + single Instagram → direct Graph API (`publishToInstagram`). Paid user → Ayrshare for any platform combination (`publishToMultiplePlatforms`)
- **Ayrshare model**: Single `AYRSHARE_API_KEY` (platform master key) + per-user profile keys stored encrypted (AES-256-GCM), created lazily on first publish
- **Separate BullMQ queue**: `ayrshare` queue with concurrency 2, 3 attempts, exponential backoff (5s initial)
- **Single API call**: One Ayrshare POST /post call handles all platforms simultaneously, but creates one `publish_job` row per platform for granular tracking
- **Status flow**: pending → publishing → published/failed per platform. Content item: draft → scheduled → published (if any succeed) / failed (if all fail)
- **Frontend polling**: usePublishStatus polls every 3s while any job is active, auto-stops when all done
- **Cost tracking**: `0.02 * platforms.length` per publish via existing costTracker
