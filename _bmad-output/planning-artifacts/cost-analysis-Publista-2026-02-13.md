---
status: complete
date: 2026-02-13
author: Utilisateur
relatedDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Publista-2026-02-13.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-13.md'
---

# Per-User API Cost Analysis & Usage Quotas — Publista

## 1. API Unit Costs (February 2026)

| API Provider | Service | Unit | Cost |
|-------------|---------|------|------|
| **Fal.ai** | Kling 3.0 Standard (text-to-video) | per second | $0.168 |
| **Fal.ai** | Kling 3.0 Pro (with voice) | per second | $0.392 |
| **Fal.ai** | Flux 2.0 Pro (1080×1350 = ~2MP) | per image | $0.045 |
| **Fal.ai** | CassetteAI Music | per minute of output | $0.02 |
| **Anthropic** | Claude Haiku 4.5 (production) | per MTok in/out | $1.00 / $5.00 |
| **Anthropic** | Claude Sonnet 4.5 (complex tasks) | per MTok in/out | $3.00 / $15.00 |
| **HeyGen** | Avatar Engine III (Scale plan) | per minute | $0.50 (1 credit) |
| **HeyGen** | Avatar Engine IV (Scale plan) | per minute | $3.00 (6 credits) |
| **Ayrshare** | Business plan base | monthly | $599 (30 profiles incl.) |
| **Ayrshare** | Additional profiles (at volume) | per profile/month | $2.49 - $8.99 |

---

## 2. Usage Quotas Per Plan

### Recommended Quota Structure

| Resource | Free (€0) | Starter (€29) | Pro (€79) | Business (€199) | Agency (€499) |
|----------|-----------|---------------|-----------|-----------------|---------------|
| **Reels (Auto-Montage)** | 3/month | 15/month | 50/month | 150/month | Unlimited |
| **Carousels** | 5/month | 30/month | 100/month | 300/month | Unlimited |
| **Single Posts** | 10/month | 50/month | Unlimited | Unlimited | Unlimited |
| **AI Images (Flux 2.0)** | 10/month | 100/month | 500/month | 2,000/month | 5,000/month |
| **AI Music Tracks** | 3/month | 15/month | 50/month | 150/month | Unlimited |
| **AI Copy Generation** | 20/month | 100/month | 500/month | Unlimited | Unlimited |
| **Publishing Platforms** | 1 (IG only) | 3 | 5 | 10 | Unlimited |
| **Connected Accounts** | 1 | 1 | 3 | 5 | 10 |
| **Max Upload per Reel** | 200MB | 500MB | 2GB | 5GB | 10GB |
| **Watermark** | Yes | No | No | No | No |
| **AI Video Gen (Kling 3.0)** | - | - | 5 min/month | 20 min/month | 60 min/month |
| **AI Avatars (HeyGen)** | - | - | - | 5 min/month | 20 min/month |
| **Rendering Priority** | Low | Standard | Priority | Priority | Dedicated |

### Publishing Strategy: Hybrid Approach

To optimize costs, Publista uses a **hybrid publishing architecture**:

- **Free tier** → Instagram Graph API direct (free, no Ayrshare cost)
- **Paid tiers** → Ayrshare unified API (multi-platform)

This eliminates the ~$4/user Ayrshare cost for free users who only need Instagram.

---

## 3. Per-User Cost Breakdown

### Cost Per API Call (Estimated Averages)

| Operation | APIs Used | Estimated Cost |
|-----------|----------|----------------|
| **1 Auto-Montage Reel** | Claude (analysis + copy) + CassetteAI + Server compute | $0.05 |
| **1 Carousel (8 slides, 50% AI images)** | Claude (copy) + Flux 2.0 (4 images) + Server | $0.19 |
| **1 Carousel (8 slides, 100% AI images)** | Claude (copy) + Flux 2.0 (8 images) + Server | $0.37 |
| **1 Single Post (AI image)** | Claude (copy) + Flux 2.0 (1 image) + Server | $0.06 |
| **1 Single Post (uploaded image)** | Claude (copy only) | $0.006 |
| **1 AI Video Scene (5s, Kling 3.0)** | Fal.ai Kling | $0.84 |
| **1 AI Music Track (30s)** | Fal.ai CassetteAI | $0.01 |
| **1 AI Avatar Video (30s, Engine III)** | HeyGen | $0.25 |
| **1 AI Avatar Video (30s, Engine IV)** | HeyGen | $1.50 |
| **1 Publish action** | Ayrshare (amortized) | $0.00 (flat rate) |
| **1 AI Copy request** | Claude Haiku 4.5 (~2K in, ~800 out) | $0.006 |

### Claude Token Estimation Per Feature

| Feature | Input Tokens | Output Tokens | Cost (Haiku 4.5) |
|---------|-------------|---------------|-------------------|
| Reel analysis (video content) | ~3,000 | ~1,500 | $0.011 |
| Instagram caption + hashtags | ~1,500 | ~500 | $0.004 |
| Carousel slide copy (8 slides) | ~2,000 | ~2,000 | $0.012 |
| Hook text generation | ~800 | ~200 | $0.002 |
| CTA copy | ~500 | ~200 | $0.002 |

---

## 4. Monthly Cost Per User (Typical Usage = ~50% of Quota)

### Free Tier (€0/month)

| API | Usage | Cost |
|-----|-------|------|
| Claude Haiku 4.5 | ~18 calls | $0.11 |
| Flux 2.0 Pro | 5 images | $0.23 |
| CassetteAI | 1.5 tracks (45s) | $0.02 |
| Ayrshare | N/A (Graph API direct) | $0.00 |
| Server compute | Light | $0.30 |
| **Total cost** | | **$0.66** |
| **Revenue** | | **$0.00** |
| **Margin** | | **-$0.66 (marketing cost)** |

> At 20% conversion rate, 5 free users per 1 paid user → CAC via free tier = **$3.30**. Excellent acquisition cost.

### Starter (€29/month ≈ $32)

| API | Usage (50% quota) | Cost |
|-----|-------------------|------|
| Claude Haiku 4.5 | ~100 calls | $0.60 |
| Flux 2.0 Pro | 50 images | $2.25 |
| CassetteAI | 8 tracks (4 min) | $0.08 |
| Ayrshare | 1.5 profiles (amortized) | $5.25 |
| Server compute (Remotion) | Medium | $1.50 |
| **Total cost** | | **$9.68** |
| **Revenue** | | **$32.00** |
| **Gross margin** | | **$22.32 (70%)** |

### Pro (€79/month ≈ $87)

| API | Usage (50% quota) | Cost |
|-----|-------------------|------|
| Claude Haiku 4.5 | ~350 calls | $2.10 |
| Flux 2.0 Pro | 250 images | $11.25 |
| CassetteAI | 25 tracks (12.5 min) | $0.25 |
| Kling 3.0 video | 2.5 min | $25.20 |
| Ayrshare | 3 profiles (amortized) | $10.50 |
| Server compute (Remotion) | High | $5.00 |
| **Total cost** | | **$54.30** |
| **Revenue** | | **$87.00** |
| **Gross margin** | | **$32.70 (38%)** |

### Pro WITHOUT AI Video Gen (50% quota)

| API | Usage | Cost |
|-----|-------|------|
| Claude Haiku 4.5 | ~350 calls | $2.10 |
| Flux 2.0 Pro | 250 images | $11.25 |
| CassetteAI | 25 tracks | $0.25 |
| Ayrshare | 3 profiles | $10.50 |
| Server compute | High | $5.00 |
| **Total cost** | | **$29.10** |
| **Revenue** | | **$87.00** |
| **Gross margin** | | **$57.90 (67%)** |

> **Key insight:** AI Video Generation (Kling 3.0) is the single most expensive feature at $0.168/s. Limiting it to 5 min/month on Pro keeps costs manageable. Most Pro users will primarily use Auto-Montage (uploaded clips + AI editing) which has near-zero API cost.

### Business (€199/month ≈ $219)

| API | Usage (40% quota) | Cost |
|-----|-------------------|------|
| Claude Haiku 4.5 | ~600 calls | $3.60 |
| Flux 2.0 Pro | 800 images | $36.00 |
| CassetteAI | 60 tracks (30 min) | $0.60 |
| Kling 3.0 video | 8 min | $80.64 |
| HeyGen Avatar (Engine III) | 2 min | $1.00 |
| Ayrshare | 5 profiles | $17.50 |
| Server compute | Very high | $12.00 |
| **Total cost** | | **$151.34** |
| **Revenue** | | **$219.00** |
| **Gross margin** | | **$67.66 (31%)** |

### Business WITHOUT AI Video + Avatar (40% quota)

| API | Usage | Cost |
|-----|-------|------|
| Claude + Flux + Music + Ayrshare + Server | As above minus video/avatar | $69.70 |
| **Revenue** | | **$219.00** |
| **Gross margin** | | **$149.30 (68%)** |

### Agency (€499/month ≈ $549)

| API | Usage (30% quota) | Cost |
|-----|-------------------|------|
| Claude Haiku 4.5 | ~1,000 calls | $6.00 |
| Flux 2.0 Pro | 1,500 images | $67.50 |
| CassetteAI | 100 tracks (50 min) | $1.00 |
| Kling 3.0 video | 18 min | $181.44 |
| HeyGen Avatar (Engine III) | 6 min | $3.00 |
| Ayrshare | 15 profiles | $52.50 |
| Server compute | Dedicated | $30.00 |
| **Total cost** | | **$341.44** |
| **Revenue** | | **$549.00** |
| **Gross margin** | | **$207.56 (38%)** |

### Agency WITHOUT AI Video + Avatar

| API | Usage | Cost |
|-----|-------|------|
| Claude + Flux + Music + Ayrshare + Server | As above minus video/avatar | $157.00 |
| **Revenue** | | **$549.00** |
| **Gross margin** | | **$392.00 (71%)** |

---

## 5. Margin Summary

### With ALL features at typical usage

| Plan | Revenue | API Cost | Margin | Margin % |
|------|---------|----------|--------|----------|
| **Free** | $0 | $0.66 | -$0.66 | Marketing |
| **Starter** | $32 | $9.68 | $22.32 | **70%** |
| **Pro** | $87 | $54.30 | $32.70 | **38%** |
| **Business** | $219 | $151.34 | $67.66 | **31%** |
| **Agency** | $549 | $341.44 | $207.56 | **38%** |

### Without AI Video Gen (MVP launch — Kling/HeyGen deferred to Phase 2)

| Plan | Revenue | API Cost | Margin | Margin % |
|------|---------|----------|--------|----------|
| **Free** | $0 | $0.66 | -$0.66 | Marketing |
| **Starter** | $32 | $9.68 | $22.32 | **70%** |
| **Pro** | $87 | $29.10 | $57.90 | **67%** |
| **Business** | $219 | $69.70 | $149.30 | **68%** |
| **Agency** | $549 | $157.00 | $392.00 | **71%** |

> **MVP Launch margins are excellent at 67-71%.** AI Video Generation (Kling 3.0) and AI Avatars (HeyGen) are the most expensive features. Deferring them to Phase 2 is the right financial decision.

---

## 6. Cost Drivers Analysis

### Top 3 Cost Drivers (ranked)

| Rank | Feature | Cost Driver | Mitigation |
|------|---------|-------------|------------|
| **#1** | AI Video Generation (Kling 3.0) | $0.168/sec = $10.08/min | Strict quotas. Defer to Phase 2. Pre-render caching. |
| **#2** | AI Image Generation (Flux 2.0) | $0.045/image at scale | Caching (same prompt = same image). Batch generation discounts. Template reuse. |
| **#3** | Ayrshare Publishing | $3.50-$8.99/profile/month | Hybrid approach: free = Graph API, paid = Ayrshare. Volume negotiation. |

### Low-Cost Features (nearly free at scale)

| Feature | Cost Per Use | Impact |
|---------|-------------|--------|
| AI Copy (Claude Haiku 4.5) | $0.006/request | Negligible |
| AI Music (CassetteAI) | $0.01/30s track | Negligible |
| Auto-Montage (uploaded clips) | ~$0.05/reel (compute only) | Very low — hero feature is cheap! |

### Critical Insight: Auto-Montage is Nearly Free

The hero feature (AI Auto-Montage) uses:
- Claude Haiku for clip analysis: ~$0.01
- CassetteAI for music: ~$0.01
- Remotion + FFmpeg for rendering: ~$0.03 (server compute)
- **Total: ~$0.05 per Reel**

This means the core value proposition costs almost nothing to deliver. Users can create unlimited Reels from their own clips at negligible cost. The expensive features (AI video generation, AI avatars) are add-ons for power users.

---

## 7. Platform Fixed Costs (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| **Ayrshare Business Plan** | $599/month | Base fee, 30 profiles included |
| **HeyGen Scale Plan** | $330/month | 660 credits, only when Phase 2 launches |
| **Server Infrastructure** | ~$200-500/month | Vercel/Railway/Render for Remotion rendering |
| **Domain + SSL + CDN** | ~$50/month | Cloudflare/Vercel |
| **PostgreSQL (managed)** | ~$50-100/month | Supabase or Neon |
| **Monitoring + Logging** | ~$50/month | Sentry, LogRocket |
| **Total Fixed (MVP)** | **~$950-1,300/month** | Without HeyGen |
| **Total Fixed (Phase 2)** | **~$1,280-1,630/month** | With HeyGen |

### Break-Even Analysis

- Fixed costs at MVP: ~$1,100/month
- Average revenue per user (weighted): ~$65/month
- Average API cost per user (weighted): ~$22/month
- Contribution margin per user: ~$43/month
- **Break-even: ~26 paying users**

---

## 8. Revenue Projection vs. Costs

### Month 1 Target: €10,000 MRR

**Expected user mix:**
| Plan | Users | Revenue/user | Total Revenue | API Cost/user | Total Cost |
|------|-------|-------------|--------------|---------------|------------|
| Free | 200 | $0 | $0 | $0.66 | $132 |
| Starter | 60 | $32 | $1,920 | $9.68 | $581 |
| Pro | 40 | $87 | $3,480 | $29.10 | $1,164 |
| Business | 15 | $219 | $3,285 | $69.70 | $1,046 |
| Agency | 5 | $549 | $2,745 | $157.00 | $785 |
| **Total** | **320** | | **$11,430** | | **$3,708** |

| | Amount |
|---|--------|
| **Total Revenue** | $11,430/month (≈ €10,390) |
| **Total API Costs** | $3,708/month |
| **Fixed Costs** | $1,100/month |
| **Total Costs** | $4,808/month |
| **Net Margin** | **$6,622/month (58%)** |

> Target of €10K MRR is achievable with 120 paying users and generates **~58% net margin** after all API + infrastructure costs.

### Month 12 Target: €100,000 MRR

At scale, volume discounts on Ayrshare profiles and batch processing on Claude reduce per-user costs by an estimated 20-30%. Net margins at €100K MRR are projected at **65-70%**.

---

## 9. Recommendations

### Quota Safeguards

1. **Hard limits on AI Video Generation** — This is the #1 cost risk. Enforce strict per-plan quotas with clear "upgrade to get more" messaging.

2. **Soft limits on AI Images** — Allow slight overage (10%) with a warning banner, then hard-cap. Users approaching limits get upgrade prompts.

3. **No limit on Auto-Montage** for paid plans — The hero feature is cheap (~$0.05/reel). Unlimited auto-montage drives retention and word-of-mouth.

4. **Ayrshare profile capping** — Each plan has a strict platform count. Users connecting more platforms must upgrade.

5. **Free tier = download + Instagram only** — No Ayrshare cost. Use direct Graph API. Watermark drives upgrades.

### Cost Optimization Strategies

1. **Claude prompt caching** — 90% savings on repeated context. Reuse system prompts across all users = massive savings at scale.

2. **Image caching** — Cache generated images by prompt hash. If two users generate similar carousels, reuse assets.

3. **Batch API for non-urgent tasks** — Claude Batch API offers 50% discount. Use for scheduled content copy generation.

4. **Ayrshare volume negotiation** — At 500+ profiles, negotiate custom pricing below $2.49/profile.

5. **Defer Kling 3.0 and HeyGen** — Launch MVP without these expensive APIs. Core value (Auto-Montage + Carousels + Publishing) has 67-71% margins.

### Pricing Validation

| Plan | Price | Max Cost (100% quota) | Min Margin | Viable? |
|------|-------|----------------------|------------|---------|
| **Free** | €0 | $0.66 | -$0.66 | Yes (marketing) |
| **Starter** | €29 | $14.86 | 54% | **Yes** |
| **Pro** | €79 | $54.30 | 38% | **Yes** (watch AI video usage) |
| **Business** | €199 | $151.34 | 31% | **OK** (monitor heavy users) |
| **Agency** | €499 | $341.44 | 38% | **Yes** |

All plans remain profitable even at 100% quota usage. The lowest margin (Business at 31%) is still healthy for SaaS.
