---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-13'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-Publista-2026-02-13.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-13.md'
  - '_bmad-output/planning-artifacts/cost-analysis-Publista-2026-02-13.md'
workflowType: 'architecture'
project_name: 'Publista'
user_name: 'Utilisateur'
date: '2026-02-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
51 FRs across 7 domains:
- Content Creation (FR1-FR8): Auto-montage, carousel builder, single post, format selection, preview, text editing
- AI Generation (FR9-FR13): Copy, music, images, video analysis, algorithm-aware editing
- Publishing & Distribution (FR14-FR21): Multi-platform via Ayrshare, Graph API fallback, scheduling, calendar, retry, format conversion
- User Management (FR22-FR29): Auth, OAuth, profiles, onboarding, GDPR erasure/portability
- Billing & Subscriptions (FR30-FR37): Stripe integration, 5 tiers, quotas, trials, dunning, webhook idempotency
- Content Management (FR38-FR42): Dashboard, status tracking, error recovery, duplication, deletion
- Platform Administration (FR43-FR51): Health metrics, error investigation, cost monitoring, quota adjustments, watermark/virality

**Non-Functional Requirements:**
33 NFRs across 6 categories:
- Performance (NFR1-7): <3min render, <2s UI, <30s upload, 10+ concurrent renders
- Security (NFR8-14): AES-256 token encryption, server-side API keys, HTTP-only sessions, tenant isolation, input validation, HTTPS
- Scalability (NFR15-19): 500 concurrent users, 10K records/user, 10GB/user storage, linear API cost scaling, queue-based rendering
- Reliability (NFR20-24): 99.5% uptime, >95% publishing success, zero data loss, graceful degradation, idempotent retry
- Integration Resilience (NFR25-28): Exponential backoff, idempotent webhooks, proactive token refresh, 30s API timeouts
- Data Privacy (NFR29-33): GDPR erasure within 72h, data export, cookie consent, EU data residency, audit logging

**Scale & Complexity:**

- Primary domain: Full-stack SaaS with AI orchestration
- Complexity level: Medium-High
- Estimated architectural components: 12-15 (auth, content engine, AI pipeline, rendering queue, publishing service, billing, quota management, admin, storage, CDN, scheduling, monitoring)

### Technical Constraints & Dependencies

- Solo developer (founder) — architecture must minimize operational complexity
- Brownfield: v1 exists as Express.js + React app — incremental migration path needed
- External API dependency for ALL core features (Fal.ai, Ayrshare, Stripe, Claude)
- Ayrshare rate limit: 5 requests/10 seconds per user
- YouTube API quota: 10,000 units/day (video upload = 1,600 units)
- Instagram Graph API requires Meta app review for publishing access
- EU data residency requirement constrains hosting choices
- Auto-montage rendering is compute-bound (Remotion + FFmpeg server-side)
- MVP budget: API costs must stay below 40% of subscription revenue per user

### Cross-Cutting Concerns Identified

1. **Quota Enforcement** — Every content creation endpoint must check and decrement user quotas atomically
2. **API Cost Tracking** — Every external API call must log cost per user for margin protection (FR49)
3. **Authentication & Authorization** — Middleware on all routes, role-based (User Free/Paid, Admin, future Agency roles)
4. **External API Resilience** — Unified retry/circuit-breaker/timeout pattern across all 7 integrations
5. **GDPR Compliance** — Cascade delete across all entities (content, assets, tokens, billing), data export endpoint
6. **Tenant Isolation** — Row-level filtering by user_id on every database query, verified by automated tests
7. **Error Recovery** — All failed operations must be retryable without data corruption (idempotent design)
8. **Audit Logging** — Admin actions and sensitive operations logged with timestamp and actor

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SaaS with AI orchestration — requires separate frontend (SPA) and backend (long-running jobs) architecture.

### Starter Options Considered

| Option | Approach | Pros | Cons | Verdict |
|--------|----------|------|------|---------|
| **Next.js monolith** | SSR + API routes | Single deployment, SSR for public pages | Serverless timeout limits (max 300s) incompatible with 3min Remotion renders. Imposes server-side opinions. | Rejected |
| **Vite + Express (2 repos)** | Separate frontend/backend | Full flexibility, matches v1 | 2 deployments, CORS, duplicated config | Possible but suboptimal |
| **Vite + Express (monorepo)** | Single repo, 2 apps, shared packages | Full backend flexibility for long jobs + unified DX + shared types | Slightly more initial setup | **Selected** |

### Selected Starter: Monorepo with npm workspaces

**Rationale for Selection:**
- Backend must support long-running jobs (Remotion render up to 3 minutes, FFmpeg processing) — serverless functions are unsuitable
- Monorepo keeps frontend + backend + shared types in one Git repo, simplifying solo developer workflow
- npm workspaces (native) avoids Turborepo complexity unnecessary for a solo developer
- v1 Express.js codebase can be migrated incrementally into the monorepo structure

**Initialization Command:**

```bash
mkdir publista-v2 && cd publista-v2
npm init -y
npm create vite@latest apps/web -- --template react-ts
mkdir -p apps/api/src
mkdir -p packages/shared/src
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.x across frontend and backend (shared tsconfig base)
- Node.js 22 LTS runtime

**Styling Solution:**
- Tailwind CSS v4 with @tailwindcss/vite plugin
- shadcn/ui component library (accessible, customizable, no vendor lock-in)

**Build Tooling:**
- Vite 6 for frontend (HMR, fast builds)
- tsx/tsup for backend TypeScript compilation
- npm workspaces for monorepo dependency management

**Testing Framework:**
- Vitest (native Vite integration, Jest-compatible API)
- React Testing Library for component tests

**Database & ORM:**
- PostgreSQL 16 via Neon (serverless, EU region, branching)
- Drizzle ORM (SQL-first, zero binary dependencies, no generate step, edge-ready)

**Authentication:**
- Passport.js with JWT strategy
- HTTP-only secure cookies for session management

**Code Organization:**
```
publista-v2/
├── apps/
│   ├── web/          # React + Vite frontend (SPA)
│   └── api/          # Express.js backend (REST API + job workers)
├── packages/
│   └── shared/       # Shared types, constants, validation schemas
├── package.json      # Workspace root
└── tsconfig.base.json
```

**Development Experience:**
- Vite HMR for instant frontend feedback
- Concurrent dev server (frontend + backend with nodemon/tsx watch)
- Shared TypeScript types between frontend and backend
- ESLint + Prettier for consistent code style

**Note:** Project initialization using this structure should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data validation strategy (Zod) — blocks all API endpoint development
- Authentication method (Passport.js + HTTP-only cookies) — blocks all protected routes
- Job queue for rendering (BullMQ + Redis) — blocks Auto-Montage pipeline
- File storage (Cloudflare R2) — blocks all upload/media workflows
- API design (REST) — blocks all client-server communication

**Important Decisions (Shape Architecture):**
- State management (TanStack Query + Zustand) — shapes frontend patterns
- Routing (React Router v7) — shapes page structure
- Monitoring (Sentry + Better Uptime) — shapes error handling patterns
- Logging (Pino) — shapes debugging workflow

**Deferred Decisions (Post-MVP):**
- Redis clustering / scaling strategy
- CDN configuration optimization
- WebSocket for real-time notifications (polling sufficient at MVP)
- API versioning strategy (only needed at Public API in Phase 2)

### Data Architecture

| Decision | Choice | Version | Rationale | Affects |
|----------|--------|---------|-----------|---------|
| **Database** | PostgreSQL via Neon | PG 16 | Serverless, EU region, branching for dev/staging, connection pooling built-in | All data persistence |
| **ORM** | Drizzle ORM | Latest | SQL-first, zero binary, no generate step, TypeScript-native, edge-ready | All DB queries |
| **Validation** | Zod | Latest | TypeScript-first, shared schemas front/back via `packages/shared`, Drizzle integration | All API endpoints, forms |
| **Migrations** | Drizzle Kit | Latest | Native with Drizzle ORM, auto-generates SQL migrations from schema changes | Database schema evolution |
| **Caching** | In-memory (node-cache) at MVP | Latest | Avoid Redis complexity for caching. Cache quotas, frequent API responses. Upgrade to Redis if >200 users | Quota checks, API responses |
| **File Storage** | Cloudflare R2 | Latest | Zero egress fees (critical for video), S3-compatible API, CDN included, EU region available | Video uploads, generated assets, images |

### Authentication & Security

| Decision | Choice | Version | Rationale | Affects |
|----------|--------|---------|-----------|---------|
| **Session strategy** | HTTP-only cookies + CSRF token | N/A | More secure than JWT in localStorage, no client-side token management, automatic inclusion in requests | All authenticated routes |
| **Auth library** | Passport.js | Latest | Flexible strategies, Express-native, supports OAuth for social platform connections | Auth middleware, OAuth flows |
| **OAuth platform tokens** | Encrypted in DB (AES-256-GCM via Node.js crypto) | Native | Zero dependency, military-grade encryption for Ayrshare/Instagram/YouTube tokens at rest | Platform connections, publishing |
| **Rate limiting** | express-rate-limit | Latest | Lightweight middleware, configurable per-route, IP-based + user-based limits | All API endpoints |
| **Input validation** | Zod middleware (server-side) | Latest | Validates all request bodies/params before handler execution, prevents injection attacks | All API endpoints |
| **CORS** | cors middleware (configured for frontend origin only) | Latest | Monorepo still deploys as 2 services, CORS needed between Vercel (frontend) and Railway (backend) | API server config |

### API & Communication Patterns

| Decision | Choice | Version | Rationale | Affects |
|----------|--------|---------|-----------|---------|
| **API style** | RESTful JSON API | N/A | Simplicity, Express-native, all external APIs (Ayrshare, Stripe, Fal.ai) are REST — consistency | All client-server communication |
| **Job queue** | BullMQ + Redis | Latest | Required for Auto-Montage rendering pipeline: retry, priority queues, concurrency control, progress tracking. Supports 10+ concurrent renders (NFR6) | Rendering, publishing, scheduled posts |
| **Error handling** | Centralized error middleware + typed error classes | N/A | AppError base class with HTTP status, error code, user-facing message. Consistent error responses across all endpoints | All API endpoints |
| **API documentation** | swagger-jsdoc + swagger-ui-express | Latest | Auto-generated OpenAPI spec from route annotations, prepares for Public API in Phase 2 | API development, testing |
| **External API resilience** | Unified service wrapper with retry (exponential backoff), circuit breaker, 30s timeout | Custom | Single pattern for all 9 external APIs: Fal.ai, Ayrshare, Stripe, Claude, Gemini, WhisperX, Instagram Graph API, Neon, Cloudflare R2 | All external integrations |

### Auto-Montage v2 Pipeline (Updated 2026-02-15)

| Decision | Choice | Version | Rationale | Affects |
|----------|--------|---------|-----------|---------|
| **Video analysis** | Gemini 2.5 Pro (Google AI) | Latest | Native video understanding (not frame-by-frame). Identifies scenes, narrative thread, energy levels, best takes across multiple rushes. Replaces Claude text-based URL analysis which was blind to actual content | `render.job.ts`, `gemini.service.ts` |
| **Transcription** | WhisperX via Fal.ai | Latest | Word-level timestamps with wav2vec2 alignment. Enables cutting at word/silence boundaries (never mid-word). Detects pauses for natural cut points | `render.job.ts`, `fal.service.ts` |
| **Audio energy analysis** | FFmpeg `silencedetect` + `astats` (RMS) | Native | Measures energy per segment to drive adaptive transition selection. No external API cost | `ffmpeg.service.ts` |
| **Transitions** | Adaptive (energy-based automatic selection) | N/A | Low energy → dissolve/fade (0.8–1.2s), Medium → slide (0.3–0.5s), High → hard cut (0s), Topic change → fadeblack (0.4–0.6s). Replaces static per-style transitions | `ffmpeg.service.ts` |
| **Audio/video integrity** | Atomic clip processing (never separate A/V) | N/A | Original voice always preserved with lip sync. Music mixed as background layer at -15dB below voice. No voice replacement or AI dubbing | `ffmpeg.service.ts`, `render.job.ts` |
| **Audio normalization** | FFmpeg loudnorm -14 LUFS | Native | Broadcast/streaming standard (Spotify, YouTube). Consistent volume across clips | `ffmpeg.service.ts` |
| **Render quality** | H.264 High Profile, CRF 18, AAC 192kbps | Native | Near-lossless video + broadcast audio quality. Native framerate preserved (no judder) | `ffmpeg.service.ts` |
| **Rush cleanup** | Delete raw clips from R2 after successful render | N/A | Eliminates unbounded storage growth. Raw clips not accessible in UI post-render. `mediaUrls` kept in DB for audit. Cleanup job for orphans > 24h | `render.job.ts`, `cleanup.job.ts` |
| **Copy generation** | Claude Haiku 4.5 (captions, hashtags, hooks) | Latest | Remains on Claude — text generation is Claude's strength. Receives Whisper transcript as context for better captions | `claude.service.ts` |

**Auto-Montage v2 Pipeline Flow:**
```
STEP 1 — PARALLEL EXTRACTION (per clip):
  ├─ WhisperX (Fal.ai): transcription + word timestamps
  ├─ FFmpeg silencedetect: pause/silence points
  └─ FFmpeg astats: RMS energy per second

STEP 2 — NARRATIVE ANALYSIS (Gemini 2.5 Pro):
  Input: raw video files + transcriptions + energy data
  Output:
  ├─ Narrative thread identified across all rushes
  ├─ Best take selected per segment/question
  ├─ Logical ordering of segments
  ├─ Moments to cut (hesitations, false starts, retakes)
  └─ Energy classification per segment (calm/medium/intense)

STEP 3 — INTELLIGENT TIMELINE:
  ├─ Align cuts to silence/word boundaries (WhisperX)
  ├─ Select transition type by RMS energy at cut point
  └─ Assemble final timeline with adaptive transitions

STEP 4 — PRO RENDER (FFmpeg):
  ├─ Original audio PRESERVED (atomic clip units)
  ├─ Adaptive transitions (xfade by energy level)
  ├─ Audio normalization (loudnorm -14 LUFS)
  ├─ Background music at -15dB below voice level
  ├─ H.264 High Profile, CRF 18, native framerate
  └─ AAC 192kbps stereo

STEP 5 — FINALIZATION:
  ├─ Upload rendered video → R2
  ├─ DELETE raw rush files from R2
  ├─ Generate captions + hashtags (Claude, using transcript)
  └─ Update DB: status = 'draft', generatedMediaUrl set
```

**Cost per Auto-Montage v2:** ~$0.08–0.10/reel (vs $0.05 v1)
- Gemini 2.5 Pro: $0.02–0.05 | WhisperX: $0.01–0.02 | CassetteAI: $0.01 | Claude captions: $0.003 | FFmpeg compute: $0.03
- Margin impact: -1 to -2 points per plan (negligible)

### Frontend Architecture

| Decision | Choice | Version | Rationale | Affects |
|----------|--------|---------|-----------|---------|
| **Server state** | TanStack Query (React Query) | v5 | Automatic caching, background refetching, optimistic updates, loading/error states. Perfect for API-driven SPA | All API data fetching |
| **Client state** | Zustand | Latest | Minimal boilerplate, no providers/context, TypeScript-friendly. For UI-only state (modals, sidebar, editor state) | UI interactions, editor state |
| **Routing** | React Router | v7 | Mature, large ecosystem, excellent TypeScript support, data loading patterns | Page structure, navigation |
| **Forms** | React Hook Form + Zod resolver | Latest | Uncontrolled components (performance), Zod schemas shared with backend validation | All forms (auth, content creation, settings) |
| **Video preview** | Remotion Player | Latest | React-native video preview, real-time scene assembly preview in browser | Auto-montage preview, Scene Assembler |
| **Icons** | Lucide React (included with shadcn/ui) | Latest | Tree-shakeable, consistent with shadcn/ui design language | All UI icons |
| **Date handling** | date-fns | Latest | Lightweight, tree-shakeable, locale support (French). For calendar, scheduling | Calendar, scheduling features |

### Infrastructure & Deployment

| Decision | Choice | Version | Rationale | Affects |
|----------|--------|---------|-----------|---------|
| **Frontend hosting** | Vercel | Latest | Git-integrated deploy, global CDN, preview deployments per PR, free tier generous | Frontend deployment |
| **Backend hosting** | Railway | Latest | Docker support, persistent workers for long jobs (Remotion 3min renders), EU region, no cold starts, built-in Redis addon | Backend + workers deployment |
| **Redis hosting** | Railway Redis addon | Latest | Co-located with backend on Railway, managed, no separate provider needed | BullMQ job queue |
| **CI/CD** | GitHub Actions | Latest | Lint → Test → Build → Deploy pipeline, free for private repos, matrix testing | Automated quality gates |
| **Error monitoring** | Sentry | Latest | Frontend + backend error tracking, source maps, performance monitoring, generous free tier | Error detection, debugging |
| **Uptime monitoring** | Better Uptime (or UptimeRobot) | Latest | External uptime checks, status page, alerts on downtime | 99.5% uptime SLA (NFR20) |
| **Logging** | Pino | Latest | Fastest Node.js logger, JSON structured output, Railway-compatible log drain | Debugging, audit trail |
| **Environment config** | dotenv + per-environment .env files | Latest | .env.development, .env.production, .env.test. Secrets in Railway/Vercel env vars, never in repo | Configuration management |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project initialization (monorepo structure, TypeScript config, ESLint/Prettier)
2. Database schema + Drizzle ORM setup + Neon connection
3. Auth (Passport.js + cookies + CSRF)
4. Core API routes (REST + Zod validation + error middleware)
5. BullMQ + Redis setup (job queue infrastructure)
6. Cloudflare R2 integration (file uploads)
7. Frontend shell (React Router + TanStack Query + Zustand + shadcn/ui)
8. Feature implementation following epic priority

**Cross-Component Dependencies:**
- Zod schemas in `packages/shared` → consumed by both frontend forms and backend validation
- BullMQ workers share database access with API server → same Drizzle schema
- TanStack Query cache keys must align with REST endpoint naming conventions
- Sentry must be initialized in both frontend (Vercel) and backend (Railway)
- Cloudflare R2 presigned URLs generated by backend, consumed by frontend for direct upload

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 25+ areas where AI agents could make different choices, organized into 5 categories below.

### Naming Patterns

**Database Naming Conventions (Drizzle + PostgreSQL):**
- Tables: `snake_case`, plural → `users`, `content_items`, `publish_jobs`, `quota_usage`
- Columns: `snake_case` → `user_id`, `created_at`, `subscription_tier`, `publish_status`
- Foreign keys: `{singular_table}_id` → `user_id`, `content_item_id`
- Indexes: `idx_{table}_{columns}` → `idx_users_email`, `idx_content_items_user_id_status`
- Enums: `snake_case` → `content_type`, `publish_status`, `subscription_tier`

**API Naming Conventions (REST):**
- Endpoints: `kebab-case`, plural → `/api/content-items`, `/api/publish-jobs`
- Route params: `:id` format → `/api/content-items/:id`
- Query params: `camelCase` → `?pageSize=20&sortBy=createdAt`
- JSON request/response bodies: `camelCase` → `{ userId, contentType, publishAt }`
- API prefix: all routes under `/api/` namespace

**Code Naming Conventions (TypeScript):**
- Component files: `PascalCase.tsx` → `ContentCard.tsx`, `AutoMontageEditor.tsx`
- Utility/service files: `camelCase.ts` → `apiClient.ts`, `quotaHelpers.ts`
- Functions/variables: `camelCase` → `getUserQuota()`, `isPublished`
- Types/Interfaces: `PascalCase`, no `I` prefix → `ContentItem`, `PublishJob`, `UserQuota`
- Constants: `UPPER_SNAKE_CASE` → `MAX_UPLOAD_SIZE`, `API_BASE_URL`
- Zod schemas: `camelCase` + `Schema` suffix → `createContentSchema`, `loginSchema`
- Hooks: `use` prefix + `PascalCase` → `useContentItems`, `useQuotaStatus`

### Structure Patterns

**Project Organization (Feature-based / Domain-driven):**

```
apps/web/src/
├── features/
│   ├── auth/              # Login, register, OAuth connection
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── index.ts
│   ├── dashboard/         # Main dashboard, quick-create
│   ├── content/           # Auto-montage, carousel, post creation/editing
│   ├── calendar/          # Scheduling, calendar views
│   ├── publishing/        # Publish flows, status, error recovery
│   ├── billing/           # Subscription, plans, invoices
│   └── admin/             # Admin panel (metrics, users, errors)
├── components/ui/         # shadcn/ui shared components
├── hooks/                 # Shared custom hooks (useMediaQuery, useDebounce)
├── lib/                   # Utilities (apiClient, cn, formatters)
└── stores/                # Zustand stores (useAuthStore, useEditorStore)

apps/api/src/
├── features/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.test.ts
│   ├── content/
│   ├── publishing/
│   ├── billing/
│   └── admin/
├── jobs/                  # BullMQ job processors
│   ├── render.job.ts
│   ├── publish.job.ts
│   └── schedule.job.ts
├── middleware/            # auth, validate, errorHandler, rateLimiter
├── services/              # External API wrappers
│   ├── fal.service.ts
│   ├── ayrshare.service.ts
│   ├── stripe.service.ts
│   └── claude.service.ts
├── db/                    # Drizzle schema, migrations, connection
│   ├── schema/
│   ├── migrations/
│   └── index.ts
└── lib/                   # Shared utilities (encryption, logger, errors)

packages/shared/src/
├── schemas/               # Zod validation schemas (shared front/back)
├── types/                 # TypeScript type definitions
├── constants/             # Shared constants (quota limits, error codes)
└── index.ts
```

**File Structure Rules:**
- Tests co-located: `ContentCard.test.tsx` next to `ContentCard.tsx`
- Each backend feature follows: `routes.ts` → `controller.ts` → `service.ts` → `test.ts`
- Feature folders export via `index.ts` barrel file
- No circular imports between features — shared code goes to `lib/` or `packages/shared`

### Format Patterns

**API Response Formats:**

Success response:
```json
{ "data": { ... }, "meta": { "page": 1, "totalPages": 5, "totalCount": 42 } }
```

Single item response:
```json
{ "data": { "id": "abc", "title": "My Reel", "status": "published" } }
```

Error response:
```json
{ "error": { "code": "QUOTA_EXCEEDED", "message": "Monthly Reel quota reached", "statusCode": 429 } }
```

**Standardized Error Codes:**
- `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)
- `NOT_FOUND` (404), `CONFLICT` (409), `QUOTA_EXCEEDED` (429)
- `INTERNAL_ERROR` (500), `EXTERNAL_API_ERROR` (502), `SERVICE_UNAVAILABLE` (503)

**Data Exchange Formats:**
- Dates in JSON: ISO 8601 strings → `"2026-02-13T10:30:00Z"`
- Date formatting in UI: `date-fns` with French locale
- Booleans: `true`/`false` (never `1`/`0`)
- Null handling: explicit `null` for absent optional values, omit key for undefined
- IDs: UUID v4 strings (generated by PostgreSQL `gen_random_uuid()`)
- Money/prices: integers in cents → `2900` for €29.00

### Communication Patterns

**BullMQ Job Naming:**
- Queue names: `{domain}` → `render`, `publish`, `schedule`
- Job names: `{domain}:{action}` → `render:auto-montage`, `publish:scheduled`, `publish:retry`
- Job data: always includes `userId` and `contentItemId` for traceability

**Zustand Stores:**
- One store per domain: `useAuthStore`, `useContentStore`, `useEditorStore`, `useUiStore`
- Actions inside the store, not as separate functions
- No derived state in store — use selectors or compute in components

**TanStack Query Keys:**
- Hierarchical arrays: `['content-items', { userId, status }]`, `['quotas', userId]`
- Mutation invalidation: invalidate the parent key array → `['content-items']`
- Stale time: 30s for frequently changing data, 5min for settings/quotas

**Event/Notification Patterns:**
- Toast notifications via `sonner` (shadcn/ui): success, error, loading states
- No custom event bus at MVP — TanStack Query cache invalidation handles data sync

### Process Patterns

**Error Handling (Backend):**
```typescript
// ALWAYS throw AppError, NEVER throw new Error()
throw new AppError('QUOTA_EXCEEDED', 'Monthly Reel quota reached', 429);
// errorHandler middleware catches, logs via Pino, returns formatted JSON response
```

**Error Handling (Frontend):**
- TanStack Query `onError` callbacks for API errors
- Error boundaries per feature (not global) for render crashes
- Toast notification for user-facing errors
- Console.error + Sentry for unexpected errors

**Loading States:**
- TanStack Query manages `isLoading`, `isError`, `data` — no manual loading state
- Skeleton components (shadcn) for initial page loads
- Spinner for in-progress actions (button loading state)
- Progress bar for file uploads and rendering jobs (BullMQ progress events)

**Logging (Backend - Pino):**
```typescript
// ALWAYS: context object first, message string second
logger.info({ userId, action: 'create-reel', contentId }, 'Reel created successfully');
logger.error({ userId, error: err.message, stack: err.stack }, 'Auto-montage render failed');
```
- Levels: `error` (failures), `warn` (degraded), `info` (actions), `debug` (dev only)
- Always include `userId` in context for multi-tenant traceability

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow naming conventions exactly as specified (no deviations)
- Use the feature-based folder structure for all new code
- Wrap all API responses in `{ data }` or `{ error }` format
- Use `AppError` class for all backend errors (never raw `throw new Error`)
- Include `userId` in all database queries for tenant isolation
- Use Zod schemas from `packages/shared` for validation on both sides
- Co-locate tests with source files
- Log with Pino using `{ context }, 'message'` format

**Anti-Patterns to Avoid:**
- Mixing `snake_case` and `camelCase` in JSON API responses
- Putting business logic in controllers (belongs in services)
- Using `any` type in TypeScript (use `unknown` + type narrowing)
- Direct database queries outside of service layer
- Storing secrets in `.env` files committed to git
- Client-side permission checks without server-side enforcement

## Project Structure & Boundaries

### Complete Project Directory Structure

```
publista-v2/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Lint → Test → Build → Deploy
├── .env.example                      # Template des variables d'environnement
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── package.json                      # Workspace root (npm workspaces)
├── tsconfig.base.json                # Config TS partagée
│
├── apps/
│   ├── web/                          # FRONTEND — React SPA
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts            # React + Tailwind v4 plugins
│   │   ├── index.html
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── logo.svg
│   │   └── src/
│   │       ├── main.tsx              # Entry point (React Router, QueryClient, Sentry)
│   │       ├── app.tsx               # Root layout + router setup
│   │       ├── app.css               # Tailwind v4 import + CSS variables
│   │       ├── components/
│   │       │   └── ui/               # shadcn/ui components (button, card, dialog, etc.)
│   │       ├── features/
│   │       │   ├── auth/                        # FR22-FR29
│   │       │   │   ├── components/
│   │       │   │   │   ├── LoginForm.tsx
│   │       │   │   │   ├── RegisterForm.tsx
│   │       │   │   │   ├── OAuthConnectButton.tsx
│   │       │   │   │   └── OnboardingWizard.tsx   # FR27
│   │       │   │   ├── hooks/
│   │       │   │   │   └── useAuth.ts
│   │       │   │   ├── pages/
│   │       │   │   │   ├── LoginPage.tsx
│   │       │   │   │   ├── RegisterPage.tsx
│   │       │   │   │   └── SettingsPage.tsx       # FR25, FR26
│   │       │   │   └── index.ts
│   │       │   ├── dashboard/                   # FR38
│   │       │   │   ├── components/
│   │       │   │   │   ├── QuickCreateButtons.tsx
│   │       │   │   │   ├── RecentContent.tsx
│   │       │   │   │   ├── QuotaWidget.tsx
│   │       │   │   │   └── WeeklyMixIndicator.tsx
│   │       │   │   ├── pages/
│   │       │   │   │   └── DashboardPage.tsx
│   │       │   │   └── index.ts
│   │       │   ├── content/                     # FR1-FR8, FR9-FR13
│   │       │   │   ├── components/
│   │       │   │   │   ├── AutoMontageUploader.tsx  # FR1, FR2
│   │       │   │   │   ├── MontageStyleSelector.tsx # FR2
│   │       │   │   │   ├── FormatSelector.tsx       # FR3
│   │       │   │   │   ├── CarouselBuilder.tsx      # FR4, FR5
│   │       │   │   │   ├── SinglePostCreator.tsx    # FR6
│   │       │   │   │   ├── ContentPreview.tsx       # FR7
│   │       │   │   │   ├── CopyEditor.tsx           # FR8, FR9
│   │       │   │   │   ├── MusicSelector.tsx        # FR10
│   │       │   │   │   ├── ImageGenerator.tsx       # FR11
│   │       │   │   │   └── RenderProgress.tsx
│   │       │   │   ├── hooks/
│   │       │   │   │   ├── useAutoMontage.ts
│   │       │   │   │   ├── useCarousel.ts
│   │       │   │   │   └── useContentItems.ts
│   │       │   │   ├── pages/
│   │       │   │   │   ├── CreateReelPage.tsx
│   │       │   │   │   ├── CreateCarouselPage.tsx
│   │       │   │   │   ├── CreatePostPage.tsx
│   │       │   │   │   └── EditContentPage.tsx
│   │       │   │   └── index.ts
│   │       │   ├── calendar/                    # FR17, FR18, FR19
│   │       │   │   ├── components/
│   │       │   │   │   ├── CalendarGrid.tsx
│   │       │   │   │   ├── ScheduleDialog.tsx
│   │       │   │   │   └── ContentMixIndicator.tsx  # FR19
│   │       │   │   ├── pages/
│   │       │   │   │   └── CalendarPage.tsx
│   │       │   │   └── index.ts
│   │       │   ├── publishing/                  # FR14-FR16, FR20-FR21, FR39-FR42
│   │       │   │   ├── components/
│   │       │   │   │   ├── PlatformConnector.tsx     # FR16
│   │       │   │   │   ├── PublishDialog.tsx         # FR14, FR15
│   │       │   │   │   ├── PublishStatusBadge.tsx    # FR39
│   │       │   │   │   ├── ErrorRecoveryPanel.tsx   # FR40
│   │       │   │   │   └── ContentList.tsx          # FR41, FR42
│   │       │   │   ├── hooks/
│   │       │   │   │   └── usePublishing.ts
│   │       │   │   ├── pages/
│   │       │   │   │   └── ContentLibraryPage.tsx
│   │       │   │   └── index.ts
│   │       │   ├── billing/                     # FR30-FR37
│   │       │   │   ├── components/
│   │       │   │   │   ├── PricingTable.tsx
│   │       │   │   │   ├── SubscriptionCard.tsx
│   │       │   │   │   ├── QuotaUsageBar.tsx        # FR33, FR34
│   │       │   │   │   └── InvoiceList.tsx          # FR32
│   │       │   │   ├── pages/
│   │       │   │   │   ├── PricingPage.tsx
│   │       │   │   │   └── BillingPage.tsx
│   │       │   │   └── index.ts
│   │       │   └── admin/                       # FR43-FR49
│   │       │       ├── components/
│   │       │       │   ├── SystemHealthPanel.tsx     # FR43
│   │       │       │   ├── PublishErrorTable.tsx     # FR44
│   │       │       │   ├── ApiCostDashboard.tsx      # FR45
│   │       │       │   ├── UserManagementTable.tsx   # FR46, FR47
│   │       │       │   └── TokenRefreshPanel.tsx     # FR48
│   │       │       ├── pages/
│   │       │       │   └── AdminPage.tsx
│   │       │       └── index.ts
│   │       ├── hooks/                 # Shared hooks
│   │       │   ├── useMediaQuery.ts
│   │       │   └── useDebounce.ts
│   │       ├── lib/
│   │       │   ├── apiClient.ts       # Axios/fetch wrapper with auth cookies
│   │       │   ├── cn.ts             # shadcn className utility
│   │       │   └── formatters.ts     # date, money, file size formatters
│   │       └── stores/
│   │           ├── useAuthStore.ts
│   │           ├── useEditorStore.ts  # Auto-montage editor state
│   │           └── useUiStore.ts      # Sidebar, modals, toasts
│   │
│   └── api/                           # BACKEND — Express.js
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile                 # Railway deployment
│       └── src/
│           ├── index.ts               # Express app entry point
│           ├── app.ts                 # Express config (middleware, routes, error handler)
│           ├── features/
│           │   ├── auth/
│           │   │   ├── auth.routes.ts       # POST /api/auth/login, /register, /logout, /oauth/:provider
│           │   │   ├── auth.controller.ts
│           │   │   ├── auth.service.ts
│           │   │   └── auth.test.ts
│           │   ├── content/
│           │   │   ├── content.routes.ts     # CRUD /api/content-items, POST /api/content-items/:id/auto-montage
│           │   │   ├── content.controller.ts
│           │   │   ├── content.service.ts
│           │   │   ├── montage.service.ts    # Auto-montage orchestration (FR12, FR13)
│           │   │   └── content.test.ts
│           │   ├── publishing/
│           │   │   ├── publishing.routes.ts  # POST /api/publish, GET /api/publish-jobs
│           │   │   ├── publishing.controller.ts
│           │   │   ├── publishing.service.ts # Ayrshare + Graph API orchestration
│           │   │   └── publishing.test.ts
│           │   ├── billing/
│           │   │   ├── billing.routes.ts     # GET /api/billing/plans, POST /api/billing/checkout
│           │   │   ├── billing.controller.ts
│           │   │   ├── billing.service.ts
│           │   │   ├── stripe.webhook.ts     # POST /api/webhooks/stripe (FR36)
│           │   │   └── billing.test.ts
│           │   ├── quota/
│           │   │   ├── quota.routes.ts       # GET /api/quotas
│           │   │   ├── quota.controller.ts
│           │   │   ├── quota.service.ts      # Atomic quota check + decrement (FR33-FR35)
│           │   │   └── quota.test.ts
│           │   └── admin/
│           │       ├── admin.routes.ts       # GET /api/admin/health, /users, /errors, /costs
│           │       ├── admin.controller.ts
│           │       ├── admin.service.ts
│           │       └── admin.test.ts
│           ├── jobs/                          # BullMQ job processors
│           │   ├── queues.ts                  # Queue definitions + connection
│           │   ├── render.job.ts              # Auto-montage v2: Gemini + WhisperX + FFmpeg
│           │   ├── publish.job.ts             # Scheduled + immediate publishing
│           │   ├── schedule.job.ts            # Cron-based schedule checker
│           │   ├── cleanup.job.ts             # Periodic orphan rush cleanup (every 6h)
│           │   └── tokenRefresh.job.ts        # Proactive OAuth token refresh (NFR27)
│           ├── services/                      # External API wrappers
│           │   ├── fal.service.ts             # Fal.ai: Flux 2.0, CassetteAI, WhisperX, (future: Kling 3.0)
│           │   ├── gemini.service.ts          # Google AI Gemini 2.5 Pro: video analysis + narrative
│           │   ├── ayrshare.service.ts        # Multi-platform publishing
│           │   ├── stripe.service.ts          # Billing, subscriptions
│           │   ├── claude.service.ts          # AI copy generation (captions, hashtags, hooks)
│           │   ├── instagram.service.ts       # Direct Graph API (free tier)
│           │   └── r2.service.ts              # Cloudflare R2 file storage
│           ├── middleware/
│           │   ├── auth.middleware.ts          # Cookie/session verification
│           │   ├── validate.middleware.ts      # Zod schema validation
│           │   ├── rateLimiter.middleware.ts   # express-rate-limit config
│           │   ├── errorHandler.middleware.ts  # AppError → JSON response
│           │   └── adminOnly.middleware.ts     # Admin role check
│           ├── db/
│           │   ├── index.ts                   # Drizzle client + Neon connection
│           │   ├── schema/
│           │   │   ├── users.ts
│           │   │   ├── contentItems.ts
│           │   │   ├── publishJobs.ts
│           │   │   ├── platformConnections.ts
│           │   │   ├── subscriptions.ts
│           │   │   ├── quotaUsage.ts
│           │   │   ├── apiCostLogs.ts
│           │   │   ├── auditLogs.ts
│           │   │   └── index.ts               # Re-export all schemas
│           │   └── migrations/                # Drizzle Kit generated
│           └── lib/
│               ├── errors.ts                  # AppError class + error codes
│               ├── logger.ts                  # Pino config
│               ├── encryption.ts              # AES-256-GCM for OAuth tokens
│               ├── resilience.ts              # Retry, circuit breaker, timeout wrapper
│               └── costTracker.ts             # Per-user API cost logging
│
└── packages/
    └── shared/                        # SHARED — Types, schemas, constants
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── schemas/
            │   ├── auth.schema.ts             # loginSchema, registerSchema
            │   ├── content.schema.ts          # createContentSchema, updateContentSchema
            │   ├── publishing.schema.ts       # publishSchema, scheduleSchema
            │   └── billing.schema.ts          # checkoutSchema
            ├── types/
            │   ├── user.types.ts
            │   ├── content.types.ts
            │   ├── publishing.types.ts
            │   ├── billing.types.ts
            │   └── api.types.ts               # ApiResponse<T>, ApiError, PaginatedResponse<T>
            ├── constants/
            │   ├── quotaLimits.ts             # Per-tier quota definitions
            │   ├── errorCodes.ts              # QUOTA_EXCEEDED, UNAUTHORIZED, etc.
            │   ├── contentTypes.ts            # Reel, Carousel, Post enums
            │   └── platforms.ts               # Instagram, YouTube, TikTok, etc.
            └── index.ts
```

### Architectural Boundaries

**API Boundaries:**
- Frontend → Backend: REST via `apiClient.ts` with HTTP-only cookies. All routes under `/api/`
- Backend → External APIs: Via `services/` wrappers with `resilience.ts` (retry + circuit breaker + 30s timeout)
- Stripe → Backend: Webhooks POST `/api/webhooks/stripe` (idempotent processing)
- Frontend never calls external APIs directly — all proxied through backend for security

**Component Boundaries:**
- Frontend features are self-contained: each has components/, hooks/, pages/
- Cross-feature communication only via Zustand stores or TanStack Query cache
- shadcn/ui components in `components/ui/` are the only shared UI primitives
- No feature imports another feature's internal components

**Service Boundaries (Backend):**
- Controllers handle HTTP request/response only — no business logic
- Services contain all business logic and database access
- External API wrappers (`services/`) are the only code that calls third-party APIs
- Jobs access services, never controllers or routes directly

**Data Boundaries:**
- All database access through Drizzle ORM in service layer
- Every query includes `user_id` filter for tenant isolation
- Schema definitions in `db/schema/`, shared types in `packages/shared/types/`
- Zod validation schemas in `packages/shared/schemas/` consumed by both frontend and backend

### Requirements to Structure Mapping

| FR Domain | Frontend | Backend | Shared | Jobs |
|-----------|----------|---------|--------|------|
| FR1-FR8 Content Creation | `features/content/` | `features/content/` | `content.schema.ts`, `content.types.ts` | `render.job.ts` |
| FR9-FR13 AI Generation | `features/content/` | `features/content/montage.service.ts` + `services/fal,claude` | — | `render.job.ts` |
| FR14-FR21 Publishing | `features/publishing/` | `features/publishing/` | `publishing.schema.ts` | `publish.job.ts`, `schedule.job.ts` |
| FR22-FR29 User Management | `features/auth/` | `features/auth/` | `auth.schema.ts`, `user.types.ts` | — |
| FR30-FR37 Billing | `features/billing/` | `features/billing/` | `billing.schema.ts`, `billing.types.ts` | — |
| FR38-FR42 Content Management | `features/dashboard/` + `features/publishing/` | `features/content/` | — | — |
| FR43-FR49 Administration | `features/admin/` | `features/admin/` | — | `tokenRefresh.job.ts` |
| FR50-FR51 Watermark | `features/content/` (preview) | `render.job.ts` | `constants/` | `render.job.ts` |

### Integration Points

**Internal Communication:**
- Frontend → Backend: REST API calls via `apiClient.ts` (TanStack Query manages caching/refetching)
- BullMQ jobs → Services: Jobs import and call service methods for business logic
- Quota checks: `quota.service.ts` called by content and publishing controllers before any creation/publish action

**External Integrations:**
| Service | Backend File | Endpoints Called | Auth |
|---------|-------------|-----------------|------|
| Fal.ai (Flux 2.0, CassetteAI, WhisperX) | `fal.service.ts` | Image gen, music gen, transcription | API key (server env) |
| Google AI (Gemini 2.5 Pro) | `gemini.service.ts` | Video analysis, narrative understanding | API key (server env) |
| Ayrshare | `ayrshare.service.ts` | Multi-platform publish | API key (server env) |
| Stripe | `stripe.service.ts` + `stripe.webhook.ts` | Checkout, subscriptions, webhooks | API key + webhook secret |
| Claude (Anthropic) | `claude.service.ts` | Text generation (captions, hashtags, copy) | API key (server env) |
| Instagram Graph API | `instagram.service.ts` | Free tier publishing | User OAuth token (encrypted in DB) |
| Cloudflare R2 | `r2.service.ts` | File upload/download, presigned URLs | API key (server env) |

**Data Flow — Auto-Montage v2 (most complex pipeline):**
```
Frontend                    Backend                        External
─────────                   ───────                        ────────
Upload clips ──────────→ POST /api/content-items
                           → r2.service (upload to R2)
                           → quota.service (check + decrement)
                           → content.service (create DB record)
                           → BullMQ: render queue

                         render.job.ts picks up:

                         STEP 1 — Parallel extraction (per clip):
                           → fal.service (WhisperX transcribe) → Fal.ai WhisperX
                           → ffmpeg.service (silencedetect)    → local FFmpeg
                           → ffmpeg.service (astats RMS)       → local FFmpeg

                         STEP 2 — Narrative analysis:
                           → gemini.service (analyze videos     → Google AI Gemini
                              + transcripts + energy data)         2.5 Pro

                         STEP 3 — Timeline + music:
                           → Build intelligent timeline
                              (cuts at word/silence boundaries,
                               adaptive transitions by energy)
                           → fal.service (generate music)      → Fal.ai CassetteAI

                         STEP 4 — Pro render:
                           → ffmpeg.service (compose video)    → local FFmpeg
                              (atomic A/V, adaptive xfade,
                               loudnorm -14 LUFS, music -15dB,
                               H.264 CRF 18, AAC 192kbps)

                         STEP 5 — Finalization:
                           → r2.service (upload result)        → Cloudflare R2
                           → r2.service (DELETE raw rushes)    → Cloudflare R2
                           → claude.service (captions/hashtags → Anthropic Claude
                              using transcript context)
                           → costTracker (log all API costs)
                           → Update DB status: draft

Poll progress ←────────← GET /api/content-items/:id/status
Preview ←──────────────← Presigned R2 URL

Publish ───────────────→ POST /api/publish
                           → quota.service (check publish quota)
                           → BullMQ: publish queue
                         publish.job.ts picks up:
                           → ayrshare.service (paid)           → Ayrshare API
                           OR instagram.service (free)         → Graph API
                           → costTracker (log costs)
                           → Update DB status: published

                         cleanup.job.ts (periodic, every 6h):
                           → Find orphaned rushes (failed renders > 24h)
                           → r2.service (DELETE orphan files)  → Cloudflare R2
```

### Development Workflow Integration

**Development Server:**
- `npm run dev` at root starts both frontend (Vite dev server, port 5173) and backend (tsx watch, port 3001) concurrently
- Vite proxy config forwards `/api/*` requests to backend during development
- Redis must be running locally (Docker) or via Railway dev environment

**Build Process:**
- Frontend: `vite build` → static files in `apps/web/dist/`
- Backend: `tsup` → compiled JS in `apps/api/dist/`
- Shared: `tsup` → compiled JS in `packages/shared/dist/`

**Deployment:**
- Frontend (`apps/web/`) → Vercel (auto-deploy from `main` branch)
- Backend (`apps/api/`) → Railway (Docker build from Dockerfile)
- Database → Neon (managed, EU region)
- Redis → Railway addon (co-located with backend)
- Files → Cloudflare R2 (S3-compatible, EU region)

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible and well-integrated:
- React 19 + Vite 6 + Tailwind v4 + shadcn/ui → confirmed compatible stack
- Express 5 + Drizzle ORM + Neon PostgreSQL → native Node.js stack, Drizzle supports Neon driver
- BullMQ + Redis (Railway addon) → co-located with backend, minimal latency
- TypeScript shared via npm workspaces → Zod schemas + types in `packages/shared`
- No contradictory decisions detected

**Pattern Consistency:**
- Database `snake_case` → JSON `camelCase` → Component `PascalCase` follows industry standards
- Feature-based structure aligns with 7 FR domains from PRD
- REST + `{ data }` / `{ error }` wrapper is consistent with TanStack Query patterns
- All patterns support the architectural decisions without conflicts

**Structure Alignment:**
- Every FR (1-51) is mapped to a specific directory in both frontend and backend
- Boundaries are well-defined: controllers → services → DB, never shortcuts
- Integration points clearly specified between all components

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 51 FRs (FR1-FR51) are architecturally supported:
- FR1-FR8 Content Creation → `features/content/` front + back + `render.job.ts`
- FR9-FR13 AI Generation → `montage.service.ts` + `gemini.service.ts` (video analysis) + `fal.service.ts` (WhisperX, music) + `claude.service.ts` (copy)
- FR14-FR21 Publishing → `features/publishing/` + `publish.job.ts` + `schedule.job.ts`
- FR22-FR29 User Management → `features/auth/` + Passport.js + GDPR cascade
- FR30-FR37 Billing → `features/billing/` + `stripe.webhook.ts` + `quota.service.ts`
- FR38-FR42 Content Management → `features/dashboard/` + `features/publishing/`
- FR43-FR49 Administration → `features/admin/` + `costTracker.ts` + `auditLogs` schema
- FR50-FR51 Watermark/Virality → `render.job.ts` conditional watermark + `constants/`

**Non-Functional Requirements Coverage:**
All 33 NFRs (NFR1-NFR33) are architecturally addressed:
- Performance (NFR1-7): BullMQ concurrency for 10+ renders, Vite for <2s UI, R2 presigned URLs for <30s uploads
- Security (NFR8-14): AES-256 token encryption, HTTP-only cookies, Zod validation, CORS, tenant isolation
- Scalability (NFR15-19): Neon PostgreSQL vertical scaling, R2 auto-scale storage, BullMQ queue-based rendering
- Reliability (NFR20-24): Better Uptime for 99.5% SLA, `resilience.ts` retry/circuit breaker, idempotent webhooks
- Integration (NFR25-28): Unified resilience wrapper, Stripe idempotency, `tokenRefresh.job.ts`, 30s timeouts
- Privacy (NFR29-33): GDPR cascade delete, data export endpoint, Neon EU region, `auditLogs` schema

### Implementation Readiness Validation ✅

**Decision Completeness:**
- 30+ architectural decisions documented with technology choices and versions
- Implementation patterns comprehensive across 5 categories (naming, structure, format, communication, process)
- Consistency rules clear with concrete examples and anti-patterns
- Enforcement guidelines documented for AI agent compliance

**Structure Completeness:**
- ~80 files and directories explicitly defined in project tree
- All integration points clearly specified with data flow diagrams
- Component boundaries well-defined with clear ownership rules

**Pattern Completeness:**
- All naming conventions specified with examples (DB, API, code)
- Communication patterns fully defined (BullMQ, TanStack Query, Zustand)
- Process patterns complete (error handling, logging, loading states)

### Gap Analysis Results

**Critical Gaps:** None ✅

**Important Gaps (Non-blocking):**
1. **No UX Design specification** — Frontend components are defined but without wireframes. UX Designer agent should be consulted before implementing complex pages (AutoMontageUploader, CarouselBuilder, CalendarGrid)
2. **Database columns not detailed** — Tables are named but exact column definitions will be resolved during Drizzle schema implementation
3. **Remotion rendering configuration** — Architecture mentions Remotion for preview/render but Lambda/CLI config details deferred to first technical spike. Note: Auto-Montage v2 pipeline uses FFmpeg directly for render (Remotion for preview only)

**Nice-to-Have Gaps:**
- No feature flag strategy (not needed at MVP)
- No detailed backup/disaster recovery plan (Neon has automatic backups)
- No E2E testing strategy specified (Playwright recommended if added later)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (51 FRs, 33 NFRs)
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (8 constraints)
- [x] Cross-cutting concerns mapped (8 concerns)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions (30+ decisions)
- [x] Technology stack fully specified (frontend, backend, infra)
- [x] Integration patterns defined (resilience wrapper for 9 APIs including Gemini + WhisperX)
- [x] Performance considerations addressed (BullMQ, caching, R2)

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (feature-based, domain-driven)
- [x] Communication patterns specified (BullMQ, TanStack Query, Zustand)
- [x] Process patterns documented (error handling, logging, loading)

**✅ Project Structure**
- [x] Complete directory structure defined (~80 files)
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete (all 51 FRs)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION ✅

**Confidence Level:** HIGH

**Key Strengths:**
- Coherent, battle-tested technology stack (React + Express + PostgreSQL)
- Pragmatic architecture for solo developer (no over-engineering)
- Excellent financial margins (67-71% without AI Video)
- Hero feature (Auto-Montage v2) costs ~$0.08–0.10/Reel — nearly free to deliver with pro-quality output
- Clear patterns and enforcement rules for AI agent consistency
- Complete FR-to-structure mapping ensures no requirements are missed

**Areas for Future Enhancement:**
- UX Design specification (before frontend implementation)
- E2E testing with Playwright (after MVP)
- Advanced monitoring and alerting (after >200 users)
- WebSocket for real-time notifications (after MVP, polling sufficient initially)
- Redis caching migration from node-cache (after >200 users)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt about a convention, check the Naming Patterns and Enforcement Guidelines sections

**First Implementation Priority:**
1. Initialize monorepo with npm workspaces (`package.json`, `tsconfig.base.json`)
2. Scaffold `apps/web` with `npm create vite@latest -- --template react-ts`
3. Scaffold `apps/api` with Express + TypeScript
4. Set up `packages/shared` with Zod schemas and types
5. Connect Neon PostgreSQL + Drizzle ORM schema
6. Implement auth (Passport.js + HTTP-only cookies)
