# Story 1.5: App Shell & Navigation Layout

Status: done

## Story

As a logged-in user,
I want a consistent app layout with sidebar navigation and top bar,
so that I can navigate between sections of the application easily.

## Acceptance Criteria

1. **AC1 — Persistent Sidebar:** A persistent sidebar is shown on the left (240px wide, collapsible to 64px icons-only) on all authenticated pages.
2. **AC2 — Navigation Items:** Sidebar contains navigation items: Dashboard, Create, Calendar, Library, Settings — with active page highlighted (indigo-50 bg, indigo-600 text, indigo left border).
3. **AC3 — Top Bar:** A top bar (56px height) shows the page title, contextual actions area, and user avatar with dropdown menu.
4. **AC4 — shadcn/ui + Design System:** The layout uses shadcn/ui components with Indigo #6366F1 as primary color and Inter font.
5. **AC5 — Responsive Behavior:** Sidebar collapses to icons on tablet (768–1023px) and is hidden on mobile (< 768px) with hamburger trigger using Sheet overlay.
6. **AC6 — Dark Mode Toggle:** Dark mode toggle is available in the user avatar dropdown.
7. **AC7 — Sentry Init:** Sentry is initialized for frontend error tracking (basic setup, DSN from env var).
8. **AC8 — Auth Guard:** Authenticated layout is only accessible to logged-in users; unauthenticated users redirect to /login.

## Tasks / Subtasks

- [x] Task 1: Install dependencies (AC: 4, 6, 7)
  - [x] Install zustand, @tanstack/react-query, @sentry/react, lucide-react, tw-animate-css
  - [x] Run `npx shadcn@latest init` (or configure components.json manually for Tailwind v4)
  - [x] Run `npx shadcn@latest add button avatar dropdown-menu sheet separator tooltip`
  - [x] Verify all deps in package.json, run lint + build

- [x] Task 2: Create Zustand UI store — `useUiStore` (AC: 1, 5)
  - [x] Create `apps/web/src/stores/useUiStore.ts`
  - [x] State: `sidebarCollapsed: boolean`, `sidebarMobileOpen: boolean`, `darkMode: boolean`
  - [x] Actions: `toggleSidebar()`, `setSidebarMobileOpen(open)`, `toggleDarkMode()`
  - [x] Use Zustand v5 TypeScript pattern: `create<T>()(...)` with double parens
  - [x] Persist `darkMode` and `sidebarCollapsed` to localStorage via zustand/middleware persist

- [x] Task 3: Set up TanStack Query + Sentry in entry point (AC: 7)
  - [x] Create `apps/web/src/lib/sentry.ts` — `Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, ... })`
  - [x] Update `apps/web/src/main.tsx`:
    - Import sentry.ts as FIRST import
    - Create QueryClient with default staleTime/gcTime
    - Wrap app in QueryClientProvider
    - Add Sentry React 19 error hooks to createRoot options (onUncaughtError, onCaughtError, onRecoverableError)
  - [x] Add `VITE_SENTRY_DSN` to `.env.example` (no actual DSN needed yet — Sentry gracefully no-ops without DSN)

- [x] Task 4: Create Sidebar component (AC: 1, 2, 5)
  - [x] Create `apps/web/src/components/layout/Sidebar.tsx`
  - [x] Navigation items array: Dashboard (LayoutDashboard), Create (PlusCircle), Calendar (CalendarDays), Library (Grid3X3), Settings (Settings) — bottom-anchored
  - [x] Use NavLink from react-router-dom for active state detection
  - [x] Active state styling: `bg-indigo-50 text-indigo-600` + left border (2px indigo-600)
  - [x] Default state: `text-gray-700`, hover: `bg-gray-100`
  - [x] Collapsed mode (64px): show only icons with tooltip for label
  - [x] Collapse toggle button at bottom with ChevronLeft/ChevronRight icon
  - [x] Read `sidebarCollapsed` from useUiStore
  - [x] Semantic HTML: `<nav role="navigation" aria-label="Main navigation">`
  - [x] Width transition: `transition-all duration-300`

- [x] Task 5: Create TopBar component (AC: 3, 6)
  - [x] Create `apps/web/src/components/layout/TopBar.tsx`
  - [x] Fixed height 56px, flex layout
  - [x] Left: hamburger Menu icon (mobile only, triggers Sheet via useUiStore.setSidebarMobileOpen)
  - [x] Left: page title (passed as prop or derived from route)
  - [x] Right: user avatar with DropdownMenu containing:
    - User display name + email
    - Separator
    - Dark mode toggle (Moon/Sun icon + "Dark mode" label)
    - Separator
    - Sign out button (calls logout from useAuth hook)
  - [x] Semantic HTML: `<header>`

- [x] Task 6: Create AppLayout component with Outlet (AC: 1, 3, 5, 8)
  - [x] Create `apps/web/src/components/layout/AppLayout.tsx`
  - [x] Auth guard: check session via useAuth hook; if not authenticated, redirect to /login
  - [x] Show loading spinner while checking auth state
  - [x] Layout structure:
    - Desktop: Sidebar (left) + main area (TopBar + Outlet)
    - Tablet: Collapsed icon sidebar + main area
    - Mobile: No sidebar (hidden), hamburger in TopBar triggers Sheet with sidebar content
  - [x] Mobile sidebar uses shadcn Sheet component (side="left")
  - [x] Main content area: `<main>` with padding and overflow-y-auto
  - [x] Apply dark mode class to root element based on useUiStore.darkMode

- [x] Task 7: Update Router with layout nesting (AC: 1, 8)
  - [x] Refactor `apps/web/src/router.tsx`:
    - Add AppLayout as parent route with `<Outlet />`
    - Nest placeholder child routes: `/dashboard`, `/create`, `/calendar`, `/library`, `/settings`
    - Keep `/login`, `/register`, `/onboarding` as standalone (no AppLayout wrapper)
    - Default redirect: `/` -> `/dashboard`
  - [x] Create minimal placeholder pages for Dashboard, Create, Calendar, Library (just page title text)
  - [x] Settings page placeholder

- [x] Task 8: Update CSS theme for dark mode support (AC: 4, 6)
  - [x] Update `apps/web/src/app.css`:
    - Add dark mode CSS variables (shadcn convention: `.dark` class on html element)
    - Ensure Indigo primary color tokens for both light and dark
    - Import tw-animate-css if needed
  - [x] Add `Inter` font import via `@import url(...)` or Google Fonts link in index.html

- [x] Task 9: Enhance useAuth hook with session check (AC: 8)
  - [x] Update `apps/web/src/features/auth/hooks/useAuth.ts`:
    - Add `checkSession()` that calls `GET /api/auth/me` on mount
    - Expose `user`, `isAuthenticated`, `isLoading` state
    - Use TanStack Query `useQuery` for session check (staleTime: 5min)
  - [x] Ensure login/register pages redirect to /dashboard if already authenticated

- [x] Task 10: Write tests (AC: all)
  - [x] Test Sidebar: renders nav items, highlights active route, collapses
  - [x] Test TopBar: renders page title, user avatar dropdown, dark mode toggle
  - [x] Test AppLayout: redirects unauthenticated users to /login
  - [x] Test Router: authenticated routes render AppLayout, public routes standalone

- [x] Task 11: Final verification
  - [x] Run `npm run lint` from root — must pass
  - [x] Run `npm run build` from root — all 3 workspaces must build
  - [x] Run `npm test` from root — all tests must pass
  - [ ] Manual smoke test: navigate between sidebar items, collapse sidebar, toggle dark mode, check mobile responsiveness

## Dev Notes

### Critical Architecture Constraints

- **Zustand v5** requires double-parens TypeScript pattern: `create<State>()(set => ({...}))`. Do NOT use v4 syntax.
- **TanStack Query v5**: use `isPending` (not `isLoading`), `gcTime` (not `cacheTime`), single-object argument for `useQuery`.
- **shadcn/ui with Tailwind v4**: `tailwindcss-animate` is DEPRECATED — use `tw-animate-css`. Leave `tailwind.config` path blank in `components.json`. CSS uses `@import "tailwindcss"`.
- **Sentry v10**: import instrument file as FIRST import in main.tsx. Use `Sentry.reactErrorHandler()` for React 19 error hooks (onUncaughtError, onCaughtError, onRecoverableError).
- **Lucide React**: use named imports for tree-shaking (`import { Home } from 'lucide-react'`). Do NOT use DynamicIcon.
- **Feature folder pattern** established in Stories 1.3/1.4: `features/` for domain logic, `components/layout/` for shared layout components, `stores/` for Zustand stores, `lib/` for utilities.
- **API response format**: `{ data: {...} }` for success, `{ error: {...} }` for failures. Already used in apiClient.ts.
- **CSRF**: all mutating API calls must include X-CSRF-Token header. The existing `apiClient.ts` handles this for POST/PUT/DELETE.

### Established Patterns from Previous Stories

- **cn() utility** at `apps/web/src/lib/cn.ts` — use for all className composition.
- **apiClient** at `apps/web/src/lib/apiClient.ts` — has `apiGet()` and `apiPost()` with CSRF support.
- **useAuth hook** at `apps/web/src/features/auth/hooks/useAuth.ts` — has `login()`, `logout()`, `checkSession()`, `user` state. Extend, do NOT replace.
- **Error handling**: backend uses AppError class with error codes. Frontend should display error.message from API responses.
- **Tailwind v4 CSS-first config**: theme defined in `app.css` via `@theme {}` block. No tailwind.config.js/ts file exists.
- **Path alias**: `@/` maps to `apps/web/src/` via vite.config.ts resolve.alias.
- **CORS**: backend allows any `http://localhost:*` origin in dev mode (fixed in Story 1.4).
- **Rate limiter**: mocked in tests to avoid 429 accumulation.
- **eslint config**: ESLint 9.17 flat config. Uses `@typescript-eslint/no-unused-vars` — use `_` prefix for intentionally unused args only.
- **Drizzle imports**: use extensionless imports in barrel exports (no `.js` extensions for drizzle-kit compatibility).

### Responsive Breakpoints (UX Spec)

| Breakpoint | Width | Tailwind | Sidebar Behavior |
|-----------|-------|----------|-----------------|
| Mobile | < 768px | default | Hidden, hamburger opens Sheet overlay |
| Tablet | 768–1023px | `md:` | Collapsed to 64px icons, tap to expand as overlay |
| Desktop | >= 1024px | `lg:` | Full 240px with icons + labels, collapsible |

### Navigation Items (from UX Spec)

| Order | Label | Icon (Lucide) | Route | Position |
|-------|-------|---------------|-------|----------|
| 1 | Dashboard | LayoutDashboard | /dashboard | Top |
| 2 | Create | PlusCircle | /create | Top |
| 3 | Calendar | CalendarDays | /calendar | Top |
| 4 | Library | Grid3X3 | /library | Top |
| 5 | Settings | Settings | /settings | Bottom (anchored) |

### Active Nav State (from UX Spec)

- Default: `text-gray-700`
- Hover: `bg-gray-100`
- Active: `bg-indigo-50 text-indigo-600` + 2px indigo-600 left border

### Dark Mode Implementation

- Use `.dark` CSS class on `<html>` element (shadcn convention)
- Toggle via useUiStore.toggleDarkMode()
- Persist preference in localStorage
- Detect system preference with `prefers-color-scheme` media query as initial default
- Add dark mode CSS variables in app.css `@theme` block

### File Structure (New Files)

```
apps/web/src/
├── lib/
│   └── sentry.ts                    # NEW — Sentry init
├── stores/
│   └── useUiStore.ts                # NEW — sidebar, dark mode state
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx            # NEW — auth guard + layout shell
│   │   ├── Sidebar.tsx              # NEW — nav sidebar
│   │   └── TopBar.tsx               # NEW — top bar with user menu
│   └── ui/                          # shadcn/ui components (auto-generated)
│       ├── button.tsx
│       ├── avatar.tsx
│       ├── dropdown-menu.tsx
│       ├── sheet.tsx
│       ├── separator.tsx
│       └── tooltip.tsx
├── features/
│   ├── dashboard/
│   │   └── pages/
│   │       └── DashboardPage.tsx    # NEW — placeholder
│   ├── content/
│   │   └── pages/
│   │       └── CreatePage.tsx       # NEW — placeholder
│   ├── calendar/
│   │   └── pages/
│   │       └── CalendarPage.tsx     # NEW — placeholder
│   └── publishing/
│       └── pages/
│           └── LibraryPage.tsx      # NEW — placeholder
├── features/auth/pages/
│   └── SettingsPage.tsx             # NEW — placeholder
└── main.tsx                         # MODIFIED — add QueryClient, Sentry
```

### Modified Files

- `apps/web/src/main.tsx` — add Sentry, QueryClientProvider, React 19 error hooks
- `apps/web/src/router.tsx` — refactor to nested routes with AppLayout
- `apps/web/src/app.css` — add dark mode variables, Inter font
- `apps/web/src/features/auth/hooks/useAuth.ts` — enhance with TanStack Query session check
- `apps/web/package.json` — new dependencies

### Project Structure Notes

- Layout components go in `components/layout/` per architecture doc, NOT in features/
- Zustand stores go in `stores/` per architecture doc
- Placeholder pages go in their respective feature folders per architecture doc
- shadcn/ui components auto-install into `components/ui/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend State Management]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `class-variance-authority` not auto-installed by shadcn CLI — required manual `npm install`
- matchMedia mock had to be in `src/test/setup.ts` (not inline in test file) because Zustand store calls `window.matchMedia()` at module init time before test-level mocks run
- "Found multiple elements with text: Dashboard" in tests — resolved by using `getByRole('heading')` instead of `getByText`

### Completion Notes List

- All 8 acceptance criteria met (AC1–AC8)
- 33/33 tests pass (22 API + 11 Web layout tests)
- Lint clean across all 3 workspaces
- Build successful for shared, api, and web packages
- Web bundle size warning (550KB > 500KB) — expected, code splitting deferred to future stories
- Sentry initialized conditionally (no-ops without DSN, as designed)
- useAuth hook refactored from local useState to TanStack Query shared cache — session state now shared across AppLayout, TopBar, and auth forms

### Code Review Fixes Applied

- **CRITICAL**: Added auth redirect on LoginPage/RegisterPage — already authenticated users redirected to /dashboard
- **HIGH**: Fixed tablet sidebar — shows collapsed 64px icons on md breakpoint (768-1023px) via matchMedia, hamburger hidden on md+
- **MEDIUM**: Fixed .env.example `SENTRY_DSN` → `VITE_SENTRY_DSN` (Vite prefix required)
- **MEDIUM**: Fixed sidebar active state border layout shift — `border-l-2 border-transparent` on non-active items
- **MEDIUM**: Refactored SidebarContent to reuse NavItem component (DRY violation)
- **MEDIUM**: Added SheetTitle/SheetDescription to mobile sidebar Sheet (accessibility)
- **LOW**: Consolidated Sentry double import in main.tsx to single named import

### Change Log

- NEW: `apps/web/components.json` — shadcn/ui config for Tailwind v4
- NEW: `apps/web/src/stores/useUiStore.ts` — Zustand v5 UI store (sidebar, dark mode)
- NEW: `apps/web/src/lib/sentry.ts` — Sentry init with conditional DSN
- NEW: `apps/web/src/components/layout/Sidebar.tsx` — Nav sidebar with collapse + tablet responsive
- NEW: `apps/web/src/components/layout/TopBar.tsx` — Top bar with user menu
- NEW: `apps/web/src/components/layout/AppLayout.tsx` — Auth guard + layout shell + Sheet a11y
- NEW: `apps/web/src/components/ui/button.tsx` — shadcn button
- NEW: `apps/web/src/components/ui/avatar.tsx` — shadcn avatar
- NEW: `apps/web/src/components/ui/dropdown-menu.tsx` — shadcn dropdown-menu
- NEW: `apps/web/src/components/ui/sheet.tsx` — shadcn sheet
- NEW: `apps/web/src/components/ui/separator.tsx` — shadcn separator
- NEW: `apps/web/src/components/ui/tooltip.tsx` — shadcn tooltip
- NEW: `apps/web/src/features/dashboard/pages/DashboardPage.tsx` — Placeholder
- NEW: `apps/web/src/features/content/pages/CreatePage.tsx` — Placeholder
- NEW: `apps/web/src/features/calendar/pages/CalendarPage.tsx` — Placeholder
- NEW: `apps/web/src/features/publishing/pages/LibraryPage.tsx` — Placeholder
- NEW: `apps/web/src/features/auth/pages/SettingsPage.tsx` — Placeholder
- NEW: `apps/web/src/test/setup.ts` — Test setup with matchMedia mock
- NEW: `apps/web/src/components/layout/layout.test.tsx` — 11 layout + auth redirect tests
- MODIFIED: `apps/web/src/main.tsx` — Added Sentry, QueryClientProvider, TooltipProvider, React 19 error hooks
- MODIFIED: `apps/web/src/router.tsx` — Nested routes under AppLayout, placeholder pages
- MODIFIED: `apps/web/src/app.css` — Full shadcn/ui CSS variable system (light + dark)
- MODIFIED: `apps/web/index.html` — Inter font via Google Fonts
- MODIFIED: `apps/web/src/features/auth/hooks/useAuth.ts` — TanStack Query session cache
- MODIFIED: `apps/web/src/features/auth/components/LoginForm.tsx` — Navigate to /dashboard
- MODIFIED: `apps/web/src/features/auth/pages/LoginPage.tsx` — Auth redirect to /dashboard
- MODIFIED: `apps/web/src/features/auth/pages/RegisterPage.tsx` — Auth redirect to /dashboard
- MODIFIED: `apps/web/vite.config.ts` — vitest config added
- MODIFIED: `apps/web/package.json` — New deps + test script
- MODIFIED: `.env.example` — Fixed VITE_SENTRY_DSN variable name

### File List

- `apps/web/components.json`
- `apps/web/src/stores/useUiStore.ts`
- `apps/web/src/lib/sentry.ts`
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/layout/TopBar.tsx`
- `apps/web/src/components/layout/AppLayout.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/avatar.tsx`
- `apps/web/src/components/ui/dropdown-menu.tsx`
- `apps/web/src/components/ui/sheet.tsx`
- `apps/web/src/components/ui/separator.tsx`
- `apps/web/src/components/ui/tooltip.tsx`
- `apps/web/src/features/dashboard/pages/DashboardPage.tsx`
- `apps/web/src/features/content/pages/CreatePage.tsx`
- `apps/web/src/features/calendar/pages/CalendarPage.tsx`
- `apps/web/src/features/publishing/pages/LibraryPage.tsx`
- `apps/web/src/features/auth/pages/SettingsPage.tsx`
- `apps/web/src/features/auth/pages/LoginPage.tsx`
- `apps/web/src/features/auth/pages/RegisterPage.tsx`
- `apps/web/src/test/setup.ts`
- `apps/web/src/components/layout/layout.test.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/router.tsx`
- `apps/web/src/app.css`
- `apps/web/index.html`
- `apps/web/src/features/auth/hooks/useAuth.ts`
- `apps/web/src/features/auth/components/LoginForm.tsx`
- `apps/web/vite.config.ts`
- `apps/web/package.json`
- `.env.example`
