---
status: complete
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Plublista - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Plublista, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Content Creation (FR1-FR8):**
- FR1: Users can upload 1-10 video clips and generate an AI auto-montage Reel from them
- FR2: Users can select a montage style (Dynamic, Cinematic, UGC, Tutorial, Hype) when creating an auto-montage
- FR3: Users can select an output format (9:16 vertical, 16:9 horizontal, 1:1 square) for any content piece
- FR4: Users can create carousel posts with 2-20 slides combining uploaded and AI-generated images
- FR5: Users can provide reference images to guide AI image generation style and composition
- FR6: Users can create single image posts with AI-generated or uploaded images
- FR7: Users can preview content before publishing in the selected format
- FR8: Users can edit AI-generated text (hooks, captions, hashtags, CTAs) before publishing

**AI Generation (FR9-FR13):**
- FR9: The system can generate captions, hashtags (3-5), hook text, and CTA copy for any content piece
- FR10: The system can generate original music tracks (10-180 seconds) from style presets or custom prompts
- FR11: The system can generate images from text prompts and reference images for carousels and posts
- FR12: The system can analyze uploaded video clips to detect best moments, filter low-quality segments, and select optimal cuts
- FR13: The system can apply algorithm-aware editing patterns (hook timing, cut rhythm, originality optimization) to auto-montages

**Publishing & Distribution (FR14-FR21):**
- FR14: Paid users can publish content to multiple platforms simultaneously (Instagram, YouTube, TikTok, Facebook, LinkedIn, X) via Ayrshare
- FR15: Free users can publish content to Instagram via direct Graph API
- FR16: Users can connect and disconnect social media platform accounts
- FR17: Users can schedule content for future publication with a specific date and time
- FR18: Users can view all scheduled and published content in a visual calendar (weekly and monthly views)
- FR19: Users can view a content mix indicator showing the balance of content types scheduled
- FR20: The system can automatically retry failed publications with exponential backoff
- FR21: The system can convert media formats when a target platform rejects the original format

**User Management (FR22-FR29):**
- FR22: Visitors can sign up with email and password
- FR23: Users can log in and maintain authenticated sessions
- FR24: Users can connect social media accounts via OAuth authorization flow
- FR25: Users can view and manage their profile settings
- FR26: Users can view their current subscription tier, quota usage, and billing status
- FR27: New users can experience an onboarding flow that guides them to create their first content piece
- FR28: Users can request complete account deletion (GDPR erasure) cascading to all content and connected accounts
- FR29: Users can export their personal data (GDPR portability)

**Billing & Subscriptions (FR30-FR37):**
- FR30: Users can subscribe to a paid plan (Starter, Pro, Business, Agency) with a 7-day free trial
- FR31: Users can upgrade or downgrade their subscription with prorated billing
- FR32: Users can view their invoices and payment history
- FR33: The system enforces quota limits per subscription tier (Reels, Carousels, AI images, connected platforms)
- FR34: The system notifies users when approaching quota limits (80% threshold)
- FR35: The system prevents content creation when a user's quota is exhausted for that resource type
- FR36: The system processes Stripe webhook events idempotently for subscription lifecycle management
- FR37: The system suspends account features after failed payment retry attempts (3 retries over 7 days)

**Content Management (FR38-FR42):**
- FR38: Users can view a dashboard with quick-create buttons, recent content, and status badges
- FR39: Users can view the publishing status of all content (draft, scheduled, published, failed)
- FR40: Users can view error details and take recovery actions for failed publications
- FR41: Users can duplicate existing content to create variations
- FR42: Users can delete content and all associated generated assets

**Platform Administration (FR43-FR51):**
- FR43: Admins can view platform-wide system health metrics (uptime, render times, publishing success rate)
- FR44: Admins can view and investigate publishing errors across all users
- FR45: Admins can monitor real-time API cost per user and aggregated platform costs
- FR46: Admins can view and manage user accounts (subscription status, quota usage, connected platforms)
- FR47: Admins can manually adjust user quotas when needed
- FR48: Admins can trigger token refresh for users with expired platform connections
- FR49: The system tracks and displays real-time API cost per user for margin protection
- FR50: Free-tier content displays a "Made with Plublista" watermark that is removed on paid plans
- FR51: The watermark links or references Plublista for organic discovery by content viewers

### NonFunctional Requirements

**Performance (NFR1-NFR7):**
- NFR1: Auto-montage render time < 3 minutes for a 30-second Reel
- NFR2: UI page load and interaction response < 2 seconds for any user action
- NFR3: Video upload processing < 30 seconds for files up to 200MB
- NFR4: AI copy generation response < 5 seconds for captions, hashtags, hooks
- NFR5: Calendar and dashboard rendering < 1 second for views with up to 100 content items
- NFR6: Concurrent rendering capacity 10+ simultaneous auto-montage renders
- NFR7: Publishing latency within 60 seconds of scheduled time

**Security (NFR8-NFR14):**
- NFR8: OAuth token storage encrypted at rest (AES-256), never exposed in frontend
- NFR9: API keys (Ayrshare, Fal.ai, Stripe, Claude) server-side only, never in client bundle
- NFR10: Authentication sessions via secure HTTP-only cookies, CSRF protection, session expiry after 30 days
- NFR11: Data isolation — users can never access another user's content, settings, or analytics
- NFR12: Payment data — zero PCI scope, Stripe handles all card data
- NFR13: Input validation — all user inputs sanitized server-side before processing
- NFR14: HTTPS enforcement — all traffic encrypted in transit via TLS 1.2+

**Scalability (NFR15-NFR19):**
- NFR15: User capacity at MVP launch — 500 concurrent users with < 10% performance degradation
- NFR16: Database scaling — PostgreSQL handles 10,000 content records per user, 500+ users
- NFR17: File storage scaling — support 10GB average per user
- NFR18: API cost scaling — linear cost growth, no per-user cost exceeds 40% of subscription revenue
- NFR19: Rendering queue scaling — queue-based processing absorbs burst traffic

**Reliability (NFR20-NFR24):**
- NFR20: Platform uptime 99.5%
- NFR21: Publishing success rate > 95%
- NFR22: Data durability — zero data loss for user content and account data
- NFR23: Graceful degradation when external APIs are unavailable
- NFR24: Error recovery — all failed operations retryable without data corruption

**Integration Resilience (NFR25-NFR28):**
- NFR25: External API retry policy — exponential backoff, max 3 retries, circuit breaker after 5 consecutive failures
- NFR26: Webhook processing — 100% idempotent Stripe event handling
- NFR27: Token management — proactive refresh 7 days before expiry
- NFR28: API response timeout — 30-second timeout for all external API calls

**Data Privacy & Compliance (NFR29-NFR33):**
- NFR29: GDPR data erasure — complete account deletion within 72 hours, cascading to all assets
- NFR30: GDPR data export — user data exportable in JSON within 30 days
- NFR31: Cookie consent — only essential cookies without consent, analytics require opt-in
- NFR32: Data residency — primary database and media storage hosted in EU region
- NFR33: Audit logging — all admin actions and sensitive operations logged

### Additional Requirements

**From Architecture — Starter Template & Infrastructure:**
- Monorepo with npm workspaces: apps/web (React SPA) + apps/api (Express backend) + packages/shared
- TypeScript 5.x across frontend and backend with shared tsconfig base
- Node.js 22 LTS runtime
- Vite 6 for frontend build with Tailwind CSS v4
- ESLint + Prettier for code quality
- PostgreSQL 16 via Neon (serverless, EU region) with Drizzle ORM
- Cloudflare R2 for file storage (zero egress, S3-compatible)
- BullMQ + Redis (Railway addon) for job queue
- Passport.js + HTTP-only cookies + CSRF tokens for auth
- express-rate-limit for API rate limiting
- Sentry for error monitoring (frontend + backend)
- Pino for structured logging
- GitHub Actions for CI/CD (lint → test → build → deploy)
- Vercel for frontend hosting, Railway for backend + Redis
- API response wrapper: { data } for success, { error } for errors
- Centralized error handling with AppError class
- Unified external API resilience wrapper (retry + circuit breaker + 30s timeout)
- Zod schemas in packages/shared for frontend and backend validation
- Feature-based folder structure (domain-driven)
- Co-located tests with source files

**From UX Design — Interaction & Design Requirements:**
- shadcn/ui component library with Radix UI primitives
- Design tokens: Indigo #6366F1 primary, Inter typography, 4px spacing base
- 8 custom components: ContentCard, AutoMontageProgress, PlatformSelector, QuotaIndicator, FormatPreview, StylePicker, ContentCalendar, SessionTracker
- Desktop-first responsive design (1024px+ primary, tablet 768-1023px secondary, mobile < 768px basic)
- WCAG 2.1 Level AA accessibility compliance
- Dark mode support via Tailwind dark: variant
- Sidebar + Main Canvas layout (sidebar 240px collapsible to 64px)
- Command palette (Cmd+K) for global quick-access
- Keyboard shortcuts: Cmd+N, Cmd+Enter, Cmd+S, Cmd+Shift+S, Cmd+Shift+P
- Drag-and-drop for file upload and calendar scheduling (dnd-kit library)
- Progressive disclosure pattern for creation settings
- Toast notifications via sonner (success, error, warning, info)
- Skeleton loading states, optimistic UI updates
- Card-based content grid with status badges (Draft, Generating, Scheduled, Published, Failed)
- Split-panel creation view (upload/options left + preview right)
- Multi-step Auto-Montage progress indicator with AI decision transparency
- Celebration moments for key actions (first Reel, batch complete, multi-platform publish)
- Onboarding: 3-step linear flow (Connect Instagram → Upload clips → Generate first Reel)
- Batch workflow: session counter, "Create Another" loop, last-used settings remembered
- Error messages: human-readable, never technical jargon, always with actionable CTA

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Upload clips + generate auto-montage |
| FR2 | Epic 2 | Select montage style |
| FR3 | Epic 2 | Select output format |
| FR4 | Epic 3 | Create carousel posts |
| FR5 | Epic 2 | Reference images for AI |
| FR6 | Epic 3 | Create single image posts |
| FR7 | Epic 2 | Preview content before publishing |
| FR8 | Epic 2 | Edit AI-generated text |
| FR9 | Epic 2 | Generate captions, hashtags, hooks |
| FR10 | Epic 2 | Generate original music |
| FR11 | Epic 3 | Generate images from prompts |
| FR12 | Epic 2 | Analyze clips for best moments |
| FR13 | Epic 2 | Algorithm-aware editing patterns |
| FR14 | Epic 4 | Multi-platform publish (Ayrshare) |
| FR15 | Epic 4 | Free tier Instagram publish |
| FR16 | Epic 4 | Connect/disconnect platforms |
| FR17 | Epic 5 | Schedule content |
| FR18 | Epic 5 | Visual calendar |
| FR19 | Epic 5 | Content mix indicator |
| FR20 | Epic 4 | Auto-retry failed publishes |
| FR21 | Epic 4 | Media format conversion |
| FR22 | Epic 1 | Sign up |
| FR23 | Epic 1 | Login + sessions |
| FR24 | Epic 1 | OAuth connection |
| FR25 | Epic 1 | Profile settings |
| FR26 | Epic 1 | Subscription/quota view |
| FR27 | Epic 1 | Onboarding flow |
| FR28 | Epic 8 | Account deletion (GDPR) |
| FR29 | Epic 8 | Data export (GDPR) |
| FR30 | Epic 6 | Subscribe to paid plan |
| FR31 | Epic 6 | Upgrade/downgrade |
| FR32 | Epic 6 | View invoices |
| FR33 | Epic 6 | Enforce quota limits |
| FR34 | Epic 6 | Quota approach notification |
| FR35 | Epic 6 | Prevent creation at quota |
| FR36 | Epic 6 | Stripe webhooks idempotent |
| FR37 | Epic 6 | Suspend after failed payments |
| FR38 | Epic 5 | Dashboard |
| FR39 | Epic 4 | Publishing status |
| FR40 | Epic 4 | Error recovery |
| FR41 | Epic 5 | Duplicate content |
| FR42 | Epic 5 | Delete content |
| FR43 | Epic 7 | System health metrics |
| FR44 | Epic 7 | Publishing error investigation |
| FR45 | Epic 7 | API cost monitoring |
| FR46 | Epic 7 | User management |
| FR47 | Epic 7 | Manual quota adjustment |
| FR48 | Epic 7 | Token refresh |
| FR49 | Epic 7 | Real-time cost tracking |
| FR50 | Epic 4 | Watermark on free tier |
| FR51 | Epic 4 | Watermark links to Plublista |

## Epic List

### Epic 1: Project Foundation & User Authentication
Users can sign up, log in, connect social media accounts via OAuth, manage their profile, view subscription/quota status, and experience a guided onboarding flow — all on a fully functional monorepo infrastructure.
**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR27

### Epic 2: Content Creation — Auto-Montage & AI Generation
Users can upload video clips and generate AI auto-montage Reels with style selection, format choice, AI-generated copy (captions, hashtags, hooks, CTAs), original AI music, and preview the result before publishing.
**FRs covered:** FR1, FR2, FR3, FR5, FR7, FR8, FR9, FR10, FR12, FR13

### Epic 3: Content Creation — Carousel & Single Post
Users can create carousel posts with AI-generated and uploaded images, and single image posts, completing the full range of content formats.
**FRs covered:** FR4, FR6, FR11

### Epic 4: Publishing & Multi-Platform Distribution
Users can publish content to multiple platforms simultaneously via Ayrshare (paid) or Instagram Graph API (free), with automatic retry on failure, media format conversion, publishing status tracking, error recovery, and "Made with Plublista" watermark on free tier.
**FRs covered:** FR14, FR15, FR16, FR20, FR21, FR39, FR40, FR50, FR51

### Epic 5: Calendar, Scheduling & Content Management
Users can schedule content for future publication, view and manage all content in a visual drag-and-drop calendar (weekly/monthly), see content mix indicators, and manage content via a dashboard with quick-create buttons, duplication, and deletion.
**FRs covered:** FR17, FR18, FR19, FR38, FR41, FR42

### Epic 6: Billing, Subscriptions & Quota Management
Users can subscribe to paid plans with 7-day free trial, upgrade/downgrade with prorated billing, view invoices, while the system enforces quota limits per tier, notifies at 80% threshold, prevents creation at exhaustion, processes Stripe webhooks idempotently, and suspends after failed payments.
**FRs covered:** FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

### Epic 7: Platform Administration & Monitoring
Admins can view system health metrics, investigate publishing errors across users, monitor real-time API costs per user, manage user accounts and quotas, and trigger token refresh for expired platform connections.
**FRs covered:** FR43, FR44, FR45, FR46, FR47, FR48, FR49

### Epic 8: GDPR Compliance & Data Privacy
Users can request complete account deletion with cascade to all content, connected accounts, and billing data, and export their personal data in machine-readable JSON format.
**FRs covered:** FR28, FR29

---

## Epic 1: Project Foundation & User Authentication

Users can sign up, log in, connect social media accounts via OAuth, manage their profile, view subscription/quota status, and experience a guided onboarding flow — all on a fully functional monorepo infrastructure.

### Story 1.1: Initialize Monorepo & Development Infrastructure

As a developer,
I want a fully configured monorepo with apps/web, apps/api, and packages/shared,
So that all subsequent development has a consistent, working foundation.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** the monorepo is initialized
**Then** npm workspaces are configured with apps/web, apps/api, and packages/shared
**And** TypeScript 5.x is configured with a shared tsconfig.base.json
**And** apps/web is scaffolded with Vite 6 + React 19 + Tailwind CSS v4
**And** apps/api is scaffolded with Express 5 + tsx for dev
**And** packages/shared exports Zod schemas and TypeScript types
**And** ESLint + Prettier are configured with consistent rules
**And** `npm run dev` starts both frontend (port 5173) and backend (port 3001) concurrently
**And** Vite proxy forwards /api/* requests to backend in development
**And** a .env.example file documents all required environment variables
**And** .gitignore excludes node_modules, dist, .env files
**And** GitHub Actions CI workflow runs lint → test → build on push

### Story 1.2: Database Setup & Core Schema

As a developer,
I want PostgreSQL connected via Drizzle ORM with the users table,
So that user data can be persisted and queried with type safety.

**Acceptance Criteria:**

**Given** a Neon PostgreSQL instance in EU region
**When** the database connection is configured
**Then** Drizzle ORM connects to Neon via connection string from environment variables
**And** a `users` table is created with columns: id (UUID), email (unique), password_hash, display_name, role (enum: user/admin), subscription_tier (enum: free/starter/pro/business/agency), created_at, updated_at
**And** Drizzle Kit generates SQL migration files from schema changes
**And** migrations can be applied with a single command
**And** the db/index.ts exports a typed Drizzle client
**And** the schema is defined in db/schema/users.ts following snake_case naming conventions

### Story 1.3: User Registration

As a visitor,
I want to sign up with my email and password,
So that I can create an account and start using Plublista.

**Acceptance Criteria:**

**Given** a visitor on the registration page
**When** they submit a valid email and password (min 8 chars)
**Then** a new user is created with subscription_tier "free" and role "user"
**And** the password is hashed with bcrypt before storage
**And** a session is created via HTTP-only secure cookie
**And** the user is redirected to the onboarding flow
**And** a CSRF token is included in the session

**Given** a visitor submits an email that already exists
**When** the registration is processed
**Then** a clear error message is shown: "This email is already registered"
**And** no duplicate account is created

**Given** a visitor submits an invalid email or weak password
**When** the form is submitted
**Then** Zod validation errors are shown inline below the relevant fields
**And** the form is not submitted to the server

### Story 1.4: User Login & Session Management

As a registered user,
I want to log in with my email and password,
So that I can access my account and content.

**Acceptance Criteria:**

**Given** a registered user on the login page
**When** they submit valid credentials
**Then** Passport.js authenticates the user via local strategy
**And** a session is created with an HTTP-only secure cookie (SameSite=Lax)
**And** a CSRF token is generated and sent to the frontend
**And** the user is redirected to the dashboard
**And** the session expires after 30 days of inactivity

**Given** a user submits incorrect credentials
**When** authentication fails
**Then** a generic error "Invalid email or password" is shown (no email enumeration)

**Given** a logged-in user clicks logout
**When** the logout endpoint is called
**Then** the session is destroyed server-side
**And** the cookie is cleared
**And** the user is redirected to the login page

### Story 1.5: App Shell & Navigation Layout

As a logged-in user,
I want a consistent app layout with sidebar navigation and top bar,
So that I can navigate between sections of the application easily.

**Acceptance Criteria:**

**Given** a logged-in user on any page
**When** the app loads
**Then** a persistent sidebar is shown on the left (240px, collapsible to 64px icons-only)
**And** sidebar contains navigation items: Dashboard, Create, Calendar, Library, Settings
**And** the active page is highlighted with indigo accent (indigo-50 bg, indigo-600 text)
**And** a top bar (56px) shows the page title, contextual actions area, and user avatar with dropdown
**And** the layout uses shadcn/ui components with Indigo #6366F1 as primary color
**And** Inter font is loaded as the primary UI font
**And** the sidebar collapses to icons on tablet (768-1023px) and is hidden on mobile (< 768px) with hamburger trigger
**And** dark mode toggle is available in the user avatar dropdown
**And** Sentry is initialized for frontend error tracking

### Story 1.6: Social Media OAuth Connection

As a user,
I want to connect my social media accounts via OAuth,
So that I can publish content to my platforms later.

**Acceptance Criteria:**

**Given** a user on the Settings page or during onboarding
**When** they click "Connect Instagram" (or YouTube, TikTok, etc.)
**Then** the OAuth authorization flow opens in a popup/redirect
**And** upon successful authorization, the platform access token is encrypted with AES-256-GCM and stored in the `platform_connections` table
**And** the connected platform shows a green "Connected" badge with the account name
**And** the user can disconnect a platform at any time with a confirmation dialog

**Given** an OAuth flow fails or is cancelled
**When** the callback is received
**Then** a clear error message is shown with a "Try Again" button
**And** no invalid token is stored

**Given** the `platform_connections` table does not exist
**When** this story is implemented
**Then** the table is created with columns: id, user_id (FK), platform (enum), access_token (encrypted), refresh_token (encrypted), token_expires_at, platform_user_id, platform_username, connected_at

### Story 1.7: User Profile & Settings

As a user,
I want to view and manage my profile settings and see my subscription status,
So that I can keep my account information up to date.

**Acceptance Criteria:**

**Given** a logged-in user navigates to Settings
**When** the page loads
**Then** they see their display name, email, and profile settings
**And** they see their current subscription tier (e.g., "Free Plan") and quota usage summary
**And** they see a list of connected social media platforms with connect/disconnect buttons
**And** they can update their display name and save changes
**And** a success toast notification confirms saved changes

**Given** a user views their quota usage
**When** the QuotaIndicator component renders
**Then** it shows usage bars for Reels, Carousels, AI Images with color coding (green 0-59%, amber 60-79%, rose 80%+)

### Story 1.8: Onboarding Flow

As a new user,
I want a guided onboarding experience,
So that I can create my first content piece within 5 minutes of signing up.

**Acceptance Criteria:**

**Given** a new user completes registration
**When** they are redirected to onboarding
**Then** a 3-step linear flow is presented: 1) Connect Instagram 2) Upload clips 3) Create first Reel
**And** Step 1 shows the Instagram OAuth connection button with trust badge and "Why connect?" explanation
**And** Step 1 can be skipped with a "Skip for now" link
**And** Step 2 shows a drag-and-drop upload zone with helper text "Use your phone videos — even selfies work!"
**And** Step 3 shows a prominent "Create My Reel" CTA button
**And** onboarding progress is saved so users can resume if they leave
**And** after completion, the user lands on the Dashboard with their first content visible

---

## Epic 2: Content Creation — Auto-Montage & AI Generation

Users can upload video clips and generate AI auto-montage Reels with style selection, format choice, AI-generated copy, original AI music, and preview the result before publishing.

### Story 2.1: File Upload & Cloud Storage

As a user,
I want to upload video clips and images to the platform,
So that I can use them to create content.

**Acceptance Criteria:**

**Given** a user on a content creation page
**When** they drag-and-drop or browse files
**Then** files are uploaded to Cloudflare R2 via presigned URLs generated by the backend
**And** upload progress is shown with a progress bar per file
**And** supported formats are validated client-side: MP4, MOV, WebM for video; JPG, PNG, WebP for images
**And** maximum file size is enforced per subscription tier (200MB free, up to 10GB agency)
**And** files are stored under the user's namespace: `users/{userId}/uploads/{filename}`
**And** upload completes within 30 seconds for files up to 200MB (NFR3)

**Given** the backend r2.service.ts does not exist
**When** this story is implemented
**Then** the R2 service is created with methods: generatePresignedUploadUrl(), generatePresignedDownloadUrl(), deleteFile()
**And** the `content_items` table is created with columns: id (UUID), user_id (FK), type (enum: reel/carousel/post), title, status (enum: draft/generating/scheduled/published/failed), style, format, duration, media_urls (jsonb), generated_media_url, caption, hashtags (jsonb), hook_text, cta_text, music_url, music_prompt, created_at, updated_at
**And** the `quota_usage` table is created with columns: id, user_id (FK, unique), period_start, period_end, reels_used (default 0), reels_limit, carousels_used (default 0), carousels_limit, ai_images_used (default 0), ai_images_limit, platforms_connected, platforms_limit — limits initialized from subscription_tier defaults

### Story 2.2: Auto-Montage Upload Interface

As a user,
I want to upload 1-10 video clips and see them organized before generating a Reel,
So that I can control the source material for my auto-montage.

**Acceptance Criteria:**

**Given** a user navigates to Create → New Reel
**When** the Auto-Montage creation view loads
**Then** the sidebar collapses to icons to maximize workspace
**And** a drag-and-drop upload zone is centered with the text "Drop your video clips here"
**And** uploaded clips appear as cards showing thumbnail, filename, and duration
**And** clips can be removed with an X button on each card
**And** total footage duration is displayed (e.g., "Total: 2:25 of raw footage")
**And** a prominent "Generate Auto-Montage" button is visible below the clips
**And** optional settings are collapsed by default below the button (progressive disclosure)

**Given** a user tries to upload more than 10 clips
**When** the 11th file is added
**Then** an error toast shows "Maximum 10 clips per Auto-Montage"

### Story 2.3: Style & Format Selection

As a user,
I want to select a montage style and output format for my Reel,
So that the AI generates content matching my creative vision.

**Acceptance Criteria:**

**Given** a user expands the optional settings on the creation view
**When** the settings panel opens
**Then** a StylePicker component shows visual preview cards for: Dynamic (default), Cinematic, UGC, Tutorial, Hype
**And** a FormatPreview component shows visual aspect ratio frames for: 9:16 (default), 16:9, 1:1
**And** duration options are available: 15s, 30s (default), 60s
**And** music option shows: Auto-match (default), with future browse/upload options
**And** defaults are pre-selected (Dynamic, 9:16, 30s, Auto-match) so generation works with zero configuration

**Given** a user selects a style
**When** they hover over a style card
**Then** a brief description tooltip appears explaining the style's characteristics

### Story 2.4: Auto-Montage Rendering Pipeline

As a user,
I want the AI to analyze my clips and generate a fully edited Reel,
So that I get a professional-quality video without manual editing.

**Acceptance Criteria:**

**Given** a user clicks "Generate Auto-Montage" with 1-10 uploaded clips
**When** the generation starts
**Then** the backend creates a BullMQ job in the "render" queue with userId, contentItemId, clip URLs, style, format, duration
**And** the content item status changes to "generating"
**And** the render.job.ts processor executes the pipeline:
  1. Calls claude.service to analyze clips (detect best moments, score hook potential, filter low-quality segments) (FR12)
  2. Calls fal.service to generate original music matching content mood (FR10)
  3. Applies algorithm-aware editing patterns: 1.7s hook, 3-5s jump cuts, originality optimization (FR13)
  4. Renders the final video via Remotion/FFmpeg
  5. Uploads the result to Cloudflare R2
  6. Logs API costs via costTracker
**And** rendering completes in < 3 minutes for a 30s Reel (NFR1)
**And** the content item status updates to "draft" with generated_media_url populated

**Given** the `api_cost_logs` table does not exist
**When** this story is implemented
**Then** the table is created with columns: id, user_id (FK), service (enum: fal/ayrshare/stripe/claude/instagram), endpoint, cost_usd, created_at
**And** the costTracker service is created to log API costs per user per service call

**Given** rendering fails at any step
**When** an error occurs
**Then** the job retries up to 3 times with exponential backoff
**And** if all retries fail, status is set to "failed" with error details
**And** the error is logged via Pino and reported to Sentry

### Story 2.5: Auto-Montage Progress UI

As a user,
I want to see real-time progress of my Reel generation with AI decision transparency,
So that I understand what the AI is doing and feel confident in the process.

**Acceptance Criteria:**

**Given** a user has started an Auto-Montage generation
**When** the progress view loads
**Then** the AutoMontageProgress component shows step-by-step progress:
  - ✅/⏳/○ Analyzing clips (count of clips, total duration)
  - ✅/⏳/○ Selecting best moments (shows hook selection: "clip2 at 0:03 — high energy")
  - ✅/⏳/○ Matching music to content mood
  - ✅/⏳/○ Rendering final video
  - ✅/⏳/○ Adding text overlays
**And** an overall progress bar shows percentage and estimated time remaining
**And** progress updates via polling (GET /api/content-items/:id/status every 3 seconds)
**And** when rendering completes, the view transitions to the result preview with a fade-in reveal

### Story 2.6: AI Copy Generation

As a user,
I want AI-generated captions, hashtags, hook text, and CTAs for my content,
So that I never face a blank text field and my copy is algorithm-optimized.

**Acceptance Criteria:**

**Given** a content item is being created (Reel, Carousel, or Post)
**When** the AI copy generation is triggered (automatically during render pipeline or on-demand)
**Then** claude.service calls the Anthropic API to generate:
  - A caption (up to 2,200 characters for Instagram)
  - 3-5 relevant hashtags
  - A hook text for the first frame
  - A CTA (Call-to-Action) text
**And** the generated copy is stored on the content_item record
**And** generation completes in < 5 seconds (NFR4)
**And** API cost is logged per user via costTracker

**Given** the Anthropic API is unavailable
**When** copy generation fails
**Then** the system degrades gracefully — the content is created without AI copy
**And** the user can manually enter text instead

### Story 2.7: Content Preview & Text Editing

As a user,
I want to preview my generated Reel and edit the AI-generated text before publishing,
So that I can ensure quality and personalize the content.

**Acceptance Criteria:**

**Given** an Auto-Montage generation completes successfully
**When** the result preview loads
**Then** a split-panel view shows:
  - Left: phone-frame video preview via Remotion Player with play/pause controls (FR7)
  - Right: editable fields for caption, hashtags, hook text, CTA (FR8)
**And** caption shows a character counter (Instagram 2,200 max)
**And** hashtags are displayed as editable tags
**And** music info shows the generated track name and duration
**And** three primary action buttons are visible: "Publish Now", "Schedule", "Regenerate"
**And** platform toggles (PlatformSelector component) show which connected platforms will receive the content
**And** reference images section allows adding images to guide future AI generation (FR5)

**Given** a user edits the caption
**When** they click away or press Tab
**Then** changes are auto-saved to the content item (no manual save required)

---

## Epic 3: Content Creation — Carousel & Single Post

Users can create carousel posts with AI-generated and uploaded images, and single image posts, completing the full range of content formats.

### Story 3.1: AI Image Generation

As a user,
I want to generate images from text prompts and reference images,
So that I can create visual content without photography or design skills.

**Acceptance Criteria:**

**Given** a user is creating a Carousel or Post
**When** they enter a text prompt and optionally upload reference images
**Then** fal.service calls the Fal.ai Flux 2.0 API to generate an image
**And** the generated image is uploaded to Cloudflare R2
**And** the image is displayed as a preview with options to accept, regenerate, or replace
**And** API cost is logged per user via costTracker
**And** quota for AI images is checked and decremented atomically before generation

**Given** the user's AI image quota is exhausted
**When** they try to generate an image
**Then** a clear message shows "Monthly AI image quota reached" with an upgrade CTA
**And** generation is blocked (FR35)

### Story 3.2: Carousel Builder

As a user,
I want to create carousel posts with 2-20 slides combining uploaded and AI-generated images,
So that I can create engaging multi-slide content for Instagram and other platforms.

**Acceptance Criteria:**

**Given** a user navigates to Create → New Carousel
**When** the carousel builder loads
**Then** a slide management interface shows numbered slides (2-20)
**And** each slide can be filled with an uploaded image or AI-generated image
**And** slides can be reordered via drag-and-drop
**And** slides can be added, removed, and duplicated
**And** AI copy is auto-generated for the carousel (caption, hashtags) via FR9
**And** a preview shows all slides in a horizontal scroll with the selected format (FR3, FR7)
**And** the same result preview with text editing is available as in Story 2.7

**Given** a user tries to create a carousel with fewer than 2 slides
**When** they click Generate/Save
**Then** a validation error shows "Carousels require at least 2 slides"

### Story 3.3: Single Post Creator

As a user,
I want to create single image posts with uploaded or AI-generated images,
So that I can publish static visual content to my social platforms.

**Acceptance Criteria:**

**Given** a user navigates to Create → New Post
**When** the single post creator loads
**Then** they can upload an image or generate one via AI (reusing Story 3.1)
**And** format selection is available (9:16, 16:9, 1:1) via FormatPreview component
**And** AI copy is auto-generated (caption, hashtags, CTA) via FR9
**And** the result preview with text editing is available as in Story 2.7
**And** a content item is created with type "post" in the database

---

## Epic 4: Publishing & Multi-Platform Distribution

Users can publish content to multiple platforms simultaneously via Ayrshare (paid) or Instagram Graph API (free), with automatic retry, format conversion, status tracking, error recovery, and watermark.

### Story 4.1: Instagram Direct Publishing — Free Tier

As a free-tier user,
I want to publish my content directly to Instagram,
So that I can share my creations on social media without a paid plan.

**Acceptance Criteria:**

**Given** a free-tier user with a connected Instagram account clicks "Publish Now"
**When** the publish action is triggered
**Then** instagram.service calls the Instagram Graph API to publish the content
**And** the content item status updates to "published" with the Instagram post URL
**And** a success toast shows "Published to Instagram!" with a link to the live post
**And** the publish job is queued via BullMQ (publish queue) for async processing
**And** API cost is logged

**Given** a free-tier user tries to publish to platforms other than Instagram
**When** they toggle YouTube, TikTok, etc.
**Then** those platforms show a lock icon with "Upgrade to publish to [platform]"

**Given** the `publish_jobs` table does not exist
**When** this story is implemented
**Then** the table is created with columns: id (UUID), user_id (FK), content_item_id (FK), platform, status (enum: pending/publishing/published/failed/retrying), published_url, error_message, error_code, attempt_count, scheduled_at, published_at, created_at

### Story 4.2: Multi-Platform Publishing via Ayrshare

As a paid user,
I want to publish content to multiple platforms simultaneously in one click,
So that I can distribute content across Instagram, YouTube, TikTok, Facebook, LinkedIn, and X without switching tools.

**Acceptance Criteria:**

**Given** a paid user with content ready and 2+ platforms selected via PlatformSelector
**When** they click "Publish to [N] platforms"
**Then** ayrshare.service sends the content to all selected platforms via the Ayrshare API
**And** a separate publish_job record is created per platform
**And** the publishing progress dialog shows real-time status per platform (spinner → ✅ Published / ❌ Failed)
**And** upon all success, a celebration modal shows links to each live post
**And** format adaptation happens automatically if needed (9:16 content published as Shorts on YouTube)
**And** Ayrshare rate limiting (5 req/10s per user) is respected via request queuing

**Given** some platforms succeed and others fail
**When** publishing completes partially
**Then** the dialog shows ✅ for successful platforms with links and ❌ for failed ones with error message
**And** "Retry Failed" button is available for one-click retry

### Story 4.3: Publishing Status & Error Recovery

As a user,
I want to see the publishing status of all my content and recover from failures,
So that I never have a silent failure and can fix issues quickly.

**Acceptance Criteria:**

**Given** a user views their content library or dashboard
**When** content cards render
**Then** each card shows a status badge: Draft (gray), Scheduled (sky), Published (emerald), Failed (rose)
**And** failed content cards show a red accent border and are impossible to miss (FR39)

**Given** a user clicks on a failed content card
**When** the error detail panel opens
**Then** it shows the error in human-readable language (never technical jargon) (FR40)
**And** it shows the platform(s) that failed with specific error messages
**And** actionable buttons are displayed: "Fix & Republish", "Retry", or "Dismiss"
**And** one-click recovery is available for format errors (auto-convert and retry)

### Story 4.4: Auto-Retry & Format Conversion

As the system,
I want to automatically retry failed publications and convert incompatible formats,
So that publishing succeeds without user intervention when possible.

**Acceptance Criteria:**

**Given** a publication fails with a transient error (rate limit, timeout, temporary unavailability)
**When** the publish job fails
**Then** the job is retried up to 3 times with exponential backoff (1min, 5min, 15min) (FR20)
**And** the content status changes to "retrying" with an amber pulsing badge
**And** each retry attempt increments the attempt_count

**Given** a publication fails because the media format is unsupported by the target platform
**When** the error is "media format not supported"
**Then** the system auto-converts the media (e.g., .webp → .jpg, re-encode video) (FR21)
**And** the converted file is uploaded to R2
**And** publishing is retried with the converted file

**Given** all retries are exhausted
**When** the final retry fails
**Then** the content status is set to "failed"
**And** the user is notified via toast/notification

### Story 4.5: Watermark System

As the system,
I want to add a "Made with Plublista" watermark to free-tier content,
So that published content drives organic discovery and signups.

**Acceptance Criteria:**

**Given** a free-tier user publishes content
**When** the content is rendered/processed for publishing
**Then** a subtle "Made with Plublista" watermark is overlaid on the content (FR50)
**And** the watermark references Plublista for organic discovery (FR51)

**Given** a paid user publishes content
**When** the content is processed
**Then** no watermark is applied
**And** the content is published clean

---

## Epic 5: Calendar, Scheduling & Content Management

Users can schedule content, view and manage all content in a visual calendar, and manage content via a dashboard with quick-create, duplication, and deletion.

### Story 5.1: Dashboard with Quick-Create & Recent Content

As a user,
I want a dashboard showing my recent content, quick-create buttons, and status overview,
So that I have a central hub for managing my content workflow.

**Acceptance Criteria:**

**Given** a logged-in user navigates to Dashboard
**When** the page loads
**Then** quick-create buttons are displayed: "New Reel", "New Carousel", "New Post"
**And** recent content is shown as a visual card grid (ContentCard components)
**And** each card shows thumbnail, title, status badge, creation date, and platform badges
**And** the QuotaIndicator widget shows current quota usage
**And** content cards load with skeleton states and render in < 1 second (NFR5)
**And** the content grid is responsive: 1 col mobile, 2 col tablet, 3-4 col desktop

### Story 5.2: Content Scheduling

As a user,
I want to schedule content for future publication at a specific date and time,
So that I can plan my content calendar in advance.

**Acceptance Criteria:**

**Given** a user views content in the result preview
**When** they click "Schedule"
**Then** a date/time picker popover opens (using shadcn/ui Calendar + time slots)
**And** the user selects a date, time, and target platforms
**And** the content item status changes to "scheduled" with scheduled_at timestamp
**And** a BullMQ scheduled job is created in the "schedule" queue
**And** a confirmation toast shows "Scheduled for [date] at [time]"

**Given** a scheduled time arrives
**When** the schedule.job.ts cron checks for due posts
**Then** the content is published within 60 seconds of the scheduled time (NFR7)
**And** the status updates from "scheduled" to "publishing" then "published" or "failed"

### Story 5.3: Calendar View

As a user,
I want to view all my scheduled and published content in a visual calendar,
So that I can plan my content strategy and identify gaps.

**Acceptance Criteria:**

**Given** a user navigates to Calendar
**When** the page loads
**Then** a ContentCalendar component shows a weekly grid (Mon-Sun) with content cards in time slots (FR18)
**And** a week/month view toggle is available
**And** content cards are color-coded by type: Reels (indigo), Carousels (emerald), Posts (sky)
**And** each day cell has a "+" quick-add button to create content for that date
**And** a content mix indicator shows the balance of content types scheduled for the week (FR19)
**And** content can be dragged between dates to reschedule (dnd-kit)
**And** the calendar renders in < 1 second for up to 100 items (NFR5)

**Given** a user drags a content card to a different date
**When** the drop completes
**Then** the scheduled_at is updated optimistically (instant visual update)
**And** the backend syncs the new schedule in the background

### Story 5.4: Content Duplication & Deletion

As a user,
I want to duplicate and delete content,
So that I can create variations efficiently and manage my content library.

**Acceptance Criteria:**

**Given** a user right-clicks or opens the "..." menu on a content card
**When** they select "Duplicate"
**Then** a new content item is created as a copy of the original (title, caption, hashtags, settings) (FR41)
**And** the duplicate appears in the library with status "draft" and title "[Original Title] (copy)"
**And** generated media files are not duplicated — the copy references the same R2 URLs

**Given** a user selects "Delete" from the content card menu
**When** the AlertDialog confirmation appears and user confirms
**Then** the content item and all associated generated assets are deleted from the database and R2 (FR42)
**And** associated publish_jobs are cancelled if pending
**And** a success toast confirms "Content deleted"

---

## Epic 6: Billing, Subscriptions & Quota Management

Users can subscribe to paid plans, manage billing, while the system enforces quotas and handles Stripe lifecycle events.

### Story 6.1: Stripe Integration & Plan Checkout

As a user,
I want to subscribe to a paid plan with a 7-day free trial,
So that I can unlock premium features and higher quotas.

**Acceptance Criteria:**

**Given** a user views the Pricing page
**When** the page loads
**Then** a PricingTable shows all 5 tiers (Free, Starter €29, Pro €79, Business €199, Agency €499) with key quotas
**And** the user's current plan is highlighted

**Given** a user clicks "Start Free Trial" on a paid plan
**When** the checkout flow starts
**Then** stripe.service creates a Stripe Checkout session with 7-day trial (no card required for trial start if configured, or card collected)
**And** the user is redirected to Stripe Checkout
**And** upon successful checkout, the user's subscription_tier is updated
**And** a `subscriptions` table record is created with: id, user_id, stripe_customer_id, stripe_subscription_id, tier, status, trial_ends_at, current_period_start, current_period_end, created_at

**Given** the `subscriptions` table does not exist
**When** this story is implemented
**Then** the table is created as specified above
**And** the existing `quota_usage` table (created in Story 2.1) is updated with limits matching the new subscription tier

### Story 6.2: Subscription Management

As a user,
I want to upgrade or downgrade my subscription,
So that I can adjust my plan based on my needs.

**Acceptance Criteria:**

**Given** a logged-in user on the Billing page
**When** they click "Upgrade" or "Change Plan"
**Then** stripe.service updates the Stripe subscription with prorated billing (FR31)
**And** the user's subscription_tier and quota_usage limits are updated immediately
**And** a confirmation toast shows "Plan updated to [tier]"

**Given** a user downgrades to a lower tier
**When** the change is processed
**Then** the downgrade takes effect at the end of the current billing period
**And** a clear message explains when the change will apply

### Story 6.3: Invoice & Payment History

As a user,
I want to view my invoices and payment history,
So that I can track my expenses and manage my budget.

**Acceptance Criteria:**

**Given** a user navigates to Billing → Invoices
**When** the page loads
**Then** stripe.service retrieves the user's invoices from Stripe
**And** invoices are displayed in a list with date, amount, status (paid/pending/failed), and download link (FR32)
**And** the SubscriptionCard shows current plan, next billing date, and payment method

### Story 6.4: Quota Enforcement System

As the system,
I want to enforce quota limits per subscription tier,
So that API costs are controlled and margins are protected.

**Acceptance Criteria:**

**Given** a user attempts to create content (Reel, Carousel, Post, AI image)
**When** the creation endpoint is called
**Then** quota.service checks the user's current usage atomically against their tier limit (FR33)
**And** if within quota, the usage counter is incremented atomically (check + decrement in single transaction)
**And** if quota is exhausted, the request is rejected with error code "QUOTA_EXCEEDED" and HTTP 429 (FR35)
**And** the error response includes a clear message: "Monthly [resource] quota reached" with upgrade CTA

**Given** a billing period resets (monthly on billing date)
**When** the period rolls over
**Then** quota_usage counters reset to zero for the new period

### Story 6.5: Quota Notifications

As a user,
I want to be notified when approaching my quota limits,
So that I can plan accordingly or upgrade before being blocked.

**Acceptance Criteria:**

**Given** a user's quota usage reaches 80% for any resource
**When** they next load the dashboard or create content
**Then** an amber warning banner shows "[Resource] quota at [X]% — [Y] remaining this month" (FR34)
**And** the QuotaIndicator changes from green to amber
**And** an "Upgrade for more" link is shown alongside the warning

### Story 6.6: Stripe Webhook Processing

As the system,
I want to process Stripe webhook events idempotently,
So that subscription lifecycle events are handled reliably without duplicate processing.

**Acceptance Criteria:**

**Given** Stripe sends a webhook event (subscription created, updated, deleted, invoice paid, payment failed)
**When** the POST /api/webhooks/stripe endpoint receives the event
**Then** the webhook signature is verified using the webhook secret
**And** the event is processed idempotently (duplicate events produce the same result) (FR36)
**And** subscription status, tier, and quota limits are updated accordingly
**And** the event is logged via Pino with event type and subscription ID

### Story 6.7: Failed Payment & Account Suspension

As the system,
I want to handle failed payments with dunning management,
So that revenue loss is minimized while treating users fairly.

**Acceptance Criteria:**

**Given** a user's payment fails
**When** Stripe triggers the payment_intent.payment_failed webhook
**Then** the system allows 3 retry attempts over 7 days (Stripe Billing handles retries) (FR37)
**And** the user is notified of the payment issue

**Given** all 3 payment retries fail
**When** the subscription is past due beyond the retry period
**Then** the user's account features are suspended (content creation blocked, scheduling paused)
**And** existing published content remains live
**And** the user sees a banner: "Payment failed — update payment method to restore access"

---

## Epic 7: Platform Administration & Monitoring

Admins can monitor system health, investigate errors, track API costs, and manage user accounts.

### Story 7.1: Admin Dashboard & System Health

As an admin,
I want to view platform-wide system health metrics,
So that I can ensure the platform is operating reliably.

**Acceptance Criteria:**

**Given** an admin navigates to the Admin page
**When** the page loads
**Then** the adminOnly middleware verifies the user has role "admin"
**And** the SystemHealthPanel shows: uptime %, average render time, publishing success rate, active users today (FR43)
**And** the SystemHealthPanel queries the existing `api_cost_logs` table (created in Story 2.4) for cost metrics
**And** the `audit_logs` table is created (if not exists) with: id, actor_id, action, target_type, target_id, metadata (jsonb), created_at

### Story 7.2: Publishing Error Investigation

As an admin,
I want to view and investigate publishing errors across all users,
So that I can identify systemic issues and help affected users.

**Acceptance Criteria:**

**Given** an admin views the Errors tab in the Admin page
**When** the page loads
**Then** a PublishErrorTable shows all failed publish_jobs across all users (FR44)
**And** each row shows: user email, content type, platform, error message, attempt count, timestamp
**And** the admin can click to view full error details
**And** the table is sortable and filterable by platform, error type, and date range

### Story 7.3: API Cost Monitoring

As an admin,
I want to monitor real-time API costs per user and aggregated platform costs,
So that I can protect margins and identify cost anomalies.

**Acceptance Criteria:**

**Given** an admin views the Costs tab
**When** the page loads
**Then** the ApiCostDashboard shows: today's total cost, cost per service (Fal.ai, Ayrshare, Claude, etc.), cost per user (FR45, FR49)
**And** a chart shows cost trends over the past 30 days
**And** per-user cost is compared against their subscription revenue to flag margin violations (> 40% cost)
**And** anomalies (users with unusually high costs) are highlighted

### Story 7.4: User Account Management

As an admin,
I want to view and manage user accounts,
So that I can provide support and adjust quotas when needed.

**Acceptance Criteria:**

**Given** an admin views the Users tab
**When** the page loads
**Then** a UserManagementTable shows all users with: email, display name, subscription tier, quota usage, connected platforms, signup date (FR46)
**And** the admin can click a user to view their full details
**And** the admin can manually adjust a user's quota limits (e.g., grant bonus Reels) (FR47)
**And** all admin actions are recorded in the audit_logs table (NFR33)

### Story 7.5: Token Refresh Management

As an admin,
I want to trigger token refresh for users with expired platform connections,
So that publishing doesn't silently fail due to expired tokens.

**Acceptance Criteria:**

**Given** an admin views users with expiring/expired tokens
**When** they click "Refresh Token" for a user's platform connection
**Then** the system attempts to refresh the OAuth token using the stored refresh_token (FR48)
**And** if successful, the new token is encrypted and stored, token_expires_at is updated
**And** if refresh fails, the admin is informed and can notify the user to re-authorize

**Given** the tokenRefresh.job.ts background job runs
**When** it scans for tokens expiring within 7 days
**Then** it proactively refreshes them automatically (NFR27)
**And** users are notified only if automatic refresh fails

---

## Epic 8: GDPR Compliance & Data Privacy

Users can delete their account and export their data in compliance with GDPR.

### Story 8.1: Account Deletion with Cascade

As a user,
I want to permanently delete my account and all associated data,
So that I can exercise my GDPR right to erasure.

**Acceptance Criteria:**

**Given** a user navigates to Settings → Account → Delete Account
**When** they click "Delete My Account"
**Then** an AlertDialog warns "This action is irreversible. All your content, connected accounts, and billing data will be permanently deleted."
**And** the user must type "DELETE" to confirm

**Given** the user confirms deletion
**When** the deletion process runs
**Then** within 72 hours (NFR29):
  - All content_items and associated R2 files are deleted
  - All publish_jobs are deleted
  - All platform_connections (and encrypted tokens) are deleted
  - The Stripe subscription is cancelled
  - The quota_usage record is deleted
  - The user record is anonymized or deleted
  - An audit log entry records the deletion
**And** the user is logged out and redirected to the landing page
**And** a confirmation email is sent: "Your Plublista account has been deleted"

### Story 8.2: Data Export

As a user,
I want to export all my personal data in a machine-readable format,
So that I can exercise my GDPR right to data portability.

**Acceptance Criteria:**

**Given** a user navigates to Settings → Account → Export My Data
**When** they click "Request Data Export"
**Then** the system queues a data export job
**And** within 30 days (NFR30), a JSON file is generated containing:
  - User profile data (email, display name, signup date)
  - All content items with metadata (titles, captions, hashtags, creation dates)
  - Connected platforms list (platform names, connection dates — NOT tokens)
  - Subscription and billing history
  - Quota usage history
**And** the user receives an email with a secure download link (valid for 7 days)
**And** the export does NOT include other users' data or encrypted tokens
