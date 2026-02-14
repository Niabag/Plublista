# Story 1.7: User Profile & Settings

Status: review

## Story

As a user,
I want to view and manage my profile settings and see my subscription status,
so that I can keep my account information up to date.

## Acceptance Criteria

1. **AC1 — Profile Display:** Given a logged-in user navigates to Settings, when the page loads, then they see their display name (editable), email (read-only), and current subscription tier (e.g., "Free Plan").
2. **AC2 — Quota Usage:** Given a user views their quota usage, when the QuotaIndicator component renders, then it shows usage bars for Reels, Carousels, AI Images with color coding (green 0-59%, amber 60-79%, rose 80%+).
3. **AC3 — Connected Platforms:** The Settings page displays the list of connected social media platforms with connect/disconnect buttons (already implemented in Story 1.6).
4. **AC4 — Display Name Update:** The user can update their display name and save changes. A success toast confirms saved changes.
5. **AC5 — Validation:** Display name validation: required, 1-100 characters. Validation errors shown inline below the field on blur.

## Tasks / Subtasks

- [x] Task 1: Create shared schemas and types (AC: 1, 2, 5)
  - [x]Create `packages/shared/src/schemas/profile.schema.ts` with `profileUpdateSchema`
  - [x]Create `packages/shared/src/types/quota.types.ts` with `QuotaUsage` interface
  - [x]Create `packages/shared/src/constants/quotaLimits.ts` with per-tier limits
  - [x]Export all new types, schemas, and constants from `packages/shared/src/index.ts`

- [x] Task 2: Add `apiPut` to frontend API client (AC: 4)
  - [x]Add `apiPut<T>(path, body)` to `apps/web/src/lib/apiClient.ts` using existing `mutatingFetch` helper

- [x] Task 3: Create backend profile update endpoint (AC: 1, 4, 5)
  - [x]Add `updateUserProfile(userId, data)` to `apps/api/src/features/auth/auth.service.ts`
  - [x]Add `updateProfile` controller to `apps/api/src/features/auth/auth.controller.ts`
  - [x]Add `PUT /api/auth/profile` route to `apps/api/src/features/auth/auth.routes.ts` with requireAuth + CSRF + validate(profileUpdateSchema)
  - [x]Rate limit: reuse existing `authLimiter` (10 req/15min) — same limiter as login/register

- [x] Task 4: Create quota endpoint (AC: 2)
  - [x]Create `apps/api/src/features/quota/quota.service.ts` — returns free tier limits with 0 usage (hardcoded until Story 6.4)
  - [x]Create `apps/api/src/features/quota/quota.controller.ts`
  - [x]Create `apps/api/src/features/quota/quota.routes.ts` — `GET /api/quotas` with requireAuth + rate limiter
  - [x]Mount quota routes in `apps/api/src/app.ts`

- [x] Task 5: Install required shadcn components (AC: 1, 2)
  - [x]Install Progress: `npx shadcn@latest add progress`
  - [x]Install Badge: `npx shadcn@latest add badge`

- [x] Task 6: Create QuotaIndicator component (AC: 2)
  - [x]Create `apps/web/src/features/auth/components/QuotaIndicator.tsx`
  - [x]Create `apps/web/src/features/auth/hooks/useQuota.ts` — TanStack Query hook for GET /api/quotas
  - [x]Progress bars with color thresholds: emerald (0-59%), amber (60-79%), rose (80%+)
  - [x]Show resource label, used/limit count, and percentage
  - [x]Accessibility: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

- [x] Task 7: Create ProfileSection component (AC: 1, 4, 5)
  - [x]Create `apps/web/src/features/auth/components/ProfileSection.tsx`
  - [x]React Hook Form + Zod resolver with `profileUpdateSchema`
  - [x]Display name field (editable input, blur validation)
  - [x]Email field (read-only, disabled input)
  - [x]Subscription tier badge (read-only)
  - [x]Save button (primary, disabled during submit, loading state)
  - [x]Success/error toasts via sonner

- [x] Task 8: Update SettingsPage with new sections (AC: all)
  - [x]Replace "Profile settings coming soon" placeholder with ProfileSection
  - [x]Add QuotaIndicator section between ProfileSection and Connected Accounts
  - [x]Keep existing Connected Accounts section unchanged
  - [x]Section order: Profile > Quota Usage > Connected Accounts

- [x] Task 9: Extend useAuth hook with updateProfile (AC: 4)
  - [x]Add `updateProfile(data)` method to `apps/web/src/features/auth/hooks/useAuth.ts`
  - [x]Call `apiPut('/api/auth/profile', data)`
  - [x]On success: update session cache with `queryClient.setQueryData(SESSION_QUERY_KEY, updatedUser)`
  - [x]Return updated user or throw error

- [x] Task 10: Write backend tests (AC: all)
  - [x]Test PUT /api/auth/profile: auth required, CSRF required, validates input, updates displayName, returns updated user
  - [x]Test PUT /api/auth/profile: rejects invalid displayName (empty, too long)
  - [x]Test GET /api/quotas: auth required, returns quota data with correct structure
  - [x]Test tenant isolation: profile update only affects authenticated user

- [x] Task 11: Write frontend tests (AC: all)
  - [x]Test ProfileSection: renders form with user data, validates on blur, submits successfully
  - [x]Test QuotaIndicator: renders progress bars, applies correct colors, handles loading/empty states
  - [x]Test SettingsPage: renders all three sections (profile, quota, connections)

- [x] Task 12: Final verification
  - [x]Run `npx tsc --noEmit` in both `apps/api` and `apps/web` — must pass
  - [x]Run `npx vitest run` in `apps/api` — all tests pass
  - [x]Run `npx vitest run` in `apps/web` — all tests pass
  - [x]Run `npm run lint` from root — must pass

## Dev Notes

### Critical Architecture Constraints

- **Profile GET endpoint already exists**: `GET /api/auth/me` returns the full user object (id, email, displayName, role, subscriptionTier, createdAt, updatedAt). The `useAuth` hook caches this at query key `['auth', 'session']` with 5-min staleTime. Do NOT create a separate GET /api/auth/profile — reuse the existing `/me` data.
- **Profile PUT is a new endpoint**: `PUT /api/auth/profile` for updating displayName. Add to existing `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts` — same feature folder.
- **Quota endpoint is a new feature**: Create `features/quota/` folder with `quota.service.ts`, `quota.controller.ts`, `quota.routes.ts`. Mount at `/api/quotas`. This lays the foundation for Story 6.4 (Quota Enforcement System).
- **Quota data is hardcoded for now**: The `quota_usage` table does NOT exist yet (Story 6.4). The quota service must return free tier limits with 0 usage. All limits come from `packages/shared/src/constants/quotaLimits.ts`.
- **Drizzle ORM**: Use `eq()` from `drizzle-orm` for WHERE clauses. Use `.set()` + `.where()` for UPDATE. The `updatedAt` column must be explicitly set to `new Date()` on update (no auto-update trigger exists).
- **Tenant isolation (NFR11)**: Profile update MUST filter by `userId` from `req.user.id`. Never trust client-supplied IDs.
- **CSRF on PUT**: All mutating endpoints need `csrfSynchronisedProtection` middleware.
- **Zod validation**: Use `validate(profileUpdateSchema)` middleware on the PUT route. Schema defined in shared package, imported by both frontend and backend.
- **TanStack Query v5**: Use `isPending` not `isLoading`, `gcTime` not `cacheTime`, single-object argument to `useQuery`.

### Established Patterns from Previous Stories

- **Form pattern (LoginForm, RegisterForm)**: React Hook Form + `zodResolver(schema)`. Extract `register`, `handleSubmit`, `formState: { errors }`. Use plain HTML `<input>` and `<label>` with Tailwind classes (NOT shadcn Input/Label — they aren't installed and existing forms don't use them). Error messages in `<p className="mt-1 text-sm text-red-600">`.
- **API response format**: `{ data: {...} }` for success. Errors: `{ error: { code, message, statusCode, details? } }`.
- **Controller pattern**: `async function handler(req, res, next) { try { ... } catch (err) { next(err); } }`. Call service → return `res.json({ data })`.
- **Service pattern**: Business logic in service functions. Use Drizzle ORM queries. Throw `AppError` for errors. Filter by userId for tenant isolation.
- **Route middleware chain**: `rateLimiter → requireAuth → csrfSynchronisedProtection → validate(schema) → controller`.
- **useAuth hook pattern**: Manual `isLoading` state + TanStack Query `isPending`. Cache updates via `queryClient.setQueryData(SESSION_QUERY_KEY, updatedUser)`. The `SESSION_QUERY_KEY` constant is `['auth', 'session']`, defined in `useAuth.ts` (Story 1.4). Error state with `setError`.
- **Toast notifications**: `toast.success('message')` and `toast.error('message')` from `sonner`. Success auto-dismisses (3s), error persists.
- **Rate limiter pattern**: `rateLimit({ windowMs: 15*60*1000, limit: N, standardHeaders: 'draft-8', legacyHeaders: false })`.
- **CSRF token behavior (from Story 1.6)**: csrf-sync tokens are consumed after a single POST. The frontend `mutatingFetch()` in apiClient automatically retries with a fresh token on 403.
- **Test pattern (backend)**: Supertest agent with session. Register user → get CSRF token → make authenticated requests. Mock DB with `vi.mock('../../db/index')`. Mock services for unit testing controllers.
- **Test pattern (frontend)**: Vitest + React Testing Library. Wrap with `QueryClientProvider` + `MemoryRouter`. Mock `@/lib/apiClient` with `vi.mock`. Use `screen.getByText()`, `screen.findByText()` for async.

### Shared Schema Definition

```typescript
// packages/shared/src/schemas/profile.schema.ts
import { z } from 'zod';

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name must be 100 characters or less'),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
```

### Quota Constants Definition

```typescript
// packages/shared/src/constants/quotaLimits.ts
import type { SubscriptionTier } from '../types/user.types.js';

export interface TierQuotaLimits {
  reels: number;
  carousels: number;
  aiImages: number;
}

export const QUOTA_LIMITS: Record<SubscriptionTier, TierQuotaLimits> = {
  free: { reels: 3, carousels: 3, aiImages: 5 },
  starter: { reels: 15, carousels: 15, aiImages: 30 },
  pro: { reels: 50, carousels: 50, aiImages: 100 },
  business: { reels: 150, carousels: 150, aiImages: 300 },
  agency: { reels: 500, carousels: 500, aiImages: 1000 },
};
```

### Quota Types Definition

```typescript
// packages/shared/src/types/quota.types.ts
export interface QuotaResource {
  resource: 'reels' | 'carousels' | 'aiImages';
  used: number;
  limit: number;
  percentage: number;
}

export interface QuotaUsage {
  tier: string;
  quotas: QuotaResource[];
  period: { start: string; end: string };
}
```

### Backend Profile Update — Service

```typescript
// Add to apps/api/src/features/auth/auth.service.ts
import type { ProfileUpdateInput } from '@plublista/shared';

export async function updateUserProfile(userId: string, data: ProfileUpdateInput) {
  const [updated] = await db
    .update(users)
    .set({
      displayName: data.displayName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  if (!updated) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  return updated;
}
```

### Backend Quota Service — Hardcoded

```typescript
// apps/api/src/features/quota/quota.service.ts
import { QUOTA_LIMITS } from '@plublista/shared';
import type { SubscriptionTier } from '@plublista/shared';

// Response format: { data: { tier, quotas, period } } — standard API envelope
export function getUserQuota(subscriptionTier: SubscriptionTier) {
  const limits = QUOTA_LIMITS[subscriptionTier];
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    tier: subscriptionTier,
    quotas: [
      { resource: 'reels' as const, used: 0, limit: limits.reels, percentage: 0 },
      { resource: 'carousels' as const, used: 0, limit: limits.carousels, percentage: 0 },
      { resource: 'aiImages' as const, used: 0, limit: limits.aiImages, percentage: 0 },
    ],
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
  };
}
```

### Frontend QuotaIndicator — Color Logic

```typescript
// Color thresholds for progress bars
function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-rose-500';    // 80%+ = rose
  if (percentage >= 60) return 'bg-amber-500';   // 60-79% = amber
  return 'bg-emerald-500';                       // 0-59% = emerald
}
```

### Frontend apiPut Addition

```typescript
// Add to apps/web/src/lib/apiClient.ts
export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return mutatingFetch<T>('PUT', path, body);
}
```

### Frontend useAuth Extension

```typescript
// Add to useAuth hook:
async function updateProfile(data: ProfileUpdateInput): Promise<User | null> {
  setIsLoading(true);
  setError(null);
  try {
    const result = await apiPut<ApiResponse<User>>('/api/auth/profile', data);
    queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
    return result.data;
  } catch (err) {
    setError(err as ApiError);
    return null;
  } finally {
    setIsLoading(false);
  }
}
```

### SettingsPage Section Layout

```
SettingsPage (max-w-2xl, space-y-8)
├── ProfileSection
│   ├── Section header: "Profile"
│   ├── Display name input (editable, blur validation)
│   ├── Email input (read-only, disabled)
│   ├── Subscription tier badge (read-only, "Free Plan")
│   └── Save button (primary)
├── QuotaIndicator
│   ├── Section header: "Usage This Month"
│   ├── Reels progress bar (used/limit)
│   ├── Carousels progress bar (used/limit)
│   └── AI Images progress bar (used/limit)
└── Connected Accounts (existing from Story 1.6 — NO CHANGES)
    ├── PlatformCard (Instagram)
    ├── PlatformCard (YouTube — Coming Soon)
    ├── PlatformCard (TikTok — Coming Soon)
    ├── PlatformCard (Facebook — Coming Soon)
    ├── PlatformCard (LinkedIn — Coming Soon)
    └── PlatformCard (X — Coming Soon)
```

### RequireAuth Middleware

A `requireAuth` middleware already exists at `apps/api/src/middleware/requireAuth.middleware.ts`. Use it on the new routes instead of inline `req.isAuthenticated()` checks:
```typescript
import { requireAuth } from '../../middleware/requireAuth.middleware';

router.put('/profile', requireAuth, csrfSynchronisedProtection, validate(profileUpdateSchema), updateProfile);
```

### Route Mounting in app.ts

The quota routes need to be mounted in `apps/api/src/app.ts`. Follow the existing pattern:
```typescript
import quotaRoutes from './features/quota/quota.routes';
app.use('/api/quotas', quotaRoutes);
```

### Environment Variables

No new environment variables needed for this story.

### New Dependencies

- **shadcn Progress**: `npx shadcn@latest add progress` (for QuotaIndicator bars)
- **shadcn Badge**: `npx shadcn@latest add badge` (for subscription tier display)
- No new npm packages required

### What This Story Does NOT Include

- Password change functionality (not in ACs — future story)
- Email change (email is display-only per ACs)
- Profile picture/avatar upload (not in ACs)
- Dark mode toggle (UX spec mentions it but it's not in this story's ACs)
- Real quota tracking from database (that's Story 6.4)
- Billing/invoice display (that's Story 6.3)
- Account deletion (that's Story 8.1)
- Notification preferences (not in ACs)

### Project Structure Notes

- Profile update code goes in existing `features/auth/` (same entity as user auth)
- Quota feature creates new `features/quota/` folder (following architecture doc)
- QuotaIndicator component placed in `features/auth/components/` (co-located with SettingsPage; will migrate to `features/billing/components/` when Epic 6 starts)
- Shared schemas in `packages/shared/src/schemas/profile.schema.ts` (parallel to `auth.schema.ts`)
- Shared types in `packages/shared/src/types/quota.types.ts`
- Shared constants in `packages/shared/src/constants/quotaLimits.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#QuotaIndicator]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Component Specifications]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toast Notifications]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button System]
- [Source: _bmad-output/implementation-artifacts/1-6-social-media-oauth-connection.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None

### Completion Notes List

- All 12 tasks completed successfully
- Backend: 47 tests pass (38 existing + 6 profile + 3 quota)
- Frontend: 32 tests pass (16 existing + 5 ProfileSection + 3 QuotaIndicator + 8 SettingsPage)
- TypeScript checks pass for both apps/api and apps/web
- Shared package rebuilt with new exports (schemas, types, constants)
- QuotaIndicator uses custom progress bars (not shadcn Progress) for per-bar color control
- Quota data is hardcoded (0 usage) — real tracking deferred to Story 6.4

### File List

**New Files:**
- `packages/shared/src/schemas/profile.schema.ts` — Zod profileUpdateSchema + ProfileUpdateInput type
- `packages/shared/src/types/quota.types.ts` — QuotaResource, QuotaUsage interfaces
- `packages/shared/src/constants/quotaLimits.ts` — QUOTA_LIMITS per subscription tier
- `apps/api/src/features/quota/quota.service.ts` — Hardcoded quota service
- `apps/api/src/features/quota/quota.controller.ts` — Quota controller
- `apps/api/src/features/quota/quota.routes.ts` — GET /api/quotas route
- `apps/web/src/features/auth/hooks/useQuota.ts` — TanStack Query hook for quotas
- `apps/web/src/features/auth/components/QuotaIndicator.tsx` — Quota usage bars
- `apps/web/src/features/auth/components/ProfileSection.tsx` — Profile form section
- `apps/web/src/components/ui/progress.tsx` — shadcn Progress component
- `apps/web/src/components/ui/badge.tsx` — shadcn Badge component
- `apps/api/src/features/auth/profile.test.ts` — 6 backend profile tests
- `apps/api/src/features/quota/quota.test.ts` — 3 backend quota tests
- `apps/web/src/features/auth/components/ProfileSection.test.tsx` — 5 frontend profile tests
- `apps/web/src/features/auth/components/QuotaIndicator.test.tsx` — 3 frontend quota tests

**Modified Files:**
- `packages/shared/src/index.ts` — Added exports for new schemas, types, constants
- `apps/web/src/lib/apiClient.ts` — Added apiPut method
- `apps/api/src/features/auth/auth.service.ts` — Added updateUserProfile function
- `apps/api/src/features/auth/auth.controller.ts` — Added updateProfile controller
- `apps/api/src/features/auth/auth.routes.ts` — Added PUT /profile route
- `apps/api/src/app.ts` — Mounted quota routes at /api/quotas
- `apps/web/src/features/auth/hooks/useAuth.ts` — Added updateProfile method
- `apps/web/src/features/auth/pages/SettingsPage.tsx` — Added ProfileSection + QuotaIndicator
- `apps/web/src/features/auth/pages/SettingsPage.test.tsx` — Updated with 8 comprehensive tests
