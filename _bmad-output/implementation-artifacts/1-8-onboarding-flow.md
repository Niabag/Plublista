# Story 1.8: Onboarding Flow

Status: review

## Story

As a new user,
I want a guided onboarding experience after registration,
so that I can set up my account and understand the platform quickly.

## Acceptance Criteria

1. **AC1 — Onboarding Entry:** Given a new user completes registration, when they are redirected to `/onboarding`, then a 3-step linear flow is presented with a progress stepper showing the current step.
2. **AC2 — Step 1: Connect Instagram:** The first step shows an Instagram OAuth connection button with a trust badge ("Why connect?") explanation and a "Skip for now" link. Connecting uses the existing OAuth flow from Story 1.6.
3. **AC3 — Step 2: Upload Clips (Placeholder):** The second step shows a drag-and-drop upload zone mockup with helper text "Use your phone videos — even selfies work!". Since file upload (Story 2.1/2.2) is not yet implemented, this step displays the planned UI with a "Coming soon" badge and a "Skip" button to proceed.
4. **AC4 — Step 3: Create First Reel (Placeholder):** The third step shows a prominent "Create My Reel" CTA mockup. Since Auto-Montage (Story 2.4) is not yet implemented, this step displays the planned UI with a "Coming soon" badge and a "Complete Onboarding" button.
5. **AC5 — Progress Persistence:** Onboarding completion is tracked via an `onboardingCompletedAt` timestamp field on the users table. A database migration adds this nullable column.
6. **AC6 — Route Guards:** Users who have not completed onboarding are redirected from authenticated routes to `/onboarding`. Users who have completed onboarding are redirected from `/onboarding` to `/dashboard`. The onboarding page requires authentication.
7. **AC7 — Completion:** After clicking "Complete Onboarding" on the final step, the backend marks `onboardingCompletedAt`, a success toast ("Welcome to Publista!") appears, and the user is redirected to `/dashboard`.

## Tasks / Subtasks

- [x] Task 1: Add `onboardingCompletedAt` field to users schema + migration (AC: 5)
  - [x] Add `onboardingCompletedAt` nullable timestamp column to users table in `apps/api/src/db/schema/users.ts`
  - [x] Generate Drizzle migration: `npx drizzle-kit generate`
  - [x] Update `User` type in `packages/shared/src/types/user.types.ts` to include `onboardingCompletedAt: string | null`
  - [x] Rebuild shared package: `npm run build` in `packages/shared`

- [x] Task 2: Create backend onboarding endpoints (AC: 5, 7)
  - [x] Add `completeOnboarding(userId)` to `apps/api/src/features/auth/auth.service.ts` — sets `onboardingCompletedAt = new Date()`, returns updated user
  - [x] Add `completeOnboarding` controller to `apps/api/src/features/auth/auth.controller.ts`
  - [x] Add `POST /api/auth/onboarding/complete` route to `auth.routes.ts` with requireAuth + CSRF + authLimiter
  - [x] Update `deserializeUser` in `apps/api/src/config/passport.ts` to include `onboardingCompletedAt: users.onboardingCompletedAt` in the select clause
  - [x] Update `registerUser` returning clause in `auth.service.ts` to include `onboardingCompletedAt: users.onboardingCompletedAt`
  - [x] Update `loginUser` select clause in `auth.service.ts` to include `onboardingCompletedAt: users.onboardingCompletedAt`
  - [x] Update `updateUserProfile` returning clause in `auth.service.ts` to include `onboardingCompletedAt: users.onboardingCompletedAt`

- [x] Task 3: Create OnboardingPage with stepper UI (AC: 1)
  - [x] Create `apps/web/src/features/auth/pages/OnboardingPage.tsx`
  - [x] 3-step stepper with visual progress indicator (step numbers + labels + connecting line)
  - [x] Step labels: "Connect Instagram", "Upload Clips", "Create Your Reel"
  - [x] Current step highlighted in indigo, completed steps show checkmark, future steps muted
  - [x] Only the current step's content is rendered (no tabs)

- [x] Task 4: Create Step 1 — Connect Instagram (AC: 2)
  - [x] Create `apps/web/src/features/auth/components/OnboardingStepConnect.tsx`
  - [x] Show Instagram card with platform icon, "Connect Instagram" button (reuse `connectPlatform` from `usePlatformConnections`)
  - [x] Trust badge section: "Why connect?" with explanation (publish directly, schedule posts, track engagement)
  - [x] If already connected (via OAuth callback or previous connection), show green "Connected as @username" state
  - [x] "Skip for now" ghost button at bottom to proceed without connecting
  - [x] "Next" primary button (enabled whether connected or skipped)

- [x] Task 4b: Implement OAuth returnTo redirect (AC: 2)
  - [x] In `apps/api/src/features/auth/oauth.controller.ts` `initiateInstagramOAuth`: read `req.query.returnTo`, validate against allowlist (`['/settings', '/onboarding']`), store in `req.session.oauthReturnTo`
  - [x] In `apps/api/src/features/auth/oauth.controller.ts` `handleInstagramCallback`: read `req.session.oauthReturnTo` (default `/settings`), use it as redirect base instead of hardcoded `/settings`
  - [x] In `OnboardingStepConnect.tsx`: use `window.location.href = \`${API_BASE}/api/auth/oauth/instagram?returnTo=/onboarding\`` to initiate OAuth with return path

- [x] Task 5: Create Step 2 — Upload Clips Placeholder (AC: 3)
  - [x] Create `apps/web/src/features/auth/components/OnboardingStepUpload.tsx`
  - [x] Drag-and-drop zone mockup (dashed border, upload icon, "Drag and drop your video clips here" text)
  - [x] Helper text: "Use your phone videos — even selfies work!"
  - [x] "Coming soon" badge (amber) indicating this feature arrives with Epic 2
  - [x] Explanatory text: "Video upload will be available soon. Skip this step for now."
  - [x] "Skip" button to proceed, "Back" button to go to Step 1

- [x] Task 6: Create Step 3 — Create Reel Placeholder (AC: 4, 7)
  - [x] Create `apps/web/src/features/auth/components/OnboardingStepCreate.tsx`
  - [x] Large "Create My Reel" CTA mockup (disabled, with "Coming soon" badge)
  - [x] Explanatory text: "AI-powered Reel creation will be available soon."
  - [x] "Complete Onboarding" primary button that calls the completion endpoint
  - [x] "Back" button to go to Step 2
  - [x] Loading state on completion button ("Completing...")

- [x] Task 7: Wire up completion flow and hooks (AC: 5, 7)
  - [x] Add `completeOnboarding()` method to `useAuth` hook — calls `apiPost('/api/auth/onboarding/complete')`, updates session cache with returned user
  - [x] OnboardingPage calls `completeOnboarding()` on final step, then `navigate('/dashboard')` + `toast.success('Welcome to Publista!')`
  - [x] Update `useAuth` return to include `completeOnboarding`

- [x] Task 8: Implement route guards (AC: 6)
  - [x] Update `AppLayout.tsx`: after auth check, if `user.onboardingCompletedAt` is null, redirect to `/onboarding`
  - [x] Update `/onboarding` route in `router.tsx`: replace placeholder with `<OnboardingPage />`
  - [x] OnboardingPage: if `user.onboardingCompletedAt` is not null, redirect to `/dashboard`
  - [x] OnboardingPage: if user is not authenticated, redirect to `/login`

- [x] Task 9: Write backend tests (AC: all)
  - [x] Test POST /api/auth/onboarding/complete: auth required, CSRF required, sets `onboardingCompletedAt`, returns updated user
  - [x] Test POST /api/auth/onboarding/complete: idempotent (calling again doesn't change the timestamp)
  - [x] Test GET /api/auth/me: includes `onboardingCompletedAt` field in response
  - [x] Update existing auth tests if needed (ensure register returns user with `onboardingCompletedAt: null`)
  - [x] Test OAuth returnTo: GET /api/auth/oauth/instagram?returnTo=/onboarding stores returnTo in session; callback redirects to /onboarding instead of /settings
  - [x] Test OAuth returnTo validation: rejects returnTo values not in allowlist

- [x] Task 10: Write frontend tests (AC: all)
  - [x] Test OnboardingPage: renders stepper with 3 steps, first step active
  - [x] Test OnboardingStepConnect: renders Instagram connect button, skip link works
  - [x] Test OnboardingStepCreate: "Complete Onboarding" button calls completion endpoint
  - [x] Test route guard: redirects to `/onboarding` when `onboardingCompletedAt` is null
  - [x] Test route guard: redirects to `/dashboard` when `onboardingCompletedAt` is set

- [x] Task 11: Final verification
  - [x] Run `npx tsc --noEmit` in both `apps/api` and `apps/web` — must pass
  - [x] Run `npx vitest run` in `apps/api` — all 53 tests pass (8 test files)
  - [x] Run `npx vitest run` in `apps/web` — all 41 tests pass (6 test files)

## Dev Notes

### Critical Architecture Constraints

- **RegisterForm already redirects to `/onboarding`**: In `apps/web/src/features/auth/components/RegisterForm.tsx:22`, after successful registration `navigate('/onboarding')` is called. No changes needed to registration flow.
- **`/onboarding` route already exists as placeholder**: In `apps/web/src/router.tsx:22-28`, a placeholder element exists. Replace it with `<OnboardingPage />`.
- **Onboarding page must check auth**: The `/onboarding` route is public (outside `AppLayout`), so `OnboardingPage` must independently check `useAuth().user` and redirect to `/login` if null. Use `isSessionLoading` to show a spinner while checking.
- **No `onboardingCompletedAt` field exists yet**: The users table at `apps/api/src/db/schema/users.ts` has no onboarding tracking. Add a nullable timestamp column and generate a Drizzle migration.
- **User type must be updated**: `packages/shared/src/types/user.types.ts` defines the `User` type. Add `onboardingCompletedAt: string | null` (ISO string format, matching existing `createdAt`/`updatedAt` convention on the frontend).
- **Auth session uses explicit select clauses**: `GET /api/auth/me` returns `req.user` populated by `deserializeUser` in `apps/api/src/config/passport.ts`, which uses an explicit `.select()` clause — it MUST be updated to include `onboardingCompletedAt`. Similarly, `registerUser`, `loginUser`, and `updateUserProfile` in `auth.service.ts` all use explicit `.returning()`/`.select()` clauses that MUST also include the new column. Do NOT assume the field will be included automatically.
- **Existing OAuth flow must work from onboarding**: `connectPlatform` from `usePlatformConnections` redirects to `/api/auth/oauth/instagram/authorize`. The callback redirects to `/settings?oauth=success&platform=instagram`. For onboarding, we need to redirect back to `/onboarding?oauth=success&platform=instagram` instead. Add `redirect_uri` or `state` parameter to carry the return URL, OR handle the callback in `OnboardingPage` similarly to `SettingsPage`.
- **OAuth callback redirect**: The simplest approach is to update the OAuth callback route to accept a `returnTo` query param (set when initiating OAuth from onboarding) and redirect there after completion. OR store the return path in the session before OAuth redirect.

### Established Patterns from Previous Stories

- **Form/component pattern**: React Hook Form + `zodResolver(schema)`. Plain HTML `<input>` and `<label>` with Tailwind classes. Error messages in `<p className="mt-1 text-sm text-red-600">`.
- **API response format**: `{ data: {...} }` for success. Errors: `{ error: { code, message, statusCode, details? } }`.
- **Controller pattern**: `async function handler(req, res, next) { try { ... } catch (err) { next(err); } }`. Call service → return `res.json({ data })`.
- **Service pattern**: Business logic in service functions. Use Drizzle ORM queries. Throw `AppError` for errors. Filter by userId for tenant isolation.
- **Route middleware chain**: `rateLimiter → requireAuth → csrfSynchronisedProtection → controller` (no validate needed — completion has no body).
- **useAuth hook**: Manual `isLoading` + TanStack Query. Cache updates via `queryClient.setQueryData(SESSION_QUERY_KEY, updatedUser)`. `SESSION_QUERY_KEY = ['auth', 'session']`.
- **Toast notifications**: `toast.success('message')` from sonner. Success auto-dismisses (3s).
- **Test pattern (backend)**: Supertest agent with session. Register → CSRF → authenticated requests. Mock DB with `vi.mock('../../db/index')`.
- **Test pattern (frontend)**: Vitest + React Testing Library. Wrap with `QueryClientProvider` + `MemoryRouter`. Mock `@/lib/apiClient` with `vi.mock`.
- **Shared package rebuild**: After modifying `packages/shared/src/`, run `npm run build` in `packages/shared` to regenerate `dist/`.

### OAuth Callback from Onboarding

The current OAuth callback flow (Story 1.6) redirects to `/settings?oauth=success&platform=instagram`. For onboarding, we need the callback to return to `/onboarding` instead. Two approaches:

**Approach A (Recommended — Session-based):** Before redirecting to the OAuth provider, store `returnTo = '/onboarding'` in `req.session`. In the OAuth callback handler, read `req.session.returnTo` (default to `/settings`) and redirect there with the query params. This requires a small change to `apps/api/src/features/auth/oauth.routes.ts`.

**Approach B (Query param):** Pass `?returnTo=/onboarding` when calling `connectPlatform`. The OAuth initiation route stores this in session, and the callback reads it. Same mechanism, different entry point.

The dev should use Approach A. Modify the OAuth authorize route to accept `returnTo` from the query string and store in session. Modify the callback route to read it from session and use it for the redirect.

### Stepper UI Design

The stepper is a simple horizontal layout:
```
  (1) Connect Instagram  ──  (2) Upload Clips  ──  (3) Create Your Reel
  [active/indigo]             [future/muted]         [future/muted]
```

- Current step: indigo circle with white number, indigo text
- Completed step: emerald circle with checkmark icon, emerald text
- Future step: gray circle with number, gray text
- Connecting lines: solid emerald (completed) or dashed gray (future)
- No external stepper library needed — build with Tailwind flexbox

### Database Migration

Drizzle Kit generates SQL migrations. After adding the column:
```bash
cd apps/api && npx drizzle-kit generate
```
This creates a migration file in `apps/api/drizzle/`. The migration adds a nullable timestamp column — no data migration needed since existing users get `NULL` (treated as "not completed").

**Decision on existing users**: Existing test/dev users will have `onboardingCompletedAt = null` and will be redirected to onboarding on next login. This is acceptable for dev. For production, a data migration could set `onboardingCompletedAt = now()` for existing users.

### Route Guard Logic

In `AppLayout.tsx`, after the existing auth check:
```typescript
// Existing: if (!user) → redirect to /login
// New: if (user && !user.onboardingCompletedAt) → redirect to /onboarding
```

In `OnboardingPage.tsx`:
```typescript
// if (isSessionLoading) → show spinner
// if (!user) → redirect to /login
// if (user.onboardingCompletedAt) → redirect to /dashboard
// else → show onboarding steps
```

### Component File Locations

```
apps/web/src/features/auth/
├── pages/
│   └── OnboardingPage.tsx          # Main onboarding page with stepper
├── components/
│   ├── OnboardingStepConnect.tsx    # Step 1: Instagram connection
│   ├── OnboardingStepUpload.tsx     # Step 2: Upload placeholder
│   └── OnboardingStepCreate.tsx     # Step 3: Create placeholder + complete
```

### What This Story Does NOT Include

- Actual file upload functionality (that's Story 2.1/2.2)
- Auto-Montage rendering (that's Story 2.4)
- Multi-step progress persistence to DB per step (only completion is tracked — partial progress is local state)
- Zustand store for onboarding (useState in OnboardingPage is sufficient for 3 steps)
- Email verification during onboarding (not in ACs)
- Profile photo upload (not in ACs)
- Onboarding analytics/tracking (not in ACs)

### Environment Variables

No new environment variables needed.

### New Dependencies

No new npm packages needed. All UI is built with existing Tailwind + shadcn components.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 Story 1.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1: First Reel — Onboarding to First Publish]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toast Notifications]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Component Specifications]
- [Source: _bmad-output/implementation-artifacts/1-7-user-profile-and-settings.md]
- [Source: _bmad-output/implementation-artifacts/1-6-social-media-oauth-connection.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- CSRF token rotation required re-fetching token after POST requests in backend tests
- `deserializeUser` runs on every request — backend test helpers must mock `db.select` for session validation
- Frontend `findAllByText` needed when text appears in multiple DOM elements (stepper label + heading + button)
- OAuth session typing requires double cast: `req.session as unknown as Record<string, unknown>`

### Completion Notes List

- All 7 Acceptance Criteria implemented and tested
- Backend: 53 tests passing across 8 test files (6 new onboarding tests)
- Frontend: 41 tests passing across 6 test files (9 new onboarding tests)
- TypeScript checks pass on both apps/api and apps/web with zero errors
- OAuth returnTo redirect supports allowlist validation (`/settings`, `/onboarding`)
- Steps 2 and 3 are placeholder UI with "Coming soon" badges as specified
- Existing users with `onboardingCompletedAt = null` will be redirected to onboarding on next login

### File List

**Modified files:**
- `apps/api/src/db/schema/users.ts` — added `onboardingCompletedAt` nullable timestamp column
- `packages/shared/src/types/user.types.ts` — added `onboardingCompletedAt: string | null` to User type
- `apps/api/src/features/auth/auth.service.ts` — added `completeOnboarding()`, updated all select/returning clauses
- `apps/api/src/features/auth/auth.controller.ts` — added `completeOnboarding` controller
- `apps/api/src/features/auth/auth.routes.ts` — added `POST /api/auth/onboarding/complete` route
- `apps/api/src/config/passport.ts` — updated `deserializeUser` select to include `onboardingCompletedAt`
- `apps/api/src/features/auth/oauth.controller.ts` — added `returnTo` session-based redirect with allowlist
- `apps/web/src/features/auth/hooks/useAuth.ts` — added `completeOnboarding()` method
- `apps/web/src/router.tsx` — replaced onboarding placeholder with `<OnboardingPage />`
- `apps/web/src/components/layout/AppLayout.tsx` — added onboarding route guard

**New files:**
- `apps/api/migrations/0002_powerful_sheva_callister.sql` — Drizzle migration for `onboarding_completed_at`
- `apps/web/src/features/auth/pages/OnboardingPage.tsx` — main 3-step onboarding page with stepper
- `apps/web/src/features/auth/components/OnboardingStepConnect.tsx` — Step 1: Instagram connection
- `apps/web/src/features/auth/components/OnboardingStepUpload.tsx` — Step 2: Upload placeholder
- `apps/web/src/features/auth/components/OnboardingStepCreate.tsx` — Step 3: Create placeholder + complete
- `apps/api/src/features/auth/onboarding.test.ts` — backend onboarding tests (6 tests)
- `apps/web/src/features/auth/pages/OnboardingPage.test.tsx` — frontend onboarding tests (9 tests)

**Updated test files:**
- `apps/api/src/db/db.test.ts` — updated column count to 9
- `apps/api/src/features/auth/auth.test.ts` — added `onboardingCompletedAt: null` to mock
- `apps/web/src/components/layout/layout.test.tsx` — added `onboardingCompletedAt` to mockUser
- `apps/web/src/features/auth/pages/SettingsPage.test.tsx` — added `onboardingCompletedAt` to mockUser
- `apps/web/src/features/auth/components/ProfileSection.test.tsx` — added `onboardingCompletedAt` to mockUser
