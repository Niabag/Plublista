# Story 2.1: File Upload & Cloud Storage

Status: review

## Story

As a user,
I want to upload video clips and images to the platform,
so that I can use them to create content.

## Acceptance Criteria

1. **AC1 — File Upload Mechanism:** Users can upload files via a presigned URL flow. The backend generates Cloudflare R2 presigned URLs; the frontend uploads directly to R2. Client-side format validation accepts MP4, MOV, WebM (video) and JPG, PNG, WebP (images). Max file size per tier: 200MB (free), 500MB (starter), 1GB (pro), 5GB (business), 10GB (agency). An upload progress bar shows real-time percentage per file.
2. **AC2 — Cloud Storage & Organization:** Files are stored in Cloudflare R2 with user-namespaced paths: `users/{userId}/uploads/{uuid}-{originalFilename}`. Presigned download URLs are generated for retrieval.
3. **AC3 — Database Schema — content_items Table:** A `content_items` table is created with columns: id (UUID PK), user_id (FK to users, indexed), type (enum: reel/carousel/post), title (varchar, nullable), status (enum: draft/generating/scheduled/published/failed, default draft), style (varchar, nullable), format (varchar, nullable), duration (integer, nullable, ms), media_urls (jsonb array), generated_media_url (varchar, nullable), caption (text, nullable), hashtags (jsonb array, default []), hook_text (text, nullable), cta_text (text, nullable), music_url (varchar, nullable), music_prompt (varchar, nullable), created_at (timestamp), updated_at (timestamp).
4. **AC4 — Database Schema — quota_usage Table:** A `quota_usage` table is created with columns: id (UUID PK), user_id (FK to users, unique, indexed), period_start (date), period_end (date), reels_used (integer, default 0), reels_limit (integer), carousels_used (integer, default 0), carousels_limit (integer), ai_images_used (integer, default 0), ai_images_limit (integer), platforms_connected (integer, default 0), platforms_limit (integer). The existing `GET /api/quotas` endpoint is updated to read from this table instead of returning hardcoded zeros.
5. **AC5 — R2 Service Methods:** An R2 service provides: `generatePresignedUploadUrl(userId, filename, contentType)` → returns presigned URL for browser upload; `generatePresignedDownloadUrl(key)` → returns presigned URL for retrieval; `deleteFile(key)` → deletes from R2.

## Tasks / Subtasks

- [x]Task 1: Install dependencies and configure environment (AC: all)
  - [x]Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` in `apps/api`
  - [x]Add R2 environment variables to `.env.example`: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_ENDPOINT`
  - [x]Add R2 env vars to `.env` (or `.env.development`) with placeholder values for local dev
  - [x]Rebuild shared package if needed after type changes

- [x]Task 2: Create content_items and quota_usage DB schemas + migration (AC: 3, 4)
  - [x]Create `apps/api/src/db/schema/contentItems.ts` with `contentTypeEnum`, `contentStatusEnum`, and `contentItems` table
  - [x]Create `apps/api/src/db/schema/quotaUsage.ts` with `quotaUsage` table (user_id unique constraint)
  - [x]Export new tables from `apps/api/src/db/schema/index.ts`
  - [x]Generate Drizzle migration: `npx drizzle-kit generate` in `apps/api`

- [x]Task 3: Add shared types and validation schemas (AC: 1, 3, 4, 5)
  - [x]Add `ContentType`, `ContentStatus`, `ContentItem` types to `packages/shared/src/types/content.types.ts`
  - [x]Add `QuotaUsage` type to `packages/shared/src/types/quota.types.ts`
  - [x]Create `packages/shared/src/schemas/upload.schema.ts` with `presignedUrlRequestSchema` (fileName, contentType, fileSize)
  - [x]Add new error codes to `packages/shared/src/constants/errorCodes.ts`: `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `STORAGE_QUOTA_EXCEEDED`
  - [x]Add file size limits and allowed formats to `packages/shared/src/constants/uploadLimits.ts`
  - [x]Export all new types/schemas from shared index files
  - [x]Rebuild shared package: `npm run build` in `packages/shared`

- [x]Task 4: Create R2 service (AC: 2, 5)
  - [x]Create `apps/api/src/services/r2.service.ts`
  - [x]Implement `generatePresignedUploadUrl(userId, filename, contentType)`: generates a key `users/{userId}/uploads/{uuid}-{filename}`, returns `{ presignedUrl, fileKey }`
  - [x]Implement `generatePresignedDownloadUrl(fileKey, expirySeconds?)`: returns presigned GET URL
  - [x]Implement `deleteFile(fileKey)`: deletes object from R2 bucket
  - [x]Use `S3Client` with R2 endpoint + credentials from env vars
  - [x]Presigned URLs expire after 1 hour (3600s)

- [x]Task 5: Create upload API endpoints (AC: 1, 2, 5)
  - [x]Create `apps/api/src/features/upload/upload.service.ts`:
    - `requestPresignedUrl(userId, tier, body)`: validates file type + size against tier limits, calls R2 service, returns presigned URL + fileKey
  - [x]Create `apps/api/src/features/upload/upload.controller.ts`:
    - `getPresignedUrl(req, res, next)`: extracts userId + tier from req.user, calls service, returns `{ data: { presignedUrl, fileKey } }`
  - [x]Create `apps/api/src/features/upload/upload.routes.ts`:
    - `POST /api/upload/presigned-url` with middleware chain: `[uploadLimiter, requireAuth, csrfSynchronisedProtection, validate(presignedUrlRequestSchema), getPresignedUrl]`
  - [x]Register upload routes in `apps/api/src/app.ts`: `app.use('/api/upload', uploadRoutes)`

- [x]Task 6: Create content-items CRUD endpoints (AC: 3)
  - [x]Create `apps/api/src/features/content/content.service.ts`:
    - `createContentItem(userId, data)`: inserts into content_items, returns created item
    - `getContentItem(userId, itemId)`: selects by id + userId (tenant isolation), throws NOT_FOUND if missing
    - `listContentItems(userId)`: selects all by userId, ordered by createdAt desc
    - `deleteContentItem(userId, itemId)`: deletes by id + userId, calls `r2.deleteFile` for each media_url, returns deleted item
  - [x]Create `apps/api/src/features/content/content.controller.ts` with handlers for create, get, list, delete
  - [x]Create `apps/api/src/features/content/content.routes.ts`:
    - `POST /api/content-items` (create)
    - `GET /api/content-items` (list)
    - `GET /api/content-items/:id` (get)
    - `DELETE /api/content-items/:id` (delete)
    - All routes: requireAuth + csrfSynchronisedProtection (for mutations) + contentLimiter
  - [x]Register content routes in `apps/api/src/app.ts`: `app.use('/api/content-items', contentRoutes)`

- [x]Task 7: Update quota system with usage tracking (AC: 4)
  - [x]Create `apps/api/src/features/quota/quotaUsage.service.ts`:
    - `getOrCreateQuotaUsage(userId, tier)`: finds or creates quota_usage record for current billing period
    - `incrementUsage(userId, resource)`: atomically increments usage counter (reels_used, carousels_used, ai_images_used)
    - `checkQuota(userId, resource)`: returns whether user has remaining quota for resource
  - [x]Update `apps/api/src/features/quota/quota.service.ts` and `quota.controller.ts`:
    - `GET /api/quotas` now reads from quota_usage table (real usage) instead of returning hardcoded zeros
  - [x]Update quota tests to account for new DB-backed usage

- [x]Task 8: Create frontend upload hook and basic upload component (AC: 1)
  - [x]Create `apps/web/src/features/upload/hooks/useFileUpload.ts`:
    - `requestPresignedUrl(fileName, contentType, fileSize)`: calls `apiPost('/api/upload/presigned-url', ...)`
    - `uploadToR2(presignedUrl, file, onProgress)`: uploads via XMLHttpRequest with `upload.onprogress` for percentage tracking
    - Returns `{ uploadFile, progress, isUploading, error }`
  - [x]Create `apps/web/src/features/upload/components/FileUploadZone.tsx`:
    - Drag-and-drop zone with dashed border, upload icon
    - Click-to-browse fallback (hidden `<input type="file">`)
    - Accept filter for supported formats (MP4, MOV, WebM, JPG, PNG, WebP)
    - Per-file progress bar during upload
    - Error messages for invalid format, file too large, quota exceeded
    - "Remove" button per uploaded file
  - [x]Create `apps/web/src/features/upload/components/UploadedFileCard.tsx`:
    - Displays filename, file size (human-readable), upload status (uploading/complete/error)
    - Progress bar when uploading

- [x]Task 9: Write backend tests (AC: all)
  - [x]Test R2 service: mock S3Client, verify presigned URL generation, verify delete
  - [x]Test upload endpoint: auth required, CSRF required, validates file type, validates file size against tier, returns presigned URL
  - [x]Test upload endpoint: rejects unsupported file types (returns 400)
  - [x]Test upload endpoint: rejects oversized files for tier (returns 413)
  - [x]Test content-items CRUD: create, get, list, delete with tenant isolation
  - [x]Test content-items: user A cannot access user B's content (returns 404)
  - [x]Test quota_usage: getOrCreateQuotaUsage creates record for new period
  - [x]Test quota_usage: incrementUsage atomically increments counter
  - [x]Test GET /api/quotas returns real usage from quota_usage table
  - [x]Update db.test.ts schema tests for new tables

- [x]Task 10: Write frontend tests (AC: 1)
  - [x]Test FileUploadZone: renders drop zone, accepts valid file types
  - [x]Test FileUploadZone: shows error for invalid file type
  - [x]Test FileUploadZone: shows error for oversized file
  - [x]Test useFileUpload hook: calls presigned URL endpoint, uploads to R2
  - [x]Test UploadedFileCard: displays filename, size, progress bar

- [x]Task 11: Final verification
  - [x]Run `npx tsc --noEmit` in both `apps/api` and `apps/web` — must pass
  - [x]Run `npx vitest run` in `apps/api` — all tests pass
  - [x]Run `npx vitest run` in `apps/web` — all tests pass

## Dev Notes

### Critical Architecture Constraints

- **Cloudflare R2 uses S3-compatible API**: Use `@aws-sdk/client-s3` with R2 endpoint override. R2 does NOT support all S3 features (e.g., no bucket policies, no versioning). Presigned URLs and basic CRUD work fine.
- **Presigned URL flow (NOT multipart upload through backend)**: Backend generates presigned PUT URL → frontend uploads directly to R2 → no backend bandwidth consumed for large files. This is critical for performance.
- **Row-level tenant isolation**: Every query on `content_items` MUST filter by `userId`. Never expose content across users. The `deleteContentItem` service must verify ownership before deleting.
- **Explicit select/returning clauses**: Drizzle ORM does NOT auto-include columns in `.select()` or `.returning()`. When querying content_items or quota_usage, explicitly list all columns needed. (Learned from Story 1.8)
- **CSRF token rotation**: After POST requests, CSRF tokens rotate. Backend tests must re-fetch CSRF tokens between POST calls. (Learned from Story 1.8)
- **Existing quota system must be preserved**: `GET /api/quotas` currently returns tier-based limits with `used: 0`. Update it to read from `quota_usage` table for real usage while keeping the same response shape `{ tier, quotas: [...], period: {...} }`.
- **No video processing in this story**: File upload stores raw files only. Video rendering/processing is Story 2.4 (BullMQ + FFmpeg + Remotion). Content items start with `status: 'draft'`.

### Established Patterns from Previous Stories

- **Controller pattern**: `async function handler(req, res, next) { try { ... } catch (err) { next(err); } }`. Extract userId: `(req.user as { id: string }).id`. Extract tier: `(req.user as { subscriptionTier: string }).subscriptionTier`.
- **Service pattern**: Business logic functions. Drizzle ORM queries. Throw `AppError(code, message, statusCode)` for errors. Return typed data.
- **Route middleware chain**: `rateLimiter → requireAuth → csrfSynchronisedProtection → validate(schema) → controller`.
- **API response format**: Success: `{ data: {...} }`. Error: `{ error: { code, message, statusCode, details? } }`.
- **Zod validation**: Schemas in `packages/shared/src/schemas/`. Types inferred with `z.infer<typeof schema>`. Validated via `validate(schema)` middleware.
- **Error codes**: Defined in `packages/shared/src/constants/errorCodes.ts` as `ERROR_CODES` object. Type: `ErrorCode`.
- **Frontend API client**: `apiGet`, `apiPost`, `apiPut`, `apiDelete` from `@/lib/apiClient`. Auto-handles CSRF tokens + retry on 403.
- **Frontend hooks**: TanStack Query for server state. Manual `isLoading`/`error` state. Cache updates via `queryClient.setQueryData(key, data)`.
- **Test pattern (backend)**: Vitest + Supertest. Mock DB: `vi.mock('../../db/index')`. Agent sessions for auth. CSRF re-fetch after POST.
- **Test pattern (frontend)**: Vitest + React Testing Library. Mock `@/lib/apiClient` with `vi.mock`. Wrap in `QueryClientProvider` + `MemoryRouter`.
- **Shared package rebuild**: After modifying `packages/shared/src/`, run `npm run build` in `packages/shared`.
- **Migration generation**: Run `npx drizzle-kit generate` in `apps/api` after schema changes.

### R2 Service Implementation Guide

```typescript
// apps/api/src/services/r2.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
```

- Use `PutObjectCommand` for presigned upload URLs
- Use `GetObjectCommand` for presigned download URLs
- Use `DeleteObjectCommand` for file deletion
- File key pattern: `users/${userId}/uploads/${crypto.randomUUID()}-${sanitizedFilename}`
- Sanitize filenames: remove special chars, limit length, prevent path traversal

### Upload Validation Rules

| Tier | Max File Size | Reels/mo | Carousels/mo | AI Images/mo |
|------|--------------|----------|--------------|--------------|
| free | 200MB | 3 | 3 | 5 |
| starter | 500MB | 15 | 15 | 25 |
| pro | 1GB | 50 | 50 | 100 |
| business | 5GB | 200 | 200 | 500 |
| agency | 10GB | unlimited | unlimited | unlimited |

Allowed MIME types:
- Video: `video/mp4`, `video/quicktime` (MOV), `video/webm`
- Image: `image/jpeg`, `image/png`, `image/webp`

### Frontend Upload with Progress

Use `XMLHttpRequest` (not `fetch`) for upload progress tracking:
```typescript
function uploadToR2(presignedUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

### File Structure

```
apps/api/src/
├── services/
│   └── r2.service.ts              # NEW: Cloudflare R2 wrapper
├── features/
│   ├── upload/
│   │   ├── upload.routes.ts       # NEW: POST /api/upload/presigned-url
│   │   ├── upload.controller.ts   # NEW
│   │   └── upload.service.ts      # NEW: validates + generates presigned URL
│   ├── content/
│   │   ├── content.routes.ts      # NEW: CRUD /api/content-items
│   │   ├── content.controller.ts  # NEW
│   │   └── content.service.ts     # NEW: content item CRUD
│   └── quota/
│       ├── quotaUsage.service.ts  # NEW: DB-backed usage tracking
│       ├── quota.service.ts       # MODIFIED: read from quota_usage table
│       └── quota.controller.ts    # MODIFIED: use real usage data
├── db/schema/
│   ├── contentItems.ts            # NEW
│   ├── quotaUsage.ts              # NEW
│   └── index.ts                   # MODIFIED: export new tables

apps/web/src/
├── features/
│   └── upload/
│       ├── hooks/
│       │   └── useFileUpload.ts   # NEW: presigned URL + R2 upload
│       └── components/
│           ├── FileUploadZone.tsx  # NEW: drag-and-drop zone
│           └── UploadedFileCard.tsx # NEW: file card with progress

packages/shared/src/
├── types/
│   ├── content.types.ts           # NEW
│   └── quota.types.ts             # NEW or MODIFIED
├── schemas/
│   └── upload.schema.ts           # NEW
└── constants/
    ├── errorCodes.ts              # MODIFIED: add upload error codes
    └── uploadLimits.ts            # NEW: file size limits, allowed formats
```

### What This Story Does NOT Include

- Auto-Montage Upload Interface UI (that's Story 2.2 — clip cards, thumbnails, duration display)
- Style/format selection (that's Story 2.3)
- Video rendering pipeline / BullMQ jobs (that's Story 2.4)
- AI copy generation (that's Story 2.6)
- Content preview/editing UI (that's Story 2.7)
- File chunking or resumable uploads (future enhancement)
- Virus/malware scanning (future enhancement)

### Environment Variables

New variables needed (add to `.env.example` and `.env`):
```
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=plublista-dev
CLOUDFLARE_R2_ENDPOINT=https://{account-id}.r2.cloudflarestorage.com
```

These are already commented out in the existing `.env.example` — uncomment and populate them.

### New Dependencies

**Backend (apps/api):**
- `@aws-sdk/client-s3` — S3-compatible client for R2
- `@aws-sdk/s3-request-presigner` — Presigned URL generation

**Frontend (apps/web):**
- No new dependencies — use native XMLHttpRequest for upload progress

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Cloudflare R2 File Storage]
- [Source: _bmad-output/planning-artifacts/architecture.md#Content Management Service]
- [Source: _bmad-output/planning-artifacts/prd.md#Content Creation User Flows]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Auto-Montage Upload]
- [Source: _bmad-output/implementation-artifacts/1-8-onboarding-flow.md] (previous story learnings)
- [Source: _bmad-output/implementation-artifacts/1-7-user-profile-and-settings.md] (quota patterns)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Fixed `express-rate-limit` import: changed default import to named `{ rateLimit }` in upload.routes.ts and content.routes.ts to match existing pattern in quota.routes.ts (default import caused test mock failures)
- Fixed Express 5 `req.params.id` typing: `string | string[]` in Express 5 — used `as string` cast in content.controller.ts

### Completion Notes List

- All 5 Acceptance Criteria implemented
- Backend: 81 tests passing (10 files), 0 TypeScript errors
- Frontend: 54 tests passing (8 files), 0 TypeScript errors
- R2 service with presigned URL upload/download/delete
- Upload endpoint with tier-based file size validation
- Content items CRUD with tenant isolation
- Quota system updated to read real usage from quota_usage table (DB-backed)
- Frontend upload hook with XHR progress tracking + drag-and-drop FileUploadZone component
- Migration 0003_eminent_zuras.sql generated for content_items + quota_usage tables

### File List

**New files:**
- `apps/api/src/db/schema/contentItems.ts` — content_items table schema with enums
- `apps/api/src/db/schema/quotaUsage.ts` — quota_usage table schema
- `apps/api/migrations/0003_eminent_zuras.sql` — Drizzle migration
- `packages/shared/src/types/content.types.ts` — ContentType, ContentStatus, ContentItem types
- `packages/shared/src/schemas/upload.schema.ts` — presignedUrlRequestSchema, createContentItemSchema
- `packages/shared/src/constants/uploadLimits.ts` — per-tier file size limits
- `apps/api/src/services/r2.service.ts` — Cloudflare R2 service (S3-compatible)
- `apps/api/src/features/upload/upload.service.ts` — presigned URL request with tier validation
- `apps/api/src/features/upload/upload.controller.ts` — upload endpoint handler
- `apps/api/src/features/upload/upload.routes.ts` — POST /api/upload/presigned-url
- `apps/api/src/features/upload/upload.test.ts` — 8 upload endpoint tests
- `apps/api/src/features/content/content.service.ts` — CRUD operations with tenant isolation
- `apps/api/src/features/content/content.controller.ts` — content endpoint handlers
- `apps/api/src/features/content/content.routes.ts` — CRUD routes for /api/content-items
- `apps/api/src/features/content/content.test.ts` — 13 content endpoint tests
- `apps/api/src/features/quota/quotaUsage.service.ts` — DB-backed quota usage tracking
- `apps/web/src/features/upload/hooks/useFileUpload.ts` — upload hook with XHR progress
- `apps/web/src/features/upload/components/FileUploadZone.tsx` — drag-and-drop upload zone
- `apps/web/src/features/upload/components/UploadedFileCard.tsx` — file card with status/progress
- `apps/web/src/features/upload/components/FileUploadZone.test.tsx` — 6 upload zone tests
- `apps/web/src/features/upload/components/UploadedFileCard.test.tsx` — 7 file card tests

**Modified files:**
- `apps/api/src/db/schema/index.ts` — export new tables
- `apps/api/src/app.ts` — register upload + content routes
- `apps/api/src/features/quota/quota.service.ts` — async, reads from quota_usage table
- `apps/api/src/features/quota/quota.controller.ts` — async with error handling
- `apps/api/src/features/quota/quota.test.ts` — mock quotaUsage.service, added percentage test
- `apps/api/src/db/db.test.ts` — schema tests for contentItems + quotaUsage
- `packages/shared/src/constants/errorCodes.ts` — FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE, STORAGE_QUOTA_EXCEEDED
- `packages/shared/src/index.ts` — export new types, schemas, constants
- `.env.example` — R2 environment variables
