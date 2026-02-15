---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-13.md'
date: 2026-02-13
author: Utilisateur
---

# Product Brief: Publista

## Executive Summary

Publista is an AI-powered multi-platform content creation and publishing SaaS platform. It enables marketers, creators, and businesses to produce professional-quality Reels, Carousels, and Posts from a single tool — with every piece of content natively optimized for Instagram's 2026 algorithm ranking factors. Content can be published to Instagram, YouTube, TikTok, and 15+ platforms via a unified publishing layer (Ayrshare), with adaptive format selection (9:16 vertical, 16:9 horizontal, 1:1 square).

The platform's hero feature is **AI Auto-Montage**: users upload raw video clips and AI automatically produces algorithm-optimized Reels with smart cutting, transitions, music, text overlays, and adaptive format selection (9:16 for Reels/TikTok/Shorts, 16:9 for YouTube, 1:1 for Feed posts). For power users, a Scene Assembler allows building Reels scene-by-scene using AI-generated video, uploaded clips, and animated graphics.

Publista replaces the need for 5-6 separate tools (Canva, CapCut, Later, ChatGPT, Buffer) with one integrated platform. A Freemium tier with product-led virality ("Made with Publista" watermark on free content) drives organic acquisition through the very content users create.

---

## Core Vision

### Problem Statement

Social media content creators and marketers face a fragmented, time-consuming workflow. Producing a single optimized Reel requires jumping between a design tool (Canva), a video editor (CapCut), a scheduling tool (Later/Buffer), and an AI copywriter (ChatGPT). Each tool operates in isolation with no awareness of platform algorithm requirements. Publishing the same content across Instagram, YouTube, and TikTok means reformatting manually for each platform. The result: hours of work per post, inconsistent quality, and content that underperforms because it wasn't built with the algorithm in mind.

### Problem Impact

- **Time waste:** 2-4 hours per Reel using fragmented tools, multiplied across the recommended 3-4 Reels + 2-3 Carousels per week
- **Missed optimization:** Most creators don't know the 1.7-second hook rule, the jump-cut cadence, or the originality score — their content underperforms without understanding why
- **Cost accumulation:** Canva Pro ($13/mo) + CapCut Pro ($8/mo) + Later ($25/mo) + ChatGPT ($20/mo) + Buffer ($6/mo) = $72+/month across disconnected tools
- **Multi-platform friction:** Publishing the same content to Instagram, YouTube Shorts, and TikTok requires manual reformatting (9:16 vs 16:9 vs 1:1) and logging into each platform separately
- **Algorithm penalties:** CapCut and TikTok exports carry watermarks that Instagram's 2026 Originality Score actively penalizes, reducing reach
- **No AI video generation:** None of the mainstream tools offer AI video scene generation or AI auto-montage from raw clips

### Why Existing Solutions Fall Short

| Competitor | What It Does | What It Misses |
|-----------|-------------|----------------|
| **Canva** | Static design, basic video editing | No AI video generation, no algorithm optimization, no Instagram publishing |
| **CapCut** | Video editing with templates | Watermarks penalized by algorithm, no AI scene generation, no scheduling |
| **Later/Hootsuite** | Scheduling and analytics | No content creation at all — just publishes what you already made |
| **Buffer** | Multi-platform scheduling | No content creation, API closed to new devs since 2019, no AI features |
| **ChatGPT** | Text generation | No visual/video/music generation, no Instagram integration |

No existing tool combines AI content generation + algorithm optimization + multi-format support + publishing in one platform. This is the niche gap.

### Proposed Solution

Publista v2 is an all-in-one platform with a phased approach:

**Phase 1 (Launch) — Core Platform:**
1. **AI Auto-Montage** (Hero Feature) — Upload raw video clips, AI automatically edits them into algorithm-optimized Reels (smart cutting, transitions, music, text overlays, adaptive format)
2. **Scene Assembler** (Power User Mode) — Build Reels scene-by-scene using AI-generated video (Kling 3.0), AI CTAs, uploaded clips, and animated graphics (Remotion)
3. **Carousel Builder** — Create image carousels with AI image generation (Flux 2.0), reference image system, and algorithm-optimized 8-10 slide structures
4. **Single Post Creator** — AI-generated or uploaded images with optimized captions
5. **Format Selection** — Choose output format per content: 9:16 (Reels/TikTok/Shorts), 16:9 (YouTube), 1:1 (Feed). AI auto-adapts framing and composition
6. **Calendar & Scheduling** — Visual content calendar with algorithm-optimal posting times per platform
7. **Multi-Platform Publishing** — Unified publishing via Ayrshare API: Instagram (Reels + Carousels + Posts), YouTube (Shorts + Videos), TikTok, Facebook, LinkedIn, X, and 15+ platforms

**Phase 2 (Post-Launch) — Premium Features:**
7. **AI Human Actors** (HeyGen) — Realistic AI spokesperson/presenter scenes once quality is validated
8. **Analytics Dashboard** — Performance tracking and AI recommendations
9. **Multi-Account Management** — For agencies and teams

Every output is automatically optimized: 1.7s hooks, jump cuts every 3-5s, original audio (no watermarks), 3-5 targeted hashtags, and optimal content mix tracking.

### Key Differentiators

1. **Algorithm-Native** — The only tool where every feature is built around Instagram's confirmed ranking factors (watch time, sends per reach, originality score)
2. **AI Auto-Montage** — No competitor offers "upload raw clips → AI creates the edit" with algorithm-aware cutting patterns. This is the hero feature and primary acquisition hook
3. **All-in-One Niche** — Replaces 5-6 tools for one specific audience (social media marketers, Instagram-first) — not a generalist trying to serve everyone
4. **Multi-Platform, One Click** — Create once, publish everywhere (Instagram, YouTube, TikTok, 15+ platforms) with automatic format adaptation (9:16, 16:9, 1:1)
5. **Zero-Watermark Original Content** — Generates original audio and visuals, avoiding the algorithm penalty that CapCut/TikTok exports receive
6. **Product-Led Virality** — Free tier content carries subtle "Made with Publista" branding, turning every published post into organic marketing
7. **API Abstraction Layer** — Architecture designed with provider-agnostic AI layer, allowing seamless switching between Fal.ai, Replicate, or direct API calls without platform lock-in

---

## Target Users

### Primary Users

**Persona 1: Sophie — Freelance Social Media Manager**
- **Profile:** 28, manages 5-8 Instagram accounts for SMBs and e-commerce brands. Works solo from home.
- **Daily reality:** Spends 60% of time creating content (rest on strategy and reporting). Juggles Canva, CapCut, ChatGPT, Later. Produces ~15 Reels + 10 Carousels per week across clients.
- **Pain point:** Video editing consumes her time. She charges flat rates, so every hour saved = more margin or more clients. CapCut watermarks frustrate her.
- **Aha moment:** Uploads 3 clips from a restaurant client, auto-montage produces a perfect Reel in 2 minutes instead of 45. She takes on a new client that same day.
- **Willingness-to-pay:** €79/month without hesitation if it saves 10h/week.

**Persona 2: Marc — Digital Marketing Manager (SMB)**
- **Profile:** 35, sole marketer at a 20-person e-commerce company. Manages website, ads, email AND Instagram.
- **Daily reality:** Instagram isn't his top priority but he knows it's crucial. Posts 2-3 times/week, irregularly. No time or skill to learn video editing.
- **Pain point:** Knows Reels perform best but lacks video skills and time. Mostly posts static product photos that underperform.
- **Aha moment:** Uploads phone-shot product videos, auto-montage creates a professional Reel with music and CTA. His boss asks "did you hire an agency?"
- **Willingness-to-pay:** €29-79/month, easily justified to management by time savings.

**Persona 3: Léa — Social Media Agency Founder**
- **Profile:** 32, runs a 5-person agency managing 20-30 client Instagram accounts.
- **Daily reality:** Supervises production, trains juniors, pitches new clients. Content production is the bottleneck for growth.
- **Pain point:** Employees spend too much time on editing. Can't scale without hiring, and hiring is expensive. Quality varies by who does the editing.
- **Aha moment:** With Publista, a junior produces the same volume as a senior. She takes on 10 more clients without hiring.
- **Willingness-to-pay:** €499/month (Agency plan) — immediate ROI vs a salary.

### Secondary Users

- **Agency/freelance clients** — Don't touch Publista but benefit from more frequent, more professional, better-optimized content. They see their Instagram metrics rise.
- **Managers/decision-makers** — Approve the subscription budget. Need measurable results (Analytics in Phase 2).

### User Journey

| Stage | Sophie (Freelance) | Marc (SMB) | Léa (Agency) |
|-------|-------------------|------------|---------------|
| **Discovery** | Sees a "Made with Publista" Reel from a competitor, Google search, freelance community | LinkedIn article "AI tools for Instagram 2026" | Peer recommendation between agencies, sales demo |
| **Onboarding** | Free trial → imports a client account → tests auto-montage with existing clips | Free trial → connects company IG → tests with product photos | Sales demo → Agency plan → sets up client accounts |
| **Aha Moment** | First auto-montaged Reel in 2 min vs 45 min on CapCut | First Reel that breaks 10K views (personal record) | Math: 10h/week saved × 5 employees = 200h/month |
| **Core Usage** | Monday batch: 15 Reels + 10 Carousels for the week, scheduled via Calendar | 2-3 posts/week, primarily auto-montage | Standardized workflow for entire team, shared templates |
| **Retention** | Upgrades to Pro after trial, can't go back | Auto-renews, Instagram results justify budget to management | Scales to 40 clients, upgrades plan, requests multi-account |

---

## Success Metrics

### User Success Metrics

| Metric | Target | Measurement | Rationale |
|--------|--------|-------------|-----------|
| **Time-to-first-Reel** | < 5 minutes | Timer from signup to first exported Reel | Fast aha moment reduces trial abandonment |
| **Auto-montage acceptance rate** | > 70% | % of auto-montages published without Scene Assembler edits | Proves AI quality meets user expectations |
| **Content production speed** | 5x faster than manual | Time per Reel vs CapCut baseline (45 min → 9 min) | Core value proposition — time savings |
| **Weekly active creation** | 3+ posts/week | Posts created per user per week | Proves habitual product adoption |
| **Instagram performance lift** | +30% engagement | Avg engagement rate before/after Publista adoption | Proves algorithm optimization works |

### Business Objectives

| Timeframe | Objective | Target |
|-----------|----------|--------|
| **Month 1** | Revenue | €10,000 MRR |
| **Month 1** | Paying users | ~130 Starter or ~50 Pro (mix) |
| **Month 3** | Revenue | €25,000 MRR |
| **Month 3** | Monthly churn | < 8% |
| **Month 6** | Revenue | €50,000 MRR |
| **Month 12** | Revenue | €100,000+ MRR |
| **Month 12** | Market position | Top 3 "Instagram AI tools" on Google |

### Key Performance Indicators

**Acquisition:**
- Free trial signups: 500+/month (via "Made with Publista" virality + paid)
- Trial-to-paid conversion: > 15%
- Cost per acquisition (CPA): < €30
- Organic signups from "Made with Publista" watermark: 20%+ of total

**Activation:**
- Trial users creating first content within 24h: > 60%
- Trial users publishing to at least one platform from Publista: > 40%
- Time to aha moment (first auto-montage): < 10 minutes

**Retention:**
- Monthly churn: < 8%
- Weekly active users (WAU): > 60% of paying users
- Net Promoter Score (NPS): > 40

**Revenue:**
- MRR growth rate: 20%+ month-over-month (first 6 months)
- Average Revenue Per User (ARPU): > €60/month
- Lifetime Value (LTV): > €500
- LTV:CAC ratio: > 3:1

**Product:**
- Auto-montage usage: > 70% of all Reels created
- AI image generation: > 50% of carousels use Flux 2.0
- Publishing rate: > 80% of created content gets published (not abandoned)
- Multi-platform adoption: > 30% of users publish to 2+ platforms

---

## MVP Scope

### Core Features

| # | Feature | Description | Justification |
|---|---------|-------------|---------------|
| **M1** | **AI Auto-Montage** | Upload 1-10 video clips → AI analyzes, selects best moments, creates algorithm-optimized Reel with smart cuts, transitions, music, text overlays. Adaptive format (9:16, 16:9, 1:1). 5 montage styles (Dynamic, Cinematic, UGC, Tutorial, Hype). | Hero feature. THE aha moment. Core value proposition. |
| **M2** | **Carousel Builder + AI Images** | Create 2-20 slide carousels. AI image generation via Flux 2.0. Reference image upload system (grid with "+" buttons). Auto-generates 8-10 slides with hook slide 1 and CTA last slide. | 2nd highest engagement format (2.33%). Completes content mix. |
| **M3** | **Single Post Creator** | AI-generated or uploaded images with optimized captions. 1080×1350 preview. | Quick to build, completes the Reel + Carousel + Post trifecta. |
| **M4** | **AI Copy Generation** | Claude generates Instagram descriptions, hashtags (3-5 targeted), hook text, CTA copy. Algorithm-optimized language. | Already integrated. Essential for "all-in-one" value. |
| **M5** | **AI Music Generation** | CassetteAI via Fal.ai. 100+ presets, custom prompts, 10-180s duration. Original audio = Originality Score bonus. | Already integrated. Directly boosts algorithm ranking. |
| **M6** | **Multi-Platform Publishing** | Ayrshare unified API: Instagram (Reels + Carousels + Posts), YouTube (Shorts + Videos), TikTok, Facebook, LinkedIn, X, and 15+ platforms. Direct publish or scheduled. | Replaces single-platform Graph API. One integration = all platforms. Key differentiator. |
| **M6b** | **Format Selection** | Choose output format per content: 9:16 vertical (Reels/TikTok/Shorts), 16:9 horizontal (YouTube), 1:1 square (Feed). AI auto-adapts framing, composition, and text placement. | Essential for multi-platform publishing. Users create once, publish everywhere. |
| **M7** | **Calendar & Scheduling** | Visual weekly/monthly calendar. Schedule date+time. Content mix indicator (3-4R + 2-3C + 1-2P/week). | Pros need batch scheduling. Differentiator vs pure editors. |
| **M8** | **Dashboard** | Quick-create buttons, recent content, status badges, basic stats, weekly mix indicator. | Central hub. Entry point for all workflows. |
| **M9** | **Auth & User Accounts** | Email/password signup + login. User profiles. Session management. | SaaS requirement. |
| **M10** | **Stripe Billing** | Freemium + Starter (€29) + Pro (€79) + Business (€199) + Agency (€499). Free trial 7 days. | Revenue generation. |
| **M11** | **"Made with Publista" watermark** | Subtle branding on Free tier content. Removed on paid plans. | Zero-cost organic acquisition engine. |
| **M12** | **PostgreSQL Database** | Replace in-memory storage. Persistent jobs, users, content, settings. | Production SaaS requires reliable persistence. |

### Out of Scope for MVP

| Feature | Reason for Deferral | Planned Phase |
|---------|-------------------|---------------|
| **Scene Assembler (manual mode)** | Complex to build. Auto-montage covers 80% of needs. | Phase 1.5 (Month 2-3) |
| **AI Video Generation (Kling 3.0)** | Impressive but not core pain point — users have clips already. | Phase 1.5 (Month 2-3) |
| **AI Human Actors (HeyGen)** | Uncanny valley risk. High API cost. Not essential for core value. | Phase 2 (Month 4-6) |
| **Analytics Dashboard** | Nice-to-have. Native Instagram insights suffice initially. | Phase 2 (Month 4-6) |
| **Multi-Account Management** | Agency-only need. Not critical at launch. | Phase 2 (Month 4-6) |
| **Advanced video transitions** | Basic fade sufficient for MVP. | Phase 1.5 (Month 2-3) |
| **Full Brand Kit** | Basic logo overlay in MVP. Advanced fonts/colors later. | Phase 1.5 (Month 2-3) |
| **Platform-specific analytics** | Per-platform analytics (YouTube Studio, TikTok analytics). Native insights suffice initially. | Phase 2 (Month 4-6) |
| **Mobile app** | Web-first. Mobile via React Native later. | Phase 3 (Month 7-12) |
| **Template marketplace** | Requires active user base first. | Phase 3 (Month 7-12) |

### MVP Success Criteria

| Criterion | Threshold | Decision If Below |
|-----------|----------|-------------------|
| Trial signups (month 1) | > 300 | Revisit acquisition strategy |
| Trial-to-paid conversion | > 10% | Revisit onboarding and value proposition |
| MRR month 1 | > €5,000 | Revisit pricing and positioning |
| Auto-montage acceptance rate | > 60% | Improve AI quality before adding features |
| Weekly active creation | > 2 posts/user | Revisit UX and perceived value |
| Monthly churn | < 12% | Critical retention problem — investigate |

### Future Vision

**Phase 1.5 (Month 2-3) — Power User Features:**
- Scene Assembler (manual scene-by-scene building)
- AI Video Generation (Kling 3.0) in assembler
- Advanced transitions (slide, zoom, glitch, morph)
- Full Brand Kit (fonts, colors, templates)

**Phase 2 (Month 4-6) — Premium & Scale:**
- AI Human Actors (HeyGen avatars and digital twins)
- Analytics Dashboard with AI-powered recommendations
- Multi-Account Management (Agency tier)
- Public API for third-party integrations

**Phase 3 (Month 7-12) — Platform & Expansion:**
- Per-platform analytics (YouTube Studio integration, TikTok analytics, Instagram Insights in-app)
- Team collaboration features
- Template marketplace (user-generated)
- White-label for agencies
- Mobile app (React Native)
- Additional platforms via Ayrshare (Pinterest, Threads, etc.)
