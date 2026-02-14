# Story 2.3: Style & Format Selection

Status: done

## Story

As a user,
I want to select a montage style and output format for my Reel,
so that the AI generates content matching my creative vision.

## Acceptance Criteria

1. **AC1 — Style Selection:** The settings panel shows a StylePicker component with visual preview cards for: Dynamic (default), Cinematic, UGC, Tutorial, Hype. Each card shows a style name and a color-coded thumbnail placeholder. The selected card has an indigo border and checkmark.
2. **AC2 — Format Selection:** A FormatPreview component shows visual aspect ratio frames for: 9:16 (default), 16:9, 1:1. Each frame visually represents its aspect ratio as a proportional shape. Selected frame has indigo border and checkmark.
3. **AC3 — Duration Options:** Duration options are available: 15s, 30s (default), 60s — displayed as button group (already implemented in Story 2.2, retained as-is).
4. **AC4 — Music Selection:** A MusicSelector shows: Auto-match (default). Displayed as a simple radio option with a note "More options coming soon" for future browse/upload.
5. **AC5 — Smart Defaults:** Defaults are pre-selected (Dynamic, 9:16, 30s, Auto-match) so generation works with zero configuration.
6. **AC6 — Style Descriptions:** Each style card shows a brief description text below the style name explaining the style's characteristics (e.g., "Fast cuts, energetic transitions" for Dynamic).
7. **AC7 — Generate Button Wiring:** The "Generate Auto-Montage" button sends a POST to `/api/content-items` with the selected style, format, duration, music preference, and uploaded mediaUrls. A success toast shows and button enters a loading state during submission.

## Tasks / Subtasks

- [x] Task 1: Create StylePicker component (AC: 1, 6)
  - [x] Create `apps/web/src/features/content/components/StylePicker.tsx`
  - [x] Define STYLES array with: value, label, description, color (for thumbnail placeholder)
  - [x] Styles: dynamic, cinematic, ugc, tutorial, hype
  - [x] Each card: colored thumbnail area, style name, description text
  - [x] States: default, hover (slight scale + shadow), selected (indigo border + checkmark)
  - [x] Accessible: `role="radiogroup"`, each card `role="radio"` with `aria-checked`, keyboard navigable

- [x] Task 2: Create FormatPreview component (AC: 2)
  - [x] Create `apps/web/src/features/content/components/FormatPreview.tsx`
  - [x] Three visual frames with proportional aspect ratios: tall 9:16, wide 16:9, square 1:1
  - [x] Each frame shows the ratio label inside
  - [x] States: default (gray border), hover (slight scale), selected (indigo border + checkmark)
  - [x] Accessible: `role="radiogroup"`, each frame `role="radio"` with `aria-checked`

- [x] Task 3: Create MusicSelector component (AC: 4)
  - [x] Create `apps/web/src/features/content/components/MusicSelector.tsx`
  - [x] Single option: "Auto-match" (selected by default)
  - [x] Show "More options coming soon" hint text
  - [x] Accessible: `role="radiogroup"`

- [x] Task 4: Update MontageSettings to use new visual components (AC: 1, 2, 3, 4, 5)
  - [x] Replace Style OptionGroup with StylePicker
  - [x] Replace Format OptionGroup with FormatPreview
  - [x] Keep Duration OptionGroup as-is (button group works well for 3 simple options)
  - [x] Add MusicSelector section
  - [x] Update `MontageStyle` type: add 'tutorial' and 'hype', remove 'energetic'
  - [x] Add `music` field to `MontageSettingsValues` with default 'auto-match'
  - [x] Settings panel now expanded by default (no longer progressive disclosure — it IS the main UI now)

- [x] Task 5: Wire Generate button to POST /api/content-items (AC: 7)
  - [x] In CreateReelPage, handle Generate button click
  - [x] Collect: type='reel', mediaUrls from completed clips' fileKeys, style, format, duration, music
  - [x] Call `apiPost('/api/content-items', payload)`
  - [x] Show loading state on button during submission
  - [x] Show success toast on completion ("Auto-Montage created!")
  - [x] Show error toast on failure
  - [x] Update `createContentItemSchema` in shared package to add `duration` and `music` fields

- [x] Task 6: Update shared schema and backend validation (AC: 7)
  - [x] Add `duration` field (z.number().int().positive().optional()) to `createContentItemSchema`
  - [x] Add `music` field (z.string().max(100).optional()) to `createContentItemSchema`
  - [x] Types already re-exported from shared/index.ts
  - [x] Updated content.service.ts to insert `duration` and `musicPrompt` fields

- [x] Task 7: Write frontend tests (AC: all)
  - [x] Test StylePicker: renders 5 styles, selection works, descriptions visible, aria-checked
  - [x] Test FormatPreview: renders 3 formats, visual frames present, selection works, aria-checked
  - [x] Test MusicSelector: renders auto-match, shows hint text, aria-checked
  - [x] Test MontageSettings: integrates all selectors, correct defaults, expanded by default
  - [x] Test CreateReelPage: settings expanded, generate button, apiPost mock

- [x] Task 8: Final verification
  - [x] Run `npx tsc --noEmit` in `apps/web` — 0 errors
  - [x] Run `npx vitest run` in `apps/web` — 95 tests passed (15 test files)
  - [x] Run `npx tsc --noEmit` in `apps/api` — 0 errors
  - [x] Run `npx vitest run` in `apps/api` — 81 tests passed (10 test files)

## Dev Notes

### Critical Architecture Constraints

- **This story upgrades Story 2.2's MontageSettings.** The basic text-button style/format/duration selectors are replaced with rich visual components. Do NOT create a parallel system — modify the existing MontageSettings component in-place.
- **Style list changes.** Story 2.2 had 4 styles: dynamic, cinematic, ugc, energetic. The epics specify 5: dynamic, cinematic, ugc, tutorial, hype. Update the `MontageStyle` type accordingly. Remove 'energetic', add 'tutorial' and 'hype'.
- **Settings panel now expanded by default.** In Story 2.2, settings were collapsed (progressive disclosure). Now that the visual selectors are the main UI, the settings panel should be visible by default. The collapsible wrapper can remain for mobile, but start expanded.
- **Generate button wiring.** The button should POST to `/api/content-items`. The backend already handles this route (from Story 2.1). Add `duration` and `music` to the shared Zod schema. The backend `content.controller.ts` already spreads validated body into the insert — new optional fields will flow through automatically.
- **No video processing.** The Generate button creates a content item record. Actual rendering is Story 2.4.
- **Music is placeholder.** Only "Auto-match" is available now. The MusicSelector should be a simple single-option component with a "coming soon" note.

### Established Patterns from Previous Stories

- **Feature folder:** `apps/web/src/features/content/components/` for new components
- **Component library:** shadcn/ui at `apps/web/src/components/ui/` — Button, Badge, Tooltip
- **Icons:** `lucide-react` — use `Check`, `Music`, `Sparkles`, `Film`, `Camera`, `Zap`, `BookOpen`, `Flame`
- **Styling:** Tailwind CSS v4 with dark mode via `dark:` prefix. Use `cn()` from `@/lib/cn`
- **Toast:** `sonner` — `import { toast } from 'sonner'`
- **API:** `apiPost` from `@/lib/apiClient` — auto-handles CSRF tokens
- **State:** React local state for settings, Zustand for UI store
- **Types:** Export types from component files, `MontageSettingsValues` is used by CreateReelPage
- **Tests:** Vitest + React Testing Library + userEvent. Mock API with `vi.mock('@/lib/apiClient')`

### Style Descriptions

| Style | Description |
|-------|-------------|
| Dynamic | Fast cuts, energetic transitions — great for product reveals |
| Cinematic | Smooth movements, film-like feel — ideal for storytelling |
| UGC | Natural, authentic look — perfect for user-generated content |
| Tutorial | Clear step-by-step flow — best for how-to content |
| Hype | High-energy with effects — designed for announcements |

### Style Color Placeholders (Thumbnail Areas)

Since actual style preview videos/images don't exist yet, use colored gradient thumbnails:

| Style | Gradient |
|-------|----------|
| Dynamic | from-orange-400 to-rose-500 |
| Cinematic | from-blue-400 to-indigo-500 |
| UGC | from-green-400 to-emerald-500 |
| Tutorial | from-purple-400 to-violet-500 |
| Hype | from-yellow-400 to-amber-500 |

### Existing Code to Modify

- `apps/web/src/features/content/components/MontageSettings.tsx` — Replace OptionGroups, update types
- `apps/web/src/features/content/components/MontageSettings.test.tsx` — Update tests for new components
- `apps/web/src/features/content/pages/CreateReelPage.tsx` — Wire Generate button, update settings state
- `apps/web/src/features/content/pages/CreateReelPage.test.tsx` — Add generate button test
- `packages/shared/src/schemas/upload.schema.ts` — Add duration + music to createContentItemSchema
- `apps/api/src/features/content/content.controller.ts` — Verify new fields handled (should auto-flow)

### File Structure

```
apps/web/src/features/content/
├── components/
│   ├── ClipCard.tsx                    # EXISTING (from Story 2.2)
│   ├── MontageSettings.tsx            # MODIFIED: use new visual components
│   ├── MontageSettings.test.tsx       # MODIFIED: updated tests
│   ├── StylePicker.tsx                # NEW: visual style selection cards
│   ├── FormatPreview.tsx              # NEW: visual aspect ratio frames
│   └── MusicSelector.tsx             # NEW: music option selector
├── pages/
│   ├── CreateReelPage.tsx             # MODIFIED: wire Generate button
│   └── CreateReelPage.test.tsx        # MODIFIED: add API call test

packages/shared/src/schemas/
└── upload.schema.ts                   # MODIFIED: add duration + music fields
```

### What This Story Does NOT Include

- Actual style preview videos or images (use color gradient placeholders)
- Music browse/upload functionality (only "Auto-match" placeholder)
- Video rendering pipeline (Story 2.4)
- Progress UI after generation (Story 2.5)
- AI copy generation (Story 2.6)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 Story 2.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StylePicker Component]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#FormatPreview Component]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/implementation-artifacts/2-2-auto-montage-upload-interface.md] (previous story)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Shared package needed rebuild (`npm run build`) after adding `duration` and `music` fields to schema — API TS check failed until compiled types were regenerated.

### Completion Notes List

- StylePicker: 5 gradient-colored cards with descriptions, accessible radiogroup
- FormatPreview: 3 proportional visual frames (9:16, 16:9, 1:1)
- MusicSelector: Single "Auto-match" option with "coming soon" hint
- MontageSettings rewritten: composes StylePicker + FormatPreview + Duration buttons + MusicSelector, expanded by default
- Generate button: POSTs to /api/content-items with type, mediaUrls, style, format, duration, music
- Schema updated with strict z.enum() validation for style, format, duration, music
- Backend service: maps `data.duration` → `duration` column, `data.music` → `musicPrompt` column
- 14 new tests across 3 new test files + 2 updated test files

#### Code Review Fixes Applied

- **H1:** Changed `mediaUrls` from `z.string().url()` to `z.string().min(1)` — frontend sends R2 file keys, not URLs
- **H2:** Replaced permissive `z.string()` with `z.enum()` for style, format, duration, music — prevents invalid values
- **M3:** Added `useNavigate` — navigates to `/library` after successful generation
- **M4:** Added `hasProcessing` guard — Generate button disabled while any clip is still uploading/processing
- **M5:** Created `useRadioGroupKeyboard` hook — arrow key navigation + tabIndex management for StylePicker, FormatPreview, Duration
- **M6:** Updated stale "progressive disclosure" comment
- **M7:** Used `clipsRef` + `settingsRef` pattern in `handleGenerate` — eliminated stale closure and unnecessary re-renders

### File List

- `apps/web/src/features/content/components/StylePicker.tsx` — NEW
- `apps/web/src/features/content/components/StylePicker.test.tsx` — NEW
- `apps/web/src/features/content/components/FormatPreview.tsx` — NEW
- `apps/web/src/features/content/components/FormatPreview.test.tsx` — NEW
- `apps/web/src/features/content/components/MusicSelector.tsx` — NEW
- `apps/web/src/features/content/components/MusicSelector.test.tsx` — NEW
- `apps/web/src/features/content/components/MontageSettings.tsx` — REWRITTEN
- `apps/web/src/features/content/components/MontageSettings.test.tsx` — UPDATED
- `apps/web/src/features/content/pages/CreateReelPage.tsx` — MODIFIED (handleGenerate, navigate, clipsRef, hasProcessing)
- `apps/web/src/features/content/pages/CreateReelPage.test.tsx` — UPDATED
- `apps/web/src/features/content/hooks/useRadioGroupKeyboard.ts` — NEW (keyboard nav for radiogroups)
- `packages/shared/src/schemas/upload.schema.ts` — MODIFIED (z.enum() validators, mediaUrls fix)
- `apps/api/src/features/content/content.service.ts` — MODIFIED (insert duration + musicPrompt)
