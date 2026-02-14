# Story 3.2: Carousel Builder

Status: done

## Story

As a user,
I want to create carousel posts with 2-20 slides combining uploaded and AI-generated images,
so that I can create engaging multi-slide content for Instagram and other platforms.

## Acceptance Criteria

1. **AC1 — Carousel Creation Flow:** Given a user navigates to Create > New Carousel, when the carousel builder loads, then a slide management interface shows numbered slides (2-20) and a "Create Carousel" button that validates and submits the carousel.

2. **AC2 — Slide Content:** Each slide can be filled with an uploaded image (via the existing upload flow) or an AI-generated image (via a standalone image generation endpoint that reuses Story 3.1's Fal.ai + quota logic).

3. **AC3 — Slide Reordering:** Slides can be reordered via drag-and-drop using `@dnd-kit` (already used in CreateReelPage for clips).

4. **AC4 — Slide Management:** Slides can be added (up to 20), removed (minimum 2), and duplicated.

5. **AC5 — Validation:** Given a user tries to create a carousel with fewer than 2 slides or slides missing images, when they click Create, then a validation error is shown.

6. **AC6 — AI Copy Auto-Generation:** After the content item is created, AI copy is auto-generated (caption, hashtags, hookText, ctaText) via the existing `POST /:id/generate-copy` endpoint.

7. **AC7 — Preview & Text Editing:** The same ContentPreviewPage from Story 2.7 is reused for carousel editing, showing slides in a horizontal scroll with the selected format.

## Tasks / Subtasks

- [ ] Task 1: Add standalone AI image generation endpoint (AC: 2)
  - [ ] Add `generateStandaloneImage()` in `content.service.ts`
  - [ ] Add `generateStandaloneImageHandler` in `content.controller.ts`
  - [ ] Add `POST /generate-image` route in `content.routes.ts` (BEFORE `/:id` routes to avoid Express param capture)
  - [ ] Returns `{ data: { imageUrl, fileKey } }` — imageUrl is presigned download URL, fileKey for passing to mediaUrls
- [ ] Task 2: Update content item creation for carousel type (AC: 1, 5, 6)
  - [ ] Relax `createContentItemSchema` — mediaUrls `.min(1)` stays, but add `.refine()` for carousel type requiring `min(2)` mediaUrls
  - [ ] In `createContentItem`, for `carousel` type: no render job, set status `draft`
  - [ ] After creation, auto-trigger copy generation (call `generateCopy` in try/catch — don't fail creation if copy generation fails)
- [ ] Task 3: Create `useCarouselBuilder` hook (AC: 1, 3, 4, 5)
  - [ ] `SlideData` interface: `{ id, imageKey, imageUrl, source: 'upload' | 'ai', status: 'empty' | 'uploading' | 'generating' | 'ready' | 'error' }`
  - [ ] State management: `addSlide()`, `removeSlide(id)`, `duplicateSlide(id)`, `reorderSlides(activeId, overId)`, `updateSlide(id, data)`
  - [ ] Enforce 2-20 slide limits
  - [ ] `isValid` computed: all slides ready, count >= 2
  - [ ] `toMediaUrls()`: return ordered fileKey array for API submission
- [ ] Task 4: Create `SlideCard` component (AC: 2, 3, 4)
  - [ ] Image preview (thumbnail) or empty state with upload/generate buttons
  - [ ] "Upload Image" button → triggers file picker, uses `useFileUpload`
  - [ ] "Generate AI" button → opens inline ImageGenerator (reuse from Story 3.1)
  - [ ] Remove button (disabled when only 2 slides remain)
  - [ ] Duplicate button (disabled when at 20 slides)
  - [ ] Drag handle via `@dnd-kit/sortable` (`useSortable`)
  - [ ] Numbered badge overlay
  - [ ] Status indicators: loading spinner during upload/generation, error state
- [ ] Task 5: Create `CreateCarouselPage` (AC: 1, 3, 5, 7)
  - [ ] Uses `useCarouselBuilder` hook for slide state
  - [ ] `@dnd-kit` DndContext + SortableContext for drag-and-drop (same pattern as CreateReelPage)
  - [ ] "Add Slide" button (up to 20)
  - [ ] `FormatPreview` component for format selection (reuse existing)
  - [ ] "Create Carousel" button: validates all slides, calls `POST /api/content-items` with `{ type: 'carousel', mediaUrls }`, then navigates to `/create/carousel/:id/preview`
  - [ ] Error states and loading during creation
- [ ] Task 6: Update `ContentPreviewPage` for carousel type (AC: 7)
  - [ ] Detect content type from fetched item
  - [ ] For carousel: show `mediaUrls` as horizontal scroll of images (instead of single video/image preview)
  - [ ] Each slide shows as a thumbnail in a scrollable row
  - [ ] Text editing (caption, hashtags, hookText, ctaText) remains the same
- [ ] Task 7: Add carousel routes to router (AC: 1)
  - [ ] `/create/carousel` → `CreateCarouselPage`
  - [ ] `/create/carousel/:id/preview` → `ContentPreviewPage` (reuse)
  - [ ] Add "New Carousel" card to `CreatePage` hub
- [ ] Task 8: Write tests (AC: all)
  - [ ] Backend: standalone generate-image endpoint tests (auth, success, quota, validation)
  - [ ] Backend: carousel creation tests (create with mediaUrls, min 2 validation, auto-copy)
  - [ ] Frontend: `SlideCard` tests (render, upload, remove, duplicate, states)
  - [ ] Frontend: `CreateCarouselPage` tests (add/remove slides, reorder, create, validation)
  - [ ] Frontend: `ContentPreviewPage` carousel mode test (horizontal scroll of mediaUrls)
- [ ] Task 9: Verify TypeScript + full test suite pass

## Dev Notes

### Architecture Compliance

**Backend pattern** — follows exact same pattern as existing content endpoints:
- Controller: thin HTTP handler → delegates to service
- Service: ownership check (`userId`), business rules, DB update
- Route: `rateLimiter → requireAuth → csrfSynchronisedProtection → validate(schema) → handler`
- Error: use `AppError` class with codes `NOT_FOUND` (404), `VALIDATION_ERROR` (400), `QUOTA_EXCEEDED` (429), `EXTERNAL_API_ERROR` (502)
- Tenant isolation: ALL queries filter by `userId`
- Cost tracking: ALL external API calls must log cost via `costTracker`

**Frontend pattern** — follows existing content feature patterns:
- TanStack Query v5 for server state (`useQuery` / `useMutation`)
- Tailwind CSS v4 + shadcn/ui components
- Toast notifications via `sonner`
- `cn()` utility for conditional classNames
- Co-located tests: `ComponentName.test.tsx`

### Key Implementation Details

**Standalone Image Generation Endpoint:**

The existing `POST /api/content-items/:id/generate-image` requires a content item ID (for ownership check and R2 key path). The carousel builder needs to generate images BEFORE the content item exists (user builds slides, then creates). Solution: add a standalone endpoint.

```typescript
// content.service.ts — add generateStandaloneImage()
export async function generateStandaloneImage(
  userId: string,
  data: ImageGenerationInput,
): Promise<{ imageUrl: string; fileKey: string }> {
  // 1. Quota check (reuse checkAndDecrementQuota)
  await checkAndDecrementQuota(userId, 'ai_images', 1);

  try {
    // 2. Generate via fal.service (reuse)
    const result = await generateImage(userId, data.prompt);

    // 3. Validate URL (same SSRF protections as generateContentImage)
    const url = new URL(result.imageUrl);
    if (url.protocol !== 'https:') {
      throw new AppError('EXTERNAL_API_ERROR', 'Invalid image URL scheme', 502);
    }

    // 4. Download + size check (same as generateContentImage)
    const response = await fetch(result.imageUrl);
    if (!response.ok) throw new AppError(...);
    // ... 20MB limit check ...
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to R2 — use standalone path (no contentItemId)
    const fileKey = `users/${userId}/generated/standalone/${crypto.randomUUID()}.webp`;
    await uploadBuffer(fileKey, buffer, 'image/webp');

    // 6. Return presigned URL + fileKey
    const imageUrl = await generatePresignedDownloadUrl(fileKey);
    return { imageUrl, fileKey };
  } catch (err) {
    await restoreQuota(userId, 'ai_images', 1);
    throw err;
  }
}
```

**Route ordering — CRITICAL:**
```typescript
// content.routes.ts — static routes BEFORE parameterized routes
router.post('/generate-image', imageGenerateLimiter, requireAuth, csrfSynchronisedProtection, validate(imageGenerationSchema), generateStandaloneImageHandler);
// ... then later:
router.post('/:id/generate-image', imageGenerateLimiter, requireAuth, csrfSynchronisedProtection, validate(imageGenerationSchema), generateImageHandler);
```

**Carousel Creation — Schema Update:**
```typescript
// packages/shared/src/schemas/content.schema.ts
// Option: add a separate carouselCreateSchema, OR use .refine() on existing
export const createContentItemSchema = z.object({
  type: z.enum(['reel', 'carousel', 'post']),
  title: z.string().max(255).optional(),
  mediaUrls: z.array(z.string().min(1)).min(1),
  style: z.enum(MONTAGE_STYLES).optional(),
  format: z.enum(MONTAGE_FORMATS).optional(),
  duration: z.union([z.literal(15), z.literal(30), z.literal(60)]).optional(),
  music: z.enum(MUSIC_OPTIONS).optional(),
}).refine(
  (data) => data.type !== 'carousel' || data.mediaUrls.length >= 2,
  { message: 'Carousels require at least 2 slides', path: ['mediaUrls'] },
).refine(
  (data) => data.type !== 'carousel' || data.mediaUrls.length <= 20,
  { message: 'Carousels allow at most 20 slides', path: ['mediaUrls'] },
);
```

**Auto Copy Generation on Carousel Creation:**
```typescript
// content.service.ts — in createContentItem(), after DB insert
if (data.type === 'carousel' && item) {
  try {
    const copy = await generateCopy(userId, 'carousel', data.style ?? 'dynamic');
    await db.update(contentItems)
      .set({
        caption: copy.caption,
        hashtags: copy.hashtags,
        hookText: copy.hookText,
        ctaText: copy.ctaText,
        updatedAt: new Date(),
      })
      .where(and(eq(contentItems.id, item.id), eq(contentItems.userId, userId)));
    return { ...item, ...copy };
  } catch {
    // Copy generation failure is non-fatal — user can regenerate later
    console.info(JSON.stringify({ userId, itemId: item.id }, null, 0), 'Auto copy generation failed for carousel — continuing');
    return item;
  }
}
```

**SlideData Interface:**
```typescript
// apps/web/src/features/content/hooks/useCarouselBuilder.ts
export interface SlideData {
  id: string;          // Client-side unique ID (crypto.randomUUID())
  imageKey: string;    // R2 file key for mediaUrls
  imageUrl: string;    // Display URL (presigned or blob URL)
  source: 'upload' | 'ai';
  status: 'empty' | 'uploading' | 'generating' | 'ready' | 'error';
  error?: string;
}

export function useCarouselBuilder() {
  const [slides, setSlides] = useState<SlideData[]>([
    createEmptySlide(), createEmptySlide(), // Start with 2 empty slots
  ]);
  // ... addSlide, removeSlide, duplicateSlide, reorderSlides, updateSlide
  // isValid: slides.length >= 2 && slides.every(s => s.status === 'ready')
  // toMediaUrls: slides.map(s => s.imageKey)
}
```

**Drag-and-Drop Pattern (reuse from CreateReelPage):**
```typescript
// CreateCarouselPage — same @dnd-kit pattern as CreateReelPage
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// In SlideCard: useSortable({ id: slide.id })
// In CreateCarouselPage: <DndContext onDragEnd={handleDragEnd}><SortableContext items={slides} strategy={rectSortingStrategy}>
```

**Carousel Preview on ContentPreviewPage:**
```typescript
// ContentPreviewPage — detect type and render accordingly
// For 'reel': show single video/image (existing behavior)
// For 'carousel': show horizontal scroll of mediaUrls images
{item.type === 'carousel' && item.mediaUrls.length > 0 && (
  <div className="flex gap-2 overflow-x-auto pb-2">
    {item.mediaUrls.map((url, i) => (
      <img key={i} src={presignedUrl(url)} alt={`Slide ${i + 1}`}
        className="h-64 w-auto rounded-md border object-cover flex-shrink-0" />
    ))}
  </div>
)}
```

**Image Upload Per Slide:**

Each SlideCard uses the existing `useFileUpload` hook for uploading images. The accept filter should be `image/*` (JPG, PNG, WebP). When upload completes, update the slide with `fileKey` and thumbnail URL.

```typescript
// In SlideCard, when user selects "Upload Image":
const { uploadFile } = useFileUpload();
const result = await uploadFile(file);
if (result) {
  updateSlide(slide.id, {
    imageKey: result.fileKey,
    imageUrl: URL.createObjectURL(file), // For immediate preview
    source: 'upload',
    status: 'ready',
  });
}
```

**AI Image Generation Per Slide:**

When user clicks "Generate AI" on a slide, show an inline `ImageGenerator` component (or a modal). When the user accepts the generated image, update the slide:

```typescript
// Use the standalone endpoint (not the content-item-specific one)
const handleImageGenerated = (imageUrl: string, fileKey: string) => {
  updateSlide(slide.id, {
    imageKey: fileKey,
    imageUrl: imageUrl,
    source: 'ai',
    status: 'ready',
  });
};
```

**NOTE:** The existing `ImageGenerator` component uses `useImageGeneration` which calls `POST /api/content-items/${contentItemId}/generate-image`. For the carousel builder, create a new `useStandaloneImageGeneration` hook that calls `POST /api/content-items/generate-image` (no `:id`). The `ImageGenerator` component should be updated to accept either a `contentItemId` prop (existing behavior) or no `contentItemId` (uses standalone endpoint). OR create a wrapper/adapter.

The simplest approach: create `useStandaloneImageGeneration` hook and pass its `generate`/`imageUrl`/`isPending` etc. to a slightly modified `ImageGenerator` that accepts generation control via props. See implementation approach:

```typescript
// Option: make ImageGenerator accept generation controls via props
interface ImageGeneratorProps {
  onImageGenerated: (imageUrl: string, fileKey?: string) => void;
  disabled?: boolean;
  // Two modes: content-item-bound or standalone
  contentItemId?: string; // If provided, uses existing endpoint
  standalone?: boolean;   // If true, uses standalone endpoint
}
```

### Carousel Quota (from PRD)

| Tier | Carousels/Month |
|------|-----------------|
| Free | 5 |
| Starter | 20 |
| Pro | 60 |
| Business | 150 |
| Agency | 400 |

**Note:** Carousel quota enforcement (checking carousel count) is handled by Epic 6 (Billing & Quota Management). For MVP, just create the content items. The AI image quota per slide IS enforced by the existing quota service from Story 3.1.

### Existing Code to Reuse

| What | Location | How |
|------|----------|-----|
| ImageGenerator component | `apps/web/src/features/content/components/ImageGenerator.tsx` | Reuse for per-slide AI generation (add standalone mode) |
| useImageGeneration hook | `apps/web/src/features/content/hooks/useImageGeneration.ts` | Reference for standalone hook |
| @dnd-kit drag-and-drop | `apps/web/src/features/content/pages/CreateReelPage.tsx` | Same DndContext + SortableContext pattern |
| ClipCard component | `apps/web/src/features/content/components/ClipCard.tsx` | Reference for SlideCard (useSortable, thumbnail, status) |
| FormatPreview | `apps/web/src/features/content/components/FormatPreview.tsx` | Reuse directly for format selection |
| FileUploadZone | `apps/web/src/features/upload/components/FileUploadZone.tsx` | Reuse for image upload per slide |
| useFileUpload | `apps/web/src/features/upload/hooks/useFileUpload.ts` | Reuse for presigned URL upload |
| ContentPreviewPage | `apps/web/src/features/content/pages/ContentPreviewPage.tsx` | Extend with carousel preview mode |
| CaptionEditor, HashtagEditor | `apps/web/src/features/content/components/` | Reused by ContentPreviewPage |
| generateCopy service | `apps/api/src/services/claude.service.ts` | Auto-generate copy on carousel creation |
| fal.service, quota.service, r2.service | `apps/api/src/services/` | Reuse for standalone image generation |
| createContentItemSchema | `packages/shared/src/schemas/content.schema.ts` | Extend with carousel validation |
| contentItems schema | `apps/api/src/db/schema/contentItems.ts` | Already supports `type: 'carousel'`, `mediaUrls: jsonb` |
| apiPost, apiPatch | `apps/web/src/lib/apiClient.ts` | API calls |
| CreatePage hub | `apps/web/src/features/content/pages/CreatePage.tsx` | Add "New Carousel" card |

### DB Schema Notes

**No migration needed.** The existing `content_items` table already supports:
- `type: contentTypeEnum` — includes `'carousel'`
- `mediaUrls: jsonb` — stores array of R2 file keys (slide order = array order)
- `caption`, `hashtags`, `hookText`, `ctaText` — for AI-generated copy
- `format` — for selected format (9:16, 16:9, 1:1)

### Project Structure Notes

New files to create:
```
apps/web/src/features/content/pages/CreateCarouselPage.tsx            (NEW)
apps/web/src/features/content/pages/CreateCarouselPage.test.tsx       (NEW)
apps/web/src/features/content/components/SlideCard.tsx                (NEW)
apps/web/src/features/content/components/SlideCard.test.tsx           (NEW)
apps/web/src/features/content/hooks/useCarouselBuilder.ts             (NEW)
apps/web/src/features/content/hooks/useStandaloneImageGeneration.ts   (NEW)
```

Files to modify:
```
packages/shared/src/schemas/content.schema.ts          (EDIT — add carousel validation refine)
apps/api/src/features/content/content.service.ts       (EDIT — add generateStandaloneImage, update createContentItem for carousel)
apps/api/src/features/content/content.controller.ts    (EDIT — add generateStandaloneImageHandler)
apps/api/src/features/content/content.routes.ts        (EDIT — add POST /generate-image route)
apps/api/src/features/content/content.test.ts          (EDIT — add tests)
apps/web/src/features/content/pages/ContentPreviewPage.tsx  (EDIT — add carousel preview mode)
apps/web/src/features/content/components/ImageGenerator.tsx (EDIT — add standalone mode support)
apps/web/src/features/content/pages/CreatePage.tsx     (EDIT — add New Carousel card)
apps/web/src/router.tsx                                (EDIT — add carousel routes)
```

### Previous Story Learnings (from Story 3.1)

- Always run `npm run build` in `packages/shared` after editing shared schemas
- Use `vi.hoisted()` for mock constants in `vi.mock` factory functions
- Use `mockReset()` before `mockReturnValueOnce()` to avoid stale persistent mocks from `getAuthenticatedAgent()`
- Place static POST routes BEFORE parameterized `/:id` routes in Express
- Zod `.trim()` on string fields to prevent whitespace-only values
- SSRF protection: validate URL scheme is `https:` via `new URL()` before `fetch()`
- Always check `response.ok` after `fetch()`
- Size limit buffers from external sources (20MB max)
- Atomic quota check with `restoreQuota()` in catch block for rollback
- `onConflictDoNothing` pattern for handling concurrent INSERT races
- Mock `express-rate-limit` with `rateLimit: () => (req, res, next) => next()`
- `vi.stubGlobal('fetch', ...)` needs `ok: true` and `headers: { get: () => null }` in mock

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3, Story 3.2, lines 637-656]
- [Source: _bmad-output/planning-artifacts/prd.md — FR4 (Carousel Creation), FR5 (Reference Images), FR3 (Format), FR7 (Preview), FR9 (AI Copy)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend component patterns, API patterns, @dnd-kit usage]
- [Source: apps/web/src/features/content/pages/CreateReelPage.tsx — @dnd-kit drag-and-drop pattern]
- [Source: apps/web/src/features/content/components/ClipCard.tsx — useSortable pattern for card component]
- [Source: apps/web/src/features/upload/ — FileUploadZone, useFileUpload patterns]
- [Source: apps/web/src/features/content/components/ImageGenerator.tsx — AI image generation UI]
- [Source: _bmad-output/implementation-artifacts/3-1-ai-image-generation.md — Story 3.1 learnings and review fixes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript error: `FormatPreview` props are `selected`/`onSelect` not `value`/`onChange` — fixed prop names
- Test failure: `@dnd-kit/sortable` adds `role="button"` to parent div, which interfered with `getAllByRole('button', { name: /ai/i })` — fixed by using `getByText('AI').closest('button')` instead
- Drizzle `.name` gives SQL column name (e.g., `ai_images_used`), but `.set()` expects JS key (`aiImagesUsed`) — fixed by adding `jsKey` property to quota column helper

### Completion Notes List

- `createContentItemSchema` extended with `.refine()` for carousel validation: min 2 slides, max 20 slides
- `quota.service.ts` refactored to support multiple resources (`'ai_images' | 'carousels'`) via `getQuotaColumn()` helper with `jsKey` for proper Drizzle `.set()` usage
- `generateStandaloneImage()` in content.service.ts: quota check → Fal.ai → SSRF validation → 20MB size limit → R2 upload → presigned URL + fileKey return. Quota rollback on failure
- `createContentItem()` extended: auto-generates AI copy via `generateCopy()` for carousel type (non-fatal — user can regenerate later)
- `POST /api/content-items/generate-image` standalone route added BEFORE `/:id` routes to avoid Express param capture
- `useCarouselBuilder` hook: manages 2-20 slides with add/remove/duplicate/reorder/update, isValid, toMediaUrls()
- `useStandaloneImageGeneration` hook: wraps useMutation for standalone endpoint, returns imageUrl + fileKey
- `SlideCard` component: sortable with drag handle, numbered badge, Upload/AI buttons on empty state, inline AI prompt with cancel, loading/error states, replace/duplicate/remove actions
- `CreateCarouselPage`: DndContext + SortableContext grid, FormatPreview selector, "Add Slide" button, "Create Carousel" with validation, navigates to ContentPreviewPage
- `ContentPreviewPage` extended: detects `item.type === 'carousel'` for horizontal scrolling slide preview with numbered badges
- `CreatePage` updated with "New Carousel" card (Images icon)
- `router.tsx` updated with `/create/carousel` and `/create/carousel/:id/preview` routes
- API tests: 7 new tests (carousel min validation, carousel create, carousel max validation, standalone auth, standalone success, standalone quota, standalone validation)
- Frontend tests: 11 new tests (header, format, empty slots, add slide, disabled create, slide add, numbers, ready count, upload/AI buttons, AI prompt open, AI prompt cancel)
- All TypeScript 0 errors, API 121 tests pass, Web 155 tests pass

### File List

New files:
- `apps/web/src/features/content/pages/CreateCarouselPage.tsx`
- `apps/web/src/features/content/pages/CreateCarouselPage.test.tsx`
- `apps/web/src/features/content/components/SlideCard.tsx`
- `apps/web/src/features/content/hooks/useCarouselBuilder.ts`
- `apps/web/src/features/content/hooks/useStandaloneImageGeneration.ts`

Modified files:
- `packages/shared/src/schemas/upload.schema.ts` — added carousel validation refines
- `apps/api/src/services/quota.service.ts` — extended for 'carousels' resource type
- `apps/api/src/features/content/content.service.ts` — added generateStandaloneImage(), carousel auto-copy in createContentItem()
- `apps/api/src/features/content/content.controller.ts` — added generateStandaloneImageHandler
- `apps/api/src/features/content/content.routes.ts` — added POST /generate-image standalone route
- `apps/api/src/features/content/content.test.ts` — added 7 carousel + standalone tests
- `apps/web/src/features/content/pages/ContentPreviewPage.tsx` — added carousel preview mode
- `apps/web/src/features/content/pages/CreatePage.tsx` — added New Carousel card
- `apps/web/src/router.tsx` — added carousel routes
