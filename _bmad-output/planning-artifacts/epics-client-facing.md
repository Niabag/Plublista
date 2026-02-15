---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: 2026-02-14
inputDocuments:
  - 'client-facing-brief-Publista-2026-02-14.md'
  - 'architecture.md'
  - 'ux-design-specification.md'
date: 2026-02-14
author: Utilisateur
---

# Publista Client-Facing Pages - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Publista's **client-facing marketing website**, decomposing the requirements from the Client-Facing Brief, Architecture, and UX Design Specification into implementable stories. This covers the public marketing site, landing page, SEO pages, and "Scan the TV" marketing features — separate from the core product epics (see epics.md).

## Requirements Inventory

### Functional Requirements

**Layout & Navigation (FR-CF1 to FR-CF5):**
- FR-CF1: Create a `PublicLayout` component with sticky Navbar + Footer, separate from existing AppLayout
- FR-CF2: Navbar with scroll-triggered transition (transparent → `bg-black/80 backdrop-blur-xl`)
- FR-CF3: Navbar with dropdown menus for "Use Cases" (6 links to /pour/*) and "Tools" (3 links to /tools/*)
- FR-CF4: Primary CTA "Commencer gratuitement" always visible on navbar (desktop + mobile)
- FR-CF5: Restructure router to separate public routes (PublicLayout), auth routes, and app routes (AppLayout)

**Landing Page (FR-CF6 to FR-CF16):**
- FR-CF6: Hero section with headline, subheadline, 2 CTAs (primary + secondary), and product demo video/animation
- FR-CF7: Social proof bar with infinite marquee scroll (platform stats)
- FR-CF8: Problem → Solution section with animated split layout (before/after Publista)
- FR-CF9: Features section in bento grid layout (2x2 desktop, stacked mobile) with 4 video/GIF blocks
- FR-CF10: Product demo section with embedded video (upgradeable to interactive demo later)
- FR-CF11: Use cases by persona section with tabs/carousel (3 personas: Freelances, PME, Agences)
- FR-CF12: Testimonials/Results section with carousel of metric cards (stat cards at launch)
- FR-CF13: Pricing preview section with 3 tiers and monthly/annual toggle
- FR-CF14: FAQ section with accordion component (6-7 questions)
- FR-CF15: Final CTA section — full-width with gradient background
- FR-CF16: Footer with 4-column layout, social icons, legal links, and language selector (FR/EN)

**Public Pages (FR-CF17 to FR-CF25):**
- FR-CF17: Features page (/features) with per-feature blocks, videos/GIFs, alternating layout
- FR-CF18: Pricing page (/pricing) with 5 tiers, feature comparison table, pricing FAQ
- FR-CF19: Use Case pages (/pour/:persona) — dynamic template serving 6 persona-specific pages
- FR-CF20: Micro-tool: AI Hashtag Generator (/tools/hashtag-generator) — functional without signup
- FR-CF21: Micro-tool: AI Caption Generator (/tools/caption-generator) — functional without signup
- FR-CF22: Micro-tool: Best Time to Post (/tools/best-time-to-post) — functional without signup
- FR-CF23: Changelog page (/changelog) — Linear-style, card-based, reverse-chronological with category badges
- FR-CF24: Competitor Comparison pages (/compare/:competitor) — side-by-side feature tables (3 pages: Canva, CapCut, Opus Clip)
- FR-CF25: Terms of Service page (/terms) — standard SaaS terms

**"Scan the TV" & Marketing Features (FR-CF26 to FR-CF33):**
- FR-CF26: Dynamic QR landing route (/tv) that redirects based on context (active promo, season, default)
- FR-CF27: Animated TV logo in hero section (CRT boot → QR code draw → glow pulse sequence)
- FR-CF28: Interactive TV logo in navbar (hover → glow + tooltip "Scannez-moi !")
- FR-CF29: TV logo in footer with "Scannez pour une surprise" text
- FR-CF30: Custom 404 page with TV in static/snow mode + "Scan to find your way back"
- FR-CF31: TV logo as animated loader for loading states (48px, screen flicker)
- FR-CF32: "TV Hunters" gamification system — scan tracking, progressive badges, leaderboard
- FR-CF33: Interactive watermark — TV logo with functional QR in free-tier watermark

### Non-Functional Requirements

- NFR-CF1: Dark mode native design — background `#09090b` (zinc-950), full design token system (Section 6.1 of brief)
- NFR-CF2: Mobile-first responsive — breakpoints at 768px and 1024px, all sections responsive
- NFR-CF3: GSAP scroll-triggered animations with `prefers-reduced-motion` respect (accessibility)
- NFR-CF4: Performance — CSS animations over JS when possible, `will-change` sparingly, no animations on mobile < 768px (except marquee)
- NFR-CF5: Landing page → signup conversion target > 7%
- NFR-CF6: Pricing page → trial start target > 12%
- NFR-CF7: Bounce rate landing < 55%, average time on page > 45s
- NFR-CF8: Micro-tool → signup conversion target > 5%
- NFR-CF9: SEO — programmatic pages must be indexable, unique URLs, SEO content blocks (300-500 words per tool)
- NFR-CF10: Hero video: 15-20s loop, autoplay muted
- NFR-CF11: Navbar transition `transition-all duration-300`, height 64px desktop / 56px mobile
- NFR-CF12: QR scan-to-signup rate > 15% (UTM attribution: `utm_source=qr_logo`)

### Additional Requirements

**From Architecture:**
- ARCH-1: Pages live in `apps/web` within existing monorepo (React + Vite SPA)
- ARCH-2: Use Tailwind CSS v4 + shadcn/ui component library (extend, not replace)
- ARCH-3: React Router restructure needed to integrate PublicLayout alongside existing AppLayout
- ARCH-4: No SSR (Vite SPA) — SEO programmatic pages need pre-rendering strategy or dynamic meta tags
- ARCH-5: Micro-tools (/tools/*) require backend AI endpoints (hashtag generation, caption generation, posting time calculation)
- ARCH-6: Public pages must NOT require authentication

**From UX Design:**
- UX-1: Extend existing design tokens for public dark mode theme
- UX-2: Reuse/extend existing shadcn/ui components (Button, Card, Accordion, etc.)
- UX-3: Three target personas (Sophie, Marc, Lea) — /pour/* pages must map to these profiles
- UX-4: "Show, Don't Tell" principle — video/GIF over static screenshots throughout

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-CF1 | CF-1 | PublicLayout component |
| FR-CF2 | CF-1 | Navbar scroll transition |
| FR-CF3 | CF-1 | Navbar dropdown menus |
| FR-CF4 | CF-1 | Navbar CTA always visible |
| FR-CF5 | CF-1 | Router restructure |
| FR-CF6 | CF-2 | Landing Hero section |
| FR-CF7 | CF-2 | Social proof marquee |
| FR-CF8 | CF-2 | Problem → Solution split |
| FR-CF9 | CF-2 | Features bento grid |
| FR-CF10 | CF-2 | Product demo embed |
| FR-CF11 | CF-2 | Use cases tabs |
| FR-CF12 | CF-2 | Testimonials carousel |
| FR-CF13 | CF-2 | Pricing preview |
| FR-CF14 | CF-2 | FAQ accordion |
| FR-CF15 | CF-2 | Final CTA |
| FR-CF16 | CF-1 | Footer |
| FR-CF17 | CF-3 | Features page |
| FR-CF18 | CF-3 | Pricing page |
| FR-CF19 | CF-4 | Use case pages |
| FR-CF20 | CF-5 | Hashtag generator tool |
| FR-CF21 | CF-5 | Caption generator tool |
| FR-CF22 | CF-5 | Best time to post tool |
| FR-CF23 | CF-7 | Changelog page |
| FR-CF24 | CF-4 | Comparison pages |
| FR-CF25 | CF-3 | Terms of service |
| FR-CF26 | CF-6 | /tv dynamic route |
| FR-CF27 | CF-6 | TV hero animation |
| FR-CF28 | CF-6 | TV navbar interactive |
| FR-CF29 | CF-6 | TV footer |
| FR-CF30 | CF-6 | Custom 404 page |
| FR-CF31 | CF-6 | TV loader animation |
| FR-CF32 | CF-7 | TV Hunters gamification |
| FR-CF33 | CF-7 | Interactive watermark |

## Epic List

### Epic CF-1: Public Site Foundation & Navigation (P0)
Users can browse the Publista marketing website with a professional sticky navbar, responsive footer, and seamless routing between public and authenticated areas.
**FRs covered:** FR-CF1, FR-CF2, FR-CF3, FR-CF4, FR-CF5, FR-CF16

### Epic CF-2: Landing Page (P0)
Visitors arriving on the homepage discover Publista's value proposition through an immersive dark-mode experience and can sign up in a few clicks.
**FRs covered:** FR-CF6, FR-CF7, FR-CF8, FR-CF9, FR-CF10, FR-CF11, FR-CF12, FR-CF13, FR-CF14, FR-CF15

### Epic CF-3: Core Conversion Pages (P0-P1)
Interested visitors can explore detailed features, compare all pricing plans, and review terms of service.
**FRs covered:** FR-CF17, FR-CF18, FR-CF25

### Epic CF-4: SEO & Persona Pages (P1)
Publista captures organic search traffic through persona-specific use case pages and competitor comparison pages.
**FRs covered:** FR-CF19, FR-CF24

### Epic CF-5: Free Micro-Tools (P1)
Anyone can use free AI-powered tools (hashtag generator, caption generator, best time to post) without signing up, creating a conversion bridge to Publista.
**FRs covered:** FR-CF20, FR-CF21, FR-CF22

### Epic CF-6: "Scan the TV" Brand Integration (P0)
Every brand touchpoint on the Publista website becomes scannable and interactive through the TV logo QR system, with a dynamic /tv landing route and custom 404 page.
**FRs covered:** FR-CF26, FR-CF27, FR-CF28, FR-CF29, FR-CF30, FR-CF31

### Epic CF-7: Growth Engine (P2)
Publista builds long-term engagement through a visual changelog, scan gamification ("TV Hunters"), and an interactive watermark that creates a viral acquisition loop.
**FRs covered:** FR-CF23, FR-CF32, FR-CF33

---

## Epic CF-1: Public Site Foundation & Navigation

Users can browse the Publista marketing website with a professional sticky navbar, responsive footer, and seamless routing between public and authenticated areas.

### Story CF-1.1: Router Restructure & PublicLayout Shell

As a visitor,
I want to access public marketing pages without being redirected to login,
So that I can learn about Publista before creating an account.

**Acceptance Criteria:**

**Given** the existing React Router configuration with AppLayout for authenticated routes
**When** the router is restructured
**Then** three route groups exist: public routes (wrapped in PublicLayout), auth routes (/login, /register, /onboarding — no layout wrapper), and app routes (wrapped in AppLayout with auth guard)
**And** the PublicLayout component renders a shell with a `<header>` slot, `<main><Outlet /></main>`, and `<footer>` slot
**And** navigating to `/` renders the PublicLayout without requiring authentication
**And** all existing authenticated routes (/dashboard, /create, /calendar, /library, /settings) continue to work unchanged with AppLayout
**And** all existing auth routes (/login, /register, /onboarding) continue to work unchanged
**And** a placeholder `<div>Landing page coming soon</div>` renders inside PublicLayout at route `/`
**And** the dark mode design tokens from the brief (Section 6.1) are added to the Tailwind config: `--bg-primary: #09090b`, `--bg-card: #18181b`, `--text-primary: #fafafa`, `--text-secondary: #a1a1aa`, etc.

### Story CF-1.2: Public Navbar

As a visitor,
I want a professional navigation bar that helps me explore all public pages,
So that I can easily find features, pricing, and tools information.

**Acceptance Criteria:**

**Given** the PublicLayout from Story CF-1.1
**When** any public page is loaded
**Then** a sticky navbar renders at `top: 0` with `z-index` above page content
**And** on initial load (scroll position 0), the navbar background is transparent
**And** when the user scrolls past 64px, the navbar transitions to `bg-black/80 backdrop-blur-xl` with `transition-all duration-300`
**And** the navbar height is 64px on desktop (≥1024px) and 56px on mobile
**And** the navbar contains: Publista logo (links to `/`), "Features" link (to `/features`), "Pricing" link (to `/pricing`), "Use Cases" dropdown, "Tools" dropdown, "Login" ghost button (to `/login`), and "Commencer gratuitement" solid accent CTA button (to `/register`)
**And** the "Use Cases" dropdown displays 6 links: Freelances & Community Managers → `/pour/freelances`, Restaurants & Food → `/pour/restaurants`, Immobilier → `/pour/immobilier`, Coachs & Consultants → `/pour/coachs`, E-commerce → `/pour/ecommerce`, Agences → `/pour/agences`
**And** the "Tools" dropdown displays 3 links: Generateur de hashtags IA → `/tools/hashtag-generator`, Generateur de captions IA → `/tools/caption-generator`, Meilleure heure de publication → `/tools/best-time-to-post`
**And** dropdowns open on hover (desktop) or tap (mobile) with smooth transition
**And** on mobile (<768px), the main links collapse into a hamburger menu (☰), but the "Commencer gratuitement" CTA remains visible alongside the hamburger icon
**And** the mobile menu opens as a full-height overlay with all navigation links
**And** the navbar respects the dark mode design tokens

### Story CF-1.3: Public Footer

As a visitor,
I want a footer with all important links and social media,
So that I can find legal information, resources, and follow Publista on social media.

**Acceptance Criteria:**

**Given** the PublicLayout from Story CF-1.1
**When** any public page is scrolled to the bottom
**Then** a footer renders with the dark mode background (`bg-zinc-950` or `bg-black`)
**And** on desktop (≥1024px), the footer displays 4 columns:
- Column 1 "Publista": Logo + tagline + social media icons (Instagram, TikTok, LinkedIn, X, YouTube) linking to Publista's social accounts
- Column 2 "Produit": Features → `/features`, Pricing → `/pricing`, Use Cases → `/pour/freelances`, Templates → `/templates` (placeholder)
- Column 3 "Ressources": Changelog → `/changelog`, Outils gratuits → `/tools/hashtag-generator`, Comparatifs → `/compare/canva`, Centre d'aide (placeholder)
- Column 4 "Legal": Confidentialite → `/privacy`, CGU → `/terms`, Suppression donnees → `/data-deletion`, Cookies (placeholder)
**And** on mobile (<768px), columns stack vertically with collapsible sections
**And** a bottom bar displays "© 2026 Publista. Tous droits reserves." and a language selector (FR/EN) — language selector is visual only at launch (no i18n implementation)
**And** all links navigate to their respective routes (existing pages like /privacy and /data-deletion work, placeholder pages show a "coming soon" message)

---

## Epic CF-2: Landing Page

Visitors arriving on the homepage discover Publista's value proposition through an immersive dark-mode experience and can sign up in a few clicks.

### Story CF-2.1: Hero Section

As a visitor,
I want to immediately understand what Publista does and how it benefits me,
So that I can decide to sign up or learn more within seconds of landing.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer from Epic CF-1
**When** a visitor navigates to `/`
**Then** a hero section renders as the first content section below the navbar
**And** the hero displays: a headline "Du contenu pro, partout, en 3 minutes" (64px desktop, 36px mobile, bold), a subheadline describing the pain→solution (16-18px, `text-secondary` color), a primary CTA button "Commencer gratuitement" linking to `/register` (solid accent gradient, `px-8 py-4 rounded-xl`), and a secondary CTA "Voir la demo" that smooth-scrolls to the product demo section (ghost/text style)
**And** a trust badge "Pas de carte bancaire requise" displays below the CTAs in small muted text
**And** on desktop (≥1024px), the layout is two-column: text left, video/visual placeholder right
**And** on mobile (<768px), the layout stacks: text top, visual bottom at 16:9 ratio
**And** a video placeholder area is rendered (accepts a future video/animation asset, shows a static product screenshot or gradient placeholder at launch)
**And** the section uses GSAP fade-up animation on scroll (or CSS fallback), respecting `prefers-reduced-motion`
**And** the page background is `#09090b` (zinc-950) with optional subtle radial gradient

### Story CF-2.2: Social Proof Bar & Problem→Solution Section

As a visitor,
I want to see proof that Publista is credible and understand how it eliminates my current pain,
So that I trust the product and feel motivated to try it.

**Acceptance Criteria:**

**Given** the landing page with the hero section from Story CF-2.1
**When** the visitor scrolls past the hero
**Then** a social proof bar renders with an infinite-scroll CSS marquee (30s loop, linear, white text on dark)
**And** the marquee displays platform stats: "X+ contenus crees", "X+ plateformes supportees", "Note 4.X/5" (placeholder values at launch, updated with real data post-launch)
**And** the marquee pauses on hover (desktop)
**And** below the social proof bar, a "Problem → Solution" section renders with the headline "5 outils. Des heures perdues. Un seul resultat."
**And** the section displays a split layout: LEFT side ("Avant Publista") lists pain points in muted/gray style with pain icons, RIGHT side ("Avec Publista") lists solutions with bright accent gradient and check icons
**And** content matches the brief: Left shows "Canva pour le design, CapCut pour la video, ChatGPT pour les textes, Buffer pour la programmation, 45 min par Reel, Watermarks penalises" — Right shows "Un seul outil, 3 minutes par Reel, Optimise pour l'algorithme, Publication multi-plateforme, Zero watermark, Zero penalite"
**And** on scroll, the left side fades down and the right side slides up (GSAP or CSS animation, respects `prefers-reduced-motion`)
**And** the section is responsive: side-by-side on desktop, stacked on mobile

### Story CF-2.3: Features Bento Grid & Product Demo Section

As a visitor,
I want to see Publista's key features visually and watch the product in action,
So that I understand what the tool does and feel confident it works.

**Acceptance Criteria:**

**Given** the landing page with sections from Stories CF-2.1 and CF-2.2
**When** the visitor scrolls to the features area
**Then** a features section renders in a bento grid layout: 2x2 on desktop (≥1024px), stacked on mobile
**And** each bento card contains: an icon or video/GIF placeholder area (autoplay, loop, muted), a benefit-oriented headline, a 2-line description, and has hover effect (scale 1.02, border glow at accent/20%)
**And** the 4 cards are: (1) "Reels en pilote automatique" — auto-montage description, (2) "Carousels qui convertissent" — carousel builder description, (3) "Publiez partout, en un clic" — multi-platform publishing, (4) "Calendrier intelligent" — scheduling description
**And** card styling follows the brief: `rounded-2xl border border-zinc-800 bg-zinc-900 p-8 hover:border-accent/20 transition-all`
**And** cards animate in with stagger effect (100ms delay between each, GSAP or CSS, respects `prefers-reduced-motion`)
**And** below the features grid, a product demo section renders with headline "Voyez Publista en action"
**And** the demo section contains an embedded video area (placeholder at launch — accepts a YouTube/Vimeo embed or custom video player) and a CTA "Essayez vous-meme — c'est gratuit" linking to `/register`

### Story CF-2.4: Use Cases Tabs & Testimonials Section

As a visitor,
I want to see how Publista applies to people like me and see real results,
So that I feel the product is designed for my specific needs.

**Acceptance Criteria:**

**Given** the landing page with sections from Stories CF-2.1 through CF-2.3
**When** the visitor scrolls to the use cases area
**Then** a use cases section renders with a tab bar or carousel showing 3 personas
**And** Tab 1 "Freelances": headline "15 Reels en une matinee", description about Sophie managing 8 client accounts, CTA "Decouvrir comment →" linking to `/pour/freelances`
**And** Tab 2 "PME / Marketing": headline "Votre premier Reel pro, sans competence video", description about Marc with no editing skills, CTA linking to `/pour/restaurants` (example SMB)
**And** Tab 3 "Agences": headline "Scalez sans embaucher", description about Lea scaling without hiring, CTA linking to `/pour/agences`
**And** tab switching has a smooth fade transition for content swap
**And** below use cases, a testimonials/results section renders as a carousel of metric stat cards (at launch: product stats like "3 min par Reel", "15+ plateformes", "0 watermark" — no fake testimonials)
**And** stat cards display a large number (48px), a label below (14px), in accent color
**And** the carousel shows 3 cards on desktop, 1 on mobile, swipeable

### Story CF-2.5: Pricing Preview, FAQ & Final CTA

As a visitor,
I want to see pricing transparency and get answers to common questions before signing up,
So that I can make an informed decision without searching for information.

**Acceptance Criteria:**

**Given** the landing page with sections from Stories CF-2.1 through CF-2.4
**When** the visitor scrolls to the pricing area
**Then** a pricing preview section renders with headline "Un plan pour chaque ambition"
**And** a toggle switches between "Mensuel" and "Annuel" (annual pre-selected, showing savings %)
**And** 3 pricing cards display side by side on desktop, stacked on mobile: Free (0 EUR), Pro (79 EUR/mois — highlighted with "Populaire" badge and accent border, slightly elevated), and Agency (499 EUR/mois)
**And** each card shows: tier name, price, 3-4 key features, and a CTA button ("Commencer gratuitement" for Free, "Essai gratuit 7 jours" for Pro, "Contacter l'equipe" for Agency)
**And** "Pas de carte bancaire requise" displays under the Free CTA
**And** a link "Voir tous les plans →" navigates to `/pricing`
**And** below pricing, a FAQ section renders with 6-7 accordion items (click to expand, smooth height transition, `+` → `−` icon)
**And** FAQ content matches the brief (Section 9): questions about editing skills, platforms, free tier limits, watermark, cancellation, free trial, data security
**And** below FAQ, a final CTA section renders full-width with gradient background: headline "Pret a creer du contenu qui performe ?", subheadline "Rejoignez les createurs qui produisent 5x plus vite.", and a large CTA button "Commencer gratuitement →" linking to `/register`

---

## Epic CF-3: Core Conversion Pages

Interested visitors can explore detailed features, compare all pricing plans, and review terms of service.

### Story CF-3.1: Features Page

As a visitor,
I want to deep-dive into all Publista features with visuals and descriptions,
So that I can understand exactly what the product offers before signing up.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/features`
**Then** a hero section renders with a headline, subheadline, and CTA "Commencer gratuitement"
**And** below the hero, feature blocks render in alternating left/right layout (text left + visual right, then text right + visual left, alternating)
**And** the feature blocks cover: (1) AI Auto-Montage (hero feature, largest visual area), (2) Carousel Builder + AI Images, (3) Single Post Creator, (4) AI Copy Generation (captions, hashtags, CTAs), (5) AI Music Generation, (6) Multi-Platform Publishing, (7) Calendar & Scheduling, (8) Format Selection (9:16, 16:9, 1:1)
**And** each feature block contains: a headline (benefit-oriented), 3-4 bullet points, a video/GIF placeholder area, and a subtle CTA
**And** below the feature blocks, an integration logos section shows all supported platform icons (Instagram, TikTok, YouTube, Facebook, LinkedIn, X, etc.)
**And** a final CTA section renders: "Commencer gratuitement" linking to `/register`
**And** the page is fully responsive (alternating layout on desktop, stacked on mobile)

### Story CF-3.2: Pricing Page

As a visitor,
I want to compare all pricing plans with a detailed feature table,
So that I can choose the plan that fits my needs and budget.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/pricing`
**Then** a hero section renders with headline "Un plan pour chaque ambition"
**And** a toggle switches between "Mensuel" and "Annuel" with annual pre-selected and savings percentage displayed
**And** 5 pricing cards render side by side on desktop (scrollable or grid), stacked on mobile: Free, Starter, Pro (highlighted with "Populaire" badge and accent border), Business, and Agency
**And** each card displays: tier name, price (adapts to toggle), key features list, and CTA button
**And** below the cards, an expandable/collapsible feature comparison table renders with sections: Creation (content types, AI features, formats), Publishing (platforms, scheduling, calendar), Limits (content/month, storage, export quality), Support (response time, dedicated manager)
**And** below the comparison table, a pricing-specific FAQ renders in accordion format (refunds, upgrades, team billing, etc.)
**And** a final CTA section renders: "Commencer gratuitement" linking to `/register`
**And** pricing data is structured as a JSON/TS config for easy updates (not hardcoded in JSX)

### Story CF-3.3: Terms of Service Page

As a visitor,
I want to read the terms of service,
So that I understand the legal terms before using Publista.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/terms`
**Then** a page renders with a clean, readable layout (max-width prose, dark background, light text)
**And** the content is structured with standard SaaS terms sections (headings + paragraphs)
**And** the content is loaded from a markdown file or static content block (easy to update without code changes)
**And** the footer link "CGU" navigates to this page
**And** the page is responsive and accessible

---

## Epic CF-4: SEO & Persona Pages

Publista captures organic search traffic through persona-specific use case pages and competitor comparison pages.

### Story CF-4.1: Use Case Pages Template & Content

As a potential user searching for content creation solutions for my specific industry,
I want a page tailored to my use case with relevant examples and pricing,
So that I can see exactly how Publista solves my specific problems.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/pour/:persona` (e.g., `/pour/freelances`, `/pour/restaurants`, etc.)
**Then** a dynamic page renders using a shared template with persona-specific data
**And** the template structure is: (1) Hero with persona-specific headline and visual placeholder, (2) Pain points — 3-4 bullet points specific to this persona, (3) Solution mapping — how Publista solves each pain point (feature mapping), (4) Quantified results / use case scenario, (5) Pricing recommendation for this persona, (6) CTA "Commencer gratuitement" linking to `/register`
**And** 6 persona data sets are implemented: freelances, restaurants, immobilier, coachs, ecommerce, agences — each with unique headline, pain points, solutions, results, and recommended pricing tier (following the brief Section 3.3 examples)
**And** an invalid `:persona` slug renders a 404 or redirects to `/`
**And** each page has appropriate `<title>` and `<meta description>` tags for SEO (e.g., "Creation Reels pour restaurants — Publista")
**And** the "Use Cases" dropdown in the navbar links correctly to each page
**And** the page is fully responsive

### Story CF-4.2: Competitor Comparison Pages Template & Content

As a potential user comparing content creation tools,
I want an honest side-by-side comparison between Publista and competitors,
So that I can make an informed decision based on features and pricing.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/compare/:competitor` (e.g., `/compare/canva`, `/compare/capcut`, `/compare/opus-clip`)
**Then** a dynamic page renders using a shared template with competitor-specific data
**And** the template structure is: (1) Headline "Publista vs [Competitor]: le comparatif complet", (2) Quick verdict — 3-sentence summary, (3) Side-by-side feature comparison table, (4) What [Competitor] does well (honest, fair), (5) What Publista does that [Competitor] doesn't, (6) Pricing comparison, (7) CTA "Essayez Publista gratuitement" linking to `/register`
**And** 3 competitor data sets are implemented: canva, capcut, opus-clip — each with unique verdict, feature table, strengths, differentiators, and pricing comparison
**And** the tone is honest and fair — competitor strengths are acknowledged, differentiation is fact-based
**And** an invalid `:competitor` slug renders a 404 or redirects to `/`
**And** each page has SEO meta tags (e.g., "Publista vs Canva — Comparatif complet 2026")
**And** the page is fully responsive

---

## Epic CF-5: Free Micro-Tools

Anyone can use free AI-powered tools (hashtag generator, caption generator, best time to post) without signing up, creating a conversion bridge to Publista.

### Story CF-5.1: AI Hashtag Generator

As a social media manager,
I want to generate optimized hashtags for my posts without signing up,
So that I can improve my reach and discover Publista as a tool.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/tools/hashtag-generator`
**Then** a tool page renders with: tool headline, brief explanation, input form, results area, soft CTA, and SEO content block
**And** the input form accepts a text field for topic/niche or Instagram post description
**And** on submission, a backend API endpoint (`POST /api/tools/hashtag-generator`) processes the request using AI (Claude API) and returns 30 categorized hashtags: 10 high-volume, 10 medium, 10 niche
**And** results display in 3 categorized groups with a "Copy all" button for each group
**And** the tool works WITHOUT requiring authentication (no login, no signup)
**And** rate limiting is applied to the API endpoint (e.g., 5 requests/hour per IP) to prevent abuse
**And** a soft CTA renders below results: "Transformez ces hashtags en Reel → Essayez Publista" linking to `/register`
**And** an SEO content block (300-500 words) renders below the tool targeting "generateur hashtag instagram"
**And** the page has SEO meta tags targeting "generateur hashtag instagram", "instagram hashtag generator"
**And** loading state shows a spinner/skeleton during generation
**And** error state shows a user-friendly message if generation fails

### Story CF-5.2: AI Caption Generator

As a content creator,
I want to generate caption variations for my posts without signing up,
So that I can improve my content copy and discover Publista.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/tools/caption-generator`
**Then** a tool page renders following the same template structure as Story CF-5.1
**And** the input form accepts: topic (text field), tone selector (pro/casual/fun), and platform selector (Instagram/TikTok/LinkedIn/YouTube)
**And** on submission, a backend API endpoint (`POST /api/tools/caption-generator`) processes the request using AI and returns 5 caption variations with emoji and CTA suggestions
**And** each caption variation displays with a "Copy" button
**And** the tool works WITHOUT authentication, with rate limiting (5 requests/hour per IP)
**And** a soft CTA renders below results linking to `/register`
**And** an SEO content block (300-500 words) targets "generateur legende instagram", "instagram caption generator"
**And** the page has appropriate SEO meta tags

### Story CF-5.3: Best Time to Post Calculator

As a social media manager,
I want to find the optimal posting times for my niche and platform,
So that I can maximize engagement and discover Publista.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/tools/best-time-to-post`
**Then** a tool page renders following the same template structure as Story CF-5.1
**And** the input form accepts: platform selector (Instagram/TikTok/YouTube/LinkedIn/Facebook), industry/niche selector or text field, and timezone selector
**And** on submission, a backend API endpoint (`POST /api/tools/best-time-to-post`) processes the request using AI and returns an optimal posting schedule for the week
**And** results display as a visual weekly calendar grid showing recommended posting times highlighted with color intensity (hotter = better time)
**And** the tool works WITHOUT authentication, with rate limiting (5 requests/hour per IP)
**And** a soft CTA renders below results linking to `/register`
**And** an SEO content block (300-500 words) targets "meilleure heure publication instagram", "best time to post"
**And** the page has appropriate SEO meta tags

---

## Epic CF-6: "Scan the TV" Brand Integration

Every brand touchpoint on the Publista website becomes scannable and interactive through the TV logo QR system, with a dynamic /tv landing route and custom 404 page.

### Story CF-6.1: Animated TV Logo Component

As a developer,
I want a reusable animated TV logo component with multiple size variants,
So that it can be integrated across the entire marketing site with consistent behavior.

**Acceptance Criteria:**

**Given** the Publista TV logo asset (retro TV with QR code screen)
**When** the AnimatedTvLogo component is rendered
**Then** it accepts props: `size` ("sm" 32px | "md" 48px | "lg" 200-300px), `animate` (boolean, default true), `interactive` (boolean, default false), and `tooltipText` (optional string)
**And** when `animate` is true and `size` is "lg", the full animation sequence plays: (1) TV screen is dark (300ms), (2) Screen flickers on with CRT boot effect (300ms), (3) QR code draws itself line by line (500ms), (4) Subtle glow pulse loops (3s cycle)
**And** when `animate` is true and `size` is "sm" or "md", a simplified animation plays (glow pulse only, no boot sequence)
**And** when `interactive` is true, on hover: stronger glow effect + tooltip displays `tooltipText` (e.g., "Scannez-moi !")
**And** when `prefers-reduced-motion` is enabled, all animations are disabled and the logo renders as a static image
**And** the component uses CSS animations (not JS) for the glow pulse, and GSAP (or CSS keyframes) for the boot sequence
**And** the component is exported from a shared location (e.g., `features/public/components/AnimatedTvLogo.tsx`)

### Story CF-6.2: Dynamic /tv QR Landing Route

As a person who scanned the Publista TV logo QR code,
I want to land on a contextual page based on the current campaign,
So that I get the most relevant offer or information.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/tv` (the QR code destination URL)
**Then** the route checks for active redirect rules and performs a client-side redirect
**And** the redirect logic checks in order: (1) active promo campaign → redirect to promo page (e.g., `/lista-code`), (2) seasonal campaign → redirect to seasonal landing, (3) default → redirect to `/` (landing page) with UTM params preserved
**And** UTM parameters are preserved through the redirect: `utm_source=qr_logo`, `utm_medium=[context]`, `utm_campaign=[campaign_name]`
**And** the redirect configuration is stored in a simple TS config file (easy to update without redeployment — or via environment variables)
**And** if an authenticated user scans, they are redirected to `/dashboard` instead
**And** the redirect happens within 100ms (no visible loading page, unless a brief branded splash is desired)
**And** analytics events fire on `/tv` hit before redirect (for scan counting)

### Story CF-6.3: TV Logo Integration in Navbar, Footer & Hero

As a visitor,
I want to see the interactive TV logo across the marketing site as a branded element,
So that I can scan it from any page and experience the brand identity.

**Acceptance Criteria:**

**Given** the AnimatedTvLogo component from Story CF-6.1 and the PublicLayout from Epic CF-1
**When** any public page is loaded
**Then** the navbar displays the AnimatedTvLogo at size "sm" (32px) as the site logo, with `interactive: true` and `tooltipText: "Scannez-moi !"`
**And** on hover, the navbar TV logo shows a subtle glow and the tooltip
**And** the footer displays the AnimatedTvLogo at size "md" with text "Scannez pour une surprise" next to it
**And** on the landing page (`/`) hero section, the large AnimatedTvLogo at size "lg" renders as a visual centerpiece element (integrated alongside or within the hero visual area), playing the full boot animation sequence on page load
**And** all TV logo instances link to or represent the QR code destination (the actual QR is in the logo image itself — no additional QR overlay needed)

### Story CF-6.4: Custom 404 Page & TV Loading States

As a visitor who reached a broken link,
I want an engaging 404 page that fits the brand,
So that I can find my way back and enjoy the experience even on an error page.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to any undefined route
**Then** a custom 404 page renders within PublicLayout
**And** the 404 page features the AnimatedTvLogo at size "lg" displaying a static/snow effect (CSS noise animation on the TV screen instead of QR code)
**And** the page displays a headline "Oups, cette page n'existe pas" and a playful subtext "Scannez la TV pour retrouver votre chemin" (or similar)
**And** a "Retour a l'accueil" button links to `/`
**And** the page uses the dark mode design system (zinc-950 background)
**And** separately, a `TvLoader` component is created at 48px using the AnimatedTvLogo with a screen flicker animation (for use as a loading spinner across the app)
**And** the TvLoader component is exported for reuse in loading states across public pages

---

## Epic CF-7: Growth Engine

Publista builds long-term engagement through a visual changelog, scan gamification ("TV Hunters"), and an interactive watermark that creates a viral acquisition loop.

### Story CF-7.1: Visual Changelog Page

As a user or visitor,
I want to see what's new in Publista through a beautifully designed changelog,
So that I can stay informed about new features and improvements.

**Acceptance Criteria:**

**Given** the PublicLayout with navbar and footer
**When** a visitor navigates to `/changelog`
**Then** a changelog page renders in Linear-style design: dark background, card-based entries, reverse-chronological order
**And** each entry displays: date, headline, description (markdown rendered), visual placeholder area (screenshot/GIF/video), and a category badge color-coded: "Nouveau" (green/accent), "Amelioration" (blue), "Correction" (yellow)
**And** entries are loaded from a local data source (JSON or markdown files in the repository — no CMS at launch)
**And** a newsletter subscription CTA renders at the top of the page: email input + "S'abonner aux mises a jour" button (UI only at launch — email collection backend is a future story)
**And** entries animate in with fade-up on scroll
**And** the page is responsive: single column on all screen sizes, max-width prose

### Story CF-7.2: TV Hunters Gamification System

As an engaged user,
I want to earn rewards and badges by scanning the Publista TV logo in different contexts,
So that I feel incentivized to engage with the brand and unlock perks.

**Acceptance Criteria:**

**Given** an authenticated user with a Publista account
**When** the user scans the TV logo QR code and arrives via `/tv` with UTM tracking
**Then** the system records the scan event with: user ID, source context (utm_medium), timestamp, and content identifier (utm_campaign)
**And** duplicate scans are rejected: same user + same content + same day = no additional credit
**And** the user's cumulative unique scan count is tracked in the database
**And** progressive rewards unlock at thresholds: 1 scan (Starter — 1 free premium template), 5 scans (Bronze — 1 week Pro free + badge), 15 scans (Silver — 1 month Pro free + badge), 30 scans (Gold — 3 months Pro free + exclusive templates + badge), 50 scans (OG Scanner — lifetime badge + merch eligibility)
**And** earned badges display on the user's profile/settings page
**And** a backend API endpoint handles scan recording and reward calculation
**And** an opt-in public leaderboard of top "TV Hunters" is available (future frontend, backend ready)

### Story CF-7.3: Interactive Watermark Enhancement

As a free-tier user,
I want my watermarked content to feature the Publista TV logo with a scannable QR code,
So that viewers of my content can discover Publista through an interactive brand element.

**Acceptance Criteria:**

**Given** the existing watermark system from Epic 4 (core product)
**When** a free-tier user exports content with the "Made with Publista" watermark
**Then** the watermark includes the TV logo image with the embedded QR code (replacing or augmenting the current text-only watermark)
**And** the QR code in the watermark points to `/tv` with UTM params: `utm_source=qr_logo`, `utm_medium=watermark`, `utm_campaign=[content_id]`
**And** the watermark is sized appropriately (not too large to be intrusive, not too small to be unscannable — recommended: 64-80px height)
**And** the watermark position follows existing watermark placement logic (bottom-right corner)
**And** scanning the watermark QR code leads to the dynamic /tv route which provides contextual offers for new users
**And** the enhanced watermark does not degrade export quality or significantly increase file size
