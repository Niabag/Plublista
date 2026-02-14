# Story 5-4: Content Duplication & Deletion — Implementation Artifact

## Summary

Added content duplication and deletion UI to ContentCard via a "..." DropdownMenu with AlertDialog confirmation for delete. Backend extended with a dedicated `duplicateContentItem` service that copies content fields without triggering render/AI pipelines. Delete already existed on backend; this story wired it to the frontend.

## Changes

### Backend (apps/api)

| File | Change |
|------|--------|
| `src/features/content/content.service.ts` | Added `duplicateContentItem()` — copies all content fields, sets status=draft, title+" (copy)", no scheduledAt |
| `src/features/content/content.controller.ts` | Added `duplicate` handler (201 response), imported `duplicateContentItem` |
| `src/features/content/content.routes.ts` | Added `POST /:id/duplicate` route with contentLimiter, requireAuth, csrfSynchronisedProtection |

### Frontend (apps/web)

| File | Change |
|------|--------|
| `src/features/content/hooks/useDeleteContent.ts` | **New** — mutation hook for `DELETE /api/content-items/:id`, invalidates content-items + calendar-content |
| `src/features/content/hooks/useDuplicateContent.ts` | **New** — mutation hook for `POST /api/content-items/:id/duplicate`, invalidates content-items + calendar-content |
| `src/features/content/components/ContentCard.tsx` | Added `onDuplicate`/`onDelete` props, DropdownMenu with "..." trigger, AlertDialog for delete confirmation |
| `src/features/dashboard/pages/DashboardPage.tsx` | Wired `useDeleteContent` + `useDuplicateContent` hooks, passed callbacks to ContentCard |

### Tests

| File | Tests |
|------|-------|
| `src/features/content/components/ContentCard.test.tsx` | Updated — 15 tests (existing 10 + 5 new: menu visibility, duplicate click, delete confirmation flow, menu stopPropagation) |
| `src/features/dashboard/pages/DashboardPage.test.tsx` | Updated — added mocks for useDeleteContent + useDuplicateContent hooks |

## Architecture Decisions

- **Dedicated duplicate service**: `createContentItem` triggers render jobs and AI copy generation — not suitable for duplication. `duplicateContentItem` does a plain DB insert copying all content fields.
- **Shared media references**: Duplicated items reference the same R2 URLs (mediaUrls, generatedMediaUrl) — no file duplication needed per story spec (FR41).
- **DropdownMenu + AlertDialog**: shadcn/radix components for the "..." menu and delete confirmation. AlertDialog state managed locally in ContentCard via `useState`.
- **Callbacks via props**: `onDuplicate`/`onDelete` are optional props on ContentCard, keeping the component reusable without menu when not needed (e.g. calendar cards).

## Test Results

- **API**: 18 files, 179 tests — all pass
- **Web**: 32 files, 248 tests — all pass
- **TypeScript**: 0 errors in both apps

## API Changes

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/content-items/:id/duplicate` | **New** — duplicates content item (returns 201 with new item) |
