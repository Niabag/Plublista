# Story 2.2: Auto-Montage Upload Interface

Status: done

## Story

As a user,
I want to upload 1-10 video clips and see them organized before generating a Reel,
so that I can control the source material for my auto-montage.

## Acceptance Criteria

1. **AC1 — Auto-Montage Creation Page:** When the user navigates to Create → New Reel, a dedicated Auto-Montage creation view loads. The sidebar collapses to icons to maximize workspace. A drag-and-drop upload zone is centered with the text "Drop your video clips here". A prominent "Generate Auto-Montage" button is visible below the clips.
2. **AC2 — Clip Cards with Thumbnails:** Uploaded clips appear as cards showing a video thumbnail (first frame), filename, and duration. Clips can be removed with an X button on each card. A loading skeleton is shown while the thumbnail generates.
3. **AC3 — Duration Display:** Total footage duration is displayed below the clips (e.g., "Total: 2:25 of raw footage"). Each clip card shows its individual duration.
4. **AC4 — Clip Reordering via Drag-and-Drop:** Users can reorder uploaded clips by dragging and dropping clip cards. Visual feedback shows the dragged card elevated with a shadow. The reordered sequence persists until the user generates or navigates away.
5. **AC5 — Clip Limit Enforcement:** When a user tries to upload more than 10 clips, an error toast shows "Maximum 10 clips per Auto-Montage". The upload zone hides when 10 clips are reached. Only video files are accepted (MP4, MOV, WebM).
6. **AC6 — Optional Settings (Progressive Disclosure):** Below the "Generate Auto-Montage" button, optional settings are collapsed by default. Expanding shows: Style (Dynamic/Cinematic/UGC/Energetic), Format (9:16/16:9/1:1), Duration (15s/30s/60s). Defaults: Dynamic, 9:16, 30s.

## Tasks / Subtasks

- [x] Task 1: Install @dnd-kit for drag-and-drop reordering (AC: 4)
  - [x] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` in `apps/web`
  - [x] Rebuild if needed

- [x] Task 2: Create video metadata utility for thumbnails and duration (AC: 2, 3)
  - [x] Create `apps/web/src/features/upload/utils/videoMetadata.ts`
  - [x] Implement `extractVideoThumbnail(file: File): Promise<string>` — uses HTMLVideoElement + Canvas to capture first frame as data URL
  - [x] Implement `extractVideoDuration(file: File): Promise<number>` — returns duration in seconds
  - [x] Implement `formatDuration(seconds: number): string` — returns "M:SS" format
  - [x] Implement `formatTotalDuration(seconds: number): string` — returns "Total: M:SS of raw footage"

- [x] Task 3: Create ClipCard component (AC: 2, 3, 4)
  - [x] Create `apps/web/src/features/content/components/ClipCard.tsx`
  - [x] Display thumbnail (16:9 aspect ratio), filename (truncated), duration
  - [x] Remove button (X icon) visible on hover, calls onRemove
  - [x] Drag handle for @dnd-kit sortable
  - [x] States: loading (skeleton), ready (thumbnail), error (red border), dragging (elevated shadow + opacity)
  - [x] Accessible: keyboard navigation, aria-labels, 44x44px touch targets

- [x] Task 4: Create CreateReelPage with upload zone and clip grid (AC: 1, 5)
  - [x] Create `apps/web/src/features/content/pages/CreateReelPage.tsx`
  - [x] Integrate FileUploadZone from Story 2.1 (filter to video-only: MP4, MOV, WebM)
  - [x] Grid layout: 3-4 columns desktop, 2 tablet, 1 mobile
  - [x] Enforce max 10 clips — show toast via sonner when exceeded
  - [x] Track uploaded clips with thumbnails and durations in local state
  - [x] Show "Generate Auto-Montage" button (disabled until ≥ 1 clip uploaded)
  - [x] Collapse sidebar on mount (via useUiStore), restore on unmount

- [x] Task 5: Implement drag-and-drop reordering with @dnd-kit (AC: 4)
  - [x] Wrap clip grid in `DndContext` + `SortableContext` from @dnd-kit
  - [x] Make each ClipCard a `useSortable` item
  - [x] Handle `onDragEnd` to reorder clips array
  - [x] Visual feedback: `DragOverlay` with elevated shadow
  - [x] Keyboard support: Tab between clips, Space/Enter to pick up, Arrow keys to move

- [x] Task 6: Implement total duration display (AC: 3)
  - [x] Sum all clip durations and display "Total: M:SS of raw footage" below clip grid
  - [x] Update in real-time as clips are added/removed/reordered

- [x] Task 7: Create optional settings panel with progressive disclosure (AC: 6)
  - [x] Create `apps/web/src/features/content/components/MontageSettings.tsx`
  - [x] Collapsible section (collapsed by default) with chevron toggle
  - [x] Style selector: Dynamic (default), Cinematic, UGC, Energetic — radio group or button group
  - [x] Format selector: 9:16 (default), 16:9, 1:1 — radio group or button group
  - [x] Duration selector: 15s, 30s (default), 60s — radio group or button group
  - [x] Store selections in component state (will be used in Story 2.3 for API submission)

- [x] Task 8: Update router and navigation (AC: 1)
  - [x] Update `/create` route to render CreateReelPage (replace placeholder)
  - [x] Add "New Reel" entry point from CreatePage or dashboard (if applicable)

- [x] Task 9: Write frontend tests (AC: all)
  - [x] Test ClipCard: renders thumbnail, filename, duration; remove button works; drag handle present
  - [x] Test CreateReelPage: renders upload zone, shows clip grid after upload, enforces 10-clip limit
  - [x] Test MontageSettings: collapsed by default, expands on click, shows all options with correct defaults
  - [x] Test duration display: shows correct total duration format
  - [x] Test drag-and-drop: clips can be reordered (mock @dnd-kit events)

- [x] Task 10: Final verification
  - [x] Run `npx tsc --noEmit` in `apps/web` — must pass
  - [x] Run `npx vitest run` in `apps/web` — all tests pass
  - [x] Run `npx tsc --noEmit` in `apps/api` — must still pass (no backend changes expected)
  - [x] Run `npx vitest run` in `apps/api` — all tests still pass

## Dev Notes

### Critical Architecture Constraints

- **This story is frontend-only.** No backend changes needed. The upload infrastructure (presigned URLs, R2 service, content-items CRUD) was built in Story 2.1. This story builds the UI on top of it.
- **Reuse Story 2.1 components:** `FileUploadZone`, `UploadedFileCard`, and `useFileUpload` hook are already built. Extend or compose them — do NOT rewrite.
- **Video thumbnails are client-side only.** Use `HTMLVideoElement` + `Canvas.drawImage()` to extract the first frame. No backend thumbnail generation in this story.
- **Video duration extraction is client-side.** Use `HTMLVideoElement.duration` via `loadedmetadata` event. No FFmpeg or backend processing.
- **The "Generate Auto-Montage" button does NOT trigger generation yet.** That's Story 2.4 (rendering pipeline). The button should be present but either disabled or show a "coming soon" state. It should be wired to create a content item via `POST /api/content-items` with the uploaded mediaUrls.
- **No video processing in this story.** Raw clips are stored as-is in R2. Rendering is Story 2.4.
- **Sidebar collapse:** Use `useUiStore.toggleSidebar()` — the store already exists at `apps/web/src/stores/useUiStore.ts` with `sidebarCollapsed` state.

### Established Patterns from Previous Stories

- **Feature folder structure:** `apps/web/src/features/content/` with `components/`, `hooks/`, `pages/` subfolders
- **Component library:** shadcn/ui components at `apps/web/src/components/ui/` — Button, Badge, Progress, etc.
- **Icons:** `lucide-react` — use `Upload`, `X`, `GripVertical` (drag handle), `ChevronDown`, `Play`, `Film`
- **Styling:** Tailwind CSS v4 with dark mode via `dark:` prefix. Use `cn()` utility from `@/lib/cn` for conditional classes
- **Toast notifications:** `sonner` library — `import { toast } from 'sonner'`
- **State management:** Zustand for UI state (`useUiStore`), TanStack Query for server state, React state for form/editor state
- **API calls:** `apiPost`, `apiGet` from `@/lib/apiClient` — auto-handles CSRF tokens
- **Content types:** `ContentType = 'reel' | 'carousel' | 'post'`, `ContentItem` interface in shared package
- **Upload schemas:** `createContentItemSchema`, `ALLOWED_VIDEO_TYPES` from `@plublista/shared`
- **Test pattern (frontend):** Vitest + React Testing Library + userEvent. Mock API calls with `vi.mock('@/lib/apiClient')`

### @dnd-kit Implementation Guide

```typescript
// Minimal @dnd-kit setup for sortable clip grid
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// In SortableClipCard:
function SortableClipCard({ id, clip, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ClipCard clip={clip} onRemove={onRemove} dragHandleProps={listeners} isDragging={isDragging} />
    </div>
  );
}

// In CreateReelPage:
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    setClips((prev) => arrayMove(prev, oldIndex, newIndex));
  }
}
```

### Video Thumbnail Extraction Guide

```typescript
// Extract first frame as data URL
function extractVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 0.1; // Seek slightly to avoid blank frames
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
  });
}
```

### Clip Data Model (Frontend)

```typescript
interface UploadedClip {
  id: string;           // unique ID for DnD
  file: File;           // original File object
  fileKey: string;      // R2 file key from presigned URL upload
  fileName: string;
  thumbnailUrl: string; // data URL from canvas extraction
  duration: number;     // seconds
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}
```

### File Structure

```
apps/web/src/
├── features/
│   ├── content/
│   │   ├── components/
│   │   │   ├── ClipCard.tsx              # NEW: Video clip card with thumbnail
│   │   │   └── MontageSettings.tsx       # NEW: Collapsible style/format/duration settings
│   │   └── pages/
│   │       └── CreateReelPage.tsx        # NEW: Main auto-montage upload page
│   └── upload/
│       ├── utils/
│       │   └── videoMetadata.ts          # NEW: Thumbnail extraction + duration parsing
│       ├── hooks/
│       │   └── useFileUpload.ts          # EXISTING (from Story 2.1)
│       └── components/
│           ├── FileUploadZone.tsx         # EXISTING (from Story 2.1, may extend)
│           └── UploadedFileCard.tsx       # EXISTING (from Story 2.1)

apps/web/src/
├── features/content/pages/CreatePage.tsx  # MODIFIED: route to CreateReelPage
├── router.tsx                             # MODIFIED: update /create route
├── stores/useUiStore.ts                   # EXISTING (sidebar collapse)
```

### What This Story Does NOT Include

- Video rendering / FFmpeg / Remotion pipeline (Story 2.4)
- Style preview or format preview (Story 2.3)
- Music selection (Story 2.3)
- AI copy generation (Story 2.6)
- Content preview after generation (Story 2.7)
- Backend changes (all backend work was done in Story 2.1)
- Content item creation API call (the button is present but full wiring to POST /api/content-items with all settings is Story 2.3)

### Responsive Design

| Breakpoint | Clip Grid | Sidebar | Upload Zone |
|------------|-----------|---------|-------------|
| Desktop (≥1024px) | 3-4 columns | Collapsed icons (64px) | Full-width drop area |
| Tablet (768-1023px) | 2 columns | Icon-only (64px) | Full-width, touch-friendly |
| Mobile (<768px) | 1 column | Hidden | Full-width |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 Story 2.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction 2: Auto-Montage Upload]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 2: Auto-Montage Creation Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Strategy]
- [Source: _bmad-output/implementation-artifacts/2-1-file-upload-and-cloud-storage.md] (previous story)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No issues encountered during implementation. All tasks completed cleanly on first pass.

### Code Review Fixes Applied

- **[H1] Parallel clip processing:** Changed sequential `for...await` to fire-and-forget `Promise.all().then()` — all clips now process concurrently
- **[M1] onDragCancel handler:** Added `onDragCancel` to DndContext to reset activeClipId when user presses Escape
- **[M2] Upload zone text:** Added `dropText`, `activeDropText`, `subtitleText` props to FileUploadZone; CreateReelPage passes video-specific text matching AC1
- **[M3] Stale clips dependency:** Replaced `clips` dependency in `handleRemoveClip` with `clipsRef` pattern to avoid unnecessary re-renders

### Completion Notes List

- Installed @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (4 packages added)
- Created videoMetadata.ts with extractVideoThumbnail, extractVideoDuration, formatDuration, formatTotalDuration
- Created ClipCard.tsx with thumbnail, filename, duration badge, drag handle, remove button, loading/error/dragging states
- Created MontageSettings.tsx with collapsible panel, Style/Format/Duration option groups with aria-checked radio buttons
- Created CreateReelPage.tsx integrating FileUploadZone, DnD clip grid, total duration, generate button, settings panel, sidebar collapse
- Updated CreatePage.tsx with "New Reel" navigation card linking to /create/reel
- Updated router.tsx with /create/reel route to CreateReelPage
- Frontend: 81 tests pass (12 files) — 27 new tests across 4 new test files
- Backend: 81 tests pass (10 files) — no backend changes, no regressions
- TypeScript: 0 errors on both apps/web and apps/api

### File List

- `apps/web/src/features/upload/utils/videoMetadata.ts` — NEW
- `apps/web/src/features/upload/utils/videoMetadata.test.ts` — NEW
- `apps/web/src/features/content/components/ClipCard.tsx` — NEW
- `apps/web/src/features/content/components/ClipCard.test.tsx` — NEW
- `apps/web/src/features/content/components/MontageSettings.tsx` — NEW
- `apps/web/src/features/content/components/MontageSettings.test.tsx` — NEW
- `apps/web/src/features/content/pages/CreateReelPage.tsx` — NEW
- `apps/web/src/features/content/pages/CreateReelPage.test.tsx` — NEW
- `apps/web/src/features/content/pages/CreatePage.tsx` — MODIFIED
- `apps/web/src/features/upload/components/FileUploadZone.tsx` — MODIFIED (added text customization props)
- `apps/web/src/router.tsx` — MODIFIED
- `apps/web/package.json` — MODIFIED (@dnd-kit dependencies added)
