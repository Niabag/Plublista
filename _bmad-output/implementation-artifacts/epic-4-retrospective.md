# Epic 4 Retrospective: Publishing & Multi-Platform Distribution

Status: done
Date: 2026-02-14

## Summary

Epic 4 delivered the full publishing pipeline: Instagram direct publishing (free tier), multi-platform publishing via Ayrshare (paid tiers), content library with status tracking and error recovery, intelligent auto-retry with format conversion, and a watermark system for free-tier branding.

**Final metrics:**
- 5 stories completed (4.1–4.5)
- ~20 new files, ~15 modified files
- API: 17 test files, 164 tests passing
- Web: 27 test files, 209 tests passing (1 pre-existing failure, unrelated)
- 0 TypeScript errors across both apps
- 1 DB migration (content_status + 'retrying')

## What Went Well

1. **Error classification pattern** — Separating errors into transient/format/permanent categories with regex-based classification made the retry logic clean and extensible. New error patterns can be added to the arrays without touching control flow.

2. **Graceful degradation everywhere** — Watermark failure falls back to original images. Format conversion failure still allows retry. Permalink fetch failure doesn't block publishing. This resilience pattern prevents secondary concerns from blocking the primary publish flow.

3. **Reusing existing infrastructure** — Sharp was already installed (from story 4-4 media conversion) when story 4-5 watermark was needed. The `downloadBuffer`/`uploadBuffer` pattern from R2 service was reused across media conversion and watermark services identically.

4. **BullMQ custom backoff** — The `settings.backoffStrategy` callback pattern for 1min/5min/15min timing is clean and well-documented. Combined with `job.discard()` for permanent errors, the retry behavior is precisely controlled.

5. **Frontend component composition** — StatusBadge, ContentCard, ErrorDetailDialog, and PublishConfirmDialog are small, focused components that compose well. The LibraryPage is thin orchestration.

6. **Tier-based logic isolation** — Free vs paid tier checks are centralized: `publishing.service.ts` blocks Ayrshare for free users, `publish.job.ts` applies watermark only for free tier. No tier logic scattered across unrelated code.

## What Didn't Go Well

1. **Sprint status drift** — The `sprint-status.yaml` still showed Epic 4 as "backlog" while all 5 stories were completed. Status tracking needs to be updated as stories are implemented, not retroactively.

2. **Video watermarking deferred** — Story 4-5 only watermarks images (post/carousel) because the render pipeline is a placeholder and FFmpeg isn't in deps. Reels published by free users have no watermark. This is a known gap.

3. **No cleanup for ephemeral watermarked files** — Watermarked images are uploaded to `users/{userId}/watermarked/` in R2 but never cleaned up. A scheduled cleanup job should be added to avoid unbounded storage growth.

4. **Ayrshare worker error handling is coarser** — The Ayrshare worker handles errors at the batch level (all platforms fail together), while per-platform partial success/failure is only tracked in the response parsing. A platform-level API error after the Ayrshare call succeeds isn't retried.

## Key Learnings

| # | Learning | First Encountered |
|---|----------|-------------------|
| 1 | BullMQ `backoff: { type: 'custom' }` on queue + `settings.backoffStrategy` on worker for custom delays | Story 4-4 |
| 2 | `job.discard()` skips remaining retries — use for permanent errors to avoid wasting retry budget | Story 4-4 |
| 3 | Sharp SVG composite with dynamic dimensions avoids static watermark assets and handles any image size | Story 4-5 |
| 4 | Watermark at publish time (not creation time) preserves originals and respects tier changes between creation and publish | Story 4-5 |
| 5 | Instagram Graph API: create container → poll status → publish is a 3-step async flow with polling | Story 4-1 |
| 6 | Ayrshare returns per-platform results in a single API call — parse `postIds` array for individual status | Story 4-2 |
| 7 | `users` table import already existed in publish.job.ts (for Ayrshare profile key) — no new schema import needed for tier check | Story 4-5 |
| 8 | Error classification via regex patterns is easy to extend but order matters: check format before permanent to avoid misclassifying "unsupported" errors | Story 4-4 |

## Architecture Decisions Made

1. **Instagram direct (free) + Ayrshare (paid) dual path** (4.1, 4.2) — Free users publish via Instagram Graph API at zero cost. Paid users use Ayrshare for multi-platform. This keeps free tier operational even if Ayrshare has issues.

2. **Error classification module** (4.4) — Centralized error categorization with custom error classes (`PermanentPublishError`, `MediaFormatError`). The `classifyError` function is the single source of truth for retry/fail decisions.

3. **Format conversion on error, not preemptively** (4.4) — WebP→JPG conversion only triggers on format errors, not on every publish. This avoids unnecessary processing for platforms that support WebP.

4. **Watermark via dynamic SVG, not static asset** (4.5) — The SVG is generated at runtime to match exact image dimensions. No asset management, no resizing logic, works for any image size.

5. **Content status 'retrying' propagated to frontend** (4.4) — Added to shared types, DB enum, and StatusBadge. Users see amber pulsing badge during retry attempts, reducing support inquiries.

## Recommendations for Epic 5+

1. **Add a watermarked file cleanup job** — Scheduled BullMQ job to delete `users/*/watermarked/**` files older than 24 hours.

2. **Video watermarking** — When FFmpeg is added for the render pipeline, extend `watermark.service.ts` with video overlay support for reels.

3. **Update sprint-status.yaml in real-time** — Update story status as each story is implemented, not at the end of the epic.

4. **Consider per-platform retry for Ayrshare** — Currently if the Ayrshare API call itself fails (network error), all platforms retry together. Consider splitting into per-platform jobs for more granular retry control.

5. **Content Library pagination** — The current `useContentList` loads all items. For users with many items, add cursor-based pagination or virtual scrolling.
