# Story 3-3: Single Post Creator

**Status:** done
**Epic:** 3 — Content Creation
**Depends on:** Story 3-1 (AI Image Generation), Story 3-2 (Carousel Builder — reuses standalone gen hook)

## Overview

Allow users to create single-image posts with uploaded or AI-generated images, format selection, and auto-generated AI copy. Simpler variant of the Carousel Builder — single image slot instead of 2-20 slides.

## Acceptance Criteria

| AC  | Criterion              | Details                                                             |
| --- | ---------------------- | ------------------------------------------------------------------- |
| AC1 | Image Selection        | User can upload an image OR generate one via AI                     |
| AC2 | Format Selection       | FormatPreview component for 9:16, 16:9, 1:1                        |
| AC3 | AI Copy Auto-Gen       | Caption, hashtags, CTA generated on creation (non-fatal)            |
| AC4 | Preview & Editing      | Navigates to ContentPreviewPage for text editing                    |
| AC5 | Database Record        | Content item created with `type: 'post'`                            |
| AC6 | Content Validation     | Post requires exactly 1 image (uploaded or AI-generated)            |

## Implementation Plan

### 1. Shared Schema (packages/shared)

Add `.refine()` to `createContentItemSchema` for post type:
- Post must have exactly 1 mediaUrl

### 2. Backend (apps/api)

**content.service.ts:**
- Add `type === 'post'` block in `createContentItem()` for auto-copy generation (same pattern as carousel)

No new routes, controllers, or services needed — everything reuses existing infrastructure.

### 3. Frontend (apps/web)

**New files:**
- `CreatePostPage.tsx` — single image upload/AI zone + format selector + create button
- `CreatePostPage.test.tsx` — unit tests

**Modified files:**
- `ContentPreviewPage.tsx` — add post type preview (single image with format badge)
- `CreatePage.tsx` — add "New Post" card with ImageIcon
- `router.tsx` — add `/create/post` and `/create/post/:id/preview` routes

**Reused from previous stories:**
- `useFileUpload` hook (upload)
- `useStandaloneImageGeneration` hook (AI generation)
- `FormatPreview` component (format selection)
- `ContentPreviewPage` (preview/edit)

### 4. Tests

**Backend:** Add post-specific tests to content.test.ts:
- Create post with 1 image
- Reject post with 0 images
- Reject post with 2+ images

**Frontend:** CreatePostPage.test.tsx:
- Renders header, format selector, upload/AI buttons
- Shows AI prompt on click
- Create button disabled when no image
- Shows image preview after upload

---

## Dev Agent Record

### Files Modified
- `packages/shared/src/schemas/upload.schema.ts` — Added `.refine()` for post type: exactly 1 mediaUrl
- `apps/api/src/features/content/content.service.ts` — Extended auto-copy generation to include `type === 'post'` (merged with carousel condition)
- `apps/api/src/features/content/content.test.ts` — Added 3 post-specific tests (create with 1 image, reject 2+ images, reject 0 images)

### Files Created
- `apps/web/src/features/content/pages/CreatePostPage.tsx` — Single image post creator with upload/AI gen, format selector, create button
- `apps/web/src/features/content/pages/CreatePostPage.test.tsx` — 8 unit tests

### Files Updated
- `apps/web/src/features/content/pages/ContentPreviewPage.tsx` — Added `type === 'post'` preview with single image display and ImageIcon header
- `apps/web/src/features/content/pages/CreatePage.tsx` — Added "New Post" card with ImageIcon
- `apps/web/src/router.tsx` — Added `/create/post` and `/create/post/:id/preview` routes

### Test Results
- API: 124 tests pass (43 content tests, +3 new post tests)
- Web: 162 tests pass, 1 pre-existing failure (layout.test.tsx sidebar toggle — unrelated)
- TypeScript: 0 errors on both apps

### Reused Components (no new hooks needed)
- `useFileUpload` — image upload
- `useStandaloneImageGeneration` — AI image generation
- `FormatPreview` — 9:16 / 16:9 / 1:1 format selection
- `ContentPreviewPage` — preview/edit with caption, hashtags, CTA
