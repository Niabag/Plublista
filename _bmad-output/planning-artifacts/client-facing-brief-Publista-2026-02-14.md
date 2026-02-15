---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
status: complete
inputDocuments:
  - product-brief-Publista-2026-02-13.md
  - ux-design-specification.md
  - architecture.md
  - prd.md
date: 2026-02-14
author: Utilisateur
---

# Client-Facing Brief: Publista Marketing Website & Acquisition Strategy

## Executive Summary

This brief defines the complete client-facing web presence for Publista: the marketing website (landing page, navbar, public pages) and the growth/acquisition strategy that replaces traditional blogging with modern, high-conversion tactics.

The marketing site targets three personas (Sophie the freelance SMM, Marc the solo marketer, Lea the agency founder) with a **Product-Led Growth (PLG)** approach inspired by Canva (SEO programmatic at scale), Opus Clip (zero-friction hero demo), Linear (visual changelog), and Notion (template marketplace as acquisition engine).

Publista has two unique advantages no competitor can replicate: **(1) the product is its own marketing channel** — every Reel created by a free-tier user carries the "Made with Publista" watermark, turning every piece of content into organic acquisition; **(2) the brand is scannable** — the Publista logo is a retro TV screen displaying a functional QR code, making every brand touchpoint (website, social media, watermarks, merch) an interactive conversion point. The "Scan the TV" campaign mechanic creates treasure-hunt engagement that simultaneously boosts algorithmic performance and drives signups.

This brief formalizes the website structure, page content, design direction, and growth tactics to exploit both advantages.

---

## 1. Sitemap & Navigation Architecture

### 1.1 Sitemap

```
PUBLIC PAGES (no auth required)
├── /                           → Landing page (homepage)
├── /features                   → Features deep-dive
├── /pricing                    → Pricing page with tiers
├── /pour/                      → Use-case pages by persona
│   ├── /pour/freelances        → For freelance social media managers
│   ├── /pour/restaurants       → For restaurants & food businesses
│   ├── /pour/immobilier        → For real estate professionals
│   ├── /pour/coachs            → For coaches & consultants
│   ├── /pour/ecommerce         → For e-commerce brands
│   └── /pour/agences           → For agencies
├── /tools/                     → Free micro-tools (ungated)
│   ├── /tools/hashtag-generator    → AI hashtag generator
│   ├── /tools/caption-generator    → AI caption generator
│   └── /tools/best-time-to-post   → Optimal posting time calculator
├── /templates                  → Template gallery (Phase 3, placeholder)
├── /changelog                  → Visual changelog (Linear-style)
├── /compare/                   → Competitor comparison pages
│   ├── /compare/canva          → Publista vs Canva
│   ├── /compare/capcut         → Publista vs CapCut
│   └── /compare/opus-clip      → Publista vs Opus Clip
├── /tv                         → Dynamic QR landing (logo scan destination, redirects by context)
├── /privacy                    → Privacy policy (exists)
├── /terms                      → Terms of service
├── /data-deletion              → Data deletion (exists)
├── /login                      → Login (exists)
├── /register                   → Register (exists)
└── /lista-code                 → Promo page (exists)

AUTHENTICATED PAGES (existing, no changes)
└── /dashboard, /create, /calendar, /library, /settings
```

### 1.2 Navbar Structure

**Desktop:**
```
[Logo Publista]   Features   Pricing   Use Cases ▾   Tools ▾      [Login]  [Commencer gratuitement →]
```

**Mobile:**
```
[Logo]                                              [Commencer →]  [☰]
```

**Navbar specifications:**

| Property | Value |
|----------|-------|
| Position | Sticky, top: 0 |
| Background | Transparent on hero, then `bg-black/80 backdrop-blur-xl` on scroll |
| Height | 64px desktop, 56px mobile |
| Max items | 5 main links + 2 CTAs |
| CTA primary | "Commencer gratuitement" — solid accent button, always visible (even mobile) |
| CTA secondary | "Login" — ghost/text button |
| Dropdown: Use Cases | Links to /pour/* pages |
| Dropdown: Tools | Links to /tools/* pages |
| Scroll behavior | Compact padding on scroll, background blur transition |
| Transition | `transition-all duration-300` |

**Dropdown "Use Cases":**
- Freelances & Community Managers
- Restaurants & Food
- Immobilier
- Coachs & Consultants
- E-commerce
- Agences

**Dropdown "Tools":**
- Generateur de hashtags IA
- Generateur de captions IA
- Meilleure heure de publication

---

## 2. Landing Page (Homepage) — Section-by-Section Specification

### Design Direction

| Property | Value | Inspiration |
|----------|-------|-------------|
| Theme | Dark mode native | Linear, Opus Clip, Runway |
| Background | `#09090b` (zinc-950) with subtle radial gradients | Opus Clip |
| Accent color | Brand gradient (existing lava lamp palette) | Publista identity |
| Typography | Bold oversized headlines (48-72px desktop), clean body (16-18px) | Linear, Runway |
| Animations | GSAP scroll-triggered, subtle fade-in/slide-up, marquee logos | Opus Clip, Linear |
| Layout | Max-width 1200px, generous spacing (80-120px between sections) | All top SaaS |
| Mobile | Mobile-first, breakpoints at 768px and 1024px | Standard |
| Visual content | Video/GIF over static screenshots. Product in action. | Runway, Descript |

### Section 1: Hero

**Purpose:** Instant value communication + primary conversion.

**Structure:**
```
[Headline — max 8 words, result-oriented]
[Subheadline — 1-2 sentences, pain → solution]
[Primary CTA button]   [Secondary CTA link]
[Hero visual: product demo video/animation showing Auto-Montage in action]
```

**Content:**

| Element | Content | Notes |
|---------|---------|-------|
| Headline | **"Du contenu pro, partout, en 3 minutes"** | Result-oriented, quantified. Alt: "Create stunning content, everywhere" |
| Subheadline | "Publista transforme vos clips bruts en Reels, Carousels et Posts optimises pour l'algorithme — et les publie sur Instagram, TikTok, YouTube et 15+ plateformes en un clic." | Pain → solution in one sentence |
| CTA primary | "Commencer gratuitement" | Solid accent button, no credit card mention |
| CTA secondary | "Voir la demo" | Ghost button or text link, scrolls to demo section |
| Visual | Looping video (15-20s) showing: raw clips upload → AI processing → finished Reel preview → publish to multiple platforms | This IS the product demo. Most critical visual on the entire site. |
| Trust badge | "Pas de carte bancaire requise" | Below CTA, small text |

**Responsive behavior:**
- Desktop: headline 64px, two-column (text left, visual right)
- Mobile: headline 36px, stacked (text top, visual bottom), visual as 16:9 ratio

### Section 2: Social Proof Bar

**Purpose:** Instant credibility.

**Structure:**
```
[Marquee infinite scroll of trust elements]
```

**Content:**

| Element | Content |
|---------|---------|
| Stats | "X+ contenus crees" · "X+ plateformes supportees" · "Note 4.X/5" |
| Format | Animated marquee (CSS infinite scroll, 30s loop), white text on dark |

**Note:** At launch, use platform support count and content creation stats. User count and testimonials added post-launch as real data accumulates. No fake social proof.

### Section 3: Problem → Solution

**Purpose:** Empathy + positioning. "We understand your pain."

**Structure:**
```
[Section headline: "5 outils. Des heures perdues. Un seul resultat."]

[Split layout]
  LEFT: "Avant Publista"                    RIGHT: "Avec Publista"
  - Canva pour le design                     - Un seul outil
  - CapCut pour la video                     - 3 minutes par Reel
  - ChatGPT pour les textes                  - Optimise pour l'algorithme
  - Buffer pour la programmation             - Publication multi-plateforme
  - 45 min par Reel                          - Zero watermark
  - Watermarks penalises                     - Zero penalite
```

**Design:**
- Left side: muted/gray, pain icons, crossed-out tool logos
- Right side: bright accent gradient, check icons, Publista UI preview
- Animated transition on scroll: left fades down, right slides up

### Section 4: Features (3-4 Blocks)

**Purpose:** Show the product capabilities.

**Structure:** Bento grid layout (2x2 on desktop, stacked on mobile). Each block has:
- Icon/mini-video (autoplay, loop, muted)
- Headline (benefit-oriented, not feature name)
- 2-line description
- Subtle hover: scale 1.02, border glow

**Blocks:**

| # | Headline | Description | Visual |
|---|----------|-------------|--------|
| 1 | **Reels en pilote automatique** | Uploadez vos clips, l'IA monte un Reel optimise avec transitions, musique et textes. En 3 minutes. | GIF: clips → Auto-Montage → finished Reel |
| 2 | **Carousels qui convertissent** | Images IA ou vos propres visuels, structures en 8-10 slides avec hook et CTA final. Optimise pour l'engagement. | GIF: carousel creation flow |
| 3 | **Publiez partout, en un clic** | Instagram, TikTok, YouTube, LinkedIn, Facebook et 15+ plateformes. Format adapte automatiquement (9:16, 16:9, 1:1). | Animation: content → multiple platform icons |
| 4 | **Calendrier intelligent** | Planifiez toute votre semaine en une session. Visualisez votre mix de contenu. Publiez au moment optimal. | Screenshot: calendar view with scheduled content |

### Section 5: Interactive Product Demo

**Purpose:** Reduce uncertainty. Let the visitor SEE the product.

**Structure:**
```
[Section headline: "Voyez Publista en action"]
[Embedded video demo OR interactive product walkthrough]
[CTA: "Essayez vous-meme — c'est gratuit"]
```

**Implementation options (pick one):**

| Option | Description | Effort | Conversion impact |
|--------|-------------|--------|-------------------|
| **A: Video demo** | 60-90s produced video showing full workflow (upload → AI → preview → publish) | Low | Medium |
| **B: Interactive demo** | Guided walkthrough using Arcade/Navattic — user clicks through real UI steps | Medium | High |
| **C: Live mini-demo** | Opus Clip style: paste a URL or upload a clip, see AI generate a preview (requires backend) | High | Very high |

**Recommendation:** Start with Option A (video) at launch. Upgrade to Option B post-launch. Option C is a Phase 3 goal.

### Section 6: Use Cases by Persona

**Purpose:** "This is for YOU specifically."

**Structure:** Tab/carousel with 3-4 persona cards.

| Tab | Headline | Description | Visual |
|-----|----------|-------------|--------|
| Freelances | "15 Reels en une matinee" | Sophie gere 8 comptes clients. Avec Publista, sa production du lundi est bouclee avant midi. | UI showing batch creation |
| PME / Marketing | "Votre premier Reel pro, sans competence video" | Marc n'a jamais touche un logiciel de montage. Son premier Reel a depasse les 10K vues. | Before/after: phone video → polished Reel |
| Agences | "Scalez sans embaucher" | Lea a pris 10 clients supplementaires sans recruter. Ses juniors produisent comme des seniors. | Dashboard view with multiple accounts |

**CTA per tab:** "Decouvrir comment →" links to respective /pour/* page.

### Section 7: Testimonials / Results

**Purpose:** Deep social proof with quantified results.

**Structure:** Carousel of testimonial cards.

| Element | Format |
|---------|--------|
| Card | Photo + name + role + quote + metric |
| Metric | Bold, large font: "+340% engagement", "5x plus rapide", "10 clients en plus" |
| Format | 3 cards visible on desktop, 1 on mobile, swipeable |

**Note:** At launch, use beta tester results or self-generated case studies. Replace with real user testimonials as they accumulate. Never fabricate testimonials.

**Fallback for launch (no real testimonials yet):**
- Use quantified product metrics instead: "3 min par Reel", "15+ plateformes", "0 watermark"
- Present as stat cards rather than fake testimonials

### Section 8: Pricing Preview

**Purpose:** Eliminate friction. Show transparency.

**Structure:**
```
[Section headline: "Un plan pour chaque ambition"]
[Toggle: Mensuel | Annuel (default)]
[3 pricing cards side by side]
[Link: "Voir tous les plans →" → /pricing]
```

**Cards (show 3 of 5 tiers — most popular):**

| Tier | Price | Key features | CTA |
|------|-------|-------------|-----|
| **Free** | 0 EUR | X contenus/mois, watermark, 1 plateforme | "Commencer gratuitement" |
| **Pro** (highlighted) | 79 EUR/mois | Contenus illimites, 0 watermark, multi-plateforme, musique IA | "Essai gratuit 7 jours" |
| **Agency** | 499 EUR/mois | Multi-comptes, priorite, support dedie | "Contacter l'equipe" |

**Design:**
- Pro card: slightly elevated, accent border, "Populaire" badge
- Annual toggle pre-selected, showing discount percentage
- "Pas de carte bancaire requise" under Free CTA

### Section 9: FAQ

**Purpose:** Overcome final objections.

**Structure:** Accordion format, 6-7 questions.

**Questions:**

| # | Question | Answer summary |
|---|----------|---------------|
| 1 | Ai-je besoin de competences en montage video ? | Non. L'IA fait tout. Uploadez vos clips, Publista fait le reste. |
| 2 | Sur quelles plateformes puis-je publier ? | Instagram, TikTok, YouTube, Facebook, LinkedIn, X, et 15+ autres via notre integration. |
| 3 | Le plan gratuit a-t-il des limites ? | Oui : X contenus/mois et un watermark "Made with Publista". Les plans payants retirent ces limites. |
| 4 | Mes videos auront-elles un watermark ? | Uniquement sur le plan gratuit. Tous les plans payants produisent du contenu sans watermark. |
| 5 | Puis-je annuler a tout moment ? | Oui. Aucun engagement. Annulez en un clic depuis vos parametres. |
| 6 | Comment fonctionne l'essai gratuit ? | 7 jours d'acces complet au plan Pro. Pas de carte bancaire requise. |
| 7 | Mes donnees sont-elles securisees ? | Oui. Chiffrement, RGPD-compliant, suppression des donnees sur demande. |

### Section 10: Final CTA

**Purpose:** Last conversion opportunity.

**Structure:**
```
[Headline: "Pret a creer du contenu qui performe ?"]
[Subheadline: "Rejoignez les createurs qui produisent 5x plus vite."]
[CTA: "Commencer gratuitement →"]
```

**Design:** Full-width section with gradient background (brand colors), centered text, large CTA button. Mirrors hero energy.

### Section 11: Footer

**Structure:**
```
[4-column layout on desktop, stacked on mobile]

Column 1: Publista        Column 2: Produit       Column 3: Ressources      Column 4: Legal
- Logo + tagline           - Features              - Changelog                - Confidentialite
- Social icons             - Pricing               - Outils gratuits          - CGU
  (Instagram, TikTok,     - Use Cases             - Comparatifs              - Suppression donnees
   LinkedIn, X, YouTube)   - Templates             - Centre d'aide            - Cookies

[Bottom bar: "© 2026 Publista. Tous droits reserves." + Language selector (FR/EN)]
```

---

## 3. Public Pages Specification

### 3.1 Features Page (/features)

**Purpose:** Deep-dive into all product capabilities for bottom-of-funnel visitors.

**Structure:**
1. Hero: headline + subheadline + CTA
2. Feature blocks (one per major feature, alternating left/right layout):
   - AI Auto-Montage (hero feature, most visual real estate)
   - Carousel Builder + AI Images
   - Single Post Creator
   - AI Copy Generation (captions, hashtags, CTAs)
   - AI Music Generation
   - Multi-Platform Publishing
   - Calendar & Scheduling
   - Format Selection (9:16, 16:9, 1:1)
3. Integration logos (all supported platforms)
4. CTA: "Commencer gratuitement"

**Each feature block:** Headline + 3-4 bullet points + video/GIF showing the feature + CTA.

### 3.2 Pricing Page (/pricing)

**Purpose:** Full pricing transparency with feature comparison.

**Structure:**
1. Hero: "Un plan pour chaque ambition"
2. Toggle: Mensuel | Annuel (annual pre-selected, show savings %)
3. 5 pricing cards (Free, Starter, Pro, Business, Agency)
4. Feature comparison table (expandable/collapsible sections)
5. FAQ (pricing-specific: refunds, upgrades, team billing, etc.)
6. CTA: "Commencer gratuitement"

**Card highlight:** Pro tier with "Populaire" badge, accent border.

**Feature comparison sections:**
- Creation (content types, AI features, formats)
- Publishing (platforms, scheduling, calendar)
- Limits (content/month, storage, export quality)
- Support (response time, dedicated account manager)

### 3.3 Use Case Pages (/pour/*)

**Purpose:** Persona-specific landing pages for SEO and conversion.

**Each page follows the same template:**
1. Hero with persona-specific headline and visual
2. Pain points specific to this persona (3-4 bullet points)
3. How Publista solves each pain point (feature mapping)
4. Quantified results / use case scenario
5. Pricing recommendation for this persona
6. CTA: "Commencer gratuitement"

**Example — /pour/restaurants:**

| Section | Content |
|---------|---------|
| Headline | "Des Reels qui remplissent vos tables" |
| Pain | Pas le temps de filmer, pas de competences montage, les clients scrollent |
| Solution | Filmez vos plats au telephone → Publista cree un Reel appetissant en 3 min |
| Result | "Un restaurant a augmente ses reservations de 40% avec 3 Reels/semaine" |
| Pricing | Plan Starter a 29 EUR/mois recommande |

### 3.4 Free Tools Pages (/tools/*)

**Purpose:** SEO acquisition via ungated value. Replaces blog strategy.

**Each tool page:**
1. Tool interface (input → output, no signup required)
2. Brief explanation of how it works
3. Results display
4. Soft CTA: "Transformez ces hashtags en Reel → Essayez Publista"
5. SEO-optimized content block (300-500 words) for the target keyword

**Tool 1: AI Hashtag Generator (/tools/hashtag-generator)**
- Input: Topic/niche or Instagram post description
- Output: 30 categorized hashtags (10 high-volume, 10 medium, 10 niche)
- Target keyword: "generateur hashtag instagram", "instagram hashtag generator"

**Tool 2: AI Caption Generator (/tools/caption-generator)**
- Input: Topic, tone (pro/casual/fun), platform
- Output: 5 caption variations with emoji and CTA suggestions
- Target keyword: "generateur legende instagram", "instagram caption generator"

**Tool 3: Best Time to Post (/tools/best-time-to-post)**
- Input: Platform, industry/niche, timezone
- Output: Optimal posting schedule for the week (visual calendar)
- Target keyword: "meilleure heure publication instagram", "best time to post"

### 3.5 Changelog (/changelog)

**Purpose:** Marketing disguised as product updates. Build momentum narrative.

**Format (inspired by Linear):**
- Reverse-chronological list of updates
- Each entry: date + headline + description + visual (screenshot/GIF/video)
- Categories: New Feature, Improvement, Fix
- Optional: emoji reactions from users
- Newsletter subscription CTA at top

**Design:** Dark background, card-based entries, accent-colored category badges.

### 3.6 Competitor Comparison Pages (/compare/*)

**Purpose:** Capture bottom-of-funnel SEO traffic ("publista vs canva", "alternative capcut").

**Each page:**
1. Headline: "Publista vs [Competitor]: le comparatif complet"
2. Quick verdict (3-sentence summary)
3. Side-by-side feature comparison table
4. What [Competitor] does well
5. What Publista does that [Competitor] doesn't
6. Pricing comparison
7. CTA: "Essayez Publista gratuitement"

**Tone:** Honest and fair. Acknowledge competitor strengths. Win on differentiation, not FUD.

### 3.7 Terms of Service (/terms)

Standard SaaS terms. Content to be drafted by legal.

---

## 4. Layout Architecture

### 4.1 Public Layout (NEW — separate from AppLayout)

A new `PublicLayout` component wrapping all public pages:

```
PublicLayout
├── Navbar (sticky, transparent → blur on scroll)
├── <main> (page content via Outlet)
└── Footer
```

**Key difference from AppLayout:** No sidebar, no auth required, no TopBar. The navbar and footer are the only persistent elements.

### 4.2 Route Structure Update

```tsx
// Public routes (PublicLayout)
<Route element={<PublicLayout />}>
  <Route path="/" element={<LandingPage />} />
  <Route path="/features" element={<FeaturesPage />} />
  <Route path="/pricing" element={<PricingPage />} />
  <Route path="/pour/:persona" element={<UseCasePage />} />
  <Route path="/tools/:tool" element={<ToolPage />} />
  <Route path="/changelog" element={<ChangelogPage />} />
  <Route path="/compare/:competitor" element={<ComparePage />} />
  <Route path="/terms" element={<TermsPage />} />
</Route>

// Auth routes (no layout — existing)
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/onboarding" element={<OnboardingPage />} />

// Authenticated routes (AppLayout — existing)
<Route element={<AppLayout />}>
  <Route path="/dashboard" ... />
  ...
</Route>
```

---

## 5. Marketing & Growth Strategy

### 5.1 Core Philosophy: Product-Led Everything

Traditional blog-based content marketing is replaced by a **6-pillar growth engine:**

| Pillar | Tactic | Inspired by | Priority |
|--------|--------|-------------|----------|
| **Scan the TV** | Scannable logo-QR as signature marketing mechanism | Snapchat, Coinbase, Spotify Codes | P0 |
| **Viral Loop** | "Made with Publista" watermark (with scannable logo) on free content | Canva, Typeform, Calendly | P0 (active) |
| **Dogfooding** | All Publista social media created WITH Publista | Unique advantage | P0 |
| **SEO Programmatic** | Use-case pages + micro-tools + comparison pages | Canva (21K pages), HubSpot | P1 |
| **Template Gallery** | Searchable templates by niche as acquisition channel | Canva, Notion (30K templates) | P2 (Phase 3) |
| **Community** | Discord + monthly challenges + user showcase | Notion (1.4M), Figma | P2 |

### 5.2 "Scan the TV" — Signature Marketing Mechanism (P0)

#### 5.2.1 The Concept

The Publista logo is a retro-futuristic TV screen displaying a functional QR code in brand colors (blue). This is not a QR code slapped onto a logo — the QR code IS the logo's core visual. Every appearance of the logo is an interactive, scannable conversion point.

**Precedents that prove this works:**

| Brand | Mechanism | Result |
|-------|-----------|--------|
| **Snapchat** | Ghost logo surrounded by scannable code | Iconic, universally understood |
| **Spotify** | Proprietary scannable barcodes per song/playlist | Cultural standard, Coca-Cola replaced logos with Spotify Codes |
| **Coinbase** | Bouncing QR code as entire Super Bowl ad ($14M) | 20M hits in 1 minute, #1 App Store |
| **Deadpool** | QR hidden in teaser frame | 80K+ TikTok likes, viral discovery |
| **Marvel/Disney+** | QR hidden in TV episodes | Reddit treasure hunts, massive engagement |
| **Louis Vuitton** | QR code styled with LV monogram | Pioneer of "QR as luxury design" |

**Publista's unique angle:** The QR is not hidden IN the logo — the QR IS the logo's screen content. This means every single brand touchpoint (website, social media, watermark, business cards, merch, presentations) is inherently an interactive conversion point. No competitor has this.

#### 5.2.2 Dynamic QR Engine

The logo's QR code points to a single short URL (e.g., `publista.com/tv`) that **dynamically routes** based on context:

| Context | Destination | Offer |
|---------|------------|-------|
| Default / organic | Landing page with signup CTA | Standard free trial |
| Active promo campaign | `/lista-code` style promo page | Campaign-specific promo code |
| Seasonal (Black Friday, New Year) | Seasonal promo landing | Time-limited discount |
| Instagram campaign | Landing + extended trial | +7 bonus days |
| Watermark scan (from user content) | Signup page with bonus | Free premium templates pack |
| Event / conference | Event-specific page | Exclusive 48h offer |
| Existing user | Dashboard redirect | Feature highlight or upsell |

**Technical implementation:** Use a dynamic QR code platform (Uniqode, QR Tiger, or Bitly) to manage the destination without ever changing the logo image. One logo image, infinite destinations.

**Tracking:** Every scan is attributed via UTM parameters:
- `utm_source=qr_logo`
- `utm_medium=[context: social|watermark|merch|web|event]`
- `utm_campaign=[campaign_name]`

#### 5.2.3 "Scan the TV" Instagram Campaign

**Recurring format for Instagram/TikTok/YouTube Shorts:**

1. Publista publishes a Reel (created with Publista = dogfooding)
2. The TV logo is **hidden somewhere** in the video (quick flash, integrated in scene, corner placement, on a screen in the background...)
3. Caption CTA: "The TV is hidden in this video. First 50 to scan it unlock [reward]"
4. Viewers rewatch, search, scan, share discoveries
5. Result: **more watch time** (algorithm loves rewatches), more engagement, more conversions

**Why this is genius for the algorithm:**
- Rewatches boost watch time → Instagram/TikTok algorithm promotes the Reel
- Comments ("Found it at 0:12!") boost engagement signals
- Shares ("Try to find it!") boost send-per-reach ratio
- The mechanic literally games the algorithm while acquiring users

**Campaign phases:**

| Phase | Duration | Action | Goal |
|-------|----------|--------|------|
| **Tease** | Week 1-2 | Cryptic posts: "Our logo hides a secret. Have you scanned it?" | Curiosity |
| **Reveal** | Week 3 | Reel explaining the logo IS a real scannable QR code. First scan = exclusive offer | Virality |
| **Hunt** | Week 4-8 | Logo hidden in every Reel. First scanners get rewards. Hashtag #ScanTheTV | Engagement + acquisition |
| **Always-on** | Permanent | Every piece of content contains the scannable logo. Destination evolves dynamically. | Continuous acquisition |

#### 5.2.4 Gamified Scan Rewards — "TV Hunters"

A progressive reward system that turns logo scans into a retention and acquisition game:

| Tier | Cumulative Scans | Reward | Badge |
|------|-----------------|--------|-------|
| **Starter** | 1 scan | 1 free premium template | — |
| **Bronze** | 5 scans | 1 week Pro free | Bronze TV icon on profile |
| **Silver** | 15 scans | 1 month Pro free | Silver TV icon |
| **Gold** | 30 scans | 3 months Pro free + exclusive templates | Gold TV icon |
| **OG Scanner** | 50 scans | Lifetime "OG" badge + Publista merch | Animated TV icon |

**Mechanics:**
- Each scan from a unique context (different Reel, different location, different day) counts as 1 scan
- Duplicate scans (same content, same day) don't count — prevents gaming
- Public leaderboard of top "TV Hunters" (opt-in)
- Monthly reset for fresh competition, lifetime badges persist

#### 5.2.5 The Watermark as Interactive Feature

The "Made with Publista" watermark on free-tier content is upgraded from passive branding to an **interactive bridge**:

**Current behavior:** Static text/logo overlay on exported content.

**Enhanced behavior:** The watermark includes the TV logo with its scannable QR code. When someone watching a Reel sees the watermark and scans it:

```
User A creates a Reel (free tier)
  → Reel published with Publista TV logo watermark
    → User B sees the Reel, notices the retro TV, scans it
      → Lands on signup page with bonus offer
        → User B signs up, creates content (free tier)
          → User B's Reel carries the same scannable watermark
            → User C sees it, scans it... INFINITE VIRAL LOOP
```

This transforms the watermark from a "penalty" for free users into a **feature**:
- Free users can say "my audience can scan to discover my tools"
- It normalizes the watermark as part of the content aesthetic (retro TV = cool)
- Each piece of free-tier content becomes a measurable acquisition channel

#### 5.2.6 Logo-TV Placement on the Website

The scannable TV logo is a **signature interactive element** across the marketing site:

| Placement | Behavior | Design |
|-----------|----------|--------|
| **Navbar** | Static small TV logo, hover → subtle glow + tooltip "Scannez-moi !" | 32px height, brand colors |
| **Hero section** | Large animated TV — screen turns on, QR code materializes with glow effect | 200-300px, centerpiece animation |
| **Footer** | TV logo + text "Scannez pour une surprise" | Medium size, soft glow |
| **404 page** | TV displays static/snow → "Scan to find your way back" | Full-page takeover, playful |
| **Loading states** | TV as animated loader (screen flickers) | 48px, subtle |
| **About section** | TV as brand story element — "Our logo is alive. Scan it." | Integrated in brand narrative |

**Hero animation sequence (landing page):**
1. TV screen is off (dark)
2. Screen flickers on (CRT boot effect, 300ms)
3. QR code draws itself line by line (500ms)
4. Subtle glow pulse on the QR code (loop, 3s)
5. On hover: stronger glow + tooltip "Scannez-moi"

#### 5.2.7 QR Scan Metrics

| Metric | Tool | Target |
|--------|------|--------|
| Total scans/day | QR platform dashboard | Growth MoM |
| Scan-to-signup rate | GA4 + UTM attribution | > 15% |
| Scans by source (social, watermark, web, merch) | QR analytics | Channel attribution |
| Time from scan to signup | GA4 funnel | < 5 minutes |
| #ScanTheTV hashtag usage | Social listening | Organic virality |
| Revenue attributed to QR scans | CRM + QR platform | Direct ROI of the logo |
| Watermark scan rate | QR analytics (utm_medium=watermark) | > 5% of watermark impressions |

#### 5.2.8 Recommended Tech Stack for QR Management

| Need | Tool | Why |
|------|------|-----|
| Dynamic QR + analytics | **Uniqode** or **QR Tiger** | Geo-routing, A/B testing, advanced analytics |
| Custom QR design | **Flowcode** | Artistic QR codes, +30% scan rate vs generic |
| Attribution + funnel | **Bitly** + GA4 | Multi-touch attribution, UTM tracking |
| Gamification/rewards | Custom (internal) | Integrate with Publista tier system |

### 5.3 Dogfooding Strategy (P0 — Immediate)

Publista's social media accounts on Instagram, TikTok, YouTube, LinkedIn, and X are entirely powered by Publista itself. Every post is a live case study. Every post contains the scannable TV logo.

**Content pillars:**
1. **Before/After** (30%): Raw clips → finished Reel. Shows the transformation. TV logo visible in final result.
2. **Scan the TV hunts** (25%): Logo hidden in the Reel. "Find and scan the TV to unlock [reward]". Drives rewatches + engagement.
3. **Tips & Value** (25%): "3 regles pour que l'algorithme adore vos Reels" — educational content created with Publista.
4. **Product updates** (10%): New features announced as Reels (dogfooding the changelog).
5. **User spotlights** (10%): Best content created by Publista users (when available).

**Frequency:** 5 Reels/week + 2 Carousels/week + daily Stories. All created in one batch session using Publista.

### 5.4 SEO Programmatic Strategy (P1)

Instead of blog articles, Publista creates **action-oriented pages** that rank AND convert:

| Page type | Volume target | Conversion mechanism | SEO target |
|-----------|--------------|---------------------|------------|
| Use-case pages (/pour/*) | 6 at launch, 20+ over time | Persona-specific CTA | "creation reels [niche]" |
| Micro-tools (/tools/*) | 3 at launch, 10+ over time | "Transformez ca en Reel" | "generateur hashtag instagram" |
| Comparison pages (/compare/*) | 3 at launch, 10+ over time | Feature table + CTA | "alternative [concurrent]" |

**Key insight from Canva:** Their template pages convert at 18% vs 0.5% for blog content. Action-oriented pages (where the user DOES something) massively outperform informational pages (where the user READS something).

### 5.5 Referral Program (P2)

Inspired by Dropbox (3,900% growth in 15 months).

| Element | Specification |
|---------|--------------|
| Reward | +X bonus contents/month for both referrer and referred |
| Mechanism | Unique referral link in user dashboard |
| Tracking | Attributed signups via UTM + referral code |
| Viral CTA | "Invitez un ami, gagnez X contenus gratuits" |
| Placement | Dashboard banner, post-publish sharing screen, email |

### 5.6 Visual Changelog (P2)

Inspired by Linear (60% engagement rate vs 10-15% industry average).

| Element | Specification |
|---------|--------------|
| Format | Card-based, reverse-chronological |
| Visual | Each entry includes screenshot, GIF, or short video |
| Categories | Nouveau, Amelioration, Correction (color-coded badges) |
| Frequency | Weekly or bi-weekly |
| Distribution | /changelog page + email newsletter + social media (as Reel via dogfooding) |
| Engagement | Emoji reactions on each entry |

### 5.7 Community Discord (P2)

| Element | Specification |
|---------|--------------|
| Channels | #general, #showcase (user content), #tips, #feature-requests, #bugs |
| Monthly challenge | "Meilleur Reel du mois" — community votes, winner gets 1 month Pro free |
| User roles | Membre, Createur actif (10+ contenus), Ambassador |
| Growth | Invite link on /changelog, post-signup email, dashboard banner |

### 5.8 Template Marketplace (Phase 3)

Inspired by Canva (21K template pages, 18% conversion) and Notion (30K templates).

| Element | Specification |
|---------|--------------|
| Structure | Filterable gallery by niche, platform, content type |
| SEO | Each template = unique URL = indexable page |
| Community | Users can submit templates (moderated) |
| Monetization | Free templates (acquisition) + premium templates (paid tiers only) |
| Categories | By niche (restaurant, fitness, immo...) + by format (Reel, Carousel, Post) + by style (Dynamic, Cinematic, UGC...) |

---

## 6. Design System Additions

### 6.1 Public Pages Design Tokens

These tokens extend the existing design system for public-facing pages:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#09090b` (zinc-950) | Page background |
| `--bg-card` | `#18181b` (zinc-900) | Card backgrounds |
| `--bg-card-hover` | `#27272a` (zinc-800) | Card hover state |
| `--border-subtle` | `#27272a` (zinc-800) | Card borders |
| `--border-glow` | Brand accent at 20% opacity | Hover border glow |
| `--text-primary` | `#fafafa` (zinc-50) | Headlines, body |
| `--text-secondary` | `#a1a1aa` (zinc-400) | Descriptions, muted text |
| `--text-muted` | `#71717a` (zinc-500) | Labels, metadata |
| `--accent-gradient` | Existing lava lamp gradient | CTAs, highlights, hero accents |
| `--section-spacing` | `96px` desktop, `64px` mobile | Between major sections |

### 6.2 Component Patterns

| Pattern | Usage | Specs |
|---------|-------|-------|
| **Bento Card** | Feature blocks, pricing cards | `rounded-2xl border border-zinc-800 bg-zinc-900 p-8 hover:border-accent/20 transition-all` |
| **Marquee** | Social proof, logo bar | CSS infinite scroll, 30-40s loop, pausable on hover |
| **Accordion** | FAQ | Click to expand, smooth height transition, `+` → `−` icon |
| **Persona Tab** | Use cases section | Tab bar with persona names, content swaps with fade transition |
| **Stat Card** | Metrics/social proof | Large number (48px), label below (14px), accent color number |
| **CTA Button Primary** | All primary actions | `px-8 py-4 rounded-xl bg-gradient font-semibold text-lg` |
| **CTA Button Secondary** | All secondary actions | `px-8 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-800` |

### 6.3 Animation Specifications

| Animation | Trigger | Specs |
|-----------|---------|-------|
| **Fade-up** | Scroll into viewport | `opacity: 0 → 1, translateY: 24px → 0, duration: 600ms, ease: ease-out` |
| **Stagger** | Multiple cards enter | Each card delays by 100ms after previous |
| **Marquee** | Constant | `translateX: 0 → -50%, duration: 30s, linear, infinite` |
| **Navbar blur** | Scroll past hero | `background: transparent → bg-black/80, backdrop-blur: 0 → 16px` |
| **Card glow** | Hover | `border-color: transparent → accent/20, duration: 200ms` |
| **Accordion** | Click | `max-height: 0 → auto, duration: 300ms, ease: ease-in-out` |

**Performance rules:**
- Use CSS animations over JS when possible
- Use `will-change: transform` sparingly
- Respect `prefers-reduced-motion` — disable all animations for accessibility
- No animation on mobile below 768px (except marquee)

---

## 7. Implementation Priorities

### Phase 1 — Foundation (Current Sprint Target)

| # | Page/Component | Priority | Depends on |
|---|----------------|----------|------------|
| 1 | PublicLayout (navbar + footer) | P0 | — |
| 2 | Landing page (all 11 sections) | P0 | PublicLayout |
| 3 | Pricing page | P0 | PublicLayout |
| 4 | Features page | P1 | PublicLayout |
| 5 | Router restructure (public vs auth vs app) | P0 | — |

### Phase 2 — SEO & Acquisition Pages

| # | Page/Component | Priority | Depends on |
|---|----------------|----------|------------|
| 6 | Use-case pages (/pour/*) — 3 initial | P1 | PublicLayout |
| 7 | Comparison pages (/compare/*) — 3 initial | P1 | PublicLayout |
| 8 | Free micro-tools (/tools/*) — 3 tools | P1 | Backend AI endpoints |
| 9 | Terms of service | P1 | — |

### Phase 3 — Growth Engine

| # | Page/Component | Priority | Depends on |
|---|----------------|----------|------------|
| 10 | Changelog page | P2 | Content pipeline |
| 11 | Template gallery | P3 | User base + template system |
| 12 | Discord community | P2 | User base |
| 13 | Referral system | P2 | User dashboard |

---

## 8. Success Metrics — Client-Facing Pages

| Metric | Target | Measurement |
|--------|--------|-------------|
| Landing page → signup conversion | > 7% | Signup events / unique visitors |
| Pricing page → trial start | > 12% | Trial starts / pricing page visitors |
| Micro-tool → signup conversion | > 5% | Signup events / tool page visitors |
| Use-case page → signup conversion | > 8% | Signup events / use-case visitors |
| Navbar CTA click-through rate | > 3% | CTA clicks / page views |
| Average time on landing page | > 45s | Analytics |
| Bounce rate (landing page) | < 55% | Analytics |
| Mobile vs desktop signup ratio | > 40% mobile | Device segmentation |
| Organic search traffic (month 6) | > 5,000/month | Search console |
| "Made with Publista" attributed signups | > 20% of total | Referral tracking |
| QR logo scans/day | Growth MoM | QR platform analytics |
| QR scan-to-signup rate | > 15% | GA4 + UTM (utm_source=qr_logo) |
| Watermark scan rate | > 5% of impressions | QR analytics (utm_medium=watermark) |
| #ScanTheTV hashtag mentions | Growth MoM | Social listening |

---

## 9. Competitive Positioning Summary

### What we take from each competitor:

| Competitor | What we adopt | What we do differently |
|------------|--------------|----------------------|
| **Canva** | Template-as-acquisition model, generous free tier, SEO programmatic at scale | We're video-first, not design-first. Algorithm optimization is built-in. |
| **Opus Clip** | Dark premium design, zero-friction hero (try before signup), social proof with metrics, persona-segmented navigation | We CREATE original content, not just repurpose. Full pipeline from creation to publishing. |
| **Linear** | Visual changelog as marketing, dark design aesthetic, micro-animations | Applied to content creation SaaS instead of dev tools. |
| **Notion** | Template marketplace as flywheel, community-led growth | Templates are content templates (Reels, Carousels) not document templates. |
| **CapCut** | Double entry point (app + web), AI-first positioning in hero | No watermark penalty, multi-platform publishing, algorithm optimization. |

### Publista's unique angles (no competitor has these):

**1. "The product markets itself."** Every Reel published by a free user carries the Publista watermark on platforms where billions scroll daily. No other SaaS has this built-in viral loop in the most consumed media format on earth (short-form video). Canva had it with static designs — Publista has it with video, which has 30x more organic reach.

**2. "The Scannable Brand."** Publista's logo — a retro-futuristic TV screen displaying a functional QR code — is the only SaaS logo in existence that is inherently interactive. Every brand touchpoint (website, social media posts, watermarks, business cards, merch, presentations, email signatures) is a scannable conversion point. Precedents like Snapchat (SnapCode), Spotify (Spotify Codes), and Coinbase (Super Bowl QR) prove the model. But none of them applied it to a content creation SaaS where the logo appears inside every piece of user-generated content via the watermark.

**3. "Scan the TV" as cultural mechanic.** The hidden-logo treasure hunt format creates a self-reinforcing engagement loop: users rewatch content to find the logo → rewatches boost algorithm signals → algorithm promotes the content → more people see it → more people scan → more signups. The acquisition mechanic literally improves the content's algorithmic performance. No competitor can replicate this without redesigning their entire brand identity.

---

*Brief completed: 2026-02-14*
*Updated: 2026-02-14 — Added "Scan the TV" QR marketing strategy (Section 5.2)*
*Author: Utilisateur + Mary (Business Analyst Agent)*
*Input documents: product-brief, ux-design-specification, architecture, prd, competitive analysis research, QR marketing research*
