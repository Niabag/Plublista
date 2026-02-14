# Story 3.1: AI Image Generation

Status: done

## Story

As a user,
I want to generate images from text prompts and reference images,
so that I can create visual content without photography or design skills.

## Acceptance Criteria

1. **AC1 — Image Generation Endpoint:** Given a user has a content item (carousel or post), when they send a text prompt to `POST /api/content-items/:id/generate-image`, then fal.service calls the Fal.ai Flux 2.0 API to generate an image.

2. **AC2 — R2 Storage:** The generated image is uploaded to Cloudflare R2 under the user's namespace and a presigned URL is returned for preview.

3. **AC3 — Preview UI:** The generated image is displayed as a preview with options to accept, regenerate, or replace.

4. **AC4 — Cost Tracking:** API cost is logged per user via costTracker for every image generation call.

5. **AC5 — Quota Enforcement:** Given the user's AI image quota is exhausted, when they try to generate an image, then a clear message shows "Monthly AI image quota reached" with an upgrade CTA, and generation is blocked (FR35).

6. **AC6 — Quota Decrement:** Quota for AI images is checked and decremented atomically before generation (not after).

7. **AC7 — Frontend Component:** A reusable `ImageGenerator` component provides a prompt input, generate button, loading state, and image preview. It can be embedded in both Carousel Builder and Single Post Creator pages.

## Tasks / Subtasks

- [x] Task 1: Add shared Zod schema for image generation request (AC: 1)
  - [x] Create `imageGenerationSchema` in `packages/shared/src/schemas/content.schema.ts`
  - [x] Export from `packages/shared/src/index.ts`
- [x] Task 2: Add Fal.ai Flux 2.0 image generation function (AC: 1, 4)
  - [x] Add `generateImage()` to `apps/api/src/services/fal.service.ts`
  - [x] Wrap with `withRetry` + `withTimeout` (30s timeout, 2 retries)
  - [x] Track cost via `logCost(userId, 'fal', 'flux-image', costUsd)`
- [x] Task 3: Add quota service for AI image quota (AC: 5, 6)
  - [x] Create `checkAndDecrementQuota()` in `apps/api/src/services/quota.service.ts`
  - [x] Atomic check: read quota_usage, compare to tier limit, decrement if under
  - [x] Throw `QUOTA_EXCEEDED` (429) if quota exhausted
- [x] Task 4: Add image generation endpoint (AC: 1, 2, 4, 5, 6)
  - [x] Add `generateContentImage()` service function in `content.service.ts`
  - [x] Add `generateImageHandler` controller in `content.controller.ts`
  - [x] Add `POST /:id/generate-image` route with validation
  - [x] Flow: ownership check → quota check → fal.ai generate → R2 upload → cost log → return URL
- [x] Task 5: Build ImageGenerator frontend component (AC: 3, 7)
  - [x] Create `ImageGenerator.tsx` with prompt input, generate button, loading spinner
  - [x] Create `useImageGeneration` hook (TanStack Query useMutation)
  - [x] Display generated image preview with accept/regenerate buttons
  - [x] Show quota exceeded message when API returns 429
- [x] Task 6: Write tests (AC: all)
  - [x] Backend: endpoint tests (auth, success, 404, quota exceeded, validation) — 7 tests
  - [x] Frontend: ImageGenerator component tests (render, generate, loading, error, quota) — 12 tests
- [x] Task 7: Verify TypeScript + full test suite pass

## Dev Notes

### Architecture Compliance

**Backend pattern** — follows exact same pattern as existing content endpoints:
- Controller: thin HTTP handler → delegates to service
- Service: ownership check (`userId` + `itemId`), business rules, DB update
- Route: `contentLimiter → requireAuth → csrfSynchronisedProtection → validate(schema) → handler`
- Error: use `AppError` class with codes `NOT_FOUND` (404), `VALIDATION_ERROR` (400), `QUOTA_EXCEEDED` (429), `EXTERNAL_API_ERROR` (502)
- Tenant isolation: ALL queries filter by `userId` — mandatory
- Cost tracking: ALL external API calls must log cost via `costTracker`

**Frontend pattern** — follows existing content feature patterns:
- TanStack Query v5 for server state (`useQuery` / `useMutation`)
- Tailwind CSS v4 + shadcn/ui components
- Toast notifications via `sonner`
- `cn()` utility for conditional classNames
- Co-located tests: `ComponentName.test.tsx`

### Key Implementation Details

**Fal.ai Flux 2.0 Image Generation:**
```typescript
// apps/api/src/services/fal.service.ts — add generateImage()
export async function generateImage(
  userId: string,
  prompt: string,
  referenceImageUrl?: string,
): Promise<{ imageUrl: string }> {
  // 1. ensureConfigured()
  // 2. withRetry(() => withTimeout(async () => {
  //      fal.subscribe('fal-ai/flux/dev', { input: { prompt, image_url: referenceImageUrl } })
  //    }, 30000), { maxRetries: 2, backoffMs: 2000 })
  // 3. logCost(userId, 'fal', 'flux-image', 0.05)
  // 4. Return { imageUrl: response.data.images[0].url }
}
```

**Image Generation Request Schema:**
```typescript
// packages/shared/src/schemas/content.schema.ts
export const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  referenceImageKey: z.string().max(500).optional(),
});
```

**Quota Service Pattern:**
```typescript
// apps/api/src/services/quota.service.ts
export async function checkAndDecrementQuota(
  userId: string,
  resource: 'ai_images',
  amount: number,
): Promise<void> {
  // 1. Get user's subscription tier
  // 2. Get current usage from quota_usage table
  // 3. Compare against tier limits:
  //    - free: 10 AI images/month
  //    - starter: 50, pro: 200, business: 500, agency: 1500
  // 4. If over quota: throw AppError('QUOTA_EXCEEDED', 'Monthly AI image quota reached', 429)
  // 5. Increment usage atomically
}
```

**Content Service — generateImage():**
```typescript
// content.service.ts
export async function generateContentImage(
  userId: string,
  itemId: string,
  data: ImageGenerationInput,
): Promise<{ imageUrl: string }> {
  // 1. getContentItem(userId, itemId) — ownership check + 404
  // 2. checkAndDecrementQuota(userId, 'ai_images', 1) — quota check + 429
  // 3. const result = await generateImage(userId, data.prompt, referenceUrl)
  // 4. Upload generated image to R2 under user namespace
  // 5. Return { imageUrl: presignedUrl }
}
```

**R2 Upload for Generated Images:**
- Download the Fal.ai output URL server-side
- Upload to R2 key: `users/${userId}/generated/${contentItemId}/${uuid}.webp`
- Return presigned download URL for frontend display
- Alternative approach: store the Fal.ai URL directly if persistent (check Fal.ai URL expiry policy)

**Frontend ImageGenerator Component:**
```typescript
// apps/web/src/features/content/components/ImageGenerator.tsx
interface ImageGeneratorProps {
  contentItemId: string;
  onImageGenerated: (imageUrl: string) => void;
  disabled?: boolean;
}
// - Prompt textarea with character counter (max 1000)
// - "Generate" button with loading spinner
// - Generated image preview with <img> tag
// - "Regenerate" and "Accept" buttons after generation
// - Quota exceeded message when 429 returned
```

### Quota Tier Limits (from PRD)

| Tier | AI Images/Month |
|------|-----------------|
| Free | 10 |
| Starter | 50 |
| Pro | 200 |
| Business | 500 |
| Agency | 1,500 |

### Existing Code to Reuse

| What | Location | How |
|------|----------|-----|
| Fal.ai service | `apps/api/src/services/fal.service.ts` | Add `generateImage()` alongside existing `generateMusic()` |
| Resilience wrappers | `apps/api/src/lib/resilience.ts` | `withRetry()` + `withTimeout()` |
| Cost tracker | `apps/api/src/services/costTracker.ts` | `logCost()` function |
| R2 service | `apps/api/src/services/r2.service.ts` | `generatePresignedUploadUrl()`, `generatePresignedDownloadUrl()` |
| Content service | `apps/api/src/features/content/content.service.ts` | `getContentItem()` for ownership check |
| Content routes | `apps/api/src/features/content/content.routes.ts` | Add POST route for generate-image |
| Content controller | `apps/api/src/features/content/content.controller.ts` | Add handler |
| Quota usage table | `apps/api/src/db/schema/quotaUsage.ts` | Already exists from Story 2.1 |
| apiClient | `apps/web/src/lib/apiClient.ts` | `apiPost` for API calls |
| Button component | `apps/web/src/components/ui/button.tsx` | Action buttons |
| Toast | `sonner` | Error/success toasts |

### DB Schema Notes

**Existing `quota_usage` table** (from Story 2.1):
- Tracks per-user resource usage per month
- Must add `ai_images` resource type support
- Check if the resource type enum/column needs updating

**Existing `api_cost_logs` table** (from Story 2.4):
- Already handles cost logging
- Just needs correct provider/model string for Fal.ai image generation

**`content_items.mediaUrls`** (jsonb):
- Already stores array of image/video URLs
- Generated images can be appended to this array
- No schema migration needed

### Project Structure Notes

New files to create:
```
apps/api/src/services/quota.service.ts                     (NEW)
apps/web/src/features/content/components/ImageGenerator.tsx (NEW)
apps/web/src/features/content/components/ImageGenerator.test.tsx (NEW)
apps/web/src/features/content/hooks/useImageGeneration.ts   (NEW)
```

Files to modify:
```
packages/shared/src/schemas/content.schema.ts              (EDIT — add imageGenerationSchema)
packages/shared/src/index.ts                               (EDIT — add export)
apps/api/src/services/fal.service.ts                       (EDIT — add generateImage)
apps/api/src/features/content/content.service.ts           (EDIT — add generateContentImage)
apps/api/src/features/content/content.controller.ts        (EDIT — add generateImage handler)
apps/api/src/features/content/content.routes.ts            (EDIT — add POST route)
apps/api/src/features/content/content.test.ts              (EDIT — add tests)
```

### Previous Story Learnings (from Epic 2)

- Always run `npm run build` in `packages/shared` after adding new exports
- Use `vi.hoisted()` for mock constants in `vi.mock` factories
- Place `POST /:id/action` routes BEFORE `GET /:id` in Express
- Use `Partial<typeof table.$inferInsert>` for typed Drizzle updates
- `@fal-ai/client` is the correct package (not deprecated `@fal-ai/serverless-client`)
- Zod schemas with all-optional fields need `.refine()` to reject empty bodies
- `useState(prop)` needs `useEffect` sync for external prop changes
- Mock `express-rate-limit` with named import `{ rateLimit }`

### Fal.ai Flux 2.0 Integration Notes

- The existing `fal.service.ts` already has `ensureConfigured()` pattern with `FAL_AI_API_KEY`
- The existing music generation uses `fal.subscribe()` — image generation should follow the same pattern
- Flux 2.0 model ID: `'fal-ai/flux/dev'` (or `'fal-ai/flux-pro/v1.1'` for production quality)
- Cost: ~$0.05 per image generation (verify current pricing)
- Image output is typically a URL that may expire — download and re-upload to R2 for persistence

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3, Story 3.1, lines 621-656]
- [Source: _bmad-output/planning-artifacts/architecture.md — API patterns, external service integration]
- [Source: _bmad-output/planning-artifacts/prd.md — FR11 (AI Image Generation), FR33-35 (Quotas)]
- [Source: apps/api/src/services/fal.service.ts — existing Fal.ai integration pattern]
- [Source: apps/api/src/services/costTracker.ts — cost logging pattern]
- [Source: apps/api/src/lib/resilience.ts — retry/timeout wrappers]
- [Source: apps/api/src/db/schema/quotaUsage.ts — quota tracking table]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript error: `fal.subscribe('fal-ai/flux/dev', { input })` requires typed `FluxDevInput` — fixed by passing `{ prompt }` directly
- Test auth failures: `mockReturnValueOnce` stale after `getAuthenticatedAgent()` — fixed by using `mockReset()` before setting up mocks
- Adversarial review: 17 findings (5H, 5M, 7L) — all fixed. Key fixes: atomic quota with SQL WHERE guard, SSRF protections (URL scheme validation, removed referenceImageKey), response.ok check, 20MB size limit, quota rollback on failure, runtime tier validation

### Completion Notes List

- `imageGenerationSchema` added to shared package with prompt (1-1000 chars), `.trim()` for whitespace-only protection
- `generateImage()` in fal.service.ts uses Flux dev model with 30s timeout, 2 retries, $0.05/image cost logging
- `checkAndDecrementQuota()` — atomic SQL WHERE guard prevents TOCTOU race, `onConflictDoNothing` for INSERT races, retry pattern
- `restoreQuota()` — rolls back quota on downstream failure using `GREATEST(used - amount, 0)`
- `generateContentImage()` service: ownership check → quota → fal.ai → URL scheme validation → fetch with response.ok check → 20MB size limit → R2 upload → persist generatedMediaUrl → presigned URL. Quota rollback in catch block
- `uploadBuffer()` and `buildGeneratedImageKey()` added to r2.service.ts for server-side image upload
- `ImageGenerator.tsx` component: prompt textarea with counter, loading spinner, image preview, accept/regenerate/quota exceeded
- `useImageGeneration` hook wraps useMutation for POST /api/content-items/:id/generate-image
- `imageGenerateLimiter` rate limiter: 10 req/15min for image generation endpoint
- `getValidatedTier()` — runtime subscription tier validation, `PLATFORM_LIMITS` per tier
- API tests: 7 new tests (auth, success, 404, quota exceeded, validation x3)
- Frontend tests: 13 new tests (render, counter, disabled states, API call, loading, preview, accept, quota, error toast, regenerate, max length)
- All TypeScript 0 errors, API 114 tests pass, Web 144 tests pass

### File List

New files:
- `apps/api/src/services/quota.service.ts`
- `apps/web/src/features/content/components/ImageGenerator.tsx`
- `apps/web/src/features/content/components/ImageGenerator.test.tsx`
- `apps/web/src/features/content/hooks/useImageGeneration.ts`

Modified files:
- `packages/shared/src/schemas/content.schema.ts` — added `imageGenerationSchema`
- `packages/shared/src/index.ts` — exported new schema + type
- `apps/api/src/services/fal.service.ts` — added `generateImage()` function
- `apps/api/src/services/r2.service.ts` — added `uploadBuffer()`, `buildGeneratedImageKey()`
- `apps/api/src/features/content/content.service.ts` — added `generateContentImage()`
- `apps/api/src/features/content/content.controller.ts` — added `generateImageHandler`
- `apps/api/src/features/content/content.routes.ts` — added `POST /:id/generate-image` route
- `apps/api/src/features/content/content.test.ts` — added 7 generate-image tests
