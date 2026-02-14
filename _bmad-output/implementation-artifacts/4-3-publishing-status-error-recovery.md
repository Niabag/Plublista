# Story 4-3: Publishing Status & Error Recovery

**Status:** done
**Epic:** 4 — Multi-Platform Distribution
**Depends on:** Story 4-2 (Multi-Platform Publishing via Ayrshare)

## Overview

Enable users to see publishing status across all content in the Content Library, with status badges on each content card and an error detail dialog for failed publishes. Failed content can be retried with one click. The Library page is rewritten from placeholder to a full responsive grid.

## Acceptance Criteria

| AC  | Criterion              | Details                                                             |
| --- | ---------------------- | ------------------------------------------------------------------- |
| AC1 | Status Badges          | Each content card shows status: Draft (gray), Scheduled (sky), Published (emerald), Failed (rose) |
| AC2 | Failed Visibility      | Failed cards have red left border accent, impossible to miss        |
| AC3 | Error Detail Dialog    | Clicking failed card opens dialog with per-platform human-readable errors |
| AC4 | Retry Action           | One-click "Retry" button re-publishes to all failed platforms       |
| AC5 | Content Library Grid   | Library page shows responsive grid of all content items             |
| AC6 | Backward Compatible    | ContentPreviewPage and PublishProgressDialog unchanged              |

## Implementation Plan

See plan file: `C:\Users\Utilisateur\.claude\plans\cozy-churning-aurora.md`

---

## Dev Agent Record

### Files Created
- `apps/web/src/features/content/hooks/useContentList.ts` — TanStack Query hook for GET /api/content-items
- `apps/web/src/features/content/hooks/useRetryPublish.ts` — Mutation hook for retrying failed publishes
- `apps/web/src/features/content/components/StatusBadge.tsx` — Color-coded status badge (draft/generating/scheduled/published/failed)
- `apps/web/src/features/content/components/ContentCard.tsx` — Grid card with thumbnail, title, status badge, type label, relative date
- `apps/web/src/features/content/components/ErrorDetailDialog.tsx` — Per-platform error detail dialog with Retry/Dismiss/View Content actions
- `apps/web/src/features/content/components/StatusBadge.test.tsx` — 7 tests
- `apps/web/src/features/content/components/ContentCard.test.tsx` — 10 tests
- `apps/web/src/features/content/components/ErrorDetailDialog.test.tsx` — 11 tests

### Files Modified
- `apps/api/src/features/publishing/publishing.service.ts` — Changed `status !== 'draft'` to `status !== 'draft' && status !== 'failed'` in both `publishToInstagram` and `publishToMultiplePlatforms`
- `apps/web/src/features/publishing/pages/LibraryPage.tsx` — Rewritten from placeholder to full grid with ErrorDetailDialog integration
- `apps/api/src/features/publishing/publishing.test.ts` — Added retry test for failed content (+1 test), updated error message assertion

### Test Results
- API: 135 tests pass (14 files, +1 new test)
- Web: 205 tests pass (26 files, +28 new tests), 1 pre-existing failure (layout.test.tsx sidebar toggle — unrelated)
- TypeScript: 0 errors on both apps/api and apps/web

### Architecture Notes
- **Backend change**: Minimal — 2 lines changed in `publishing.service.ts` to allow `failed` status alongside `draft`. Creates new publish_job rows on retry (idempotent).
- **useContentList**: Follows same pattern as `useContentItem` (TanStack Query, apiGet, typed response)
- **useRetryPublish**: Separate from `usePublishContent` because it takes `contentItemId` as param (not closure) and invalidates the content list query
- **StatusBadge**: Uses shadcn Badge with inline Tailwind classes per status. `generating` has `animate-pulse`.
- **ContentCard**: Renders as `<button>` for accessibility. Failed items get `border-l-4 border-l-rose-500`. Calls `onFailedClick` for failed items, `navigate()` for others.
- **ErrorDetailDialog**: Shows only failed jobs. Retry sends all failed platforms in one call. Uses same PLATFORM_META pattern as PublishProgressDialog.
- **LibraryPage**: Fetches content list, manages `selectedItem` state for error dialog, conditionally enables `usePublishStatus` only when a failed item is selected.
