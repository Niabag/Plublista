---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'Plublista v2 - Evolution from code-to-reel to full Instagram content creation SaaS'
session_goals: 'Define architecture, AI stack, and feature set for a marketing-optimized Instagram content platform'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['Market Research', 'Algorithm Analysis', 'Technology Benchmarking', 'Strategic Decision Matrix']
ideas_generated: []
context_file: '_bmad/bmm/data/project-context-template.md'
---

# Brainstorming Session Results

**Facilitateur:** Utilisateur
**Date:** 2026-02-13

---

## Session Overview

**Topic:** Plublista v2 — Pivot from "Code → Instagram Reel" tool to a full-scale AI-powered Instagram content creation SaaS platform
**Goals:** Define the complete feature set, technology stack, and architecture optimized for Instagram's 2026 algorithm

---

## PART 1: INSTAGRAM ALGORITHM INTELLIGENCE (2026)

### Algorithm Ranking Factors (Confirmed by Adam Mosseri)

| Factor | Weight | Implication for Plublista |
|--------|--------|--------------------------|
| **Watch Time** | #1 Most Important | Must generate content with strong 3-second hooks. Viewers decide in 1.7s. 60%+ hold rate = 5-10x more reach |
| **Sends Per Reach (DM Shares)** | #2 for Discovery | Content must be shareable — emotional, useful, or surprising |
| **Likes Per Reach** | #3 for Followers | Quality and relevance to audience |
| **Originality Score** | NEW 2026 | Algorithm penalizes watermarked content (TikTok/CapCut logos). Original audio/voiceovers get preference |
| **Consistency** | Growth Factor | 3-5 Reels/week is the sweet spot |

### Content Format Performance (2026 Data)

| Format | Engagement Rate | Reach Rate | Best For |
|--------|----------------|------------|----------|
| **Carousels (mixed media)** | **2.33%** highest | Moderate | Saves, engagement, education |
| **Carousels (image only)** | 1.80% | Moderate | Saves, tutorials |
| **Reels** | 1.23% | **30.81%** highest | Discovery, new audience growth |
| **Static Images** | 0.70% | Low | Simple announcements |

### Critical Optimization Rules for Generated Content

1. **Hook in first 1.7 seconds** — visual hook must stop the scroll
2. **Jump cuts every 3-5 seconds** → +32% engagement
3. **Trending audio** → +42% engagement (but Plublista should generate original audio for Originality Score bonus)
4. **Optimal Reel length:** 7-30s for viral potential, 30-90s for storytelling
5. **Carousels:** 8-10 slides at 1080×1350px portrait, strong hook slide 1, CTA on last slide
6. **Mixed-media carousels** (image + video slides) perform 30% better than image-only
7. **Optimal posting mix:** 3-4 Reels + 2-3 Carousels + 1-2 static posts per week
8. **3-5 targeted hashtags** (not spammed)
9. **No watermarks** from other tools — clean original content
10. **Design for saves and shares** — templates, checklists, actionable content

---

## PART 2: TECHNOLOGY DECISIONS — AI STACK

### Decision 1: Video Generation API → **Fal.ai (Multi-Model Gateway)**

**Why Fal.ai as the primary gateway:**
- Already integrated in Plublista for music generation
- Access to 600+ models through ONE unified API
- Includes Kling 3.0, Veo 3, Hailuo, Wan 2.6, and more
- Pay-per-second pricing (cheapest option)
- No need to integrate multiple separate APIs

**Primary video models via Fal.ai:**

| Model | Cost | Best For | Quality |
|-------|------|----------|---------|
| **Kling 3.0** (Feb 2026) | ~$0.10/sec | Multi-shot sequences, subject consistency, cinematic | Top tier |
| **Veo 3** (Google) | ~$0.20/sec | Highest quality, audio+video sync | Premium |
| **Wan 2.6** | ~$0.05/sec | Budget-friendly, good quality | Good |
| **Hailuo** | ~$0.07/sec | Fast generation, social content | Good |

**Recommendation:** Default to **Kling 3.0** for quality-cost balance. Offer Veo 3 as "Premium" option. Wan 2.6 as "Economy" option.

### Decision 2: AI Human Actors/Avatars → **HeyGen API**

**Why HeyGen:**
- Avatar IV: 4K native rendering, indistinguishable from real camera footage
- Digital Twins: create custom avatar from single photo
- 175+ languages for international marketing
- Voice Doctor: control pitch, pace, emotional inflection
- All avatar types available via API (UGC, Professional, Lifestyle)
- Video Agent Beta: describe video in text → auto-produces everything

**Pricing:** $99/month for 100 credits (Pro), ~$0.50/credit per 30-second video

**Use case in Plublista:** Generate spokesperson/presenter scenes, UGC-style testimonials, product presentations with realistic human actors

### Decision 3: Image Generation → **Flux 2.0 Pro via Fal.ai**

**Why Flux 2.0:**
- #1 for photorealism in 2026 benchmarks
- Already accessible via Fal.ai (no new integration needed)
- $0.03/image at 1024×1024, ~$0.045 at 1080×1350 (Instagram portrait)
- Commercial use included
- Multi-reference editing: can use uploaded images as style references

**Backup: Ideogram 2.0** for text-heavy images (best text rendering in images)

### Decision 4: Video Assembly/Rendering → **Remotion + FFmpeg Hybrid**

**Why Remotion:**
- React-based (matches existing tech stack)
- Programmatic video creation — perfect for scene assembly
- Frame-by-frame rendering with full control
- Transitions, effects, overlays all in React/CSS
- Can render server-side to MP4
- Open source, active community
- Remotion Skills (2026): AI can generate video code from descriptions

**Architecture:**
- **Browser:** Remotion Player for real-time preview of scene assembly
- **Server:** Remotion Lambda/CLI for final MP4 rendering
- **FFmpeg:** Post-processing (audio mixing, normalization, format optimization)

### Decision 5: AI Text/Description Generation → **Claude (Anthropic) — Keep**

Already integrated. Evolve usage:
- Instagram descriptions optimized for algorithm
- CTA text generation
- Carousel slide copy
- Hashtag strategy (3-5 targeted)
- Hook text for first slide/first 1.7s

### Decision 6: Music Generation → **Fal.ai CassetteAI — Keep**

Already integrated and working well. Evolve:
- Generate music matched to content mood
- Generate original audio (algorithm bonus for originality)
- Voiceover capabilities via HeyGen

---

## PART 3: COMPLETE FEATURE ARCHITECTURE — PLUBLISTA v2

### Navigation Structure

```
┌──────────────────────────────────────────────┐
│  PLUBLISTA v2                                │
│                                              │
│  📊 Dashboard     (Hub central)              │
│  ✨ Create        (Assembleur de contenu)    │
│  📚 Library       (Médias & Templates)       │
│  📅 Calendar      (Planification visuelle)   │
│  📈 Analytics     (Performance tracking)     │
│  ⚙️  Settings     (Configuration)            │
└──────────────────────────────────────────────┘
```

### Feature F1: Dashboard (EVOLVED)

- Content calendar mini-view (upcoming posts this week)
- Performance snapshot (reach, engagement, growth)
- Quick-create buttons: "New Reel" | "New Carousel" | "New Post"
- Recent content with status badges
- AI-suggested optimal posting times
- Weekly content mix indicator (3-4 Reels, 2-3 Carousels, 1-2 Posts)

### Feature F2: CREATE — The Scene Assembler (NEW CORE)

#### F2.1: Content Type Selection

```
┌──────────────────────────────────────────────────────────┐
│  What do you want to create?                             │
│                                                          │
│  🎬 REEL/VIDEO      📸 CAROUSEL        🖼️ POST          │
│  (Video)            (2-20 slides)      (Single image)   │
│  7-90 seconds       1080×1350          1080×1350        │
│                                                          │
│  FORMAT SELECTION:                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 📱 9:16   │  │ 🖥️ 16:9  │  │ ⬜ 1:1   │              │
│  │ Vertical  │  │Horizontal│  │ Square   │              │
│  │ Reels/    │  │ YouTube  │  │ Feed     │              │
│  │ TikTok/   │  │          │  │          │              │
│  │ Shorts    │  │          │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  After choosing REEL/VIDEO:                              │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ 🪄 AUTO-MONTAGE  │  │ 🎬 ASSEMBLEUR    │             │
│  │ Upload clips &   │  │ Build scene by   │             │
│  │ AI edits for you │  │ scene manually   │             │
│  └──────────────────┘  └──────────────────┘             │
└──────────────────────────────────────────────────────────┘
```

When user selects **REEL**, they choose between:
- **Auto-Montage** (F2.2): Upload raw clips → AI does everything
- **Scene Assembler** (F2.3): Build from scratch, scene by scene (AI-generated or uploaded)

#### F2.2: AI Auto-Montage (for Reels/Videos — Upload Mode)

```
┌─────────────────────────────────────────────────────────┐
│  AI AUTO-MONTAGE                                        │
│                                                         │
│  Upload your raw clips and let AI create the edit       │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│  │ clip1   │ │ clip2   │ │ clip3   │ │   +     │     │
│  │ .mp4    │ │ .mov    │ │ .mp4    │ │  Upload │     │
│  │ 0:42    │ │ 1:15    │ │ 0:28    │ │  Clip   │     │
│  │   [x]   │ │   [x]   │ │   [x]   │ │         │     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AI MONTAGE OPTIONS                               │  │
│  │                                                    │  │
│  │  Style:  [Dynamique ▾] [Cinematic ▾] [UGC ▾]     │  │
│  │  Format: [📱9:16 ▾] [🖥️16:9 ▾] [⬜1:1 ▾]         │  │
│  │  Target: [30 sec ▾]                                │  │
│  │  Music:  [Auto-match mood ▾] [Choose track ▾]     │  │
│  │  Text:   [Add hook text] [Add CTA]                │  │
│  │  Brand:  [☑ Add logo overlay]                     │  │
│  │                                                    │  │
│  │  [🪄 Generate Auto-Montage]                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           9:16 RESULT PREVIEW                     │  │
│  │         (Remotion Player)                         │  │
│  │                                                    │  │
│  │  [▶ Play] [Edit in Scene Assembler] [Export]      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**How AI Auto-Montage Works:**

1. **Upload** — User uploads 1-10 raw video clips (MP4, MOV, WebM, max 500MB total)
2. **AI Analysis** — Claude analyzes each clip:
   - Detects best moments (most dynamic, well-lit, in-focus)
   - Identifies faces, products, actions, text
   - Scores each segment for "hook potential"
   - Maps audio quality per segment
3. **Smart Cutting** — AI selects the best segments:
   - Picks the strongest 1.7s hook for the opening
   - Creates jump cuts every 3-5s (algorithm-optimal)
   - Trims dead air, shaky footage, poor lighting
   - Arranges clips in narrative flow
4. **Auto-Enhancement** — Remotion + FFmpeg:
   - Applies color grading/filter per style
   - Adds smooth transitions between cuts
   - Overlays text (hook, CTA) with motion
   - Mixes background music (auto-matched or chosen)
   - Brand logo overlay if enabled
   - Crops/fits to 9:16 (1080×1920) with smart framing
5. **Review & Refine** — User can:
   - Preview the auto-montage result
   - Open it in the Scene Assembler to fine-tune
   - Regenerate with different style/settings
   - Adjust individual cuts, reorder scenes
   - Swap music, change text overlays

**Montage Styles:**

| Style | Description | Best For |
|-------|-------------|----------|
| **Dynamic** | Fast cuts (2-3s), energetic transitions, bold text | Product launches, promos |
| **Cinematic** | Smooth transitions, slow-mo moments, film-grade color | Brand storytelling |
| **UGC** | Authentic feel, minimal effects, natural pacing | Testimonials, behind-scenes |
| **Tutorial** | Step-by-step flow, numbered text overlays, clear pacing | How-to content |
| **Hype** | Ultra-fast cuts, glitch effects, bass-heavy music match | Events, reveals, drops |

**Supported Upload Formats:**
- Video: MP4, MOV, WebM, AVI, MKV
- Resolution: Any (auto-converted to 1080×1920)
- Max per clip: 200MB
- Max total: 500MB (Starter), 2GB (Pro), 5GB (Business/Agency)

---

#### F2.3: Scene Assembler (for Reels/Videos — Manual Mode)

```
┌─────────────────────────────────────────────────────┐
│  SCENE ASSEMBLER                                    │
│                                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │Scene 1 │→│Trans.  │→│Scene 2 │→│  + Add │   │
│  │ Hook   │  │ Fade   │  │Content │  │ Scene  │   │
│  │ 3s     │  │        │  │ 10s    │  │        │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           9:16 LIVE PREVIEW                  │   │
│  │         (Remotion Player)                    │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Timeline: [===Hook===][=Trans=][===Content===]     │
│  Total: 13s / Target: 30s                           │
└─────────────────────────────────────────────────────┘
```

**Scene Types Available:**
- 🎥 **AI Video Scene** — Generate cinematic video with Kling 3.0/Veo 3
- 👤 **AI Avatar Scene** — HeyGen human presenter/spokesperson
- 📝 **AI CTA Scene** — AI-generated call-to-action (animated text/graphics)
- 📤 **Upload Scene** — Import your own video clip
- 🎨 **AI Animated Graphics** — Motion graphics, text animations (Remotion)

**Transition Effects Between Scenes:**
- Fade, Slide, Zoom, Wipe, Dissolve, Glitch, Morph

**Per-Scene Controls:**
- Duration (adjustable)
- Text overlay
- Music/audio for this scene
- Filter/color grading
- Speed (slow-mo, normal, fast)

#### F2.4: Carousel Builder (for Carousels)

```
┌─────────────────────────────────────────────────────┐
│  CAROUSEL BUILDER                                   │
│                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │Slide 1 │ │Slide 2 │ │Slide 3 │ │  +     │      │
│  │ HOOK   │ │Content │ │Content │ │ Add    │      │
│  │        │ │        │ │        │ │ Slide  │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────────┐     │
│  │   SLIDE PREVIEW  │  │  REFERENCE IMAGES     │     │
│  │   1080×1350      │  │                        │     │
│  │                   │  │  [img1] [img2] [ + ]  │     │
│  │                   │  │                        │     │
│  └─────────────────┘  └──────────────────────┘     │
│                                                     │
│  AI Generation Options:                             │
│  [Generate All Slides] [Generate This Slide]        │
│  [Generate from References]                         │
└─────────────────────────────────────────────────────┘
```

**Reference Image System:**
- Grid of uploaded reference images
- Each has a thumbnail + delete button
- "+" square button to add more (one by one)
- AI uses these as style/content guidance
- Up to 10 reference images

**Slide Types:**
- 🎨 **AI Generated Image** — Flux 2.0 creates visual from prompt + references
- 📤 **Uploaded Image** — User's own image
- 📝 **Text/Info Slide** — AI-designed text layout (Remotion rendered to image)
- 🎥 **Video Slide** — Mixed-media carousel support (IG allows video in carousels)

**AI Carousel Intelligence:**
- Auto-generates 8-10 slides (optimal count)
- Slide 1 = Hook (scroll-stopping design)
- Last slide = CTA (follow, save, share)
- Consistent visual theme across slides
- Optimized for swipe, save, and share behaviors

#### F2.5: Single Post Creator

- AI image generation (Flux 2.0)
- Upload your own image
- Reference images for style guidance
- AI-optimized caption + hashtags
- Preview at 1080×1350

### Feature F3: Library (EVOLVED)

| Tab | Content |
|-----|---------|
| **Music** | Keep as-is: tracks, generation, presets |
| **Templates** | NEW: Saved scene assemblies, carousel templates, CTA templates |
| **Media Assets** | NEW: Uploaded images, generated images, video clips |
| **Brand Kit** | MOVED from Settings: logos, colors, fonts, brand voice |

### Feature F4: Calendar (NEW)

- Visual monthly/weekly calendar
- Drag-and-drop scheduling
- Color-coded by content type (Reel, Carousel, Post)
- AI-suggested posting times based on engagement data
- Content mix indicator (algorithm optimal: 3-4R + 2-3C + 1-2P per week)
- One-click reschedule

### Feature F5: Analytics (NEW — Future Phase)

- Post performance tracking
- Engagement rates by content type
- Best performing content analysis
- Audience growth tracking
- AI recommendations for improvement

### Feature F6: Settings (EVOLVED)

| Section | Config |
|---------|--------|
| **AI APIs** | Anthropic (Claude), Fal.ai (Video + Images + Music), HeyGen (Avatars) |
| **Publishing** | Ayrshare API key, connected platforms (Instagram, YouTube, TikTok, etc.), per-platform accounts |
| **Subscription** | SaaS plan management, billing |
| **Account** | User profile, authentication |

---

## PART 4: ALGORITHM-OPTIMIZED CONTENT GENERATION

### Built-in Intelligence Rules

Every piece of content Plublista generates will automatically follow these rules:

**For Reels:**
1. First scene = visual hook (1.7s rule)
2. Jump cuts every 3-5s baked into scene transitions
3. Original audio generated (no watermarks — originality score boost)
4. Adaptive format: 9:16 (1080×1920) for Reels/TikTok/Shorts, 16:9 (1920×1080) for YouTube, 1:1 (1080×1080) for Feed. 30fps minimum
5. No CapCut/TikTok watermarks
6. AI description with 3-5 targeted hashtags
7. Optimal length suggestion based on content type

**For Carousels:**
8. 8-10 slides at 1080×1350px portrait
9. Slide 1 = scroll-stopping hook
10. Last slide = clear CTA
11. Consistent design theme
12. Mixed-media when possible (images + video slides)
13. Designed for saves (templates, checklists, actionable info)

**For All Content:**
14. AI-generated captions optimized for engagement
15. Strategic hashtag selection (3-5 targeted, not generic)
16. Scheduling suggestions based on optimal times
17. Content mix tracking (weekly balance)

---

## PART 5: TECHNOLOGY STACK SUMMARY

### Complete Stack for Plublista v2

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | React 18 + Vite + Tailwind | UI Framework (keep) |
| **Video Preview** | Remotion Player | In-browser scene preview & assembly |
| **Video Render** | Remotion CLI + FFmpeg | Server-side MP4 rendering |
| **Backend** | Express.js + Node.js | API server (keep) |
| **Database** | SQLite3 → PostgreSQL | Persistent storage (upgrade from in-memory) |
| **Auth** | Passport.js / Auth0 | User authentication (NEW) |
| **AI Text** | Claude (Anthropic) | Descriptions, CTAs, copy, hashtags |
| **AI Video** | Fal.ai → Kling 3.0 / Veo 3 / Wan 2.6 | Video scene generation |
| **AI Images** | Fal.ai → Flux 2.0 Pro | Image generation for carousels/posts |
| **AI Music** | Fal.ai → CassetteAI | Music generation (keep) |
| **AI Avatars** | HeyGen API | Human presenter/actor scenes |
| **Publishing** | Ayrshare Unified API | Multi-platform: Instagram, YouTube, TikTok, Facebook, LinkedIn, X, 15+ platforms |
| **Format Engine** | Custom + FFmpeg | Adaptive format selection: 9:16 (Reels/TikTok/Shorts), 16:9 (YouTube), 1:1 (Feed) |
| **Scheduling** | Node-cron + Calendar + Ayrshare | Enhanced scheduling with per-platform optimal times |

### API Integration Map

```
                    ┌──────────────┐
                    │   PLUBLISTA   │
                    │   BACKEND     │
                    └──────┬───────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
┌────▼────┐          ┌─────▼─────┐         ┌─────▼─────┐
│ Fal.ai  │          │  HeyGen   │         │ Anthropic │
│ Gateway │          │   API     │         │  Claude   │
└────┬────┘          └───────────┘         └───────────┘
     │
┌────┼──────────────┐
│    │              │
┌▼─────┐ ┌▼─────┐ ┌──▼──────┐
│Kling │ │Flux  │ │Cassette │
│3.0   │ │2.0   │ │AI Music │
│Video │ │Image │ │         │
└──────┘ └──────┘ └─────────┘

                    ┌──────────────┐
                    │   PLUBLISTA   │
                    │   BACKEND     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Ayrshare   │
                    │  Unified API │
                    └──────┬───────┘
                           │
     ┌─────────┬───────────┼───────────┬─────────┐
     │         │           │           │         │
┌────▼───┐ ┌──▼────┐ ┌────▼───┐ ┌────▼───┐ ┌──▼──┐
│Insta-  │ │YouTube│ │TikTok  │ │Facebook│ │ +15 │
│gram    │ │       │ │        │ │LinkedIn│ │more │
└────────┘ └───────┘ └────────┘ └────────┘ └─────┘
```

---

## PART 6: SaaS MONETIZATION STRATEGY

### Pricing Tiers (Suggested for 10K first month target)

| Plan | Price | Includes |
|------|-------|----------|
| **Starter** | €29/month | 10 Reels + 20 Carousels + 30 Posts/month, Basic AI generation |
| **Pro** | €79/month | 30 Reels + 60 Carousels + Unlimited Posts, AI avatars (5/month), Priority rendering |
| **Business** | €199/month | Unlimited content, Full AI avatars, Calendar, Analytics, Multi-account |
| **Agency** | €499/month | Everything + 10 Instagram accounts, Team members, White-label |

**To reach 10K€/month:** ~50 Pro users OR ~130 Starter users OR mix

### Competitive Differentiation

1. **All-in-one**: No need for Canva + CapCut + Later + ChatGPT + Buffer separately
2. **Algorithm-native**: Every feature built around Instagram's ranking factors
3. **AI-first**: Generate entire campaigns, not just edit
4. **Original content engine**: Avoids watermarks and plagiarism penalties
5. **Human-quality AI actors**: No need for expensive video shoots
6. **Multi-platform, one click**: Create once, publish to Instagram, YouTube, TikTok, and 15+ platforms with automatic format adaptation
7. **Adaptive format**: AI auto-adapts framing, composition, and text placement for 9:16, 16:9, and 1:1

---

## DECISIONS SUMMARY

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Video Generation | **Fal.ai → Kling 3.0** (default) | Best quality/cost, multi-shot, Feb 2026 release |
| Premium Video | **Fal.ai → Veo 3** (premium option) | Highest quality available |
| Image Generation | **Fal.ai → Flux 2.0 Pro** | #1 photorealism, cheapest ($0.03/img) |
| Human AI Actors | **HeyGen API** | Market leader, 4K, Digital Twins, API ready |
| Video Assembly | **Remotion** (React) | Matches stack, programmatic, preview + render |
| Video Post-Processing | **FFmpeg** (keep) | Audio mixing, normalization, format |
| Text/Copy AI | **Claude** (keep) | Already integrated, excellent for marketing copy |
| Music AI | **Fal.ai CassetteAI** (keep) | Already integrated, works well |
| Database | **SQLite3 → PostgreSQL** | Production SaaS needs persistent reliable storage |
| Auth | **Passport.js or Auth0** | SaaS requires user accounts |
| Multi-Platform Publishing | **Ayrshare Unified API** | 15+ platforms (Instagram, YouTube, TikTok, Facebook, LinkedIn, X) via one API. Node.js SDK. Replaces direct Graph API |
| Format Selection | **9:16 / 16:9 / 1:1 adaptive** | Create once, publish everywhere. AI auto-adapts framing per format |
