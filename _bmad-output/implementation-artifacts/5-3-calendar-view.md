# Story 5-3: Calendar View — Implementation Artifact

## Summary

Replaced the CalendarPage placeholder with a full monthly/weekly calendar grid showing scheduled content. Features drag-and-drop rescheduling via dnd-kit, content mix indicator, quick-add buttons, and optimistic updates. Backend extended to return `scheduledAt` in API responses and support date range filtering.

## Changes

### Shared Package

| File | Change |
|------|--------|
| `packages/shared/src/schemas/content.schema.ts` | Added `rescheduleContentSchema` + `RescheduleContentInput` type |
| `packages/shared/src/index.ts` | Exported new schema and type |

### Backend (apps/api)

| File | Change |
|------|--------|
| `src/features/content/content.service.ts` | Added `scheduledAt` to `contentItemColumns`, added date range filtering to `listContentItems`, added `rescheduleContentItem()` |
| `src/features/content/content.controller.ts` | Updated `list` to pass query params, added `reschedule` handler |
| `src/features/content/content.routes.ts` | Added `PATCH /:id/reschedule` route |

### Frontend (apps/web)

| File | Change |
|------|--------|
| `src/features/calendar/hooks/useCalendarContent.ts` | **New** — TanStack Query hook with date range params |
| `src/features/calendar/hooks/useReschedule.ts` | **New** — mutation for PATCH reschedule endpoint |
| `src/features/calendar/components/CalendarContentCard.tsx` | **New** — compact draggable card with type color coding |
| `src/features/calendar/components/CalendarDayCell.tsx` | **New** — droppable day cell with quick-add button |
| `src/features/calendar/components/ContentMixIndicator.tsx` | **New** — type breakdown badges |
| `src/features/calendar/components/CalendarGrid.tsx` | **New** — DndContext grid with month/week views |
| `src/features/calendar/pages/CalendarPage.tsx` | Replaced placeholder with full calendar page |
| `src/features/content/components/ContentCard.test.tsx` | Added `scheduledAt: null` to mock |
| `src/features/content/components/ErrorDetailDialog.test.tsx` | Added `scheduledAt: null` to mock |

### Tests

| File | Tests |
|------|-------|
| `src/features/calendar/components/CalendarContentCard.test.tsx` | **New** — 6 tests (render, colors, navigation) |
| `src/features/calendar/components/ContentMixIndicator.test.tsx` | **New** — 3 tests (counts, empty, partial) |
| `src/features/calendar/pages/CalendarPage.test.tsx` | **New** — 7 tests (loading, views, navigation, content) |

## Architecture Decisions

- **Separate query key**: `calendar-content` vs `content-items` to avoid cache interference with library view
- **Date range filtering**: Backend filters by `scheduledAt` range, only returns items with `scheduledAt` set when range params provided
- **Optimistic DnD**: Query cache updated immediately on drag-drop, backend confirms in background, revert on error
- **Custom grid over library**: Built with Tailwind CSS grid + date-fns instead of react-big-calendar for consistency with project patterns

## Test Results

- **API**: 18 files, 179 tests — all pass
- **Web**: 32 files, 243 tests — all pass
- **TypeScript**: 0 errors in both apps

## API Changes

| Method | Path | Change |
|--------|------|--------|
| GET | `/api/content-items` | Added optional `?from=&to=` query params for date range filtering |
| GET | `/api/content-items` | Now returns `scheduledAt` field in responses |
| PATCH | `/api/content-items/:id/reschedule` | **New** — reschedule content (`{ scheduledAt }`) |
