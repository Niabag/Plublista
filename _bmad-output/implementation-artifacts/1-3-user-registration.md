# Story 1.3: User Registration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want to sign up with my email and password,
so that I can create an account and start using Plublista.

## Acceptance Criteria

1. **AC1:** Given a visitor on the registration page, when they submit a valid email, password (min 8 chars), and display name, then a new user is created with subscription_tier "free" and role "user", the password is hashed with bcrypt before storage, a session is created via HTTP-only secure cookie, the user is redirected to the onboarding flow, and a CSRF token is included in the session
2. **AC2:** Given a visitor submits an email that already exists, when the registration is processed, then a clear error message is shown: "This email is already registered" and no duplicate account is created
3. **AC3:** Given a visitor submits an invalid email or weak password, when the form is submitted, then Zod validation errors are shown inline below the relevant fields and the form is not submitted to the server

## Tasks / Subtasks

- [x] **Task 1: Install backend auth dependencies** (AC: #1)
  - [x]Add `bcrypt`, `passport`, `express-session`, `csrf-sync`, `express-rate-limit` to `apps/api` dependencies
  - [x]Add `@types/bcrypt`, `@types/passport`, `@types/express-session` to `apps/api` devDependencies
  - [x]Run `npm install` from root

- [x] **Task 2: Create AppError class** (AC: #1, #2, #3)
  - [x]Create `apps/api/src/lib/errors.ts` — `AppError` extends `Error` with `code` (ErrorCode), `message`, `statusCode`
  - [x]Import `ERROR_CODES` type from `@plublista/shared`

- [x] **Task 3: Create error handler middleware** (AC: #2)
  - [x]Create `apps/api/src/middleware/errorHandler.middleware.ts`
  - [x]Catch `AppError` → return `{ error: { code, message, statusCode } }` with correct HTTP status
  - [x]Catch unknown errors → return `INTERNAL_ERROR` (500), log the original error

- [x] **Task 4: Create Zod validation middleware** (AC: #3)
  - [x]Create `apps/api/src/middleware/validate.middleware.ts`
  - [x]Generic: `validate(schema: ZodSchema)` → validates `req.body` → `next()` or throw `AppError('VALIDATION_ERROR', ..., 400)`
  - [x]Format Zod errors into user-friendly field-level messages

- [x] **Task 5: Configure express-session, Passport.js, and CSRF** (AC: #1)
  - [x]Update `apps/api/src/app.ts`: add `express-session` middleware with HTTP-only cookie config
  - [x]Add `passport.initialize()` and `passport.session()` middleware
  - [x]Create `apps/api/src/config/passport.ts` with `serializeUser` (stores user.id) and `deserializeUser` (queries user by id from DB)
  - [x]Add `csrf-sync` middleware for state-changing routes (POST/PUT/DELETE)
  - [x]Add GET `/api/auth/csrf-token` endpoint that returns the CSRF token to the SPA
  - [x]Session config: `secret` from `SESSION_SECRET` env var, `cookie.httpOnly: true`, `cookie.secure: production only`, `cookie.sameSite: 'lax'`, `cookie.maxAge: 30 days`

- [x] **Task 6: Create auth service** (AC: #1, #2)
  - [x]Create `apps/api/src/features/auth/auth.service.ts`
  - [x]Implement `registerUser(data: RegisterInput)`: check email uniqueness via DB query, hash password with bcrypt (12 rounds), insert user in DB, return user object WITHOUT `passwordHash`
  - [x]Throw `AppError('CONFLICT', 'This email is already registered', 409)` for duplicate email

- [x] **Task 7: Create auth controller and routes** (AC: #1)
  - [x]Create `apps/api/src/features/auth/auth.controller.ts` — `register` handler: calls service, then `req.login()` to create session, returns `{ data: { user } }` with status 201
  - [x]Create `apps/api/src/features/auth/auth.routes.ts` — `POST /api/auth/register` with `validate(registerSchema)` middleware and rate limiter
  - [x]Create `apps/api/src/features/auth/index.ts` barrel export

- [x] **Task 8: Wire auth routes and middleware into app.ts** (AC: #1)
  - [x]Import and mount auth routes at `/api/auth`
  - [x]Add error handler as LAST middleware
  - [x]Middleware order: `cors` → `json` → `session` → `passport` → routes → `errorHandler`
  - [x]Add rate limiter on `/api/auth` routes (max 10 requests per 15 minutes per IP)

- [x] **Task 9: Install frontend dependencies** (AC: #3)
  - [x]Add `react-router-dom`, `react-hook-form`, `@hookform/resolvers` to `apps/web` dependencies
  - [x]Run `npm install` from root

- [x] **Task 10: Create frontend API client and auth hooks** (AC: #1, #3)
  - [x]Create `apps/web/src/lib/apiClient.ts` — fetch wrapper with `credentials: 'include'`, CSRF token header, JSON handling, base URL config
  - [x]Create `apps/web/src/features/auth/hooks/useAuth.ts` — `register()` function, loading/error state management

- [x] **Task 11: Create registration page and form** (AC: #1, #2, #3)
  - [x]Create `apps/web/src/features/auth/pages/RegisterPage.tsx` — page layout with RegisterForm
  - [x]Create `apps/web/src/features/auth/components/RegisterForm.tsx` — react-hook-form with `zodResolver(registerSchema)`, inline field-level Zod errors, API error display (duplicate email), redirect to `/onboarding` on success
  - [x]Form fields: email, password, displayName

- [x] **Task 12: Set up frontend routing** (AC: #1)
  - [x]Create `apps/web/src/router.tsx` with react-router-dom `createBrowserRouter`
  - [x]Routes: `/register` → RegisterPage, `/` → placeholder Home
  - [x]Update `App.tsx` to use `RouterProvider`

- [x] **Task 13: Write backend auth tests** (AC: #1, #2, #3)
  - [x]Create `apps/api/src/features/auth/auth.test.ts` using supertest
  - [x]Test valid registration → 201, user in response, session cookie set, no passwordHash in response
  - [x]Test duplicate email → 409, error code CONFLICT
  - [x]Test invalid email → 400, error code VALIDATION_ERROR
  - [x]Test weak password (< 8 chars) → 400, error code VALIDATION_ERROR
  - [x]Test missing displayName → 400, error code VALIDATION_ERROR

- [x] **Task 14: Final verification**
  - [x]Run `npm run lint` — no errors
  - [x]Run `npm run test` — all tests pass (existing 6 + new auth tests)
  - [x]Run `npm run build` — all 3 workspaces build

## Dev Notes

### Critical Architecture Decisions

This story establishes **THREE foundational patterns** used by every subsequent story:

1. **Feature folder pattern**: `features/auth/` with `routes.ts` → `controller.ts` → `service.ts` → `test.ts`. Every backend feature (content, publishing, billing, admin) follows this exact structure.
2. **AppError + error handler**: Centralized error handling. ALL future endpoints throw `AppError`, NEVER `new Error()`.
3. **Validation middleware**: Reusable Zod validation for all API endpoints via `validate(schema)`.

**Source:** [architecture.md](_bmad-output/planning-artifacts/architecture.md) — Sections: "Authentication & Security", "API & Communication Patterns", "Code Structure"

### Project Structure Notes

This story creates the `features/`, `middleware/`, `lib/`, and `config/` directories in the API. It also creates the `features/auth/` structure in the web app. All paths are relative to the monorepo root.

```
apps/api/src/
├── config/
│   └── passport.ts                # NEW — Passport serialize/deserialize
├── features/
│   └── auth/
│       ├── auth.routes.ts         # NEW — POST /api/auth/register
│       ├── auth.controller.ts     # NEW — register handler
│       ├── auth.service.ts        # NEW — registration business logic
│       ├── auth.test.ts           # NEW — supertest auth tests
│       └── index.ts               # NEW — barrel export
├── lib/
│   └── errors.ts                  # NEW — AppError class
├── middleware/
│   ├── errorHandler.middleware.ts  # NEW — centralized error handler
│   └── validate.middleware.ts     # NEW — Zod validation middleware
├── app.ts                         # MODIFIED — add session, passport, CSRF, routes, error handler
├── db/                            # EXISTING from Story 1.2

apps/web/src/
├── features/
│   └── auth/
│       ├── components/
│       │   └── RegisterForm.tsx   # NEW — registration form
│       ├── hooks/
│       │   └── useAuth.ts         # NEW — auth API hooks
│       └── pages/
│           └── RegisterPage.tsx   # NEW — registration page
├── lib/
│   └── apiClient.ts              # NEW — fetch wrapper
├── router.tsx                     # NEW — react-router-dom config
├── App.tsx                        # MODIFIED — use RouterProvider
```

### Naming Conventions

**Backend files:** `camelCase.ts` for utilities, `feature.type.ts` for feature files (e.g., `auth.routes.ts`, `auth.service.ts`)

**Middleware files:** `name.middleware.ts` (e.g., `errorHandler.middleware.ts`, `validate.middleware.ts`)

**Frontend files:** `PascalCase.tsx` for components/pages (e.g., `RegisterForm.tsx`, `RegisterPage.tsx`), `camelCase.ts` for hooks/utilities

**Zod schemas:** `camelCase` + `Schema` suffix → `registerSchema` (already exists in `packages/shared/src/schemas/auth.schema.ts`)

[Source: architecture.md § "Code Naming Conventions"]

### API Patterns

**Registration endpoint:**
```
POST /api/auth/register
Content-Type: application/json
X-CSRF-Token: <token>

Request:  { "email": "user@example.com", "password": "securePass123", "displayName": "John" }
Success:  201 { "data": { "id": "uuid", "email": "...", "displayName": "...", "role": "user", "subscriptionTier": "free" } }
Error:    409 { "error": { "code": "CONFLICT", "message": "This email is already registered", "statusCode": 409 } }
Error:    400 { "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "statusCode": 400, "details": [...] } }
```

**CSRF token endpoint:**
```
GET /api/auth/csrf-token
Success:  200 { "data": { "csrfToken": "<token>" } }
```

The `{ data: { ... } }` wrapper and `{ error: { ... } }` format match the patterns established in Story 1.1 (health endpoint) and defined in `packages/shared/src/types/api.types.ts`.

[Source: architecture.md § "API Response Formats", "API Naming Conventions"]

### Error Handling Pattern

```typescript
// ALWAYS throw AppError, NEVER throw new Error()
import { AppError } from '../../lib/errors';

// In service:
throw new AppError('CONFLICT', 'This email is already registered', 409);

// In middleware:
throw new AppError('VALIDATION_ERROR', 'Validation failed', 400);

// errorHandler.middleware.ts catches ALL errors and returns formatted JSON
```

**Error codes** are already defined in `packages/shared/src/constants/errorCodes.ts`. Use the `ERROR_CODES` constant.

[Source: architecture.md § "Error Handling"]

## Technical Requirements

### Library Versions (Verified February 2026)

| Library | Version | Notes |
|---------|---------|-------|
| **bcrypt** | **6.0.0** | Native bcrypt, uses prebuildify. If native build fails on Windows, fallback to `bcryptjs@3.0.3` (pure JS) |
| **passport** | **0.7.0** | `req.logout()` is async (requires callback). Works with Express 5 |
| **express-session** | **1.19.0** | Supports dynamic cookie options. Express org maintained |
| **csrf-sync** | **4.2.1** | Synchronizer Token Pattern. Replaces deprecated `csurf` |
| **express-rate-limit** | **8.2.1** | Explicit Express 5 support. IPv6 subnet masking default |
| **react-router-dom** | **7.x** | Latest stable for React 19 |
| **react-hook-form** | **7.x** | Form management |
| **@hookform/resolvers** | **Latest** | Zod resolver for react-hook-form |

### Critical Version Notes

1. **csurf is DEPRECATED** (May 2025 by Express team). Use `csrf-sync` instead. Import: `import { csrfSync } from 'csrf-sync'`
2. **Passport 0.7.0** — `req.logout()` requires a callback: `req.logout((err) => { ... })`. This is critical for Story 1.4 logout.
3. **express-rate-limit 8.x** — IPv6 addresses masked with `/56` subnet by default. Use `standardHeaders: 'draft-8'` for IETF RateLimit headers.
4. **express-session** — MemoryStore is fine for development. Production needs a persistent store (connect-pg-simple or Redis). DO NOT add a persistent store in this story.

## Architecture Compliance

### Patterns to Follow in This Story

1. **Feature folder structure:** `features/auth/` → `routes.ts`, `controller.ts`, `service.ts`, `test.ts`, `index.ts`
2. **Controller is thin:** Only handles req/res — delegates to service for business logic
3. **Service owns business logic:** DB queries, bcrypt hashing, validation logic
4. **AppError for all errors:** Never `throw new Error()` — always `throw new AppError(code, message, statusCode)`
5. **Zod validation middleware:** `validate(schema)` before controller — controller never validates
6. **API response format:** `{ data: {...} }` for success, `{ error: {...} }` for failure
7. **password_hash NEVER returned:** Strip `passwordHash` from user objects before sending to client
8. **Session secret from env:** `process.env.SESSION_SECRET` — never hardcoded

### Anti-Patterns to Avoid

- DO NOT use `csurf` — it is deprecated. Use `csrf-sync`
- DO NOT put business logic in controllers — belongs in services
- DO NOT return `passwordHash` in ANY API response — strip it in the service
- DO NOT use `any` type — use `unknown` + type narrowing
- DO NOT use `passport-local` strategy yet — that's Story 1.4 (login). For registration, manually create user then call `req.login()`
- DO NOT add a persistent session store (connect-pg-simple, Redis) — use MemoryStore for now
- DO NOT create `/api/auth/login` or `/api/auth/logout` endpoints — Story 1.4
- DO NOT skip CSRF protection — it's in the AC
- DO NOT import `db` directly in controllers — only services access the database
- DO NOT store the CSRF token in localStorage — use session-based synchronizer token pattern

## File Structure Requirements

### apps/api/src/lib/errors.ts

```typescript
import type { ErrorCode } from '@plublista/shared';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
```

### apps/api/src/middleware/errorHandler.middleware.ts

```typescript
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, statusCode: err.statusCode },
    });
    return;
  }
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error', statusCode: 500 },
  });
}
```

### apps/api/src/middleware/validate.middleware.ts

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../lib/errors';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', 'Validation failed', 400);
    }
    req.body = result.data;
    next();
  };
}
```

### apps/api/src/config/passport.ts

```typescript
import passport from 'passport';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user[0] || null);
  } catch (err) {
    done(err);
  }
});

export default passport;
```

### apps/api/src/features/auth/auth.service.ts

```typescript
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema/index';
import { AppError } from '../../lib/errors';
import type { RegisterInput } from '@plublista/shared';

const BCRYPT_ROUNDS = 12;

export async function registerUser(data: RegisterInput) {
  // Check email uniqueness
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) {
    throw new AppError('CONFLICT', 'This email is already registered', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Insert user
  const [newUser] = await db.insert(users).values({
    email: data.email,
    passwordHash,
    displayName: data.displayName,
  }).returning({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    subscriptionTier: users.subscriptionTier,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  });

  return newUser;
}
```

### CSRF Setup in app.ts (partial)

```typescript
import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
});

// Apply CSRF protection to state-changing routes
app.use('/api/auth/register', csrfSynchronisedProtection);

// Endpoint to get CSRF token (before registration form loads)
app.get('/api/auth/csrf-token', (req, res) => {
  const token = generateToken(req);
  res.json({ data: { csrfToken: token } });
});
```

### Frontend apiClient.ts (pattern)

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let csrfToken = '';

export async function fetchCsrfToken() {
  const res = await fetch(`${API_BASE}/api/auth/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.data.csrfToken;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw err.error;
  }
  return res.json();
}
```

## Testing Requirements

### Backend Tests (`apps/api/src/features/auth/auth.test.ts`)

Use **supertest** against the Express app (NOT a running server). Tests should cover:

1. `POST /api/auth/register` with valid data → 201, returns `{ data: { id, email, displayName, role, subscriptionTier } }`, response has `set-cookie` header (HTTP-only session), NO `passwordHash` in response
2. `POST /api/auth/register` with duplicate email → 409, returns `{ error: { code: 'CONFLICT' } }`
3. `POST /api/auth/register` with invalid email → 400, `VALIDATION_ERROR`
4. `POST /api/auth/register` with short password (< 8 chars) → 400, `VALIDATION_ERROR`
5. `POST /api/auth/register` with missing displayName → 400, `VALIDATION_ERROR`

**CSRF in tests:** For supertest tests, you may need to first GET `/api/auth/csrf-token` to obtain a token, then include it in the `X-CSRF-Token` header of POST requests. Alternatively, disable CSRF for test environment via `NODE_ENV=test` check.

**Important:** Do NOT test actual bcrypt timing — just verify the user is created and the password is hashed (not stored in plaintext). Existing tests (6 from Stories 1.1 + 1.2) must continue to pass.

### Frontend Tests (optional for this story)

Frontend component tests can be deferred since the frontend testing infrastructure (vitest + testing-library for React) is not yet configured in `apps/web`. If created, focus on:

1. RegisterForm renders all 3 fields (email, password, displayName)
2. Zod validation shows inline errors for invalid input
3. Form calls API on valid submit

## Previous Story Intelligence

### From Story 1.2: Database Setup & Core Schema

**Key learnings applied:**
- Drizzle Kit CJS loader requires extensionless imports in `db/schema/` and `db/` files. Continue this pattern.
- `timestamp` columns use `{ withTimezone: true }` for `timestamptz` — was corrected during code review.
- `moduleResolution: "bundler"` in tsconfig allows extensionless imports; `packages/shared` uses `.js` extensions.
- DATABASE_URL validated at module load time with early `throw` — follow this pattern for SESSION_SECRET.

**Files established that this story uses:**
- `apps/api/src/db/index.ts` — Drizzle client (`db`) for all database operations
- `apps/api/src/db/schema/users.ts` — `users` table, `userRoleEnum`, `subscriptionTierEnum`
- `packages/shared/src/schemas/auth.schema.ts` — `registerSchema` with `email`, `password` (min 8), `displayName`
- `packages/shared/src/constants/errorCodes.ts` — `ERROR_CODES` with VALIDATION_ERROR, CONFLICT, etc.
- `packages/shared/src/types/api.types.ts` — `ApiResponse<T>`, `ApiError`
- `packages/shared/src/types/user.types.ts` — `User` type (without passwordHash)

**Patterns established:**
- Express app in `apps/api/src/app.ts` with CORS and JSON middleware
- Health endpoint: `GET /api/health` → `{ data: { status: 'ok', timestamp: '...' } }`
- Tests co-located using Vitest + supertest
- Build: tsup for API, vite for web, tsc for shared

### From Story 1.1: Initialize Monorepo

- ESLint 9 (not 10) with flat config
- Root `package.json` has `"type": "module"`
- Build order: `packages/shared` → `apps/api` → `apps/web`

## References

- [Source: architecture.md § "Authentication & Security"] — Session strategy, Passport.js, CSRF, rate limiting
- [Source: architecture.md § "API & Communication Patterns"] — RESTful JSON, error handling, error codes
- [Source: architecture.md § "Code Structure"] — Feature folders, middleware, lib
- [Source: architecture.md § "API Response Formats"] — { data } / { error } wrapper
- [Source: architecture.md § "Code Naming Conventions"] — camelCase files, PascalCase components
- [Source: epics.md § "Story 1.3"] — BDD acceptance criteria
- [Source: prd.md § "RBAC & Permission Matrix"] — User roles (user, admin)
- [Source: shared/schemas/auth.schema.ts] — registerSchema already defined with email, password, displayName

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Circular dependency: `auth.routes.ts` initially imported `csrfSynchronisedProtection` from `app.ts`, which also imports auth routes. Fixed by extracting CSRF config to `config/csrf.ts`.
- `app.test.ts` (health endpoint) failed because `app.ts` → `passport.ts` → `db/index.ts` triggered DATABASE_URL validation at import time. Fixed by: (1) using dynamic imports in passport.ts for db modules, (2) converting db/index.ts to lazy initialization via Proxy pattern — db only connects on first actual usage.
- Missing `@types/supertest` — added to devDependencies.
- Missing `vite-env.d.ts` — created to provide `import.meta.env` types for the frontend API client.
- Auth tests use vitest mocking (`vi.mock`) for both the db module and bcrypt, keeping tests fast and independent of a real database.

### Completion Notes List

- All 3 ACs satisfied
- 7 new auth tests + 6 existing = 13 total passing
- Backend: AppError class, error handler middleware, Zod validation middleware, express-session (MemoryStore), Passport.js (serialize/deserialize), CSRF via csrf-sync, rate limiting (10 req/15min)
- Frontend: Registration form with react-hook-form + Zod validation, API client with CSRF token handling, react-router-dom routing
- passwordHash never returned in API responses — service uses `.returning()` with explicit column selection
- CSRF protection uses Synchronizer Token Pattern (csrf-sync) replacing deprecated csurf
- db/index.ts refactored from eager to lazy initialization (Proxy pattern) — preserves fail-fast behavior on actual DB usage while allowing test imports without DATABASE_URL

### Code Review Notes (AI)

**Reviewer:** Claude Opus 4.6 — Adversarial code review
**Date:** 2026-02-13
**Findings:** 1 HIGH, 4 MEDIUM, 3 LOW → All HIGH and MEDIUM fixed

- **H1 FIXED:** Email not normalized to lowercase — added `data.email.toLowerCase().trim()` in auth.service.ts
- **M1 FIXED:** `RATE_LIMITED` error code added to `ERROR_CODES` in shared/errorCodes.ts
- **M2 FIXED:** `SESSION_SECRET` validation added in app.ts — throws in production if missing
- **M3 FIXED:** `AppError` extended with optional `details` field; `errorHandler` and `validate` middleware propagate field-level validation errors
- **M4 FIXED:** Wrapped INSERT in try/catch in auth.service.ts — catches unique constraint violation and converts to 409 CONFLICT
- **L1 NOTED:** Unsafe `err as ApiError` cast in useAuth.ts — deferred
- **L2 NOTED:** apiClient.ts doesn't handle non-JSON responses — deferred
- **L3 NOTED:** No CSRF rejection test in auth.test.ts — deferred

### Change Log

- Modified: apps/api/package.json — added bcrypt, passport, express-session, csrf-sync, express-rate-limit + type deps
- Modified: apps/api/src/app.ts — added session, passport, CSRF, auth routes, error handler middleware, SESSION_SECRET production validation
- Modified: apps/api/src/db/index.ts — refactored to lazy Proxy initialization
- Created: apps/api/src/lib/errors.ts — AppError class
- Created: apps/api/src/middleware/errorHandler.middleware.ts
- Created: apps/api/src/middleware/validate.middleware.ts
- Created: apps/api/src/config/passport.ts — serialize/deserialize with dynamic DB import
- Created: apps/api/src/config/csrf.ts — csrf-sync configuration
- Created: apps/api/src/features/auth/auth.service.ts — registerUser business logic
- Created: apps/api/src/features/auth/auth.controller.ts — register handler
- Created: apps/api/src/features/auth/auth.routes.ts — POST /api/auth/register
- Created: apps/api/src/features/auth/auth.test.ts — 7 supertest auth tests
- Created: apps/api/src/features/auth/index.ts — barrel export
- Modified: apps/web/package.json — added react-router-dom, react-hook-form, @hookform/resolvers
- Modified: apps/web/src/main.tsx — switched to RouterProvider
- Created: apps/web/src/router.tsx — browser router config
- Created: apps/web/src/lib/apiClient.ts — fetch wrapper with CSRF
- Created: apps/web/src/features/auth/hooks/useAuth.ts — register hook
- Created: apps/web/src/features/auth/components/RegisterForm.tsx — registration form
- Created: apps/web/src/features/auth/pages/RegisterPage.tsx — registration page
- Created: apps/web/src/vite-env.d.ts — Vite client types
- [Review] Modified: apps/api/src/features/auth/auth.service.ts — email normalization + unique constraint catch
- [Review] Modified: apps/api/src/lib/errors.ts — added optional details field to AppError
- [Review] Modified: apps/api/src/middleware/errorHandler.middleware.ts — propagate details in error response
- [Review] Modified: apps/api/src/middleware/validate.middleware.ts — pass fieldErrors as details to AppError
- [Review] Modified: apps/api/src/app.ts — SESSION_SECRET production validation
- [Review] Modified: packages/shared/src/constants/errorCodes.ts — added RATE_LIMITED

### File List

- apps/api/package.json
- apps/api/src/app.ts
- apps/api/src/db/index.ts
- apps/api/src/lib/errors.ts
- apps/api/src/middleware/errorHandler.middleware.ts
- apps/api/src/middleware/validate.middleware.ts
- apps/api/src/config/passport.ts
- apps/api/src/config/csrf.ts
- apps/api/src/features/auth/auth.service.ts
- apps/api/src/features/auth/auth.controller.ts
- apps/api/src/features/auth/auth.routes.ts
- apps/api/src/features/auth/auth.test.ts
- apps/api/src/features/auth/index.ts
- apps/web/package.json
- apps/web/src/main.tsx
- apps/web/src/router.tsx
- apps/web/src/lib/apiClient.ts
- apps/web/src/features/auth/hooks/useAuth.ts
- apps/web/src/features/auth/components/RegisterForm.tsx
- apps/web/src/features/auth/pages/RegisterPage.tsx
- apps/web/src/vite-env.d.ts
- packages/shared/src/constants/errorCodes.ts
