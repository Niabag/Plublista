# Story 4-5: Watermark System

## Status: Complete

## Summary

Implemented an automatic "Made with Publista" watermark system for free-tier users. Images (posts and carousels) published by free-tier users are watermarked with a subtle semi-transparent text overlay in the bottom-right corner. Paid users publish clean content without watermarks. Watermark failure is non-fatal — publishing proceeds with original images if the watermark process fails.

## Changes

### Backend — Watermark Service
- **`apps/api/src/services/watermark.service.ts`** (new) — Sharp-based watermark using dynamic SVG:
  - `buildWatermarkedKey(userId, contentItemId, ext?)` — generates R2 path for watermarked copies
  - `applyWatermark(fileKey, userId, contentItemId)` — downloads image, composites SVG watermark, uploads as JPEG (quality 92)
  - `applyWatermarkToAll(mediaKeys, userId, contentItemId)` — processes all images sequentially
  - Watermark: "Made with Publista" text, bottom-right, white at 65% opacity + dark shadow, font 2.5% of image width (clamped 14–48px)
  - Watermarked files stored at `users/{userId}/watermarked/{contentItemId}/{uuid}.jpg`

### Backend — Publish Job Integration
- **`apps/api/src/jobs/publish.job.ts`** — Modified `processPublishJob`:
  - Added user subscription tier query after loading platform connection
  - If `free` tier + image content (`post`/`carousel`): applies watermark before generating presigned URLs
  - Graceful fallback: watermark errors logged, original images used
  - Reels excluded (video watermarking deferred to when FFmpeg is added)

### Frontend — Watermark Notice
- **`apps/web/src/features/content/components/PublishConfirmDialog.tsx`** — Added amber notice for free-tier users: "A 'Made with Publista' watermark will be added to published images"

### Tests
- **`apps/api/src/services/watermark.service.test.ts`** (new) — 5 tests: key building, watermark application, batch processing
- **`apps/web/src/features/content/components/PublishConfirmDialog.test.tsx`** — 2 new tests: watermark notice visible for free tier, hidden for paid tier

## Test Results
- **API**: 164 tests pass (17 files)
- **Web**: 209 tests pass (26 files) — 1 pre-existing failure (layout.test.tsx, unrelated)
- **TypeScript**: 0 errors on both apps

## Acceptance Criteria Met
- [x] Free-tier published content has "Made with Publista" watermark overlaid
- [x] Watermark references Publista for organic discovery
- [x] Paid users publish clean content without watermark
- [x] Watermark applied during content processing for publishing (not stored on original)
- [x] Frontend shows watermark notice to free-tier users in publish dialog

## Scope Notes
- Video/reel watermarking deferred — render pipeline is currently a placeholder (no FFmpeg)
- Watermark only needed in `processPublishJob` (Instagram direct) — Ayrshare blocks free users
- Original media in R2 untouched — watermarked copies are ephemeral
