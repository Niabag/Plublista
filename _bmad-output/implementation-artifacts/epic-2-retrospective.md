# Epic 2 Retrospective: Content Creation — Auto-Montage & AI Generation

Status: done
Date: 2026-02-13

## Summary

Epic 2 delivered the full Auto-Montage content creation pipeline across 7 stories: from file upload through AI-powered rendering, copy generation, and content preview with inline text editing.

**Final metrics:**
- 7 stories completed (2.1–2.7)
- ~66 new files, ~23 modified files
- API: 13 test files, 107 tests passing
- Web: 20 test files, 131 tests passing
- 0 TypeScript errors across both apps

## What Went Well

1. **Consistent architecture patterns** — Every backend endpoint follows the same controller → service → DB pattern with `rateLimiter → requireAuth → csrfSynchronisedProtection → validate(schema) → handler` middleware chain. This made each new endpoint predictable and fast to implement.

2. **Shared Zod schemas** — Validating at both frontend and backend via `@plublista/shared` caught issues early and kept types in sync. The `tsup` build step is an extra step but worth it.

3. **Graceful degradation in the render pipeline** — The Claude API failure → continue without copy decision (Story 2.6) is architecturally sound and prevents a secondary AI service from blocking the primary rendering flow.

4. **TanStack Query v5 patterns** — Polling with `refetchInterval`, auto-invalidation via `useMutation.onSuccess`, and query key conventions worked cleanly and reduced manual state management.

5. **Adversarial code reviews** — Running code reviews after each story caught real bugs: stale closures (2.2, 2.3), missing input sanitization (2.6, 2.7), missing state sync on prop changes (2.7), and untested code paths (2.7).

6. **Test coverage** — From 0 tests at the start of Epic 2 to 238 tests at the end. Every endpoint, component, and hook has baseline test coverage.

## What Didn't Go Well

1. **Shared package rebuild friction** — Every time a new export is added to `@plublista/shared`, a manual `npm run build` is required before the API or web app can see it. This caused multiple "Module has no exported member" TypeScript errors during development.

2. **Vitest mock hoisting surprises** — `vi.mock` factories are hoisted before `const` declarations. This caused `Cannot access before initialization` errors in content.test.ts and render.job.test.ts. The fix (`vi.hoisted()`) is non-obvious and was encountered twice.

3. **Stories 2.1 and 2.4 left in "review" status** — These were never formally moved to "done" even though their code was integrated and subsequent stories built on them successfully. Status tracking drifted.

4. **`Record<string, unknown>` type escape hatch** — The initial `updateContentText` implementation used an untyped record, losing Drizzle column validation. Caught in review but should have been typed correctly from the start.

5. **Express 5 `req.params` typing** — Express 5 types `params` as `string | string[]`, requiring `as string` casts throughout. This is a persistent friction point that adds visual noise.

## Key Learnings

| # | Learning | First Encountered |
|---|----------|-------------------|
| 1 | Always run `npm run build` in `packages/shared` after adding new exports | Story 2.4 |
| 2 | Use `vi.hoisted()` for mock constants shared between test bodies and `vi.mock` factories | Story 2.6 |
| 3 | `hashtags` column is `notNull()` with `default([])` — never set to `null`, use `[]` | Story 2.6 |
| 4 | `useState(prop)` only reads the prop on mount; add `useEffect` to sync on prop changes | Story 2.7 |
| 5 | Place `POST /:id/action` routes BEFORE `GET /:id` to avoid Express treating "action" as an ID param | Story 2.6 |
| 6 | Use `Partial<typeof table.$inferInsert>` instead of `Record<string, unknown>` for Drizzle updates | Story 2.7 |
| 7 | Mock `express-rate-limit` with named import `{ rateLimit }`, not default import | Story 2.1 |
| 8 | `@fal-ai/client` replaced deprecated `@fal-ai/serverless-client` | Story 2.4 |
| 9 | Hashtags for social platforms should be sanitized to `\w` (alphanumeric + underscore) | Story 2.7 |
| 10 | Zod schemas with all-optional fields need `.refine()` to reject empty bodies | Story 2.7 |

## Architecture Decisions Made

1. **Presigned URL uploads** (2.1) — Client uploads directly to R2 via presigned URLs. Server never touches file bytes. Correct for cost and latency.

2. **BullMQ + Redis for job queue** (2.4) — Render jobs are async, retryable, and observable. BullMQ's built-in retry with exponential backoff handles transient failures.

3. **Cost tracking per API call** (2.4) — `api_cost_logs` table records every external API call with model, tokens, and cost. Essential for burn rate visibility.

4. **Auto-save on blur, not manual save** (2.7) — Reduces friction for content creators. No "Save" button; changes persist immediately on field blur. Trade-off: more PATCH calls, but each is lightweight.

5. **Client-side progress simulation** (2.5) — Backend doesn't track granular render steps. Client simulates step progression during `generating` status. Acceptable for MVP; real step tracking can be added via BullMQ job progress events later.

## Recommendations for Epic 3+

1. **Add a shared package watch mode** — Set up `tsup --watch` in development to avoid manual rebuild friction.

2. **Create a test utilities file** — The `getAuthenticatedAgent()` pattern is duplicated across API test files. Extract to a shared test helper.

3. **Standardize route path constants** — Route strings like `/create/reel/:id/preview` are hardcoded in router, pages, and tests. Centralize in a `routes.ts` constants file.

4. **Consider optimistic updates** — Currently, mutations invalidate queries and refetch. For text editing fields, optimistic updates via TanStack Query `onMutate` would eliminate UI flicker.

5. **Address remaining "review" stories** — Stories 2.1 and 2.4 should be formally moved to "done" since all downstream stories are complete and tested.
