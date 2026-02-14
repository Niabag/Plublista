# Story 2.5: Auto-Montage Progress UI

Status: review

## Story

As a user,
I want to see real-time progress of my Reel generation with AI decision transparency,
so that I understand what the AI is doing and feel confident in the process.

## Acceptance Criteria

1. **AC1 — Progress Page Route:** After clicking "Generate Auto-Montage" in `CreateReelPage`, user navigates to `/create/reel/:id/progress` instead of `/library`. The page shows the `AutoMontageProgress` component.

2. **AC2 — Step-by-Step Progress Display:** The `AutoMontageProgress` component shows 5 pipeline steps with status icons:
   - `✅` / `⏳` / `○` Analyzing clips (count of clips, total duration)
   - `✅` / `⏳` / `○` Selecting best moments (shows hook selection detail when done)
   - `✅` / `⏳` / `○` Matching music to content mood
   - `✅` / `⏳` / `○` Rendering final video
   - `✅` / `⏳` / `○` Adding text overlays

3. **AC3 — Polling & Progress Bar:** Progress updates via polling `GET /api/content-items/:id/status` every 3 seconds using TanStack Query `refetchInterval`. An overall progress bar shows percentage. Polling stops when status is `draft` (success) or `failed`.

4. **AC4 — Completion Transition:** When rendering completes (status → `draft`), all steps show `✅`, progress bar hits 100%, and after a 1.5s delay the view transitions with a fade-in to show a "View your Reel" CTA button linking to `/library`.

5. **AC5 — Error State:** If status is `failed`, the current step shows `❌` with an error message. A "Try Again" button appears that navigates back to `/create/reel` to start over.

6. **AC6 — Accessibility:** `aria-live="polite"` on step updates region, `aria-valuenow`/`aria-valuemin`/`aria-valuemax` on progress bar, step completions announced to screen readers, respects `prefers-reduced-motion`.

7. **AC7 — Tests:** Component tests cover: rendering all steps, polling behavior mock, completion transition, error state with retry button, accessibility attributes.

## Tasks / Subtasks

- [x] Task 1: Create `useContentStatus` polling hook (AC: 3)
  - [x] Create `apps/web/src/features/content/hooks/useContentStatus.ts`
  - [x] Use TanStack Query `useQuery` with `refetchInterval: 3000`
  - [x] Stop polling when status is `draft` or `failed` (set `refetchInterval: false`)
  - [x] Return `{ status, generatedMediaUrl, isPending, isError }`
  - [x] Query key: `['content-status', contentItemId]`

- [x] Task 2: Create `AutoMontageProgress` component (AC: 2, 6)
  - [x] Create `apps/web/src/features/content/components/AutoMontageProgress.tsx`
  - [x] Props: `contentItemId: string`
  - [x] Uses `useContentStatus(contentItemId)` for polling
  - [x] 5-step list with icons: `CheckCircle2` (done), `Loader2` with `animate-spin` (in-progress), `Circle` (pending)
  - [x] Map backend `status` to step progress: `generating` → simulate steps over time, `draft` → all complete, `failed` → stop at current step with `XCircle`
  - [x] Use shadcn/ui `Progress` component for the overall progress bar
  - [x] Add `aria-live="polite"` region, proper `aria-value*` on progress bar

- [x] Task 3: Create `ProgressPage` route (AC: 1, 4, 5)
  - [x] Create `apps/web/src/features/content/pages/ProgressPage.tsx`
  - [x] Route: `/create/reel/:id/progress` — extract `id` from `useParams()`
  - [x] Renders `AutoMontageProgress` with the content item ID
  - [x] On completion: 1.5s delay → fade-in "Your Reel is ready!" with "View in Library" button → navigates to `/library`
  - [x] On error: show "Try Again" button → navigates to `/create/reel`
  - [x] Register route in `apps/web/src/router.tsx`

- [x] Task 4: Update `CreateReelPage` navigation (AC: 1)
  - [x] In `apps/web/src/features/content/pages/CreateReelPage.tsx`
  - [x] Change `handleGenerate` to navigate to `/create/reel/${item.id}/progress` instead of `/library`
  - [x] Extract `item.id` from the `apiPost` response: `const result = await apiPost<{ data: { id: string } }>(...)` → `navigate(\`/create/reel/${result.data.id}/progress\`)`

- [x] Task 5: Write component tests (AC: 7)
  - [x] Create `apps/web/src/features/content/components/AutoMontageProgress.test.tsx`
  - [x] Test: renders all 5 step labels
  - [x] Test: shows progress bar with correct aria attributes
  - [x] Test: displays completion state when status is `draft`
  - [x] Test: displays error state with retry button when status is `failed`
  - [x] Test: aria-live region is present
  - [x] Create `apps/web/src/features/content/hooks/useContentStatus.test.ts`
  - [x] Test: calls API with correct content item ID
  - [x] Test: stops polling when status is `draft`

- [x] Task 6: Final verification
  - [x] `npx tsc --noEmit` in both apps — 0 errors
  - [x] `npx vitest run` in API — all tests pass (13 files, 96 tests)
  - [x] `npx vitest run` in web — all tests pass (17 files, 109 tests — 14 new)

## Dev Notes

### Critical Architecture Constraints

- **TanStack Query for polling.** Use `useQuery` with `refetchInterval` option — set to `3000` (3 seconds) when `status === 'generating'`, set to `false` when `status === 'draft'` or `status === 'failed'`. This is the established pattern in the codebase (see `useAuth.ts`, `useQuota.ts`).
- **API client.** Use `apiGet` from `@/lib/apiClient` — it auto-includes credentials and handles errors. The endpoint `GET /api/content-items/:id/status` already exists (Story 2.4) and returns `{ data: { status, generatedMediaUrl } }`.
- **Shadcn/ui Progress.** Already installed at `apps/web/src/components/ui/progress.tsx` — Radix UI based. Use `<Progress value={percentage} />`. Add `aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}` and `aria-label="Generation progress"`.
- **Icons from Lucide React.** Already installed. Use: `CheckCircle2` (completed step), `Loader2` (in-progress, add `className="animate-spin"`), `Circle` (pending), `XCircle` (failed).
- **Toast notifications.** Use `toast` from `sonner` (already installed) for success/error feedback — matches existing pattern in `CreateReelPage`.
- **Error handling.** API errors thrown by `apiGet` are `{ code, message, statusCode }` objects. Display `error.message` to the user on failure.
- **Tailwind CSS v4.** Use Tailwind classes for styling. Dark mode via `dark:` variant. The app uses `class-variance-authority` for component variants but this component is simple enough to use direct Tailwind classes.
- **No Zustand needed.** This component's state is fully server-driven via polling — no local UI state beyond what React state provides.
- **`prefers-reduced-motion`.** Use Tailwind's `motion-safe:` and `motion-reduce:` variants for animations. The `animate-spin` on `Loader2` should be wrapped in `motion-safe:animate-spin`. The fade-in transition on completion should respect this preference.

### Step Progress Simulation

The backend currently returns only `status` (`generating`, `draft`, `failed`) — there is no granular `progressStep` field. To simulate step-by-step progress during `generating` status:

1. When status first becomes `generating`, start a local timer
2. Advance steps at simulated intervals: step 1 at 0s, step 2 at 3s, step 3 at 6s, step 4 at 9s, step 5 waits for completion
3. When status transitions to `draft`, immediately set all steps to complete
4. When status transitions to `failed`, freeze at the current simulated step and show error icon

This approach provides visual progress feedback without requiring backend changes. Use a `useEffect` with `setInterval` to advance the simulated step.

### Frontend Component Structure

```
apps/web/src/features/content/
├── components/
│   ├── AutoMontageProgress.tsx          # Progress display component
│   └── AutoMontageProgress.test.tsx     # Component tests
├── hooks/
│   ├── useContentStatus.ts             # TanStack Query polling hook
│   └── useContentStatus.test.ts        # Hook tests
└── pages/
    ├── CreateReelPage.tsx              # MODIFIED — navigate to progress page
    └── ProgressPage.tsx                # NEW — progress page wrapper
```

### Existing Patterns to Follow

- **Hook pattern:** Follow `useAuth.ts` / `useQuota.ts` — export named query key, use `useQuery` with `queryFn` calling `apiGet`, return destructured data.
- **Component pattern:** Follow `PlatformCard.tsx` / `ClipCard.tsx` — functional component, Tailwind classes, Lucide icons, proper TypeScript props interface.
- **Test pattern:** Follow `PlatformCard.test.tsx` — `describe/it/expect`, `render` from `@testing-library/react`, `screen.getByText/getByRole`, `vi.mock` for API/hooks.
- **Page pattern:** Follow `CreateReelPage.tsx` — `useNavigate`, `useParams` for route params, centered layout with `max-w-*`.
- **File naming:** `camelCase.ts` for files, `PascalCase` for components.
- **Router registration:** Add route object to the `AppLayout` children array in `apps/web/src/router.tsx`.

### Key Dependencies Already Installed

- `@tanstack/react-query` v5 — for polling
- `lucide-react` — for step icons
- `sonner` — for toast notifications
- `radix-ui` — Progress component (via shadcn/ui)
- `react-router-dom` v7 — for routing/navigation
- `@testing-library/react` + `@testing-library/user-event` — for tests

### What This Story Does NOT Include

- Real granular progress tracking from backend (uses simulated steps)
- WebSocket/SSE real-time updates (polling only — sufficient for MVP)
- Cancel generation feature (future story)
- Preview of the generated video (Story 2.7)
- AI copy generation below progress (Story 2.6)

### Previous Story Learnings (from Story 2.4)

- **`@fal-ai/client`** is the correct package (not deprecated `@fal-ai/serverless-client`)
- **BullMQ** uses config object, not IORedis instance, to avoid type conflicts
- **Route ordering matters:** more specific routes (`/:id/status`) must come before parameterized routes (`/:id`) — already fixed in Story 2.4
- **Spread operator for immutability:** Use `{ ...item, status: 'new' as const }` instead of mutating Drizzle-returned objects
- **Status endpoint exists and works:** `GET /api/content-items/:id/status` returns `{ data: { status, generatedMediaUrl } }` — fully tested in Story 2.4

### Project Structure Notes

- All new files are in `apps/web/src/features/content/` — aligns with existing feature-folder structure
- Route registered under `AppLayout` children — matches existing pattern
- No new dependencies needed — all packages already installed
- No backend changes needed — Story 2.4 already provides the polling endpoint

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 Story 2.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AutoMontageProgress]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Communication Patterns]
- [Source: _bmad-output/implementation-artifacts/2-4-auto-montage-rendering-pipeline.md]
- [Source: apps/web/src/features/content/pages/CreateReelPage.tsx]
- [Source: apps/web/src/features/auth/hooks/useAuth.ts]
- [Source: apps/web/src/components/ui/progress.tsx]
- [Source: apps/web/src/router.tsx]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Missing `afterEach` import in test file — fixed by adding to vitest imports
- No new dependencies needed — all packages already installed

### Completion Notes List

- All 6 tasks completed successfully
- TypeScript: 0 errors in both apps
- API tests: 13 files, 96 tests passing (no regressions)
- Web tests: 17 files, 109 tests passing (14 new tests: 10 component + 4 hook)
- No backend changes needed — uses existing `GET /api/content-items/:id/status` endpoint from Story 2.4
- Step progress is simulated client-side (every 3s) since backend only returns status enum
- Polling stops automatically when status reaches `draft` or `failed`

### File List

New files created:
- `apps/web/src/features/content/hooks/useContentStatus.ts`
- `apps/web/src/features/content/components/AutoMontageProgress.tsx`
- `apps/web/src/features/content/pages/ProgressPage.tsx`
- `apps/web/src/features/content/components/AutoMontageProgress.test.tsx`
- `apps/web/src/features/content/hooks/useContentStatus.test.ts`

Modified files:
- `apps/web/src/router.tsx` — Added ProgressPage import and `/create/reel/:id/progress` route
- `apps/web/src/features/content/pages/CreateReelPage.tsx` — Changed handleGenerate to navigate to progress page with content item ID
