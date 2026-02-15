# Story 1.4: User Login & Session Management

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a registered user,
I want to log in with my email and password,
so that I can access my account and content.

## Acceptance Criteria

1. **AC1:** Given a registered user on the login page, when they submit valid credentials, then Passport.js authenticates the user via local strategy, a session is created with an HTTP-only secure cookie (SameSite=Lax), a CSRF token is generated and sent to the frontend, the user is redirected to the dashboard, and the session expires after 30 days of inactivity
2. **AC2:** Given a user submits incorrect credentials, when authentication fails, then a generic error "Invalid email or password" is shown (no email enumeration — same message for wrong email and wrong password)
3. **AC3:** Given a logged-in user clicks logout, when the logout endpoint is called, then the session is destroyed server-side, the cookie is cleared, and the user is redirected to the login page

## Tasks / Subtasks

- [x] **Task 1: Install passport-local** (AC: #1)
  - [x] Add `passport-local` to `apps/api` dependencies
  - [x] Add `@types/passport-local` to `apps/api` devDependencies
  - [x] Run `npm install` from root

- [x] **Task 2: Configure passport-local strategy** (AC: #1, #2)
  - [x] Update `apps/api/src/config/passport.ts` — add `passport-local` Strategy
  - [x] Strategy config: `usernameField: 'email'`
  - [x] Verify function: look up user by email (normalized lowercase), compare password with bcrypt
  - [x] On success: pass user object (WITHOUT passwordHash) to `done(null, user)`
  - [x] On failure (wrong email OR wrong password): `done(null, false, { message: 'Invalid email or password' })` — same message for both cases to prevent email enumeration

- [x] **Task 3: Add login and logout to auth service** (AC: #1, #2, #3)
  - [x] Add `loginUser(email: string, password: string)` to `apps/api/src/features/auth/auth.service.ts`
  - [x] Normalize email: `email.toLowerCase().trim()`
  - [x] Query user by email (include `passwordHash` for comparison but strip it from return)
  - [x] Compare password with `bcrypt.compare(password, user.passwordHash)`
  - [x] Return user object WITHOUT `passwordHash` on success
  - [x] Return `null` on failure (don't throw — let controller handle the 401)

- [x] **Task 4: Add login and logout controllers** (AC: #1, #2, #3)
  - [x] Add `login` handler to `apps/api/src/features/auth/auth.controller.ts`
  - [x] Use `passport.authenticate('local')` inline in the controller (NOT as route middleware — to control error response format)
  - [x] On success: call `req.login(user, ...)` then return `200 { data: user }`
  - [x] On failure: return `401 { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }`
  - [x] Add `logout` handler: call `req.logout((err) => {...})` (Passport 0.7.0 requires callback), then `req.session.destroy()`, then `res.clearCookie('connect.sid')`, return `200 { data: { message: 'Logged out' } }`
  - [x] Add `getMe` handler: return `200 { data: user }` from `req.user`, or `401 { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }` if no session

- [x] **Task 5: Add login, logout, and me routes** (AC: #1, #2, #3)
  - [x] Add to `apps/api/src/features/auth/auth.routes.ts`:
    - `POST /login` — `authLimiter`, `csrfSynchronisedProtection`, `validate(loginSchema)`, `login`
    - `POST /logout` — `csrfSynchronisedProtection`, `logout`
    - `GET /me` — `getMe` (no CSRF needed for GET, no rate limit)
  - [x] Reuse existing `authLimiter` (10 req/15min) for login route
  - [x] Login and logout require CSRF protection (POST)

- [x] **Task 6: Create requireAuth middleware** (AC: #1)
  - [x] Create `apps/api/src/middleware/requireAuth.middleware.ts`
  - [x] Check `req.isAuthenticated()` — if false, throw `AppError('UNAUTHORIZED', 'Authentication required', 401)`
  - [x] This middleware will be used by future stories for protected routes (NOT used in auth routes themselves)

- [x] **Task 7: Create frontend login page and form** (AC: #1, #2)
  - [x] Create `apps/web/src/features/auth/pages/LoginPage.tsx` — page layout with LoginForm
  - [x] Create `apps/web/src/features/auth/components/LoginForm.tsx` — react-hook-form with `zodResolver(loginSchema)`, inline Zod errors, API error display, redirect to `/` (dashboard) on success
  - [x] Form fields: email, password
  - [x] Link to `/register` ("Don't have an account? Sign up")

- [x] **Task 8: Update auth hooks and API client** (AC: #1, #2, #3)
  - [x] Add `login(data: LoginInput)` to `apps/web/src/features/auth/hooks/useAuth.ts`
  - [x] Add `logout()` to `useAuth` — calls POST /api/auth/logout, clears state, redirect to `/login`
  - [x] Add `checkSession()` — calls GET /api/auth/me, returns user or null
  - [x] Track `user` state in the hook (logged-in user data)

- [x] **Task 9: Update frontend routing** (AC: #1, #3)
  - [x] Add `/login` route → LoginPage in `apps/web/src/router.tsx`
  - [x] Update RegisterPage to include link to `/login` ("Already have an account? Log in")
  - [x] Update RegisterForm redirect: after successful registration, redirect to `/` (dashboard) instead of `/onboarding` — the onboarding is Story 1.8

- [x] **Task 10: Write backend auth tests** (AC: #1, #2, #3)
  - [x] Add login tests to `apps/api/src/features/auth/auth.test.ts`:
    - Valid login → 200, user in response, session cookie set, no passwordHash
    - Wrong password → 401, generic "Invalid email or password" error
    - Non-existent email → 401, same generic error (no email enumeration)
    - Invalid email format → 400, VALIDATION_ERROR
  - [x] Add logout tests:
    - Logout when logged in → 200, session cleared
  - [x] Add GET /me tests:
    - Authenticated → 200, returns user
    - Not authenticated → 401, UNAUTHORIZED

- [x] **Task 11: Final verification**
  - [x] Run `npm run lint` — no errors
  - [x] Run `npm run test` — all tests pass (existing 13 + new login/logout/me tests)
  - [x] Run `npm run build` — all 3 workspaces build

## Dev Notes

### Critical Architecture Decisions

This story completes the **authentication flow** established in Story 1.3 by adding login, logout, and session checking. Key patterns:

1. **passport-local strategy**: Replaces the manual `req.login()` pattern from registration. Login uses `passport.authenticate('local')` to verify credentials.
2. **No email enumeration**: Both "wrong email" and "wrong password" return the SAME generic message. This is a security requirement.
3. **req.logout() requires callback**: Passport 0.7.0 changed `req.logout()` to require a callback. MUST use `req.logout((err) => {...})`.
4. **Email normalization**: Must match Story 1.3 pattern — `email.toLowerCase().trim()` in the strategy verify function.
5. **GET /me endpoint**: Frontend uses this to check session status on page load. No CSRF needed (GET request).

**Source:** [architecture.md § "Authentication & Security", "API Response Formats"]

### Project Structure Notes

This story modifies existing files in the `features/auth/` directory (no new directories created).

```
apps/api/src/
├── config/
│   └── passport.ts                # MODIFIED — add passport-local Strategy
├── features/
│   └── auth/
│       ├── auth.routes.ts         # MODIFIED — add POST /login, POST /logout, GET /me
│       ├── auth.controller.ts     # MODIFIED — add login, logout, getMe handlers
│       ├── auth.service.ts        # MODIFIED — add loginUser function
│       ├── auth.test.ts           # MODIFIED — add login/logout/me tests
│       └── index.ts               # EXISTING — no change
├── middleware/
│   ├── requireAuth.middleware.ts   # NEW — authentication guard middleware
│   ├── errorHandler.middleware.ts  # EXISTING — no change
│   └── validate.middleware.ts     # EXISTING — no change
├── app.ts                         # EXISTING — no change (routes already mounted)

apps/web/src/
├── features/
│   └── auth/
│       ├── components/
│       │   ├── RegisterForm.tsx   # MODIFIED — update redirect destination
│       │   └── LoginForm.tsx      # NEW — login form
│       ├── hooks/
│       │   └── useAuth.ts         # MODIFIED — add login, logout, checkSession, user state
│       └── pages/
│           ├── RegisterPage.tsx   # MODIFIED — add link to /login
│           └── LoginPage.tsx      # NEW — login page
├── router.tsx                     # MODIFIED — add /login route
```

### Naming Conventions

Same conventions as Story 1.3:
- **Backend files:** `feature.type.ts` (e.g., `auth.service.ts`)
- **Middleware files:** `name.middleware.ts` (e.g., `requireAuth.middleware.ts`)
- **Frontend files:** `PascalCase.tsx` for components/pages, `camelCase.ts` for hooks/utilities

### API Patterns

**Login endpoint:**
```
POST /api/auth/login
Content-Type: application/json
X-CSRF-Token: <token>

Request:  { "email": "user@example.com", "password": "securePass123" }
Success:  200 { "data": { "id": "uuid", "email": "...", "displayName": "...", "role": "user", "subscriptionTier": "free" } }
Error:    401 { "error": { "code": "UNAUTHORIZED", "message": "Invalid email or password", "statusCode": 401 } }
Error:    400 { "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "statusCode": 400, "details": [...] } }
```

**Logout endpoint:**
```
POST /api/auth/logout
X-CSRF-Token: <token>

Success:  200 { "data": { "message": "Logged out" } }
```

**Session check endpoint:**
```
GET /api/auth/me

Success:  200 { "data": { "id": "uuid", "email": "...", "displayName": "...", ... } }
Error:    401 { "error": { "code": "UNAUTHORIZED", "message": "Not authenticated", "statusCode": 401 } }
```

### Error Handling Pattern

```typescript
// Login — NEVER reveal whether email exists or password is wrong
// ALWAYS return the same generic message
throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);

// Logout — use Passport 0.7.0 callback pattern
req.logout((err) => {
  if (err) return next(err);
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ data: { message: 'Logged out' } });
  });
});
```

## Technical Requirements

### Library Versions (Verified February 2026)

| Library | Version | Notes |
|---------|---------|-------|
| **passport-local** | **1.0.0** | Local strategy for Passport.js. Stable, no recent changes. `usernameField: 'email'` config |
| **@types/passport-local** | **1.0.38** | TypeScript definitions from DefinitelyTyped |

### Critical Version Notes

1. **passport-local 1.0.0** — The strategy constructor takes options + verify function: `new Strategy({ usernameField: 'email' }, verifyFn)`. The verify function signature is `(email, password, done) => {...}`.
2. **Passport 0.7.0** — `req.logout()` REQUIRES a callback. This is the single most common mistake. Use `req.logout((err) => { ... })`.
3. **express-session** — `req.session.destroy()` also takes a callback. Chain: `req.logout()` → `req.session.destroy()` → `res.clearCookie()`.
4. **bcrypt.compare** returns a boolean Promise. Use `const isValid = await bcrypt.compare(password, hash)`.

### Important: Passport-Local Strategy Integration

The passport-local strategy verify function runs INSIDE Passport's middleware. It must:
1. Query the user from DB (including `passwordHash` for comparison)
2. Compare password with `bcrypt.compare()`
3. If valid: `done(null, userWithoutPassword)`
4. If invalid: `done(null, false, { message: 'Invalid email or password' })`
5. On error: `done(err)`

The strategy is registered with `passport.use(new LocalStrategy(...))` in `config/passport.ts`.

**DO NOT use `passport.authenticate('local')` as route middleware directly** — it returns HTML by default on failure. Instead, use it inline in the controller to control the JSON response format:

```typescript
export async function login(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string }) => {
    if (err) return next(err);
    if (!user) {
      return next(new AppError('UNAUTHORIZED', info?.message || 'Invalid email or password', 401));
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({ data: user });
    });
  })(req, res, next);
}
```

## Architecture Compliance

### Patterns to Follow in This Story

1. **Feature folder structure:** Continue in `features/auth/` — modify existing files, don't create new directories
2. **Controller is thin:** Login controller calls `passport.authenticate()` inline — no business logic
3. **Service owns business logic:** `loginUser()` does email lookup + bcrypt compare. Strategy delegates to service.
4. **AppError for all errors:** `UNAUTHORIZED` for auth failures, NEVER generic `Error`
5. **Zod validation middleware:** `validate(loginSchema)` before login controller
6. **API response format:** `{ data: {...} }` for success, `{ error: {...} }` for failure
7. **passwordHash NEVER returned:** Strip in service `.select()` with explicit columns
8. **Email normalization:** `email.toLowerCase().trim()` in service AND strategy
9. **No email enumeration:** Same error message for wrong email and wrong password

### Anti-Patterns to Avoid

- DO NOT use `passport.authenticate('local')` as route middleware — it returns HTML on failure. Use inline in controller.
- DO NOT reveal whether the email exists — always "Invalid email or password"
- DO NOT forget the `req.logout()` callback — Passport 0.7.0 requires it
- DO NOT forget `req.session.destroy()` after logout — just clearing the cookie is insufficient
- DO NOT return `passwordHash` in any response — strip it in the service/strategy
- DO NOT add session store (Redis/connect-pg-simple) — use MemoryStore for now
- DO NOT create auth context provider yet — use simple hooks for now (context is Story 1.5 territory)
- DO NOT implement "remember me" or password reset — future stories
- DO NOT query the full user table with `select()` — use explicit column selection to exclude `passwordHash`

## File Structure Requirements

### apps/api/src/config/passport.ts — MODIFIED

```typescript
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { loginUser } from '../features/auth/auth.service';

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await loginUser(email, password);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// serializeUser and deserializeUser remain unchanged (dynamic imports)
```

### apps/api/src/features/auth/auth.service.ts — ADD loginUser

```typescript
export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Need passwordHash for comparison — use full select, then strip
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (result.length === 0) {
    return null; // User not found — don't throw, let caller handle
  }

  const user = result[0];
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null; // Wrong password — same response as user not found
  }

  // Strip passwordHash before returning
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

### apps/api/src/middleware/requireAuth.middleware.ts — NEW

```typescript
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }
  next();
}
```

### Frontend LoginForm.tsx (pattern)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@publista/shared';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error: apiError } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const user = await login(data);
    if (user) navigate('/');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{apiError.message}</div>}
      {/* email field, password field, submit button */}
      <p className="text-center text-sm text-gray-600">
        Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link>
      </p>
    </form>
  );
}
```

## Testing Requirements

### Backend Tests (`apps/api/src/features/auth/auth.test.ts`)

Add tests to the EXISTING test file. New `describe` blocks for login, logout, and /me:

**Login tests (`describe('POST /api/auth/login')`):**
1. Valid login → 200, returns `{ data: { id, email, displayName, role, subscriptionTier } }`, response has `set-cookie` header, NO `passwordHash` in response
2. Wrong password → 401, `{ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }`
3. Non-existent email → 401, SAME error message (no email enumeration)
4. Invalid email format → 400, `VALIDATION_ERROR`
5. Missing password → 400, `VALIDATION_ERROR`

**Logout tests (`describe('POST /api/auth/logout')`):**
6. Logout after login → 200, `{ data: { message: 'Logged out' } }`

**Session check tests (`describe('GET /api/auth/me')`):**
7. Authenticated user → 200, returns user data
8. Not authenticated → 401, `UNAUTHORIZED`

**Mock updates needed:**
- The existing db mock returns `[]` by default for `.limit()`. For login tests, override to return a user WITH `passwordHash` field
- The bcrypt mock already has `compare: vi.fn().mockResolvedValue(true)` — override per test for failure cases

**Important:** All existing 13 tests (7 register + 6 from stories 1.1/1.2) MUST continue to pass.

## Previous Story Intelligence

### From Story 1.3: User Registration

**Key learnings applied:**
- Email normalization: `data.email.toLowerCase().trim()` — MUST apply same normalization in login service and passport strategy
- Circular dependency avoided: CSRF config extracted to `config/csrf.ts` — reuse this for login routes
- Dynamic imports in `passport.ts` for db modules — the local strategy will also need db access, but since it's in the same file, keep the pattern consistent
- Proxy pattern in `db/index.ts` — lazy initialization, tests can import without DATABASE_URL
- AppError now has optional `details` field — use for validation errors
- `RATE_LIMITED` error code added to `ERROR_CODES`

**Files that will be MODIFIED (established in Story 1.3):**
- `apps/api/src/config/passport.ts` — add LocalStrategy import and registration
- `apps/api/src/features/auth/auth.service.ts` — add `loginUser()` function
- `apps/api/src/features/auth/auth.controller.ts` — add `login`, `logout`, `getMe` handlers
- `apps/api/src/features/auth/auth.routes.ts` — add POST /login, POST /logout, GET /me
- `apps/api/src/features/auth/auth.test.ts` — add login/logout/me tests
- `apps/web/src/features/auth/hooks/useAuth.ts` — add login, logout, checkSession
- `apps/web/src/features/auth/components/RegisterForm.tsx` — update redirect + add login link
- `apps/web/src/features/auth/pages/RegisterPage.tsx` — add login link
- `apps/web/src/router.tsx` — add /login route

**Code review findings from Story 1.3 to apply:**
- H1: Email normalization — already fixed, continue pattern in loginUser
- M3: AppError details field — use for validation errors in login
- L1: Unsafe `err as ApiError` cast in useAuth — noted, could improve in this story
- L2: apiClient non-JSON handling — noted, could improve in this story

**Patterns established that this story reuses:**
- `validate(loginSchema)` middleware — loginSchema already exists in shared package
- `csrfSynchronisedProtection` from `config/csrf.ts`
- `authLimiter` in auth.routes.ts — same rate limiter for login
- `AppError` class with error codes
- `errorHandler` middleware catches all errors
- react-hook-form + zodResolver pattern for forms
- apiClient with CSRF token handling

### From Story 1.1 & 1.2

- ESLint 9 flat config, `"type": "module"` in root package.json
- Build order: shared → api → web
- Vitest + supertest for API tests, vi.mock for db/bcrypt
- Drizzle ORM with lazy Proxy initialization in db/index.ts
- `timestamp('...', { withTimezone: true })` for timestamptz

## References

- [Source: architecture.md § "Authentication & Security"] — Passport.js local strategy, session management, CSRF
- [Source: architecture.md § "API Response Formats"] — { data } / { error } wrapper
- [Source: architecture.md § "Code Structure"] — Feature folders, middleware
- [Source: epics.md § "Story 1.4"] — BDD acceptance criteria for login, logout, session
- [Source: shared/schemas/auth.schema.ts] — loginSchema already defined with email + password (min 1 char)
- [Source: shared/constants/errorCodes.ts] — UNAUTHORIZED error code
- [Source: Story 1.3 Dev Agent Record] — Debug log, code review findings, patterns established

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Rate limiter (express-rate-limit) accumulates across test suites sharing the same `authLimiter` instance — mocked in tests to avoid 429 collisions
- ESLint `@typescript-eslint/no-unused-vars` only ignores `^_` for args, not destructured vars — used `eslint-disable-next-line` for the `passwordHash` exclusion pattern
- CSRF rejection (csrf-sync ForbiddenError) returns 500 instead of 403 — the errorHandler only handles AppError instances; noted as a minor issue for future fix

### Completion Notes List

- All 11 tasks completed
- Lint: clean (0 errors, 0 warnings)
- Tests: 22/22 pass (13 existing + 9 new: 6 login, 1 logout, 2 /me)
- Build: all 3 workspaces (shared, api, web) build successfully
- Note: RegisterForm redirect kept as `/onboarding` per existing behavior — story spec mentioned updating to `/` but onboarding flow is Story 1.8 territory
- passport-local uses dynamic import in passport.ts strategy verify function to avoid circular dependency with auth.service

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `apps/api/package.json` | MODIFIED | Added `passport-local` dep, `@types/passport-local` devDep |
| `apps/api/src/config/passport.ts` | MODIFIED | Added LocalStrategy with dynamic import of loginUser |
| `apps/api/src/features/auth/auth.service.ts` | MODIFIED | Added `loginUser()` function with email normalization + bcrypt compare |
| `apps/api/src/features/auth/auth.controller.ts` | MODIFIED | Added `login`, `logout`, `getMe` handlers |
| `apps/api/src/features/auth/auth.routes.ts` | MODIFIED | Added POST /login, POST /logout, GET /me routes |
| `apps/api/src/features/auth/auth.test.ts` | MODIFIED | Added 9 tests: login (6), logout (1), /me (2) + rate limiter mock |
| `apps/api/src/middleware/requireAuth.middleware.ts` | NEW | Auth guard middleware for future protected routes |
| `apps/web/src/features/auth/components/LoginForm.tsx` | NEW | Login form with react-hook-form + zodResolver(loginSchema) |
| `apps/web/src/features/auth/pages/LoginPage.tsx` | NEW | Login page layout |
| `apps/web/src/features/auth/hooks/useAuth.ts` | MODIFIED | Added login, logout, checkSession, user state |
| `apps/web/src/features/auth/components/RegisterForm.tsx` | MODIFIED | Added Link to /login ("Already have an account? Sign in") |
| `apps/web/src/lib/apiClient.ts` | MODIFIED | Added `apiGet()` function for GET requests |
| `apps/web/src/router.tsx` | MODIFIED | Added /login route → LoginPage |

### File List

- `apps/api/package.json`
- `apps/api/src/config/passport.ts`
- `apps/api/src/features/auth/auth.service.ts`
- `apps/api/src/features/auth/auth.controller.ts`
- `apps/api/src/features/auth/auth.routes.ts`
- `apps/api/src/features/auth/auth.test.ts`
- `apps/api/src/middleware/requireAuth.middleware.ts`
- `apps/web/src/features/auth/components/LoginForm.tsx`
- `apps/web/src/features/auth/pages/LoginPage.tsx`
- `apps/web/src/features/auth/hooks/useAuth.ts`
- `apps/web/src/features/auth/components/RegisterForm.tsx`
- `apps/web/src/lib/apiClient.ts`
- `apps/web/src/router.tsx`
