---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
status: complete
completedAt: 2026-02-13
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Plublista-2026-02-13.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-13.md'
  - '_bmad-output/planning-artifacts/cost-analysis-Plublista-2026-02-13.md'
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
  other: 1
classification:
  projectType: saas_b2b
  domain: martech_social_media
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - Plublista

**Author:** Utilisateur
**Date:** 2026-02-13

## Executive Summary

**Product:** Plublista — AI-powered multi-platform content creation SaaS for social media managers, marketing teams, and agencies.

**Vision:** Transform social media content creation from a manual, time-consuming process into an AI-automated workflow that produces algorithm-optimized content and publishes it across 15+ platforms in one click.

**Core Differentiator:** AI Auto-Montage — upload raw video clips and get a fully edited, algorithm-optimized Reel in under 3 minutes. No existing tool offers this end-to-end automation. Combined with original AI music (CassetteAI), algorithm-native content optimization, multi-format adaptation (9:16, 16:9, 1:1), and unified multi-platform publishing (Ayrshare), Plublista creates a "create once, publish everywhere" workflow.

**Target Users:** Freelance social media managers (primary), marketing managers at SMBs, and digital agencies managing multiple client accounts.

**Business Model:** Freemium SaaS with 5 tiers — Free (€0), Starter (€29), Pro (€79), Business (€199), Agency (€499). Quota-based resource management. 7-day free trial on paid tiers.

**Project Context:** Brownfield (v1 exists as code-snippet-to-Instagram-Reel tool). V2 is a full SaaS rebuild. Classification: saas_b2b, martech_social_media domain, medium complexity.

## Success Criteria

### User Success

| Metric | Target | Measurement | Why It Matters |
|--------|--------|-------------|----------------|
| **Time-to-first-Reel** | < 5 minutes | Timer from signup to first exported Reel | Fast aha moment reduces trial abandonment |
| **Auto-montage acceptance rate** | > 70% | % of auto-montages published without manual edits | Proves AI quality meets user expectations |
| **Content production speed** | 5x faster than manual | Time per Reel vs CapCut baseline (45 min → 9 min) | Core value proposition — time savings |
| **Weekly active creation** | 3+ posts/week | Posts created per user per week | Proves habitual product adoption |
| **Instagram performance lift** | +30% engagement | Avg engagement rate before/after Plublista adoption | Proves algorithm optimization works |
| **Multi-platform adoption** | > 30% of users publish to 2+ platforms | Connected platforms per user | Validates multi-platform value |

### Business Success

| Timeframe | Metric | Target | Decision If Below |
|-----------|--------|--------|-------------------|
| **Month 1** | MRR | €10,000 (~120 paying users) | Revisit acquisition strategy |
| **Month 1** | Trial signups | > 300 | Revisit marketing channels |
| **Month 1** | Trial-to-paid conversion | > 15% | Revisit onboarding and value proposition |
| **Month 3** | MRR | €25,000 | Revisit pricing and positioning |
| **Month 3** | Monthly churn | < 8% | Critical retention problem — investigate |
| **Month 6** | MRR | €50,000 | Evaluate growth strategy |
| **Month 12** | MRR | €100,000+ | Scale or pivot |
| **Ongoing** | CPA | < €30 | Optimize acquisition channels |
| **Ongoing** | LTV:CAC ratio | > 3:1 | Ensure unit economics are healthy |
| **Ongoing** | ARPU | > €60/month | Validate pricing tiers |
| **Ongoing** | "Made with Plublista" organic signups | > 20% of total | Validates product-led virality |

### Technical Success

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Auto-montage rendering time** | < 3 minutes for a 30s Reel | Users expect near-instant results for the hero feature |
| **Platform uptime** | 99.5% | Publishing reliability is critical — missed schedule = lost reach |
| **Ayrshare publishing success rate** | > 95% | Failed publishes erode trust immediately |
| **API cost per user** | < 40% of subscription price | Maintain 60%+ gross margins across all tiers |
| **Page load / UI response** | < 2 seconds | Snappy UI retains power users doing batch creation |
| **Video upload processing** | < 30 seconds for 200MB clip | Upload friction kills the auto-montage workflow |
| **Concurrent rendering capacity** | 10+ simultaneous renders | Support batch creation workflows (Sophie: 15 Reels/Monday) |

### Measurable Outcomes

**User Outcome:** A freelance social media manager (Sophie) creates 15 Reels + 10 Carousels in a single Monday morning batch session, scheduled across 5 client accounts for the entire week. Total time: 3 hours instead of 15+ hours. She takes on 2 new clients that same month.

**Business Outcome:** 120 paying users at an average of €65/month generate €10K MRR in month 1. API costs average $22/user, fixed costs $1,100/month, yielding 58% net margin ($6,622/month profit).

**Technical Outcome:** The platform handles 50+ concurrent users, renders auto-montages in under 3 minutes, and publishes to 3+ platforms per user with 95%+ success rate. Zero data loss, zero missed scheduled posts.

## User Journeys

### Journey 1: Sophie — Monday Batch Session (Primary User, Success Path)

**Opening:** Monday morning, 8am. Sophie, freelance social media manager, opens Plublista with 7 client accounts to feed this week. Her list: 15 Reels + 10 Carousels. With CapCut, this took 15+ hours. With Plublista, she aims for 3 hours.

**Rising Action:** She starts with her restaurant client. Uploads 3 iPhone clips of the new daily special. Selects "UGC" style, 9:16 format, 30 seconds target. Clicks "Generate Auto-Montage". In 2 minutes, a Reel appears with a punchy hook, jump cuts, original music, and a "Book Now" CTA. She tweaks the hook text, validates. Moves to her e-commerce client: creates an 8-slide Carousel with Flux 2.0 generating product visuals from her reference photos. AI writes captions with targeted hashtags.

**Climax:** By 11am, all 15 Reels and 10 Carousels are created. She opens the Calendar, schedules everything for the week across Instagram + TikTok + YouTube Shorts. One click per content piece. Published to 3 platforms simultaneously via Ayrshare.

**Resolution:** Sophie freed her afternoon. She uses the time to pitch a new client. "With Plublista, I can take on 3 more clients without sacrificing quality." Her freelance MRR grows from €4K to €6K/month.

**Capabilities revealed:** Auto-montage, multi-clip upload, style selection, format selection, carousel builder, AI image generation, reference images, AI copy + hashtags, calendar scheduling, multi-platform publishing, batch workflow.

### Journey 2: Marc — First Reel Ever (Primary User, Onboarding/Edge Case)

**Opening:** Marc, marketing manager at a 20-person e-commerce company, sees a competitor posting Reels that go viral. He's never edited a video in his life. He spots a Reel with "Made with Plublista" and signs up for the free trial.

**Rising Action:** Onboarding asks him to connect his Instagram account via Ayrshare. He hesitates — "is this secure?" — but permissions are clearly explained with a trust badge. He lands on the Dashboard. The "New Reel" button catches his eye. He uploads 2 iPhone videos of his products (hastily shot, mediocre lighting). Selects "Auto-Montage", "Dynamic" style, and waits anxiously.

**Climax:** The result appears: AI selected the best moments, cut the blurry passages, added energetic music and a hook "These sneakers change everything". Marc whispers "I made this?" His boss walks by and asks: "Did you hire an agency?"

**Resolution:** Marc publishes his first Reel. 10K views in 48 hours — personal record. He upgrades to Starter (€29) before his trial ends. He now posts 3 times/week, his Instagram page gains 200 followers/week.

**Capabilities revealed:** "Made with Plublista" discovery, free trial signup, Instagram OAuth connection, onboarding flow, auto-montage with poor-quality input (AI resilience), AI enhancement of mediocre footage, one-click publish, upgrade funnel.

### Journey 3: Léa — Scaling the Agency (Primary User, Business Growth)

**Opening:** Léa runs a 5-person agency managing 25 Instagram accounts. Her bottleneck: content production. Her juniors take 1 hour per Reel on CapCut. Hiring would cost €3K/month.

**Rising Action:** She subscribes to the Agency plan (€499/month). Configures 10 client accounts in Plublista. Trains her 3 juniors in 30 minutes — the interface is intuitive. Juniors begin producing: upload client clips → auto-montage → review → schedule. A junior now produces 20 Reels/day instead of 5.

**Climax:** End of month: the agency produced 400 pieces of content for 25 clients. Same volume as before, but in 60% less time. Léa calculates: 200h/month saved × €25/h = €5,000 savings. Her €499 plan has a 10x ROI.

**Resolution:** Léa takes on 10 additional clients without hiring. She scales from 25 to 35 accounts. Her agency revenue grows from €15K to €22K/month. She requests Multi-Account Management (Phase 2 feature).

**Capabilities revealed:** Agency plan, multi-account setup, team onboarding, batch production workflow, content review/approval, ROI tracking, plan upgrade path, feature request channel.

### Journey 4: System Admin — Platform Operations (Admin/Ops)

**Opening:** The admin (founder initially, then an ops hire) monitors the platform on a Tuesday morning. They check the admin dashboard.

**Rising Action:** They notice 3 publications failed via Ayrshare (expired YouTube token for one user). A Pro user has reached 90% of their AI image quota. A new Stripe signup had a declined card. Today's API costs are normal ($45 for 120 active users).

**Climax:** They regenerate the YouTube token for the affected user, trigger an automated email to the Pro user approaching their quota ("Upgrade for more AI images"), and verify Stripe payment retry is configured.

**Resolution:** All systems operational. Day's metrics: 95% publishing success rate, 2.1min average render time, $0.37 average cost/user for the day. The admin schedules an automated weekly report.

**Capabilities revealed:** Admin dashboard, publishing error monitoring, quota tracking, API cost monitoring, Stripe billing management, token refresh handling, automated emails, system health metrics, error recovery workflows.

### Journey 5: Marc — Failed Publish & Recovery (Edge Case/Error)

**Opening:** Marc scheduled 5 posts for Wednesday. Thursday morning, he opens Plublista and sees 2 red badges: 2 publications failed.

**Rising Action:** He clicks the first error: "Instagram publishing failed — media format not supported". The Carousel contained a .webp image unsupported by Instagram. He clicks the second: "TikTok rate limit exceeded — retrying in 1 hour".

**Climax:** For the Carousel, Plublista offers "Re-convert images & retry". One click, images are converted to .jpg, and publishing succeeds. For TikTok, the automatic retry already worked — the post is live.

**Resolution:** Marc understands the system handles errors gracefully. He sees all 5 posts published successfully. He never needed to contact support. His trust in the platform increases.

**Capabilities revealed:** Error notifications, error diagnosis UI, automatic retry logic, media format conversion, publishing status tracking, error recovery actions, graceful degradation.

### Journey Requirements Summary

| Capability Area | Revealed By Journeys | Priority |
|----------------|---------------------|----------|
| **Auto-Montage Engine** | Sophie, Marc | MVP Critical |
| **Multi-platform Publishing** | Sophie, Marc, Léa | MVP Critical |
| **Error Handling & Recovery** | Marc (error), Admin | MVP Critical |
| **Onboarding & First Experience** | Marc | MVP Critical |
| **Calendar & Scheduling** | Sophie, Léa | MVP Critical |
| **Carousel Builder + AI Images** | Sophie | MVP Critical |
| **Quota Management & Billing** | Admin, Léa | MVP Important |
| **Admin Dashboard & Monitoring** | Admin | MVP Important |
| **Team/Agency Workflow** | Léa | Phase 2 |
| **Automated Notifications** | Admin, Marc (error) | MVP Important |
| **Format Conversion & Resilience** | Marc (error) | MVP Important |

## Domain-Specific Requirements

### Platform API Constraints

| Platform | Constraint | Mitigation |
|----------|-----------|------------|
| **Instagram Graph API** | Meta app review required for publishing access. Token expiry every 60 days. | Ayrshare abstracts token management. Fallback to direct Graph API for free tier. |
| **YouTube Data API** | Quota of 10,000 units/day per project. Video upload = 1,600 units. | Monitor quota usage, queue uploads during peak, request quota increase. |
| **TikTok API** | Rate limits on video publishing. Content review before going live. | Retry logic with exponential backoff. Inform users of TikTok's review delay. |
| **Ayrshare** | 5 requests/10 seconds per user. Business plan: 30 profiles base. | Request queuing. Volume pricing negotiation at scale. |

### Privacy & Data Protection

- **GDPR Compliance (EU users):** Consent management for data processing, right to erasure (delete all user content + account), data export/portability, privacy policy with clear data usage terms.
- **OAuth Token Storage:** All platform tokens encrypted at rest (AES-256). Tokens never exposed in frontend. Automatic refresh before expiry.
- **User Content:** Video clips and generated content stored with user ownership. Deletion cascades to all generated assets. No training on user content without explicit consent.
- **Payment Data:** Stripe handles all payment data (PCI DSS compliant). Plublista never stores card details.

### Content & Copyright

- **AI-Generated Music (CassetteAI):** Original compositions — no copyright issues. Commercial use included.
- **AI-Generated Images (Flux 2.0):** Original creations — commercial use included via Fal.ai terms.
- **User-Uploaded Content:** User's responsibility per Terms of Service. DMCA takedown process if copyright claims arise.
- **"Made with Plublista" Watermark:** Compliant with platform ToS. Removed on paid plans per user preference.

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. AI Auto-Montage (Primary Innovation)**
No existing tool offers "upload raw video clips → AI creates a fully edited, algorithm-optimized Reel." CapCut requires manual editing with templates. Canva has no video AI. ChatGPT has no visual generation. Plublista's auto-montage combines AI video analysis (moment detection, hook scoring, quality filtering) with algorithm-aware editing patterns (1.7s hook, 3-5s jump cuts, originality score optimization) in a single automated pipeline. This is a genuinely novel workflow automation.

**2. Algorithm-Native Content Engine**
Every feature is engineered around Instagram's confirmed 2026 ranking factors (watch time #1, sends per reach #2, originality score). No competitor builds content creation tools with algorithm awareness baked into the generation process. The platform doesn't just create content — it creates content designed to perform.

**3. Multi-Format AI Adaptation**
Create content once, and AI automatically adapts framing, composition, and text placement for three output formats (9:16, 16:9, 1:1). This eliminates the manual reformatting burden for multi-platform publishing. Combined with Ayrshare's unified API, this creates a "create once, publish everywhere" workflow that doesn't exist in any current tool.

**4. Product-Led Virality via Watermark**
The "Made with Plublista" watermark on free-tier content turns every published post into organic marketing. The product markets itself through the very content users create. This is a proven growth pattern (Mailchimp, Calendly) applied to social media content creation.

### Validation Approach

| Innovation | Validation Method | Success Threshold |
|-----------|------------------|-------------------|
| AI Auto-Montage | Acceptance rate (published without edits) | > 70% |
| Algorithm-Native | Engagement lift for Plublista-created content | +30% vs baseline |
| Multi-Format AI | % of users publishing to 2+ platforms | > 30% |
| Product-Led Virality | Organic signups from watermarked content | > 20% of total signups |

## SaaS B2B Specific Requirements

### Project-Type Overview

Plublista is a multi-tenant B2B SaaS platform targeting freelance social media managers, marketing teams, and agencies. The platform follows a freemium model with tiered subscriptions, quota-based resource management, and third-party API orchestration as core architectural concerns.

### Tenant Model

**Architecture:** Single-database multi-tenancy with row-level isolation via `user_id` foreign keys.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Isolation level** | Row-level (shared schema, shared database) | Cost-effective for MVP. Plublista workloads are compute-bound (AI APIs), not storage-bound. |
| **Data boundaries** | All user content (videos, images, generated assets) isolated by `user_id` | Users must never see another user's content or analytics. |
| **Resource isolation** | Quota-based per subscription tier | API cost control is critical — each user's AI consumption must be tracked and capped. |
| **Agency accounts (Phase 2)** | Parent-child account model: agency owner manages sub-accounts for clients | Agency tier (€499) manages up to 25 client profiles. Each sub-account has independent quotas and connected platforms. |
| **Scaling strategy** | Vertical scaling initially → horizontal with read replicas as user base grows | PostgreSQL handles 500+ concurrent tenants comfortably at MVP scale. |

### RBAC & Permission Matrix

**MVP Roles:**

| Role | Scope | Permissions |
|------|-------|-------------|
| **User (Free)** | Own account | Create content (limited quotas), publish to Instagram only (direct Graph API), view own dashboard |
| **User (Paid)** | Own account | Full content creation (tier quotas), multi-platform publishing (Ayrshare), scheduling, calendar, all AI features |
| **Admin** | Platform-wide | User management, billing oversight, API cost monitoring, publishing error triage, system health, quota adjustments |

**Phase 2 Roles (Post-MVP):**

| Role | Scope | Permissions |
|------|-------|-------------|
| **Agency Owner** | Agency + all sub-accounts | Create/manage sub-accounts, view aggregated analytics, manage team members, billing for all sub-accounts |
| **Agency Member** | Assigned sub-accounts | Create content for assigned accounts, schedule/publish, no billing access |
| **Agency Viewer** | Assigned sub-accounts | View content and calendar only, no create/publish |

**Authorization enforcement:** Middleware-level checks on every API route. No client-side-only permission gates.

### Subscription Tiers

| Tier | Price | Key Quotas | Target User | Gross Margin |
|------|-------|-----------|-------------|--------------|
| **Free** | €0 | 5 Reels/mo, 5 Carousels/mo, 10 AI images, Instagram only | Trial/hobby users | N/A (acquisition cost) |
| **Starter** | €29/mo | 30 Reels, 20 Carousels, 50 AI images, 3 platforms | Solo creators, small businesses | ~70% |
| **Pro** | €79/mo | 100 Reels, 60 Carousels, 200 AI images, 10 platforms | Freelancers, marketing managers | ~38% |
| **Business** | €199/mo | 300 Reels, 150 Carousels, 500 AI images, 15 platforms | Power users, small agencies | ~31% |
| **Agency** | €499/mo | 750 Reels, 400 Carousels, 1500 AI images, 25 profiles | Agencies managing multiple clients | ~38% |

**Billing implementation:**
- Stripe Checkout for signup, Stripe Billing for subscriptions
- 7-day free trial on all paid tiers (no card required for Free)
- Prorated upgrades/downgrades mid-cycle
- Dunning management: 3 retry attempts over 7 days before suspension
- Quota resets monthly on billing date
- Usage tracking in real-time via PostgreSQL counters (not eventual consistency)

### Integration List

| Integration | Purpose | Tier | Auth Method | Critical Path |
|-------------|---------|------|-------------|---------------|
| **Ayrshare** | Multi-platform publishing | Paid tiers | API key (server-side) | Yes — publishing core |
| **Instagram Graph API** | Direct publishing for Free tier | Free tier | OAuth 2.0 (user-granted) | Yes — free tier publishing |
| **Fal.ai** | AI generation (Flux 2.0 images, CassetteAI music, Kling 3.0 video) | All tiers | API key (server-side) | Yes — content generation core |
| **Anthropic Claude API** | AI text generation (captions, hashtags, hooks) | All tiers | API key (server-side) | Yes — copy generation |
| **Stripe** | Payments, subscriptions, billing | All tiers | API key + webhooks | Yes — revenue |
| **HeyGen** (Phase 2) | AI human actors, digital twins | Paid tiers | API key (server-side) | No — Phase 2 |
| **Vercel/Hosting** | Frontend deployment + serverless functions | Platform | Platform auth | Yes — infrastructure |
| **PostgreSQL (Neon/Supabase)** | Primary database | Platform | Connection string | Yes — data layer |

### Compliance Requirements

| Area | Requirement | Implementation |
|------|-------------|----------------|
| **GDPR** | Data processing consent, right to erasure, data portability | Consent banner, account deletion cascade (all content + metadata), data export endpoint |
| **Platform ToS** | Instagram, YouTube, TikTok developer terms | Ayrshare handles compliance for publishing. Direct Graph API follows Meta app review. No automation that violates platform rules. |
| **PCI DSS** | Payment card data security | Stripe handles all card data. Plublista never touches card numbers. |
| **Content Rights** | AI-generated content ownership | CassetteAI and Flux 2.0 outputs are commercially usable per API terms. Users own their generated content. Clear ToS language. |
| **Cookie/Tracking** | EU ePrivacy directive | Essential cookies only at MVP. Analytics cookies with consent. No third-party ad trackers. |
| **Data Residency** | EU data storage preference | Database hosted in EU region (Neon/Supabase EU). Media assets on CDN with EU origin. |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — deliver the core "time savings" value proposition with minimum viable features. The fastest path to validated learning is proving that Auto-Montage quality is good enough that users publish without manual edits (>70% acceptance rate).

**Core Hypothesis:** Social media managers will pay €29-499/month for a tool that reduces content creation time by 5x while improving algorithm performance.

**Resource Requirements:** Solo developer (founder) + AI APIs. No team needed for MVP. Estimated 8-12 weeks to launch.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

| Journey | MVP Support | Notes |
|---------|------------|-------|
| Sophie — Batch Session | Full | All batch creation + scheduling + multi-platform publish |
| Marc — First Reel | Full | Onboarding → auto-montage → publish (the "aha" moment) |
| Léa — Agency Scaling | Partial | Single-account only at MVP. Multi-account in Phase 2. |
| Admin — Platform Ops | Basic | Essential monitoring only. No automated alerts at MVP. |
| Marc — Error Recovery | Full | Error display, retry logic, format conversion |

**Must-Have Capabilities (Ship-or-Die):**

| # | Feature | Justification |
|---|---------|--------------|
| M1 | AI Auto-Montage | Hero feature. Without it, no product. |
| M2 | Carousel Builder + AI Images | Second most-used content type. Sophie's journey requires it. |
| M3 | Single Post Creator | Basic content type. Table stakes. |
| M4 | AI Copy Generation | Captions + hashtags are essential for every content piece. |
| M5 | AI Music Generation | Original audio is a key differentiator for Reels algorithm performance. |
| M6 | Multi-Platform Publishing | Core value prop — publish to 3+ platforms in one click. |
| M6b | Format Selection | Required for multi-platform (9:16, 16:9, 1:1). |
| M7 | Calendar & Scheduling | Batch workflow requires scheduling. Sophie can't function without it. |
| M8 | Dashboard | Entry point for all workflows. Quick-create buttons. |
| M9 | Auth & User Accounts | Cannot have a product without auth. |
| M10 | Stripe Billing | Cannot monetize without billing. 7-day trial critical for conversion. |
| M12 | PostgreSQL Database | Data persistence is non-negotiable. |

**Could-Be-Manual-Initially:**

| Feature | Manual Alternative | When to Automate |
|---------|-------------------|-----------------|
| M11 — Watermark | Manually add watermark in post-processing | Automate when >100 free users |
| Admin alerts | Founder checks dashboard daily | Automate when >200 users |
| Quota enforcement emails | Manual email when quota approached | Automate when >50 paid users |

**Explicitly Deferred from MVP:**

| Feature | Why Deferred | Phase |
|---------|-------------|-------|
| Scene Assembler (manual editing) | Auto-Montage is the hero — manual editing is a fallback, not the core value | Phase 1.5 |
| AI Video Generation (Kling 3.0) | $0.168/s cost is the #1 cost driver. Validate demand before adding. | Phase 1.5 |
| Advanced transitions | Enhances quality but auto-montage works with basic cuts | Phase 1.5 |
| Brand Kit | Nice-to-have for agencies, not essential for proving core hypothesis | Phase 1.5 |
| AI Human Actors (HeyGen) | $0.50-3.00/min, high cost, niche use case | Phase 2 |
| Analytics Dashboard | Users already have Instagram Insights. Plublista analytics is additive. | Phase 2 |
| Multi-Account Management | Léa needs it, but can use separate logins at MVP | Phase 2 |
| Public API | No third-party demand at launch | Phase 2 |
| Team collaboration | Requires RBAC complexity beyond MVP | Phase 3 |
| Template marketplace | Requires community scale | Phase 3 |
| White-label | Enterprise feature, premature at MVP | Phase 3 |
| Mobile app | Web-first is sufficient. Creators use desktop for batch work. | Phase 3 |

### Post-MVP Features

**Phase 1.5 — Enhancement (Month 2-3):**
- Scene Assembler for manual control (fallback for auto-montage rejections)
- AI Video Generation via Kling 3.0 (gate behind usage confirmation due to cost)
- Advanced transitions (slide, zoom, glitch, morph)
- Full Brand Kit (fonts, colors, logos, templates)
- Automated quota notification emails

**Phase 2 — Growth (Month 4-6):**
- AI Human Actors (HeyGen avatars and digital twins)
- Analytics Dashboard with AI-powered recommendations
- Multi-Account Management (Agency tier unlock)
- Public API for third-party integrations
- Agency roles (Owner, Member, Viewer)

**Phase 3 — Expansion (Month 7-12):**
- Per-platform analytics integration
- Team collaboration features
- Template marketplace (user-generated)
- White-label for agencies
- Mobile app (React Native)
- Additional platforms via Ayrshare (Pinterest, Threads)

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Auto-montage quality below 70% acceptance | Medium | Critical | Start with conservative editing patterns (proven jump-cut formulas). Add style variety incrementally. Fallback: Scene Assembler in Phase 1.5. |
| Fal.ai reliability issues | Low | High | Circuit breaker + graceful degradation to upload-only mode. Evaluate alternative providers (Replicate). |
| Ayrshare rate limits at scale | Low | Medium | Request queuing. Direct API fallback for Instagram. Negotiate volume pricing early. |
| PostgreSQL performance at >500 users | Low | Medium | Index optimization. Read replicas. Vertical scaling headroom with Neon/Supabase. |

**Market Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Users prefer manual editing control | Medium | High | Track auto-montage rejection reasons. Prioritize Scene Assembler if >30% rejection. |
| Price sensitivity in creator market | Medium | Medium | Free tier validates demand. 7-day trial reduces purchase friction. Competitive pricing vs CapCut Pro ($8) + scheduling tool ($30+). |
| Competitor launches similar AI auto-montage | Low | High | Speed-to-market advantage. Algorithm-native optimization is hard to replicate. Multi-platform + AI music combo creates defensibility. |

**Platform & Integration Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Meta revokes API access | Low | Critical | Ayrshare abstraction layer + direct Graph API fallback + multi-platform reduces single-platform dependency |
| Ayrshare service outage | Low | High | Retry queue with 24h buffer. Admin notification. Direct API fallback for Instagram. |
| Fal.ai API unavailable | Low | High | Graceful degradation to upload-only mode. Multiple model fallbacks (Kling → Wan). |
| OAuth token mass expiry | Medium | Medium | Proactive token refresh 7 days before expiry. User notification to re-authorize if refresh fails. |
| Platform ToS changes | Medium | Medium | API abstraction layer allows quick provider switching. Monitor platform developer blogs. |
| Algorithm rules change | Medium | Medium | Modular optimization rules — update parameters without code changes. Monitor Mosseri announcements. |

**Resource Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Solo developer burnout | Medium | High | MVP is 12 features, not 30. Lean on APIs for heavy lifting. No custom ML models. |
| API costs exceed projections | Low | Medium | Hard quotas per user. Real-time cost tracking. Throttle before loss. Break-even at 26 users. |
| Launch delay beyond 12 weeks | Medium | Medium | Cut watermark (M11) and advanced calendar features. Core = auto-montage + publish + billing. |

**Absolute Minimum Launch (if resources constrained):**
Auto-Montage (M1) + AI Copy (M4) + AI Music (M5) + Multi-Platform Publish (M6) + Auth (M9) + Stripe (M10) + Database (M12) = 7 features. Defer Carousel (M2), Single Post (M3), Format Selection (M6b), Calendar (M7), Dashboard (M8).

## Functional Requirements

### Content Creation

- **FR1:** Users can upload 1-10 video clips and generate an AI auto-montage Reel from them
- **FR2:** Users can select a montage style (Dynamic, Cinematic, UGC, Tutorial, Hype) when creating an auto-montage
- **FR3:** Users can select an output format (9:16 vertical, 16:9 horizontal, 1:1 square) for any content piece
- **FR4:** Users can create carousel posts with 2-20 slides combining uploaded and AI-generated images
- **FR5:** Users can provide reference images to guide AI image generation style and composition
- **FR6:** Users can create single image posts with AI-generated or uploaded images
- **FR7:** Users can preview content before publishing in the selected format
- **FR8:** Users can edit AI-generated text (hooks, captions, hashtags, CTAs) before publishing

### AI Generation

- **FR9:** The system can generate captions, hashtags (3-5), hook text, and CTA copy for any content piece
- **FR10:** The system can generate original music tracks (10-180 seconds) from style presets or custom prompts
- **FR11:** The system can generate images from text prompts and reference images for carousels and posts
- **FR12:** The system can analyze uploaded video clips to detect best moments, filter low-quality segments, and select optimal cuts
- **FR13:** The system can apply algorithm-aware editing patterns (hook timing, cut rhythm, originality optimization) to auto-montages

### Publishing & Distribution

- **FR14:** Paid users can publish content to multiple platforms simultaneously (Instagram, YouTube, TikTok, Facebook, LinkedIn, X) via Ayrshare
- **FR15:** Free users can publish content to Instagram via direct Graph API
- **FR16:** Users can connect and disconnect social media platform accounts
- **FR17:** Users can schedule content for future publication with a specific date and time
- **FR18:** Users can view all scheduled and published content in a visual calendar (weekly and monthly views)
- **FR19:** Users can view a content mix indicator showing the balance of content types scheduled
- **FR20:** The system can automatically retry failed publications with exponential backoff
- **FR21:** The system can convert media formats when a target platform rejects the original format

### User Management

- **FR22:** Visitors can sign up with email and password
- **FR23:** Users can log in and maintain authenticated sessions
- **FR24:** Users can connect social media accounts via OAuth authorization flow
- **FR25:** Users can view and manage their profile settings
- **FR26:** Users can view their current subscription tier, quota usage, and billing status
- **FR27:** New users can experience an onboarding flow that guides them to create their first content piece
- **FR28:** Users can request complete account deletion (GDPR erasure) cascading to all content and connected accounts
- **FR29:** Users can export their personal data (GDPR portability)

### Billing & Subscriptions

- **FR30:** Users can subscribe to a paid plan (Starter, Pro, Business, Agency) with a 7-day free trial
- **FR31:** Users can upgrade or downgrade their subscription with prorated billing
- **FR32:** Users can view their invoices and payment history
- **FR33:** The system enforces quota limits per subscription tier (Reels, Carousels, AI images, connected platforms)
- **FR34:** The system notifies users when approaching quota limits (80% threshold)
- **FR35:** The system prevents content creation when a user's quota is exhausted for that resource type
- **FR36:** The system processes Stripe webhook events idempotently for subscription lifecycle management
- **FR37:** The system suspends account features after failed payment retry attempts (3 retries over 7 days)

### Content Management

- **FR38:** Users can view a dashboard with quick-create buttons, recent content, and status badges
- **FR39:** Users can view the publishing status of all content (draft, scheduled, published, failed)
- **FR40:** Users can view error details and take recovery actions for failed publications
- **FR41:** Users can duplicate existing content to create variations
- **FR42:** Users can delete content and all associated generated assets

### Platform Administration

- **FR43:** Admins can view platform-wide system health metrics (uptime, render times, publishing success rate)
- **FR44:** Admins can view and investigate publishing errors across all users
- **FR45:** Admins can monitor real-time API cost per user and aggregated platform costs
- **FR46:** Admins can view and manage user accounts (subscription status, quota usage, connected platforms)
- **FR47:** Admins can manually adjust user quotas when needed
- **FR48:** Admins can trigger token refresh for users with expired platform connections
- **FR49:** The system tracks and displays real-time API cost per user for margin protection

### Growth & Virality

- **FR50:** Free-tier content displays a "Made with Plublista" watermark that is removed on paid plans
- **FR51:** The watermark links or references Plublista for organic discovery by content viewers

## Non-Functional Requirements

### Performance

| NFR | Target | Rationale |
|-----|--------|-----------|
| **NFR1:** Auto-montage render time | < 3 minutes for a 30-second Reel | Users expect near-instant results for the hero feature. Beyond 3 min, perceived as "broken". |
| **NFR2:** UI page load and interaction response | < 2 seconds for any user action | Snappy UI retains power users in batch workflows (Sophie: 25 content pieces/session). |
| **NFR3:** Video upload processing | < 30 seconds for files up to 200MB | Upload friction kills the auto-montage workflow. |
| **NFR4:** AI copy generation response | < 5 seconds for captions, hashtags, hooks | Text generation should feel instant relative to video rendering. |
| **NFR5:** Calendar and dashboard rendering | < 1 second for views with up to 100 content items | Batch users need fast navigation between content pieces. |
| **NFR6:** Concurrent rendering capacity | 10+ simultaneous auto-montage renders | Support batch creation peaks (Monday mornings for content managers). |
| **NFR7:** Publishing latency (scheduled posts) | Within 60 seconds of scheduled time | Late posts miss algorithm prime time windows. |

### Security

| NFR | Target | Rationale |
|-----|--------|-----------|
| **NFR8:** OAuth token storage | Encrypted at rest (AES-256), never exposed in frontend | Compromised tokens = unauthorized posting to user accounts. |
| **NFR9:** API keys (Ayrshare, Fal.ai, Stripe, Claude) | Server-side only, never in client bundle or browser | API key leak = financial exposure and service abuse. |
| **NFR10:** Authentication sessions | Secure HTTP-only cookies, CSRF protection, session expiry after 30 days of inactivity | Standard web application security. |
| **NFR11:** Data isolation | Users can never access another user's content, settings, or analytics | Multi-tenant security is fundamental. Verified by automated tests. |
| **NFR12:** Payment data handling | Zero PCI scope — Stripe handles all card data | Plublista never processes, stores, or transmits card numbers. |
| **NFR13:** Input validation | All user inputs sanitized server-side before processing | Prevent XSS, SQL injection, and command injection across all endpoints. |
| **NFR14:** HTTPS enforcement | All traffic encrypted in transit via TLS 1.2+ | No plaintext HTTP connections allowed. |

### Scalability

| NFR | Target | Rationale |
|-----|--------|-----------|
| **NFR15:** User capacity at MVP launch | 500 concurrent users with < 10% performance degradation | Month 1 target: 300+ signups. Headroom for growth. |
| **NFR16:** Database scaling | PostgreSQL handles 10,000 content records per user, 500+ users | Row-level isolation with proper indexing. Vertical scaling to 1,000+ users before read replicas needed. |
| **NFR17:** File storage scaling | Support 10GB average per user (videos, images, generated assets) | Cloud object storage (S3/R2) with CDN. Auto-scales. |
| **NFR18:** API cost scaling | Linear cost growth — no per-user cost exceeds 40% of their subscription revenue | Quota enforcement ensures predictable margins at any scale. |
| **NFR19:** Rendering queue scaling | Queue-based processing absorbs burst traffic without dropping requests | Monday morning peaks (batch users) handled via job queue, not rejected. |

### Reliability

| NFR | Target | Rationale |
|-----|--------|-----------|
| **NFR20:** Platform uptime | 99.5% (< 3.6 hours downtime/month) | Publishing reliability is critical — missed schedule = lost reach. |
| **NFR21:** Publishing success rate | > 95% of scheduled posts published successfully | Failed publishes erode trust immediately. |
| **NFR22:** Data durability | Zero data loss for user content and account data | User content is irreplaceable. Database backups daily, point-in-time recovery. |
| **NFR23:** Graceful degradation | System remains partially functional when external APIs are unavailable | Fal.ai down → upload-only mode. Ayrshare down → queue for 24h retry. Stripe down → existing sessions continue. |
| **NFR24:** Error recovery | All failed operations retryable without data corruption | Idempotent operations, transaction rollbacks, retry-safe queue processing. |

### Integration Resilience

| NFR | Target | Rationale |
|-----|--------|-----------|
| **NFR25:** External API retry policy | Exponential backoff, max 3 retries, circuit breaker after 5 consecutive failures | Prevent cascade failures while maximizing delivery success. |
| **NFR26:** Webhook processing | 100% idempotent — duplicate Stripe events processed safely | Stripe may fire webhooks multiple times. No double-charges or missed state updates. |
| **NFR27:** Token management | Proactive refresh 7 days before expiry, user notification on refresh failure | Expired tokens cause silent publishing failures — worst UX scenario. |
| **NFR28:** API response timeout | 30-second timeout for all external API calls, user notified on timeout | No indefinite hangs. Clear feedback when an external service is slow. |

### Data Privacy & Compliance

| NFR | Target | Rationale |
|-----|--------|-----------|
| **NFR29:** GDPR data erasure | Complete account deletion within 72 hours of request, cascading to all assets | Legal requirement for EU users. |
| **NFR30:** GDPR data export | User data exportable in machine-readable format (JSON) within 30 days of request | Legal requirement for EU users. |
| **NFR31:** Cookie consent | Only essential cookies without consent. Analytics/tracking cookies require explicit opt-in | EU ePrivacy directive compliance. |
| **NFR32:** Data residency | Primary database and media storage hosted in EU region | User expectation for EU-focused SaaS. Reduces GDPR cross-border transfer complexity. |
| **NFR33:** Audit logging | All admin actions and sensitive operations logged with timestamp and actor | Required for security investigation and compliance evidence. |
