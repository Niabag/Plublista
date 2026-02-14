# Story 5.1: Dashboard with Quick-Create & Recent Content

Status: done

## Story

As a user,
I want a dashboard showing my recent content, quick-create buttons, and status overview,
so that I have a central hub for managing my content workflow.

## Acceptance Criteria

1. **AC1 — Quick-Create Buttons:** Quick-create buttons are displayed: "New Reel", "New Carousel", "New Post", linking to their respective creation pages.

2. **AC2 — Recent Content Grid:** Recent content is shown as a visual card grid using existing `ContentCard` components, ordered by creation date (newest first).

3. **AC3 — Content Card Info:** Each card shows thumbnail, title (or fallback), status badge (via `StatusBadge`), content type icon, creation date, and platform badges where applicable.

4. **AC4 — Quota Widget:** The `QuotaIndicator` widget shows current quota usage for reels, carousels, and AI images with color-coded progress bars.

5. **AC5 — Loading States:** Content cards load with skeleton states and the grid renders in < 1 second for up to 100 items (NFR5).

6. **AC6 — Responsive Grid:** The content grid is responsive: 1 column on mobile, 2 columns on tablet, 3-4 columns on desktop.

7. **AC7 — Empty State:** When the user has no content, a friendly empty state is shown with a CTA to create their first piece of content.

8. **AC8 — Tests:** Frontend tests cover the dashboard page (render, loading state, content display, empty state, quick-create links, quota widget).

## Tasks / Subtasks

- [x] Task 1: Implement DashboardPage component (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Replace stub in `apps/web/src/features/dashboard/pages/DashboardPage.tsx`
  - [x] Add quick-create section with 3 buttons: New Reel → `/create/reel`, New Carousel → `/create/carousel`, New Post → `/create/post`
  - [x] Add `QuotaIndicator` widget section (reuse existing from settings)
  - [x] Add recent content grid using `useContentList` hook + `ContentCard` components
  - [x] Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - [x] Skeleton loading state while content loads (animate-pulse pattern)
  - [x] Empty state when no content items exist (icon + message + CTA link to `/create`)
  - [x] Error state with retry option
- [x] Task 2: Write `DashboardPage.test.tsx` tests (AC: 8)
  - [x] Renders quick-create buttons with correct links
  - [x] Shows loading skeleton state while data loads
  - [x] Displays content cards when data is available
  - [x] Shows empty state when no content items
  - [x] Renders QuotaIndicator widget
  - [x] Shows error state with retry button
  - [x] Limits to 8 items with "View all" link
- [x] Task 3: Verify TypeScript + full test suite pass

## Dev Notes

### Architecture Compliance

**Frontend-only story.** No backend changes needed — all required API endpoints already exist:
- `GET /api/content-items` — returns all user content (ordered by createdAt DESC)
- `GET /api/quotas` — returns quota usage per resource

**Frontend pattern** — follows existing content feature patterns:
- TanStack Query v5 for server state (`useQuery`)
- Tailwind CSS v4 + shadcn/ui components
- Toast notifications via `sonner`
- `cn()` utility for conditional classNames
- Co-located tests: `DashboardPage.test.tsx`

### Key Implementation Details

**DashboardPage Structure:**

```typescript
// apps/web/src/features/dashboard/pages/DashboardPage.tsx
import { Link } from 'react-router-dom';
import { Film, Images, ImageIcon, Plus } from 'lucide-react';
import { useContentList } from '@/features/content/hooks/useContentList';
import { ContentCard } from '@/features/content/components/ContentCard';
import { QuotaIndicator } from '@/features/auth/components/QuotaIndicator';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const { items, isPending, isError, error, refetch } = useContentList();

  return (
    <div className="space-y-8">
      {/* Section 1: Quick Create */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Create</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/create/reel" className="...">
            <Film /> New Reel
          </Link>
          <Link to="/create/carousel" className="...">
            <Images /> New Carousel
          </Link>
          <Link to="/create/post" className="...">
            <ImageIcon /> New Post
          </Link>
        </div>
      </section>

      {/* Section 2: Quota Overview */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Usage</h2>
        <QuotaIndicator />
      </section>

      {/* Section 3: Recent Content */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Content</h2>
        {isPending && <SkeletonGrid />}
        {isError && <ErrorState onRetry={refetch} />}
        {items?.length === 0 && <EmptyState />}
        {items && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**Skeleton Loading Grid:**
```typescript
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-40 w-full rounded" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

**Empty State:**
```typescript
function EmptyState() {
  return (
    <div className="text-center py-12">
      <Plus className="mx-auto size-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No content yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first piece of content to get started.
      </p>
      <Link to="/create" className="...">
        Create Content
      </Link>
    </div>
  );
}
```

**QuotaIndicator Reuse:**

The `QuotaIndicator` component already exists in `apps/web/src/features/auth/components/QuotaIndicator.tsx`. It uses `useQuota()` hook internally and renders colored progress bars per resource. It should be importable directly:

```typescript
import { QuotaIndicator } from '@/features/auth/components/QuotaIndicator';
// Used in settings page — verify it works standalone (no parent context dependencies)
```

**If QuotaIndicator needs adjustment** for dashboard context (e.g., compact mode, different layout), create a wrapper or pass a `variant` prop rather than duplicating the component.

### Existing Code to Reuse

| What | Location | How |
|------|----------|-----|
| `DashboardPage` stub | `apps/web/src/features/dashboard/pages/DashboardPage.tsx` | Replace stub content |
| `useContentList` hook | `apps/web/src/features/content/hooks/useContentList.ts` | Fetches all user content |
| `ContentCard` component | `apps/web/src/features/content/components/ContentCard.tsx` | Displays content items with thumbnail, status, type |
| `StatusBadge` component | `apps/web/src/features/content/components/StatusBadge.tsx` | Color-coded status badges (used by ContentCard) |
| `QuotaIndicator` component | `apps/web/src/features/auth/components/QuotaIndicator.tsx` | Quota progress bars |
| `useQuota` hook | `apps/web/src/features/auth/hooks/useQuota.ts` | Fetches quota usage (used by QuotaIndicator) |
| `Skeleton` component | `apps/web/src/components/ui/skeleton.tsx` | shadcn/ui loading skeletons |
| Dashboard route | `apps/web/src/router.tsx` | Already configured at `/dashboard` |
| Sidebar navigation | `apps/web/src/components/layout/Sidebar.tsx` | Already has Dashboard link |
| `GET /api/content-items` | `apps/api/src/features/content/content.routes.ts` | Backend endpoint (already exists) |
| `GET /api/quotas` | `apps/api/src/features/quota/quota.routes.ts` | Backend endpoint (already exists) |

### DB Schema Notes

**No migration needed.** All required data is already available via existing endpoints.

### Project Structure Notes

Files to modify:
```
apps/web/src/features/dashboard/pages/DashboardPage.tsx      (EDIT — replace stub)
```

Files to create:
```
apps/web/src/features/dashboard/pages/DashboardPage.test.tsx  (NEW — tests)
```

**No backend changes required.**

### Previous Story Learnings (from Stories 3.1, 3.2, Epic 4)

- `FormatPreview` props are `selected`/`onSelect`
- Use `vi.hoisted()` for mock constants in `vi.mock` factories
- Use `mockReset()` before `mockReturnValueOnce()`
- Mock react-router-dom: `vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => mockNavigate }))`
- QueryClient wrapper needed for tests: `createWrapper()` with `QueryClientProvider`
- `createElement` pattern for test rendering without JSX (see ImageGenerator.test.tsx)
- Content types: `'reel' | 'carousel' | 'post'`
- Content statuses: `'draft' | 'generating' | 'scheduled' | 'published' | 'failed' | 'retrying'`
- Status badge colors: draft=gray, generating/retrying=amber+pulse, scheduled=sky, published=green, failed=red
- Content card icons: Film (reel), Images (carousel), ImageIcon (post)

### Test Patterns (for DashboardPage.test.tsx)

```typescript
// Mock useContentList
vi.mock('@/features/content/hooks/useContentList', () => ({
  useContentList: vi.fn(),
}));

// Mock QuotaIndicator (avoid dependency on useQuota in tests)
vi.mock('@/features/auth/components/QuotaIndicator', () => ({
  QuotaIndicator: () => createElement('div', { 'data-testid': 'quota-indicator' }, 'Quota'),
}));

// Wrap with MemoryRouter for Link components
function renderDashboard() {
  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(QueryClientProvider, { client: queryClient },
        createElement(DashboardPage)
      )
    )
  );
}

// Test scenarios:
// 1. Loading state: useContentList returns { isPending: true }
// 2. Content display: useContentList returns { items: [mockItem1, mockItem2] }
// 3. Empty state: useContentList returns { items: [] }
// 4. Error state: useContentList returns { isError: true, error: new Error('...'), refetch: vi.fn() }
// 5. Quick-create links: check href attributes
// 6. Quota widget: check data-testid presence
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-5, Story 5.1]
- [Source: _bmad-output/planning-artifacts/prd.md — FR38 (Dashboard), FR39 (Publishing Status)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend patterns, responsive grid, skeleton states]
- [Source: apps/web/src/features/content/components/ContentCard.tsx — existing content card]
- [Source: apps/web/src/features/content/components/StatusBadge.tsx — existing status badges]
- [Source: apps/web/src/features/auth/components/QuotaIndicator.tsx — existing quota widget]
- [Source: apps/web/src/features/content/hooks/useContentList.ts — existing content list hook]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed pre-existing layout test: Sidebar toggle button test updated to hover-based collapse check

### Completion Notes List

- DashboardPage implemented with 3 sections: Quick Create, Quota Overview, Recent Content
- Quick-create links: New Reel → `/create/reel`, New Carousel → `/create/carousel`, New Post → `/create/post`
- QuotaIndicator reused from auth feature (self-contained with own loading/error states)
- Recent content grid limited to 8 items with "View all" → `/library` link
- Skeleton loading with animate-pulse pattern (consistent with existing codebase)
- Empty state with CTA to `/create`, error state with retry button
- Responsive grid: 1-col mobile, 2-col tablet, 3-col desktop, 4-col wide
- Created `skeleton.tsx` shadcn/ui component for future use
- Fixed stale sidebar toggle test (hover-based expand/collapse, no button)
- TypeScript: 0 errors | Web tests: 217 pass (28 files) | API tests: 164 pass (17 files)

### File List

- `apps/web/src/features/dashboard/pages/DashboardPage.tsx` — MODIFIED (replaced stub)
- `apps/web/src/features/dashboard/pages/DashboardPage.test.tsx` — CREATED (7 tests)
- `apps/web/src/components/ui/skeleton.tsx` — CREATED (shadcn/ui Skeleton component)
- `apps/web/src/components/layout/layout.test.tsx` — MODIFIED (fixed stale sidebar test)
