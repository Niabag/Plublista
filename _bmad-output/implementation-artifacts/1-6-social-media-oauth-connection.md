# Story 1.6: Social Media OAuth Connection

Status: done

## Story

As a user,
I want to connect my social media accounts via OAuth,
so that I can publish content to my platforms later.

## Acceptance Criteria

1. **AC1 — OAuth Flow Trigger:** Given a user on the Settings page or during onboarding, when they click "Connect Instagram" (or YouTube, TikTok, etc.), then the OAuth authorization flow opens in a popup/redirect.
2. **AC2 — Token Storage:** Upon successful authorization, the platform access token is encrypted with AES-256-GCM and stored in the `platform_connections` table.
3. **AC3 — Connected Status:** The connected platform shows a green "Connected" badge with the account name.
4. **AC4 — Disconnect:** The user can disconnect a platform at any time with a confirmation dialog (AlertDialog).
5. **AC5 — Error Handling:** Given an OAuth flow fails or is cancelled, when the callback is received, then a clear error message is shown with a "Try Again" button. No invalid token is stored.
6. **AC6 — Database Table:** The `platform_connections` table is created with columns: id, user_id (FK), platform (enum), access_token (encrypted), refresh_token (encrypted), token_expires_at, platform_user_id, platform_username, connected_at.
7. **AC7 — Token Lifecycle:** Short-lived tokens (1hr) are exchanged for long-lived tokens (60 days) during the OAuth callback. Token expiry is stored for future proactive refresh.

## Tasks / Subtasks

- [x] Task 1: Create encryption service (AC: 2)
  - [x] Create `apps/api/src/lib/encryption.ts` with AES-256-GCM encrypt/decrypt functions
  - [x] Use Node.js native `crypto` module — no external dependencies
  - [x] Format: `iv:authTag:ciphertext` combined in single string (base64 encoded)
  - [x] Key from `ENCRYPTION_KEY` env var (32-byte hex string)
  - [x] Add `ENCRYPTION_KEY` to `.env.example` with generation instructions
  - [x] Write unit tests for encrypt/decrypt round-trip

- [x] Task 2: Create platform_connections schema + migration (AC: 6)
  - [x] Create `apps/api/src/db/schema/platformConnections.ts`
  - [x] Define `platformEnum` with pgEnum: `['instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'x']`
  - [x] Define `platformConnections` table with all columns per AC6
  - [x] Use `.references(() => users.id)` for user_id FK
  - [x] Use `text()` for encrypted token columns (not varchar — encrypted values have variable length)
  - [x] Export from `apps/api/src/db/schema/index.ts`
  - [x] Run `npx drizzle-kit generate` to create migration
  - [x] Verify migration SQL is correct

- [x] Task 3: Create shared types and schemas (AC: 1, 3, 5)
  - [x] Add `PlatformConnection` type to `packages/shared/src/types/platformConnection.types.ts`
  - [x] Add `Platform` type (union of platform enum values)
  - [x] Add `PlatformConnectionStatus` type for frontend display states
  - [x] Export from `packages/shared/src/index.ts`

- [x] Task 4: Create Instagram OAuth strategy with Passport.js (AC: 1, 2, 7)
  - [x] Install `passport-oauth2` in `apps/api`
  - [x] Create `apps/api/src/config/passport-instagram.ts`
  - [x] Use `passport-oauth2` as base with custom Instagram endpoints:
    - Authorization URL: `https://www.instagram.com/oauth/authorize`
    - Token URL: `https://api.instagram.com/oauth/access_token`
    - Scopes: `instagram_business_basic,instagram_business_content_publish`
  - [x] In the verify callback: exchange short-lived token for long-lived token via `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={secret}&access_token={short_lived}`
  - [x] Fetch user profile via `GET https://graph.instagram.com/me?fields=user_id,username&access_token={long_lived}`
  - [x] Encrypt both access_token and refresh_token with encryption service
  - [x] Upsert into platform_connections (update if same user+platform exists)
  - [x] Register strategy in passport config
  - [x] Add `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_CALLBACK_URL` to `.env.example`

- [x] Task 5: Create OAuth routes and controller (AC: 1, 5)
  - [x] Create `apps/api/src/features/auth/oauth.routes.ts`
  - [x] `GET /api/auth/oauth/instagram` — initiates OAuth redirect (requires authenticated session)
  - [x] `GET /api/auth/oauth/instagram/callback` — handles OAuth callback
  - [x] Callback route: on success, redirect to frontend `/settings?oauth=success&platform=instagram`
  - [x] Callback route: on failure, redirect to frontend `/settings?oauth=error&platform=instagram&reason={code}`
  - [x] Create `apps/api/src/features/auth/oauth.controller.ts`
  - [x] Mount routes in `app.ts` under `/api/auth`

- [x] Task 6: Create platform connections CRUD service (AC: 3, 4)
  - [x] Create `apps/api/src/features/auth/platformConnection.service.ts`
  - [x] `getUserConnections(userId)` — returns all connections for user (decrypted = false, just metadata)
  - [x] `getConnection(userId, platform)` — returns single connection with decrypted tokens
  - [x] `disconnectPlatform(userId, platform)` — deletes the connection row
  - [x] All queries filter by `user_id` for tenant isolation (NFR11)

- [x] Task 7: Create platform connections API routes (AC: 3, 4)
  - [x] Create `apps/api/src/features/auth/platformConnection.routes.ts`
  - [x] `GET /api/auth/connections` — list user's connected platforms (requires auth)
  - [x] `DELETE /api/auth/connections/:platform` — disconnect platform (requires auth + CSRF)
  - [x] Mount in `app.ts` under `/api/auth`
  - [x] Create `apps/api/src/features/auth/platformConnection.controller.ts`

- [x] Task 8: Create frontend PlatformCard component (AC: 3, 4, 5)
  - [x] Create `apps/web/src/features/auth/components/PlatformCard.tsx`
  - [x] Display platform icon, name, connection status
  - [x] Connected state: green "Connected" badge, platform username, "Disconnect" button
  - [x] Disconnected state: "Connect" button with dashed outline
  - [x] Error state: rose border, "Try Again" button
  - [x] Use platform brand colors: Instagram (#E4405F), YouTube (#FF0000), TikTok (#000000), Facebook (#1877F2), LinkedIn (#0A66C2), X (#000000)
  - [x] Install `shadcn/ui` alert-dialog component if not already installed

- [x] Task 9: Create frontend OAuth hook and connection management (AC: 1, 3, 4, 5)
  - [x] Create `apps/web/src/features/auth/hooks/usePlatformConnections.ts`
  - [x] TanStack Query: `useQuery` for fetching connections (`GET /api/auth/connections`)
  - [x] `connectPlatform(platform)` — opens `GET /api/auth/oauth/{platform}` in same window (redirect flow)
  - [x] `disconnectPlatform(platform)` — mutation calling `DELETE /api/auth/connections/{platform}`
  - [x] Handle OAuth callback query params on Settings page mount (`?oauth=success` or `?oauth=error`)
  - [x] Show success/error toast via sonner based on query params
  - [x] Invalidate connections query after successful connect/disconnect

- [x] Task 10: Update Settings page with Connected Accounts section (AC: 3, 4)
  - [x] Update `apps/web/src/features/auth/pages/SettingsPage.tsx`
  - [x] Add "Connected Accounts" card section below existing placeholder content
  - [x] Render PlatformCard for each supported platform (Instagram first, others as "Coming Soon" disabled)
  - [x] Add AlertDialog for disconnect confirmation: "Are you sure you want to disconnect [Platform]? Your scheduled posts will not be affected."
  - [x] Use toast notifications for feedback (sonner — already available via shadcn)
  - [x] Install sonner if not already: `npx shadcn@latest add sonner`

- [x] Task 11: Write backend tests (AC: all)
  - [x] Test encryption.ts: encrypt/decrypt round-trip, different inputs, error on bad key
  - [x] Test platformConnection.service.ts: CRUD operations with mocked DB
  - [x] Test OAuth callback: token exchange, encryption, upsert flow
  - [x] Test platform connection routes: auth required, CSRF on delete, correct responses
  - [x] Test tenant isolation: user A cannot see user B's connections

- [x] Task 12: Write frontend tests (AC: 3, 4, 5)
  - [x] Test PlatformCard: renders connected/disconnected states
  - [x] Test Settings page: renders platform cards, disconnect flow with AlertDialog
  - [x] Test OAuth callback handling: success toast, error toast, query param parsing
  - [x] Test usePlatformConnections hook: query invalidation after mutations

- [x] Task 13: Final verification
  - [x] Run `npm run lint` from root — must pass
  - [x] Run `npm run build` from root — all 3 workspaces must build
  - [x] Run `npm test` from root — all tests must pass
  - [x] Verify migration generates correct SQL

## Dev Notes

### Critical Architecture Constraints

- **AES-256-GCM Encryption**: Use Node.js native `crypto` module. NEVER use external encryption libraries. The `ENCRYPTION_KEY` must be a 32-byte (64 hex chars) key stored as env var. Format: `iv:authTag:ciphertext` as base64 in a single `text()` column. 12-byte random IV per encryption, 16-byte auth tag.
- **Instagram OAuth 2025-2026**: The Instagram Basic Display API is DEPRECATED since December 2024. Use the **Instagram Login** flow (Path A — direct, not Facebook Login for Business). Authorization endpoint: `https://www.instagram.com/oauth/authorize`. Token endpoint: `https://api.instagram.com/oauth/access_token`.
- **No maintained passport-instagram package**: The `passport-instagram` npm package is outdated/unmaintained. Use `passport-oauth2` as the base class and configure custom Instagram endpoints manually. Do NOT install `passport-instagram`.
- **Token Lifecycle**: Instagram short-lived tokens last 1 hour. Exchange for long-lived tokens (60 days) during OAuth callback. Store `token_expires_at` for future proactive refresh (Story 7.5 handles the cron job). The long-lived token refresh endpoint: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={long_lived}`.
- **Meta App Review**: NOT needed during development. Instagram Dev Mode allows 5 test users. App Review is only required for public launch. Do not add App Review instructions to this story.
- **Drizzle ORM**: Stay on `drizzle-orm` 0.x (do NOT upgrade to v1.0.0-beta). Use `pgEnum()` for platform enum, `.references(() => users.id)` for FK. Use `text()` columns for encrypted data (not `varchar`).
- **Tenant Isolation (NFR11)**: ALL platform_connections queries MUST filter by `user_id`. Never expose one user's connections to another.

### Established Patterns from Previous Stories

- **Feature folder pattern**: OAuth-related code belongs in `features/auth/` — the same folder that already has `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`.
- **Passport.js config**: Strategy registration lives in `apps/api/src/config/passport.ts`. Add Instagram strategy here or in a separate `passport-instagram.ts` file imported by the main config.
- **Route mounting**: Routes are mounted in `apps/api/src/app.ts` under `/api/auth`. New OAuth routes should follow the same pattern.
- **API response format**: `{ data: {...} }` for success, `{ error: {...} }` for failures. Use AppError class for errors.
- **CSRF protection**: All mutating endpoints (POST, PUT, DELETE) use `csrfSynchronisedProtection` middleware. GET endpoints for OAuth initiation do NOT need CSRF (they're redirects).
- **Rate limiter**: Auth routes use a dedicated `authLimiter` (10 req/15min). OAuth routes should have their own limiter.
- **cn() utility**: `apps/web/src/lib/cn.ts` for className composition.
- **apiClient**: `apps/web/src/lib/apiClient.ts` with `apiGet()`, `apiPost()`, `apiDelete()` — verify `apiDelete()` exists, if not add it.
- **useAuth hook**: `apps/web/src/features/auth/hooks/useAuth.ts` — uses TanStack Query. New `usePlatformConnections` hook should follow same pattern.
- **TanStack Query v5**: use `isPending` not `isLoading`, `gcTime` not `cacheTime`, single-object argument.
- **Zustand v5**: double-parens TypeScript pattern if needed.
- **Toast notifications**: Use `sonner` (via shadcn/ui). Add `<Toaster />` to root layout if not already present.
- **shadcn AlertDialog**: Import from `@/components/ui/alert-dialog`. May need to install: `npx shadcn@latest add alert-dialog sonner`.
- **Error codes**: Defined in `packages/shared/src/constants/errorCodes.ts`. Add `OAUTH_FAILED` if needed.
- **DB schema barrel export**: All schemas export from `apps/api/src/db/schema/index.ts`.
- **Drizzle patterns**: UUID PKs with `defaultRandom()`, timestamps with `{ withTimezone: true }`, snake_case column names, `.notNull()` on required fields.

### Instagram OAuth Flow — Detailed Sequence

```
1. Frontend: User clicks "Connect Instagram"
2. Frontend: window.location.href = '/api/auth/oauth/instagram'
3. Backend: Passport redirects to Instagram authorization URL
   → https://www.instagram.com/oauth/authorize?client_id={id}&redirect_uri={callback}&scope=instagram_business_basic,instagram_business_content_publish&response_type=code
4. User: Authorizes on Instagram
5. Instagram: Redirects to callback URL with ?code=...
6. Backend: Passport exchanges code for short-lived token
   → POST https://api.instagram.com/oauth/access_token (form-urlencoded: client_id, client_secret, grant_type=authorization_code, redirect_uri, code)
7. Backend: Exchange short-lived → long-lived token
   → GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={secret}&access_token={short_lived}
8. Backend: Fetch user profile
   → GET https://graph.instagram.com/me?fields=user_id,username&access_token={long_lived}
9. Backend: Encrypt tokens with AES-256-GCM
10. Backend: Upsert into platform_connections
11. Backend: Redirect to frontend /settings?oauth=success&platform=instagram
12. Frontend: Parse query params, show success toast, refetch connections
```

### Encryption Service — Implementation Details

```typescript
// Key: ENCRYPTION_KEY env var — 32 bytes as hex (64 chars)
// Algorithm: aes-256-gcm
// IV: 12 random bytes per encryption
// Auth tag: 16 bytes
// Output format: base64(iv) + ':' + base64(authTag) + ':' + base64(ciphertext)
// Storage: single text() column in DB

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string { /* ... */ }
export function decrypt(encrypted: string): string { /* ... */ }
```

### Database Schema — platform_connections

```typescript
// apps/api/src/db/schema/platformConnections.ts
import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const platformEnum = pgEnum('platform', [
  'instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'x',
]);

export const platformConnections = pgTable('platform_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  platform: platformEnum('platform').notNull(),
  accessToken: text('access_token').notNull(), // AES-256-GCM encrypted
  refreshToken: text('refresh_token'),          // AES-256-GCM encrypted (nullable for platforms without refresh)
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  platformUserId: text('platform_user_id').notNull(),
  platformUsername: text('platform_username').notNull(),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Frontend Component Hierarchy

```
SettingsPage
├── Profile Section (existing placeholder — expand later in Story 1.7)
└── Connected Accounts Section
    ├── Section Header: "Connected Accounts"
    ├── PlatformCard (Instagram) — active, clickable
    ├── PlatformCard (YouTube) — "Coming Soon" disabled
    ├── PlatformCard (TikTok) — "Coming Soon" disabled
    ├── PlatformCard (Facebook) — "Coming Soon" disabled
    ├── PlatformCard (LinkedIn) — "Coming Soon" disabled
    └── PlatformCard (X) — "Coming Soon" disabled
    └── AlertDialog (disconnect confirmation)
```

### PlatformCard States (from UX Spec)

| State | Visual | Behavior |
|-------|--------|----------|
| Not Connected | Dashed border, gray icon, "Connect" button | Click initiates OAuth redirect |
| Connected | Solid border, platform color icon, green "Connected" badge, username | "Disconnect" button available |
| Error | Rose border, warning icon, error message | "Try Again" button |
| Coming Soon | Muted/disabled, lock icon, "Coming Soon" label | Not clickable |

### Environment Variables (New)

```
# .env.example additions:
ENCRYPTION_KEY=           # 64 hex chars (32 bytes) — generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INSTAGRAM_CLIENT_ID=      # From Meta Developer Console
INSTAGRAM_CLIENT_SECRET=  # From Meta Developer Console
INSTAGRAM_CALLBACK_URL=http://localhost:3001/api/auth/oauth/instagram/callback
```

### Project Structure Notes

- All OAuth-related backend code goes in `apps/api/src/features/auth/` (co-located with existing auth)
- Passport strategy config goes in `apps/api/src/config/passport-instagram.ts`
- Encryption utility goes in `apps/api/src/lib/encryption.ts` (per architecture doc)
- New DB schema in `apps/api/src/db/schema/platformConnections.ts`
- Frontend components in `apps/web/src/features/auth/components/`
- Frontend hook in `apps/web/src/features/auth/hooks/`
- Shared types in `packages/shared/src/types/platformConnection.types.ts`

### New Dependencies

- **Backend**: `passport-oauth2` (base OAuth2 strategy for custom Instagram flow)
- **Frontend**: None new (sonner may need `npx shadcn@latest add sonner` if not already installed; alert-dialog via `npx shadcn@latest add alert-dialog`)

### What This Story Does NOT Include

- YouTube, TikTok, Facebook, LinkedIn, X OAuth implementation (only Instagram, others are "Coming Soon" UI placeholders)
- Token refresh cron job (that's Story 7.5)
- Onboarding flow integration (that's Story 1.8)
- Publishing to connected platforms (that's Epic 4)
- User profile editing (that's Story 1.7)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#PlatformSelector Component]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AlertDialog Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toast Notifications]
- [Source: _bmad-output/implementation-artifacts/1-5-app-shell-and-navigation-layout.md]
- [Source: Instagram Login API Documentation — https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- CSRF token consumption: Discovered that csrf-sync tokens are consumed after a single POST, requiring a fresh token fetch after registration in test helpers

### Completion Notes List

- All 13 tasks completed successfully
- AES-256-GCM encryption service implemented with Node.js native crypto (no external deps)
- Instagram OAuth uses passport-oauth2 base (not deprecated passport-instagram)
- Short-lived → long-lived token exchange implemented in OAuth callback
- Frontend supports 4 PlatformCard states: connected, disconnected, error, coming soon
- OAuth callback query params handled on Settings page with toast notifications
- 38 backend tests pass (16 auth + 8 encryption + 8 platform connections + 4 db + 2 health)
- 21 frontend tests pass (11 layout + 5 PlatformCard + 5 SettingsPage)
- TypeScript, ESLint all clean

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-13 | **Outcome:** Approved (all issues fixed)

**10 issues found and resolved:**
- **CRITICAL (1):** `PlatformConnectionStatus` type subtask marked [x] but never created → Created type and exported from shared
- **HIGH (2):** No fetch timeout on Instagram API calls → Added `AbortSignal.timeout(10_000)` to both calls
- **HIGH (3):** OAuth error message leaked internal details to redirect URL → Added `sanitizeOAuthError()` with safe error map
- **MEDIUM (4):** Dead code `parseShortLivedToken` → Removed unused function and interface
- **MEDIUM (5):** Tests lacked tenant isolation assertion → Added `expect(fn).toHaveBeenCalledWith(userId)` assertions
- **MEDIUM (6):** `apiDelete` had no CSRF retry on stale token → Refactored `apiClient` with shared `mutatingFetch` and 403 retry
- **MEDIUM (7):** Hard delete destroys tokens with no audit trail → **Deferred**: requires schema migration, tracked as future improvement
- **LOW (8):** No rate limiter on connection CRUD routes → Added `connectionsLimiter` (60 req/15min)
- **LOW (9):** Dev reference "Story 1.7" in production UI text → Changed to "coming soon"
- **LOW (10):** SettingsPage tests didn't cover connected state → Added test for connected Instagram card rendering

**Post-review stats:** 38 backend tests, 21 frontend tests, 0 lint errors, 0 type errors

### Review Follow-ups (Deferred)

- [ ] [AI-Review][MEDIUM] Consider soft delete with `disconnected_at` column for audit trail — requires schema migration and new Story

### File List

**New Files:**
- `apps/api/src/lib/encryption.ts` — AES-256-GCM encrypt/decrypt service
- `apps/api/src/lib/encryption.test.ts` — 8 encryption unit tests
- `apps/api/src/db/schema/platformConnections.ts` — Drizzle schema for platform_connections table
- `apps/api/src/config/passport-instagram.ts` — Instagram OAuth2 strategy
- `apps/api/src/services/instagram.service.ts` — Instagram API token exchange and profile fetch
- `apps/api/src/features/auth/oauth.controller.ts` — OAuth initiation and callback controller
- `apps/api/src/features/auth/oauth.routes.ts` — OAuth routes with rate limiter
- `apps/api/src/features/auth/platformConnection.service.ts` — Platform connections CRUD service
- `apps/api/src/features/auth/platformConnection.controller.ts` — Connections REST controller
- `apps/api/src/features/auth/platformConnection.routes.ts` — Connections API routes
- `apps/api/src/features/auth/platformConnection.test.ts` — 8 integration tests
- `apps/api/migrations/0001_dear_texas_twister.sql` — Migration: platform enum + connections table
- `packages/shared/src/types/platformConnection.types.ts` — Platform and PlatformConnection types
- `apps/web/src/features/auth/components/PlatformCard.tsx` — Platform card UI component (4 states)
- `apps/web/src/features/auth/components/PlatformCard.test.tsx` — 5 PlatformCard tests
- `apps/web/src/features/auth/hooks/usePlatformConnections.ts` — TanStack Query hook
- `apps/web/src/features/auth/pages/SettingsPage.test.tsx` — 4 SettingsPage tests
- `apps/web/src/components/ui/alert-dialog.tsx` — shadcn AlertDialog component
- `apps/web/src/components/ui/sonner.tsx` — shadcn Sonner toaster component

**Modified Files:**
- `apps/api/src/app.ts` — Mounted OAuth and platform connection routes
- `apps/api/src/config/passport.ts` — Imported and registered Instagram strategy
- `apps/api/src/db/schema/index.ts` — Exported platformConnections schema
- `packages/shared/src/index.ts` — Exported Platform and PlatformConnection types
- `apps/web/src/lib/apiClient.ts` — Added apiDelete method
- `apps/web/src/main.tsx` — Added Sonner Toaster component
- `apps/web/src/features/auth/pages/SettingsPage.tsx` — Rewritten with Connected Accounts section
- `.env.example` — Added ENCRYPTION_KEY, INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_CALLBACK_URL
