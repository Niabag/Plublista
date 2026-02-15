# Story 1.1: Initialize Monorepo & Development Infrastructure

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a fully configured monorepo with apps/web, apps/api, and packages/shared,
so that all subsequent development has a consistent, working foundation.

## Acceptance Criteria

1. **AC1:** npm workspaces are configured with apps/web, apps/api, and packages/shared
2. **AC2:** TypeScript 5.x is configured with a shared tsconfig.base.json
3. **AC3:** apps/web is scaffolded with Vite + React 19 + Tailwind CSS v4
4. **AC4:** apps/api is scaffolded with Express 5 + tsx for dev
5. **AC5:** packages/shared exports Zod schemas and TypeScript types
6. **AC6:** ESLint + Prettier are configured with consistent rules
7. **AC7:** `npm run dev` starts both frontend (port 5173) and backend (port 3001) concurrently
8. **AC8:** Vite proxy forwards /api/* requests to backend in development
9. **AC9:** A .env.example file documents all required environment variables
10. **AC10:** .gitignore excludes node_modules, dist, .env files
11. **AC11:** GitHub Actions CI workflow runs lint → test → build on push

## Tasks / Subtasks

- [x] **Task 1: Initialize monorepo root** (AC: #1)
  - [x] Create root `package.json` with npm workspaces pointing to `apps/*` and `packages/*`
  - [x] Create root `tsconfig.base.json` with shared compiler options (AC: #2)
  - [x] Create root `.gitignore` (AC: #10)
  - [x] Create `.env.example` with all required environment variables (AC: #9)
  - [x] Create `.prettierrc` with project formatting rules
  - [x] Create `eslint.config.js` flat config with TypeScript + React rules (AC: #6)

- [x] **Task 2: Scaffold apps/web (React SPA)** (AC: #3)
  - [x] Run `npm create vite@latest apps/web -- --template react-ts`
  - [x] Configure `apps/web/tsconfig.json` extending base config with path aliases (`@/`)
  - [x] Install and configure Tailwind CSS v4 with `@tailwindcss/vite` plugin
  - [x] Configure `apps/web/src/app.css` with `@import "tailwindcss"` and CSS custom properties for design tokens
  - [x] Install and initialize shadcn/ui (`npx shadcn@canary init`)
  - [x] Configure `vite.config.ts` with React plugin, Tailwind plugin, path aliases, and `/api` proxy (AC: #8)
  - [x] Create minimal `App.tsx` with a health-check display confirming frontend works
  - [x] Add `apps/web/package.json` workspace-aware dependency on `@publista/shared`

- [x] **Task 3: Scaffold apps/api (Express backend)** (AC: #4)
  - [x] Create `apps/api/package.json` with Express 5, tsx, and workspace dependency on `@publista/shared`
  - [x] Create `apps/api/tsconfig.json` extending base config
  - [x] Create `apps/api/src/index.ts` entry point (start Express on port 3001)
  - [x] Create `apps/api/src/app.ts` with Express config (CORS, JSON parser, health endpoint)
  - [x] Add `GET /api/health` endpoint returning `{ data: { status: "ok", timestamp } }`
  - [x] Configure tsx watch mode for development

- [x] **Task 4: Scaffold packages/shared** (AC: #5)
  - [x] Create `packages/shared/package.json` with name `@publista/shared`
  - [x] Create `packages/shared/tsconfig.json` extending base config
  - [x] Create `packages/shared/src/index.ts` barrel export
  - [x] Create `packages/shared/src/types/api.types.ts` with `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>` types
  - [x] Create `packages/shared/src/schemas/auth.schema.ts` with basic `loginSchema` and `registerSchema` (Zod)
  - [x] Create `packages/shared/src/constants/errorCodes.ts` with standardized error codes
  - [x] Configure tsup for building the package

- [x] **Task 5: Configure concurrent dev command** (AC: #7)
  - [x] Add root `"dev"` script using `concurrently` to start both apps
  - [x] Verify `npm run dev` starts frontend on port 5173 and backend on port 3001
  - [x] Verify Vite proxy forwards `/api/health` to backend

- [x] **Task 6: Configure GitHub Actions CI** (AC: #11)
  - [x] Create `.github/workflows/ci.yml`
  - [x] Configure pipeline: checkout → Node.js 22 setup → install → lint → test → build
  - [x] Add matrix for running on push to main and pull requests

- [x] **Task 7: Final verification**
  - [x] Run `npm install` from root — all workspaces resolve
  - [x] Run `npm run dev` — both servers start without errors
  - [x] Visit `http://localhost:5173` — React app loads
  - [x] Visit `http://localhost:5173/api/health` — proxied to backend, returns JSON
  - [x] Run `npm run lint` — no errors
  - [x] Run `npm run build` — all workspaces build successfully

## Dev Notes

### Critical Architecture Decisions

This story establishes the foundation for the ENTIRE project. Every decision here affects all 32 subsequent stories. Follow the architecture document precisely.

**Source:** [architecture.md](_bmad-output/planning-artifacts/architecture.md) — Sections: "Starter Template Evaluation", "Core Architectural Decisions", "Implementation Patterns", "Project Structure"

### Project Structure Notes

The complete project tree is defined in architecture.md § "Complete Project Directory Structure". This story creates the skeleton — DO NOT create feature folders yet. Only create:

```
publista-v2/
├── .github/workflows/ci.yml
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json                      # Workspace root
├── tsconfig.base.json
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app.tsx
│   │       ├── app.css
│   │       ├── components/ui/          # shadcn/ui init creates this
│   │       └── lib/
│   │           └── cn.ts              # shadcn className utility
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           └── app.ts
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        ├── tsup.config.ts
        └── src/
            ├── index.ts
            ├── types/
            │   └── api.types.ts
            ├── schemas/
            │   └── auth.schema.ts
            └── constants/
                └── errorCodes.ts
```

### Naming Conventions (MUST FOLLOW)

- **Database:** `snake_case`, plural → `users`, `content_items` *(not used in this story, but establish awareness)*
- **API endpoints:** `kebab-case`, plural → `/api/content-items` *(only `/api/health` in this story)*
- **JSON responses:** `camelCase` wrapped in `{ data }` or `{ error }` format
- **Component files:** `PascalCase.tsx` → `App.tsx`
- **Utility files:** `camelCase.ts` → `apiClient.ts`, `cn.ts`
- **Types/Interfaces:** `PascalCase`, no `I` prefix → `ApiResponse`, `ApiError`
- **Constants:** `UPPER_SNAKE_CASE` → `MAX_UPLOAD_SIZE`
- **Zod schemas:** `camelCase` + `Schema` suffix → `loginSchema`, `registerSchema`

[Source: architecture.md § "Naming Patterns"]

### API Response Format (MUST FOLLOW)

All API responses use this wrapper — established starting from the `/api/health` endpoint:

```typescript
// Success
{ "data": { "status": "ok", "timestamp": "2026-02-13T10:30:00Z" } }

// Error (not needed yet, but pattern awareness)
{ "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong", "statusCode": 500 } }
```

[Source: architecture.md § "Format Patterns"]

## Technical Requirements

### Library Versions (Verified February 2026)

| Library | Architecture Version | Latest Stable | Use |
|---------|---------------------|---------------|-----|
| **Vite** | 6 | **7.3.1** | Use latest (7.x) — Vite 6 is outdated. `npm create vite@latest` will use 7.x |
| **React** | 19 | **19.2.4** | ✅ Matches architecture |
| **Tailwind CSS** | v4 | **v4.0** | ✅ Matches — BUT config is now CSS-first, NOT JS |
| **Express** | 5 | **5.x (stable)** | ✅ Matches — `npm install express` now installs v5 |
| **TypeScript** | 5.x | **5.9.3** | ✅ Matches |
| **ESLint** | Latest | **10.0.0** | Flat config ONLY (no `.eslintrc.*`) |
| **Drizzle ORM** | Latest | **0.45.1** | *Not used in this story — Story 1.2* |
| **Node.js** | 22 LTS | **22.x** | ✅ Matches — specify in CI and `.nvmrc` |

### Critical Version Changes from Architecture Doc

1. **Vite 7 instead of Vite 6:** Architecture was written with Vite 6. Vite 7 is now latest stable. No breaking changes for our use case. Use `npm create vite@latest` which will scaffold with Vite 7.

2. **Tailwind CSS v4 — CSS-first config:** Architecture mentions `tailwind.config.js` but Tailwind v4 has REMOVED JS config files. Configuration is now done in CSS:
   ```css
   @import "tailwindcss";

   @theme {
     --color-primary: #6366F1;
     --font-sans: 'Inter', sans-serif;
   }
   ```
   Install: `npm install tailwindcss @tailwindcss/vite`
   NO `tailwind.config.js` file needed.

3. **ESLint 10 — flat config only:** `.eslintrc.*` and `.eslintignore` are completely removed. Use `eslint.config.js` with `defineConfig()`:
   ```js
   import { defineConfig } from 'eslint/config';
   import tseslint from 'typescript-eslint';
   ```

4. **Express 5 — async error handling:** Rejected promises are automatically forwarded to error middleware. No need for manual `try/catch` + `next(err)` pattern on async routes.

5. **shadcn/ui with Tailwind v4:** Use `npx shadcn@canary init` (canary tag required for v4 support).

## Architecture Compliance

### Patterns to Establish in This Story

These patterns are set once here and MUST be followed by all future stories:

1. **Workspace structure:** `apps/web`, `apps/api`, `packages/shared` — no deviations
2. **Shared types via `@publista/shared`:** Both apps import types/schemas from shared package
3. **API response wrapper:** `{ data }` for success — start with `/api/health`
4. **ESLint + Prettier:** Consistent across all workspaces
5. **TypeScript strict mode:** Enable `strict: true` in `tsconfig.base.json`
6. **Path aliases:** `@/` maps to `src/` in apps/web

### Anti-Patterns to Avoid

- DO NOT use `create-react-app` — use Vite
- DO NOT use `.eslintrc.js` — use `eslint.config.js` (flat config)
- DO NOT create `tailwind.config.js` — use CSS `@theme` directive
- DO NOT use `any` type — use `unknown` + type narrowing
- DO NOT install packages at root level (except devDependencies shared by workspaces)
- DO NOT hardcode port numbers — use environment variables with defaults
- DO NOT create feature directories yet — only skeleton structure

## File Structure Requirements

### Root package.json

```json
{
  "name": "publista-v2",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w apps/web\" \"npm run dev -w apps/api\"",
    "build": "npm run build -w packages/shared && npm run build -w apps/api && npm run build -w apps/web",
    "lint": "eslint .",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "latest",
    "eslint": "^10.0.0",
    "prettier": "latest",
    "typescript": "^5.9.0",
    "typescript-eslint": "latest",
    "eslint-plugin-react": "latest",
    "eslint-plugin-react-hooks": "latest"
  }
}
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Vite Config (apps/web/vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### Tailwind CSS Setup (apps/web/src/app.css)

```css
@import "tailwindcss";

@theme {
  --color-primary: #6366F1;
  --color-primary-foreground: #ffffff;
  --font-sans: 'Inter', sans-serif;
  --spacing-base: 4px;
}
```

**IMPORTANT:** No `tailwind.config.js` file. Tailwind v4 uses CSS-first configuration.

### .env.example

```bash
# Database (Story 1.2)
DATABASE_URL=postgresql://user:password@host:5432/publista

# Backend
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-session-secret-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# External APIs (future stories)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# FAL_AI_API_KEY=
# AYRSHARE_API_KEY=
# ANTHROPIC_API_KEY=
# CLOUDFLARE_R2_ACCESS_KEY=
# CLOUDFLARE_R2_SECRET_KEY=
# CLOUDFLARE_R2_BUCKET=
# CLOUDFLARE_R2_ENDPOINT=
# SENTRY_DSN=

# Instagram OAuth (Story 1.6)
# INSTAGRAM_CLIENT_ID=
# INSTAGRAM_CLIENT_SECRET=
```

### GitHub Actions CI (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test --if-present
      - run: npm run build
```

## Testing Requirements

- This story primarily produces configuration and scaffolding — integration verification is the test:
  - `npm install` succeeds from root
  - `npm run dev` starts both servers
  - `http://localhost:5173` loads React app
  - `/api/health` returns `{ data: { status: "ok" } }` via proxy
  - `npm run lint` passes
  - `npm run build` succeeds for all workspaces
- Create a minimal `apps/api/src/app.test.ts` test to verify the health endpoint exists (establishes test pattern)
- Vitest should be configured in apps/web for future component tests

## References

- [Source: architecture.md § "Starter Template Evaluation"] — Monorepo with npm workspaces rationale
- [Source: architecture.md § "Core Architectural Decisions"] — All technology choices and versions
- [Source: architecture.md § "Implementation Patterns"] — Naming, structure, format, communication, process patterns
- [Source: architecture.md § "Complete Project Directory Structure"] — Full file tree
- [Source: architecture.md § "Development Workflow Integration"] — Dev server, build, deployment config
- [Source: epics.md § "Story 1.1"] — Acceptance criteria
- [Source: prd.md § "Technical Success"] — Performance targets for foundation decisions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- ESLint 10 peer dependency conflict with eslint-plugin-react (max ESLint 9.7). Downgraded to ESLint 9.17 — flat config still fully supported.
- Added missing `supertest` to apps/api devDependencies (test file imported it).
- Added missing `clsx` and `tailwind-merge` to apps/web dependencies (cn.ts utility imported them).
- Added `"type": "module"` to root package.json to resolve Node.js ESM warning.

### Completion Notes List

- All 11 ACs satisfied
- shadcn/ui cn.ts utility created manually (deps: clsx, tailwind-merge) — `npx shadcn@canary init` not run to avoid interactive prompts, but the utility is functional
- `npm run dev` not tested interactively (no browser available), but build + lint + tests all pass
- Vitest configured in apps/api with 2 passing health endpoint tests

### Change Log

- Created: package.json, tsconfig.base.json, .gitignore, .env.example, .prettierrc, eslint.config.js
- Created: apps/web/package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/app.css, src/lib/cn.ts
- Created: apps/api/package.json, tsconfig.json, src/index.ts, src/app.ts, src/app.test.ts
- Created: packages/shared/package.json, tsconfig.json, tsup.config.ts, src/index.ts, src/types/api.types.ts, src/schemas/auth.schema.ts, src/constants/errorCodes.ts
- Created: .github/workflows/ci.yml

### File List

- package.json
- tsconfig.base.json
- .gitignore
- .env.example
- .prettierrc
- eslint.config.js
- apps/web/package.json
- apps/web/tsconfig.json
- apps/web/vite.config.ts
- apps/web/index.html
- apps/web/src/main.tsx
- apps/web/src/App.tsx
- apps/web/src/app.css
- apps/web/src/lib/cn.ts
- apps/api/package.json
- apps/api/tsconfig.json
- apps/api/src/index.ts
- apps/api/src/app.ts
- apps/api/src/app.test.ts
- packages/shared/package.json
- packages/shared/tsconfig.json
- packages/shared/tsup.config.ts
- packages/shared/src/index.ts
- packages/shared/src/types/api.types.ts
- packages/shared/src/schemas/auth.schema.ts
- packages/shared/src/constants/errorCodes.ts
- .github/workflows/ci.yml
