# Epic 3 Retrospective: Content Creation — Carousel & Single Post

Status: done
Date: 2026-02-14

## Summary

Epic 3 extended content creation beyond reels to support carousels (2-20 image slides) and single image posts. It introduced standalone AI image generation for use during content creation, drag-and-drop slide reordering for carousels, and reused the existing content preview and editing infrastructure.

**Final metrics:**
- 3 stories completed (3.1–3.3)
- API: 17 test files, 164 tests passing
- Web: 27 test files, 209 tests passing (1 pre-existing failure, unrelated)
- 0 TypeScript errors across both apps

## What Went Well

1. **Standalone image generation endpoint** — Placing `POST /api/content-items/generate-image` before parameterized `/:id` routes allowed image generation during carousel/post creation before a content item exists. Clean separation of concerns.

2. **@dnd-kit for carousel reordering** — The sortable context + rectSortingStrategy pattern worked well for the slide grid. Same library used for reel clip reordering, so the pattern was already established.

3. **FormatPreview reuse** — The same format selector component (9:16, 16:9, 1:1) is used across reels, carousels, and posts with no modifications needed.

4. **ContentPreviewPage polymorphism** — A single preview page handles all content types by checking `item.type`. Carousel shows horizontal scroll, post shows single image, reel shows video placeholder. No type-specific pages needed.

5. **Auto-copy generation pattern** — Both carousel and post creation trigger `generateCopy()` inline (non-fatal). Users get AI-generated captions, hashtags, and CTAs immediately, with the option to regenerate later.

6. **useCarouselBuilder hook** — Clean state management for slides with `addSlide`, `removeSlide`, `duplicateSlide`, `reorderSlides`, `updateSlide`. Computed properties `isValid` and `hasProcessing` simplify button state logic.

## What Didn't Go Well

1. **Sprint status tracking drift** — Stories 3-2 and 3-3 were fully implemented but the sprint-status.yaml showed them as `ready-for-dev` and `backlog`. This caused confusion when planning the next work item. Status should be updated immediately upon story completion.

2. **Placeholder image display in preview** — ContentPreviewPage shows placeholder icons instead of actual images for carousel slides and posts. Presigned download URLs aren't generated for the preview. This is acceptable for MVP but should be addressed.

3. **No image editing/cropping** — Users can upload or generate images but can't crop, resize, or adjust them within the app. Platform-specific aspect ratio requirements may cause unexpected results.

## Key Learnings

| # | Learning | First Encountered |
|---|----------|-------------------|
| 1 | Place static routes (`/generate-image`) BEFORE parameterized routes (`/:id`) in Express to avoid param matching | Story 3-1 |
| 2 | `useStandaloneImageGeneration` (no content ID needed) vs `useImageGeneration(contentItemId)` — use standalone during creation, item-specific after | Story 3-1 |
| 3 | Fal.ai image URLs need SSRF validation (`https:` protocol check) before downloading server-side | Story 3-1 |
| 4 | Quota check + decrement must be atomic (check-and-decrement in single query) to prevent TOCTOU races | Story 3-1 |
| 5 | @dnd-kit `rectSortingStrategy` works for grid layouts, `verticalListSortingStrategy` for lists | Story 3-2 |
| 6 | Zod `.refine()` for type-specific validation: carousel needs 2-20 images, post needs exactly 1 | Story 3-2 |

## Architecture Decisions Made

1. **Standalone image generation** (3.1) — A separate endpoint for image generation decoupled from content items. Images are generated to R2, and the file key is later included in `mediaUrls` when creating the content item.

2. **Client-side slide state** (3.2) — Carousel slides are managed entirely in client state (`useCarouselBuilder`) until the "Create" button is pressed. No server-side draft persistence for individual slides.

3. **Single preview page** (3.3) — Rather than creating separate preview pages per content type, `ContentPreviewPage` handles all types with conditional rendering. This reduces route complexity and keeps editing UI consistent.

## Recommendations for Epic 5+

1. **Actual image rendering in preview** — Generate presigned download URLs for `mediaUrls` in the content item API response so the preview page can display actual images instead of placeholders.

2. **Update sprint status in real-time** — Mark stories as `done` immediately upon completion, not retroactively at retrospective time.

3. **Image optimization** — Consider server-side image resizing for different platform requirements (Instagram square, story portrait, etc.) during the publish flow.
