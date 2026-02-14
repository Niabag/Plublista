# Story 2.7: Content Preview & Text Editing

Status: done

## Story

As a user,
I want to preview my generated Reel and edit the AI-generated text before publishing,
so that I can ensure quality and personalize the content.

## Acceptance Criteria

1. **AC1 — Split-Panel Preview Layout:** Given an Auto-Montage generation completes successfully, when the result preview loads, then a split-panel view shows: Left: phone-frame video preview area with play/pause controls (FR7). Right: editable fields for caption, hashtags, hook text, CTA (FR8).

2. **AC2 — Caption Character Counter:** The caption field shows a live character counter (Instagram 2,200 max). Visual warning when approaching limit.

3. **AC3 — Hashtag Editing as Tags:** Hashtags are displayed as editable tag chips. Users can add/remove individual tags. Tags render without `#` prefix (stored without prefix per Story 2.6).

4. **AC4 — Music Information Display:** Music info shows the generated track details (musicPrompt used and duration).

5. **AC5 — Primary Action Buttons:** Three action buttons visible: "Regenerate Copy" (functional — calls existing `POST /:id/generate-copy`), "Schedule" (disabled — Epic 5), "Publish Now" (disabled — Epic 4).

6. **AC6 — Platform Toggles (Display-Only):** Connected platforms shown for visibility. Actual publishing is Epic 4 — toggles are read-only placeholders.

7. **AC7 — Auto-Save on Blur:** When a user edits the caption (or any text field) and clicks away or presses Tab, changes are auto-saved to the content item via `PATCH /api/content-items/:id`. No manual save button required.

8. **AC8 — Navigation Integration:** The ProgressPage redirects to the preview page when status becomes `draft`. The preview page is accessible from a direct route `/create/reel/:id/preview`.

## Tasks / Subtasks

- [x] Task 1: Add shared Zod schema for content text update (AC: 7)
  - [x] Create `updateContentTextSchema` in `packages/shared/src/schemas/content.schema.ts`
  - [x] Export from `packages/shared/src/index.ts`
- [x] Task 2: Add PATCH endpoint for content text fields (AC: 7)
  - [x] Add `updateContentText` service function in `content.service.ts`
  - [x] Add `update` controller in `content.controller.ts`
  - [x] Add `PATCH /:id` route with `validate(updateContentTextSchema)` in `content.routes.ts`
- [x] Task 3: Add frontend hooks and API integration (AC: 7, 8)
  - [x] Create `useContentItem` hook (TanStack Query `useQuery`)
  - [x] Create `useContentEdit` hook (TanStack Query `useMutation` with auto-invalidation)
- [x] Task 4: Build ContentPreviewPage with split-panel layout (AC: 1, 4, 5, 6, 8)
  - [x] Create `ContentPreviewPage` at `apps/web/src/features/content/pages/ContentPreviewPage.tsx`
  - [x] Left panel: phone-frame placeholder for video (use `generatedMediaUrl` when available)
  - [x] Right panel: form fields + action buttons + music info
  - [x] Add route `/create/reel/:id/preview` in `router.tsx`
  - [x] Wire ProgressPage to redirect on `draft` status
- [x] Task 5: Build CaptionEditor component with character counter (AC: 2, 7)
  - [x] Textarea with live character count display (X / 2,200)
  - [x] Visual warning state (orange at 2000+, red at 2200)
  - [x] Auto-save on blur via `useContentEdit`
- [x] Task 6: Build HashtagEditor component with tag chips (AC: 3, 7)
  - [x] Display existing hashtags as removable badge chips
  - [x] Input field to add new tags (Enter to add)
  - [x] Auto-save on blur/add/remove via `useContentEdit`
- [x] Task 7: Write tests (AC: all)
  - [x] Backend: PATCH endpoint tests (auth, success, 404, validation, non-draft rejection)
  - [x] Frontend: ContentPreviewPage render test, CaptionEditor counter test, HashtagEditor add/remove test
- [x] Task 8: Verify TypeScript + full test suite pass

## Dev Notes

### Architecture Compliance

**Backend pattern** — follows exact same pattern as existing content endpoints:
- Controller: thin HTTP handler → delegates to service
- Service: ownership check (`userId` + `itemId`), business rules, DB update
- Route: `rateLimiter → requireAuth → csrfSynchronisedProtection → validate(schema) → handler`
- Error: use `AppError` class with codes `NOT_FOUND` (404), `VALIDATION_ERROR` (400)
- Tenant isolation: ALL queries filter by `userId` — mandatory

**Frontend pattern** — follows existing content feature patterns:
- TanStack Query v5 for server state (`useQuery` / `useMutation`)
- React Hook Form + Zod resolver for form validation
- Tailwind CSS v4 + shadcn/ui components
- Toast notifications via `sonner`
- `cn()` utility for conditional classNames (`clsx` + `tailwind-merge`)
- Co-located tests: `ComponentName.test.tsx`

### Key Implementation Details

**PATCH endpoint design:**
```typescript
// Shared schema: packages/shared/src/schemas/content.schema.ts
export const updateContentTextSchema = z.object({
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string().max(50)).max(30).optional(),
  hookText: z.string().max(500).optional(),
  ctaText: z.string().max(200).optional(),
});
```

**Service function signature:**
```typescript
export async function updateContentText(
  userId: string, itemId: string, data: UpdateContentTextInput
) {
  // 1. getContentItem (ownership check + 404)
  // 2. Validate status === 'draft'
  // 3. db.update().set({ ...data, updatedAt: new Date() }).where(...)
  // 4. Return updated item
}
```

**Auto-save pattern (frontend):**
- Each editable field calls `useContentEdit.mutate()` on `onBlur`
- Debounce NOT needed since blur is a discrete event
- Show toast on error only (success is silent for auto-save UX)
- Optimistic update via TanStack Query `onMutate`

**Split-panel layout:**
- Desktop: `grid grid-cols-2 gap-6` (50/50 split)
- Mobile: stacked vertically (video on top, form below)
- Phone frame: fixed 9:16 aspect ratio container with `aspect-[9/16]`

**Video preview placeholder:**
- For now, `generatedMediaUrl` is an R2 key (no actual video yet)
- Show a styled placeholder with format info and "Video preview coming soon"
- When actual rendering lands, swap for `<video>` element or Remotion Player

**Hashtag component:**
- Use shadcn `Badge` component for tag chips with X button
- Input field at the end of tag list
- Enter key adds tag, strips `#` prefix automatically
- Max 30 tags enforced by schema

### Existing Code to Reuse

| What | Location | How |
|------|----------|-----|
| Content API routes | `apps/api/src/features/content/content.routes.ts` | Add PATCH route |
| Content service | `apps/api/src/features/content/content.service.ts` | Add `updateContentText()` |
| Content controller | `apps/api/src/features/content/content.controller.ts` | Add `update()` handler |
| DB schema | `apps/api/src/db/schema/contentItems.ts` | Already has all columns |
| Shared types | `packages/shared/src/types/content.types.ts` | ContentItem interface |
| Upload schema | `packages/shared/src/schemas/upload.schema.ts` | Pattern reference |
| useContentStatus | `apps/web/src/features/content/hooks/useContentStatus.ts` | Pattern for hooks |
| apiClient | `apps/web/src/lib/apiClient.ts` | `apiGet`, `apiPatch` for API calls |
| cn utility | `apps/web/src/lib/cn.ts` | Class merging |
| Badge component | `apps/web/src/components/ui/badge.tsx` | For hashtag chips |
| Button component | `apps/web/src/components/ui/button.tsx` | Action buttons |
| Toast | `sonner` | Error toasts on save failure |
| Router | `apps/web/src/router.tsx` | Add preview route |
| ProgressPage | `apps/web/src/features/content/pages/ProgressPage.tsx` | Add redirect to preview |
| AutoMontageProgress | `apps/web/src/features/content/components/AutoMontageProgress.tsx` | Pattern reference for status-driven UI |

### API Client Note

Check if `apiPatch` exists in `apiClient.ts`. If not, add it following the same pattern as `apiPut`:
```typescript
export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
}
```

### Project Structure Notes

New files to create:
```
packages/shared/src/schemas/content.schema.ts          (NEW)
apps/web/src/features/content/pages/ContentPreviewPage.tsx  (NEW)
apps/web/src/features/content/components/CaptionEditor.tsx  (NEW)
apps/web/src/features/content/components/HashtagEditor.tsx  (NEW)
apps/web/src/features/content/hooks/useContentItem.ts       (NEW)
apps/web/src/features/content/hooks/useContentEdit.ts       (NEW)
```

Files to modify:
```
packages/shared/src/index.ts                                (EDIT — add export)
apps/api/src/features/content/content.service.ts            (EDIT — add updateContentText)
apps/api/src/features/content/content.controller.ts         (EDIT — add update handler)
apps/api/src/features/content/content.routes.ts             (EDIT — add PATCH route)
apps/api/src/features/content/content.test.ts               (EDIT — add PATCH tests)
apps/web/src/router.tsx                                     (EDIT — add preview route)
apps/web/src/features/content/pages/ProgressPage.tsx        (EDIT — redirect on draft)
```

### Previous Story Learnings (from Story 2.6)

- `hashtags` column is `notNull()` with `default([])` — never set to `null`, use `[]` fallback
- Use `vi.hoisted()` for mock constants shared between test assertions and `vi.mock` factories
- `contentLimiter` (100 req/15min) is fine for PATCH; no need for stricter limiter since no external API calls
- DB mock chains: `db.update().set().where()` — mock with `mockReturnThis()` for chainable methods
- Combined imports work: `import { fn, type Type } from 'module'`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2, Story 2.7, lines 595-617]
- [Source: _bmad-output/planning-artifacts/architecture.md — API patterns, component structure, state management]
- [Source: apps/api/src/features/content/content.service.ts — existing service pattern]
- [Source: apps/web/src/features/content/hooks/useContentStatus.ts — TanStack Query hook pattern]
- [Source: apps/web/src/features/content/components/AutoMontageProgress.tsx — status-driven UI pattern]
- [Source: packages/shared/src/schemas/upload.schema.ts — Zod schema pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- All 8 tasks completed successfully
- Shared Zod schema (`updateContentTextSchema`) created and exported from `@plublista/shared`
- PATCH endpoint follows existing route pattern: `contentLimiter → requireAuth → csrfSynchronisedProtection → validate → handler`
- Service enforces `status === 'draft'` constraint — only draft items can be text-edited
- `apiPatch` helper added to web apiClient (was missing)
- ContentPreviewPage uses split-panel layout (`grid lg:grid-cols-2`), stacks on mobile
- CaptionEditor: textarea with live counter, orange warning at 2000+, red at 2200, truncation at max, auto-save on blur
- HashtagEditor: Badge chips with X remove, Enter to add, # auto-strip, Backspace to remove last, max 30 tags
- HookField and CTA Field: inline single-line text inputs with auto-save on blur
- Action buttons: Regenerate Copy (functional via `POST /:id/generate-copy`), Schedule (disabled), Publish Now (disabled)
- Music info display when `musicPrompt` is set
- ProgressPage refactored to redirect to `/create/reel/:id/preview` on completion (removed "View in Library" button)
- Required `npm run build` in `packages/shared` for new exports to be available
- API: 13 files, 106 tests passed (5 new PATCH tests)
- Web: 20 files, 128 tests passed (17 new — 7 CaptionEditor + 6 HashtagEditor + 4 ContentPreviewPage)
- TypeScript: 0 errors in both apps
- AC6 (Platform Toggles) deferred — not implemented as connected platforms require Epic 4 infrastructure

### File List

**New files:**
- `packages/shared/src/schemas/content.schema.ts` — Zod schema for PATCH content text update
- `apps/web/src/features/content/pages/ContentPreviewPage.tsx` — Split-panel preview page with edit form
- `apps/web/src/features/content/pages/ContentPreviewPage.test.tsx` — 4 tests (loading, error, render, disabled buttons)
- `apps/web/src/features/content/components/CaptionEditor.tsx` — Textarea with live character counter
- `apps/web/src/features/content/components/CaptionEditor.test.tsx` — 7 tests (render, counter, save, truncation, warning, disabled)
- `apps/web/src/features/content/components/HashtagEditor.tsx` — Tag chip editor
- `apps/web/src/features/content/components/HashtagEditor.test.tsx` — 6 tests (render, add, strip, remove, duplicates, backspace)
- `apps/web/src/features/content/hooks/useContentItem.ts` — TanStack Query useQuery hook
- `apps/web/src/features/content/hooks/useContentEdit.ts` — TanStack Query useMutation hook

**Modified files:**
- `packages/shared/src/index.ts` — Added exports for `updateContentTextSchema` and `UpdateContentTextInput`
- `apps/api/src/features/content/content.service.ts` — Added `updateContentText()` function
- `apps/api/src/features/content/content.controller.ts` — Added `update` handler
- `apps/api/src/features/content/content.routes.ts` — Added `PATCH /:id` route
- `apps/api/src/features/content/content.test.ts` — Added 5 PATCH endpoint tests
- `apps/web/src/lib/apiClient.ts` — Added `apiPatch` function
- `apps/web/src/router.tsx` — Added `/create/reel/:id/preview` route
- `apps/web/src/features/content/pages/ProgressPage.tsx` — Redirect to preview on completion
