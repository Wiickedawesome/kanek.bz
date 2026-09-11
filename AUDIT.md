# kanek.bz — Pre-Launch Comprehensive Audit Plan

**Date**: April 17, 2026
**Target**: Full-scale audit of public marketing site + admin dashboard
**Stack**: Next.js 16.2.3 (static export) · Supabase · Framer Motion · GSAP · Firebase Hosting
**Scope**: Every file under `src/`, all configuration, dependencies, deployment readiness

> Status note, April 27, 2026: this document started as a pre-launch plan. The live hosting target is now Firebase Hosting, not GitHub Pages, and the latest implementation pass added a fail-closed admin backend contract for mutations and document access.

## April 27, 2026 Findings Snapshot

### Confirmed Changes

- Public marketing routes `/`, `/about`, `/contact`, `/join`, and `/download` were refactored to server-rendered markup to reduce route-level hydration and animation runtime risk.
- Admin reads, mutations, and document access now run through a fail-closed backend contract configured through `NEXT_PUBLIC_ADMIN_API_BASE_URL`, with a Supabase Edge Function implementation added at `supabase/functions/admin-api/index.ts`.
- The admin login flow now waits for profile resolution before clearing loading state and disables implicit OTP user creation.
- The live Supabase function `admin-api` was deployed to project `tlggdherqjvybpddsqjj` on April 27, 2026.

### Confirmed Constraints

- This repo still builds as a static export, so dynamic Next.js route handlers are not the right place for secure admin mutations here.
- No Supabase SQL migrations, storage policies, or RLS definitions exist in this repo, so a full authorization audit still cannot be completed locally from code alone even though a query checklist now exists at `supabase/sql/rls-audit-queries.sql`.
- The live database currently has zero `profiles.role = 'admin'` rows, so the deployed admin backend will reject every admin request until an admin profile is created or promoted.

### Live Supabase Audit Findings

- All inspected app-facing public tables currently have RLS enabled.
- RLS is enabled but not forced on the inspected public tables.
- The `documents` storage bucket is private.
- The public-role policies inspected on `profiles`, `posts`, `bookings`, `contract_events`, and `driver_documents` are predicate-constrained by `auth.uid()` or admin checks rather than being blanket-open reads or writes.
- Stored document references still contain legacy malformed values: 3 of 7 sampled refs include a trailing `:http://localhost...` blob suffix. The deployed Edge Function now strips that suffix before requesting a signed URL.

### Remaining Audit Priorities

- Verify Supabase RLS and storage policies directly in the backend source of truth or Supabase dashboard.
- Point `NEXT_PUBLIC_ADMIN_API_BASE_URL` at the deployed function URL in each environment and ensure the frontend is rebuilt with that value.
- Promote at least one production profile to `role = 'admin'` so the backend can authorize real admin sessions.
- Clean or backfill malformed stored document references so the backend no longer needs to sanitize legacy blob-suffixed paths at read time.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Phase 1 — Security Audit](#phase-1--security-audit)
3. [Phase 2 — Functional Audit](#phase-2--functional-audit)
4. [Phase 3 — Performance Audit](#phase-3--performance-audit)
5. [Phase 4 — Accessibility Audit](#phase-4--accessibility-audit-wcag-21-aa)
6. [Phase 5 — SEO & Launch Readiness](#phase-5--seo--launch-readiness)
7. [Phase 6 — Code Quality Audit](#phase-6--code-quality-audit)
8. [Verification Checklist](#verification-checklist)
9. [Known Risks (Pre-Audit)](#known-risks-pre-audit)
10. [Scope & Exclusions](#scope--exclusions)
11. [Issue Tracker](#issue-tracker)

---

## System Overview

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Pages                      │
│              (static HTML/CSS/JS export)             │
├──────────────────────┬──────────────────────────────┤
│   Public Site (7pp)  │   Admin Dashboard (7 sections)│
│   /                  │   /admin/login                │
│   /about             │   /admin  (overview)          │
│   /contact           │   /admin/users                │
│   /download          │   /admin/bookings             │
│   /join              │   /admin/content              │
│   /privacy           │   /admin/community            │
│   /terms             │   /admin/moderation           │
│                      │   /admin/finance              │
├──────────────────────┴──────────────────────────────┤
│              Supabase (Backend-as-a-Service)          │
│   Auth (OTP email) · PostgreSQL · RLS · Storage      │
└─────────────────────────────────────────────────────┘
```

### File Inventory

| Category | Count | Key Files |
|----------|-------|-----------|
| Public pages | 7 | `src/app/(public)/page.tsx`, about, contact, download, join, privacy, terms |
| Admin pages | 8 | login + 7 dashboard sections |
| UI components | 16 | `src/components/ui/*` — buttons, cards, animations, canvas effects |
| Admin components | 3 | admin-guard, admin-shell, auth-provider |
| Shared components | 4 | header, footer, theme-provider, theme-toggle |
| Library files | 3 | supabase client, utils, useResolveNames hook |
| Config files | 6 | next.config, tsconfig, eslint, postcss, components.json, package.json |

### Supabase Tables Accessed (17)

| Table | Read | Write | Used In |
|-------|------|-------|---------|
| `profiles` | ✓ | — | Auth, dashboard, users, name resolution |
| `driver_details` | ✓ | — | Users |
| `driver_documents` | ✓ | ✓ (approve/reject) | Users |
| `rider_documents` | ✓ | ✓ (approve/reject) | Users |
| `bookings` | ✓ | — | Dashboard, bookings |
| `contracts` | ✓ | — | Bookings |
| `contract_events` | ✓ | — | Bookings |
| `posts` | ✓ | ✓ (cancel) | Content, name resolution |
| `notifications` | ✓ | — | Content |
| `road_reports` | — | — | Deprecated / Dropped |
| `gas_prices` | ✓ | — | Community |
| `waitlist` | — | — | Deprecated / Dropped |
| `ekyash_transactions` | ✓ | — | Finance |
| `email_receipts` | ✓ | — | Finance |
| `donation_totals` | ✓ | — | Finance |
| `flags` | ✓ | ✓ (review) | Moderation |
| `strikes` | ✓ | ✓ (issue) | Moderation |
| `admin_actions` | ✓ | ✓ (log) | Moderation, content |

### Environment Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (client-side safe only if RLS is configured) |

---

## Phase 1 — Security Audit

### 1.1 Authentication & Authorization

The admin uses Supabase OTP (magic link via email). There is no password. The flow is:

```
Email entered → signInWithOtp() → code sent to email
Code entered → verifyOtp() → session created
onAuthStateChange → fetchProfile(user.id) → check profile.role === "admin"
AdminGuard component → blocks non-admin from dashboard routes
```

**What we audit:**

| Check | Description | Severity if Failing |
|-------|-------------|---------------------|
| OTP rate limiting | Does Supabase rate-limit OTP requests? (prevents email bombing) | High |
| Brute force on code | Is there a limit on verification attempts? (6-digit code = 1M combinations) | Critical |
| Client-side role check | `isAdmin` is set from `profile.role` — can a user modify this in DevTools? | Critical |
| AdminGuard coverage | Does AdminGuard wrap ALL admin routes including the layout? | Critical |
| Session persistence | Does auth survive page refresh? Does expired token get caught? | High |
| Session cleanup | Does `signOut()` clear all tokens from localStorage/cookies? | Medium |
| Email validation | Is the email input validated before sending to Supabase? | Low |
| OTP code validation | Is there a max-length or format check on the code input? | Low |
| Auth state race | Can a user land on a dashboard page before auth check completes? (flash of content) | Medium |
| Profile fetch failure | What happens if the profiles table RLS blocks the fetch? (currently shows error) | Medium |

**Key question**: The `isAdmin` check happens client-side. The real security gate is Supabase RLS on the database — if RLS is not configured, the client-side check is just cosmetic and any user with the anon key can read/write everything.

### 1.2 Supabase Row Level Security (RLS) — HIGHEST RISK AREA

**Why this matters**: The Supabase anon key is embedded in the client-side JavaScript bundle. Anyone can extract it from the browser and make direct API calls to the Supabase REST endpoint. The ONLY thing preventing unauthorized data access is properly configured RLS policies on every table.

**What we audit:**

| Check | Description | Severity if Failing |
|-------|-------------|---------------------|
| RLS enabled on all tables | Every table must have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | Critical |
| Read policies per table | Who can SELECT from each of the 17 tables? | Critical |
| Write policies per table | Who can INSERT/UPDATE/DELETE? (mutations exist for posts, flags, strikes, admin_actions, driver/rider_documents) | Critical |
| Admin role enforcement | Do policies check `profiles.role = 'admin'` for admin-only operations? | Critical |
| Anon access | Can unauthenticated requests (anon key only, no session) read any table? | Critical |
| Count exposure | `{ count: "exact" }` may leak table row counts even without data access | Medium |
| Column-level exposure | `.select("*")` returns all columns — are there sensitive columns (password hashes, internal IDs, PII) that shouldn't be exposed? | High |
| Service role key | Is the service role key used anywhere in client code? (must not be) | Critical |
| Storage policies | If Supabase Storage is used for document uploads (driver/rider docs), are bucket policies restrictive? | High |

**This phase requires access to the Supabase dashboard.** Code analysis can only identify what the client *expects* — not what the server *enforces*.

### 1.3 Client-Side Security

| Check | Description | Severity if Failing |
|-------|-------------|---------------------|
| XSS via user data | Admin pages render user-submitted data (names, emails, descriptions, rejection reasons). Is any of it rendered with `dangerouslySetInnerHTML`? | Critical |
| Secrets in bundle | Verify only `NEXT_PUBLIC_*` env vars are in the client bundle. No API keys, service role keys, or internal URLs. | Critical |
| `prompt()` injection | `moderation/page.tsx` uses `prompt("User ID (full UUID)")` for issuing strikes. The value is passed to a Supabase query — is it sanitized? | Medium |
| `confirm()` coverage | All destructive admin actions (post removal, flag review, strike issuance, document approval/rejection) must have confirmation dialogs. | Medium |
| Clickjacking | Is `X-Frame-Options` or CSP `frame-ancestors` set? (GitHub Pages may set defaults) | Medium |
| Open redirects | After login, does the redirect target only go to `/admin`? No user-controlled redirect params? | Medium |

### 1.4 Dependency Security

| Check | Description | How |
|-------|-------------|-----|
| Known CVEs | Are any production dependencies flagged? | `npm audit` |
| Outdated packages | Are critical packages (Next.js, Supabase SDK, React) current? | `npm outdated` |
| Unused dependencies | Extra packages increase attack surface | Manual review of package.json vs imports |
| Supply chain | Are lockfile hashes present and intact? | Check `package-lock.json` |

**Current dependency versions:**
- `next@16.2.3` · `react@19.2.4` · `@supabase/supabase-js@2.103.2`
- `framer-motion@12.38.0` · `gsap@3.14.2` · `@base-ui/react@1.3.0`
- `lucide-react@1.8.0` · `next-themes@0.4.6` · `shadcn@4.2.0`

---

## Phase 2 — Functional Audit

### 2.1 Public Site — Page-by-Page

#### Homepage (`/`)

| Check | Expected Behavior |
|-------|-------------------|
| ParticleTextEffect canvas renders | Text forms from particles, readable on all screen sizes |
| Canvas doesn't crash on mobile | No infinite loop, no memory spike, graceful degradation |
| ScrollRevealFeatures animates on scroll | Feature cards slide in as user scrolls |
| AnimatedCounter counts up | Numbers animate from 0 to target |
| AuroraBlobs background renders | Gradient blobs animate without layout shift |
| CTA buttons link correctly | "Download" → `/download`, "Learn More" → `/about` or relevant |
| Responsive layout | No horizontal scroll, text readable at 320px width |
| Dark/light mode | All elements visible in both themes |

#### About (`/about`)

| Check | Expected Behavior |
|-------|-------------------|
| Split heading animation | Text splits and animates on scroll |
| Character reveal | Characters appear sequentially |
| Content is final | Copy reviewed for launch — no placeholder text |
| Responsive layout | No overflow, images scale |

#### Contact (`/contact`)

| Check | Expected Behavior |
|-------|-------------------|
| FAQ accordion | Click to expand/collapse, only one open at a time (or multiple?) |
| Email links | `mailto:hello@kanek.bz` and `mailto:support@kanek.bz` open email client |
| Channel cards | All contact methods displayed |
| **NOTE**: No contact form exists | Is this intentional for launch, or is a form needed? |

#### Download (`/download`)

| Check | Expected Behavior |
|-------|-------------------|
| GSAP CinematicHero renders | 3D text, mouse tracking, scroll parallax |
| Mouse tracking responsive | Hero elements follow cursor smoothly |
| Scroll parallax smooth | No jank at 60fps |
| Download links/buttons | Point to correct app store / APK / coming soon |

#### Join (`/join`)

| Check | Expected Behavior |
|-------|-------------------|
| Role cards display | Builders, Ambassadors, Creatives, Partners — all visible |
| Card hover effects | Interactive, responsive |
| Manifesto section | Content is final, no placeholders |
| CTA action | What happens when someone wants to join? Link? Form? |

#### Privacy (`/privacy`) & Terms (`/terms`)

| Check | Expected Behavior |
|-------|-------------------|
| Legal content accurate | Reviewed by legal? Belize-specific where needed? |
| Date stamps | "Last updated" date present and current? |
| Readable formatting | Numbered sections, proper hierarchy |
| Links to contact | References to support email work |

#### Global Navigation

| Check | Expected Behavior |
|-------|-------------------|
| Header links | All nav items link to correct pages |
| Mobile sheet menu | Opens/closes, links work, closes on navigation |
| Footer links | Internal links resolve, external links open in new tab |
| Active state | Current page highlighted in nav |
| 404 page | What renders for `/nonexistent`? Is there a custom 404? |

### 2.2 Admin Dashboard — Section-by-Section

#### Login (`/admin/login`)

| Check | Expected Behavior |
|-------|-------------------|
| Email step renders | Input + "Send Code" button |
| OTP sent on valid email | Supabase sends code, UI transitions to code input |
| Code verification works | Correct code → session → redirect to `/admin` |
| Wrong code | Error message displayed, can retry |
| Expired code | Error message, option to resend |
| Non-admin email | Signs in but shows "role is [X] not admin" error |
| Already logged in as admin | Redirect to `/admin` immediately |
| Profile fetch fails (RLS) | Shows "could not load profile" error |

#### Dashboard Overview (`/admin`)

| Check | Expected Behavior |
|-------|-------------------|
| Stats cards load | Total users, drivers, bookings, posts, open flags — numbers display |
| Zero-data state | Handles 0 counts gracefully (not NaN, not blank) |
| Error state | "Failed to load stats." message on query failure |
| No actions available | Read-only page — no buttons that mutate data |

#### Users (`/admin/users`)

| Check | Expected Behavior |
|-------|-------------------|
| User list loads | Profiles displayed with names, emails, roles, status |
| Driver details expand | Vehicle info, verification status, documents |
| Document approval | Approve/reject buttons work, status updates |
| Rider documents | Displayed, reviewable |
| Account status | Suspended/active/pending states shown correctly |
| Search/filter | (If exists) Works correctly |
| ~997 lines | Complex page — extra attention to edge cases |

#### Bookings (`/admin/bookings`)

| Check | Expected Behavior |
|-------|-------------------|
| Bookings table loads | Post, user, status, seats, date columns |
| Detail panel opens | Click row → shows booking details, contract, events |
| Post/user names resolved | `useResolveNames` shows human names, not UUIDs |
| Contract events | Shows event type + actor name |
| Empty state | "No bookings found." message |

#### Content (`/admin/content`)

| Check | Expected Behavior |
|-------|-------------------|
| Posts tab | Lists posts with title, status, type, dates |
| Post removal | "Remove" button → confirm → status set to "cancelled" → admin_action logged |
| Notifications tab | Lists notifications with user, type, title, read status |
| Author/user names resolved | `useResolveNames` shows human names |
| Tab switching | Posts ↔ Notifications — state preserved or reset cleanly |

#### Community (`/admin/community`)

| Check | Expected Behavior |
|-------|-------------------|
| Road reports tab | Reports with type, location, description, upvotes |
| Gas prices tab | Station name, regular/premium/diesel prices |
| Waitlist tab | Post + user names resolved, notified status |
| Reporter names resolved | `useResolveNames` shows human names |
| Detail panels | All three types open/close correctly |

#### Moderation (`/admin/moderation`)

| Check | Expected Behavior |
|-------|-------------------|
| Flags tab | Reporter name, target, reason, status, actions (Act/Dismiss) |
| Flag review | Act → status "action_taken", Dismiss → status "dismissed", reviewed_by set |
| Strikes tab | User name, type (hard/soft), reason, auto/manual |
| Strike issuance | `prompt()` → inserts strike → refreshes list |
| Actions tab | Admin name, action type, target, reason, date |
| All names resolved | `useResolveNames` across all three tabs |

#### Finance (`/admin/finance`)

| Check | Expected Behavior |
|-------|-------------------|
| Transactions tab | Payer/payee names, amount, status, date |
| Receipts tab | User name, email_to, type, status |
| Donations section | Total cents displayed as formatted currency |
| Payer/payee names resolved | `useResolveNames` shows human names |

#### Cross-Cutting Admin Checks

| Check | Expected Behavior |
|-------|-------------------|
| Sidebar navigation | All 7 sections accessible, active state shown |
| User email in sidebar | Logged-in admin's email displayed |
| Sign out button | Clears session, redirects to login |
| Back button after logout | Cannot navigate back to dashboard |
| Direct URL access | `/admin/bookings` when not logged in → redirects to login |
| Loading states | Spinner or skeleton shown while data loads |
| Error states | Failed queries show user-friendly messages, not blank screens |
| Tab persistence | Switching pages and coming back — does tab reset? |

### 2.3 Cross-Browser / Device Matrix

| Browser | Desktop | Mobile | Tablet |
|---------|---------|--------|--------|
| Chrome | ✓ Test | ✓ Android | — |
| Firefox | ✓ Test | — | — |
| Safari | ✓ Test | ✓ iOS | ✓ iPad |
| Edge | Optional | — | — |

**Key concerns:**
- Canvas-based `ParticleTextEffect` — WebGL/Canvas support varies
- GSAP `ScrollTrigger` — iOS Safari has unique scroll behavior
- `sheet` component (Radix) — mobile touch interactions

---

## Phase 3 — Performance Audit

### 3.1 Bundle & Load Performance

| Check | Tool | Target |
|-------|------|--------|
| Total bundle size (JS) | `npm run build` output | < 300KB gzipped for public pages |
| First Contentful Paint | Lighthouse | < 1.8s |
| Largest Contentful Paint | Lighthouse | < 2.5s |
| Cumulative Layout Shift | Lighthouse | < 0.1 |
| Time to Interactive | Lighthouse | < 3.8s |
| Framer Motion tree-shaking | Build output inspection | Only used features bundled |
| GSAP tree-shaking | Build output inspection | Only ScrollTrigger + core bundled |

### 3.2 Animation Performance

| Component | Concern | Test Method |
|-----------|---------|-------------|
| `ParticleTextEffect` | Canvas rendering loop — CPU/GPU on mobile | Chrome DevTools Performance tab |
| `CinematicLandingHero` | GSAP + mouse tracking — frame rate | Performance monitor overlay |
| `AuroraBlobs` | CSS animations — GPU compositing vs paint | Layers panel |
| `ScrollRevealFeatures` | Intersection Observer — scroll jank | 60fps target |
| `ScrollVelocityText` | Scroll event frequency — throttled? | Performance tab |
| `AnimatedCounter` | Framer Motion spring — repaints | Paint flashing |
| `MagneticButton` | Mouse move handler — throttled? | Performance tab |

**Critical question**: Do any of these animations have cleanup logic? When navigating between pages (Next.js client-side routing), GSAP ScrollTrigger instances and canvas animation frames must be explicitly killed or they leak memory.

### 3.3 Data Loading

| Check | Current State | Concern |
|-------|---------------|---------|
| Query limit | `.limit(200)` on all admin queries | What happens with 1000+ records? No pagination UI. |
| Parallel queries | Multiple queries fire on page mount | Connection pooling? Race conditions? |
| `useResolveNames` batching | Chunks of 50 IDs | Re-fetches on every data change? Memoization effective? |
| No caching | Fresh query on every page visit | Supabase has no client cache — every nav = new request |
| No search/filter | All admin pages fetch all data up to 200 | Users will need filtering as data grows |

### 3.4 Static Export Size

| Check | How |
|-------|-----|
| `out/` directory total size | `du -sh out/` after build |
| Per-page HTML size | Check individual HTML files |
| Shared chunks | How much JS is shared vs per-page |
| Image assets | Currently none in `/public` — will images be added? |

---

## Phase 4 — Accessibility Audit (WCAG 2.1 AA)

### 4.1 Semantic Structure

| Check | Expected | Pages |
|-------|----------|-------|
| Single `<h1>` per page | Each page has exactly one h1 | All |
| Heading hierarchy | h1 → h2 → h3, no skips | All |
| `<main>` landmark | Content wrapped in main | All |
| `<nav>` landmark | Header navigation, admin sidebar | Header, admin shell |
| `<footer>` landmark | Footer component | Public layout |
| `<aside>` landmark | Admin sidebar? Detail panels? | Admin pages |
| Skip-to-content link | Hidden link before nav, visible on focus | All |

### 4.2 Keyboard Navigation

| Check | Expected | Component |
|-------|----------|-----------|
| Tab order logical | Header → content → footer | All pages |
| Mobile menu keyboard | Open/close with Enter/Escape, trap focus inside | Header sheet |
| Admin sidebar keyboard | Navigate with Tab, activate with Enter | Admin shell |
| Detail panel keyboard | Close with Escape | All admin pages |
| FAQ accordion | Toggle with Enter/Space | Contact page |
| Table row selection | Click handler but keyboard equivalent? | Admin tables |
| Confirmation dialogs | Focusable, Escape to cancel | Admin actions |
| Focus visible | Visible focus ring in both themes | All interactive elements |
| Focus management | Focus moves to panel on open, returns on close | Detail panels |

### 4.3 Screen Reader Support

| Check | Expected | Component |
|-------|----------|-----------|
| Alt text on images | Descriptive alt attributes | (None currently — no images in public/) |
| Icon-only buttons: `aria-label` | Theme toggle, mobile menu button, close buttons | Header, admin |
| Status badges: `role="status"` | Announced on change | Admin pages |
| Loading states: `aria-live="polite"` | Screen reader announces loading/loaded | All data pages |
| Error messages: `aria-live="assertive"` | Errors announced immediately | Login, admin pages |
| Table captions | Describe table contents | Admin data tables |
| Data cells: `scope` attributes | Headers associated with cells | Admin data tables |

### 4.4 Color & Contrast

| Check | Requirement | Test Method |
|-------|-------------|-------------|
| Text contrast (normal) | 4.5:1 minimum | axe-core |
| Text contrast (large) | 3:1 minimum | axe-core |
| Forest green on dark bg | Verify accent-green passes contrast | Manual |
| Status badge colors | Distinguishable without color alone? (shape, text, icon) | Manual, colorblind sim |
| Focus indicators | 3:1 against adjacent colors | Manual |
| Dark mode contrast | Re-test all the above in dark theme | axe-core |

### 4.5 Motion & Animation

| Check | Expected | Component |
|-------|----------|-----------|
| `prefers-reduced-motion` | All animations disabled or simplified | ParticleTextEffect, GSAP hero, AuroraBlobs, scroll animations, Framer Motion |
| Auto-playing animation | Can be paused? | AuroraBlobs, marquee |
| Flashing content | No content flashes > 3 times per second | All animations |
| Scroll-triggered animation | Still usable with animations off | ScrollRevealFeatures, AnimatedRoadmap |

---

## Phase 5 — SEO & Launch Readiness

### 5.1 SEO Assets Checklist

| Asset | Status | Action Needed |
|-------|--------|---------------|
| `robots.txt` | ❌ Missing | Create — allow public pages, disallow /admin |
| `sitemap.xml` | ❌ Missing | Create — list all 7 public pages |
| Favicon (`.ico`) | ❌ Missing | Add to `/public` or `app/` |
| Apple touch icon | ❌ Missing | Add 180x180 PNG |
| Open Graph image | ❌ Missing (tags exist, no image) | Create 1200x630 OG image |
| Structured data (JSON-LD) | ❌ Missing | Organization + WebSite schema |
| Open Graph tags | ✅ Present | Verify per-page |
| Twitter Card | ✅ Present | Verify per-page |
| `metadataBase` | ✅ `https://kanek.bz` | — |
| `<html lang="en">` | ✓ Check | Must be present for a11y + SEO |

### 5.2 Per-Page Metadata

| Page | Title | Unique Description Needed |
|------|-------|---------------------------|
| `/` | "kanek — Community Mobility for Belize" | ✅ Set |
| `/about` | Needs unique title | ✓ Check |
| `/contact` | Needs unique title | ✓ Check |
| `/download` | Needs unique title | ✓ Check |
| `/join` | Needs unique title | ✓ Check |
| `/privacy` | "Privacy Policy" | ✅ Set |
| `/terms` | "Terms of Service" | ✅ Set |

### 5.3 Static Export Validation

| Check | Expected | How |
|-------|----------|-----|
| `npm run build` succeeds | Clean exit, no errors | Run build |
| `out/` directory contains all routes | 7 public + admin pages as HTML | Inspect output |
| CNAME file preserved | `kanek.bz` in `out/CNAME` | Check after build |
| No broken asset references | JS/CSS chunks load correctly | Open HTML files locally |
| No server-only features used | No `getServerSideProps`, no API routes, no dynamic routes | Code scan |

### 5.4 GitHub Pages SPA Routing — LAUNCH BLOCKER

**The problem**: `output: "export"` produces static HTML files. GitHub Pages serves them directly. When a user navigates to `/admin/bookings` via the browser's address bar (not via client-side navigation), GitHub Pages looks for `out/admin/bookings/index.html`. If it doesn't exist as a pre-rendered page, it returns 404.

**What we need to verify:**
- Does Next.js static export create `admin/bookings/index.html`? (It should, since these are pages)
- Does client-side routing work after initial load? (It should, via Next.js router)
- Is there a custom `404.html` fallback that redirects to the SPA? (May be needed for catch-all routes)

### 5.5 Domain & HTTPS

| Check | Expected |
|-------|----------|
| CNAME configured | `kanek.bz` points to GitHub Pages |
| HTTPS enforced | GitHub Pages settings → "Enforce HTTPS" checked |
| www redirect | `www.kanek.bz` → `kanek.bz` (or vice versa) |
| Admin accessible | `kanek.bz/admin/login` loads correctly |

---

## Phase 6 — Code Quality Audit

### 6.1 Type Safety

| Check | Tool | Expected |
|-------|------|----------|
| Zero type errors | `npx tsc --noEmit` | Clean output |
| No `any` types | `grep -r ": any" src/` | Zero occurrences (or justified) |
| No `@ts-ignore` | `grep -r "ts-ignore\|ts-expect-error" src/` | Zero occurrences |
| Strict mode enforced | `tsconfig.json` → `strict: true` | ✅ Already set |
| Supabase types | Are query results typed with interfaces? | Manual review |

### 6.2 Lint Health

| Check | Tool | Expected |
|-------|------|----------|
| Zero ESLint errors | `npx eslint .` | Clean output |
| Zero warnings | Same | Ideally clean, acceptable if intentional |
| Unused imports | ESLint or TypeScript | None |
| Unused variables | ESLint or TypeScript | None |

### 6.3 Build Health

| Check | Tool | Expected |
|-------|------|----------|
| Clean build | `npm run build` | Exit code 0, no warnings |
| No console.log in prod | `grep -r "console.log" src/` | Only in error handlers, not debug |
| No TODO/FIXME/HACK | `grep -r "TODO\|FIXME\|HACK" src/` | Zero or tracked |

### 6.4 React Patterns

| Check | What to Look For |
|-------|------------------|
| `useEffect` dependencies | Missing or extra deps → stale closures or infinite loops |
| `useCallback` dependencies | Same as above |
| `useMemo` dependencies | Same as above |
| Cleanup functions | `useEffect` return cleanup for subscriptions, listeners, timers |
| GSAP cleanup | `ScrollTrigger.kill()`, `gsap.killTweensOf()` on unmount |
| Canvas cleanup | `cancelAnimationFrame()` on unmount |
| Supabase subscriptions | If any realtime subscriptions exist, are they cleaned up? |
| Key props | List items have stable, unique `key` props |
| Conditional hooks | Hooks not called conditionally (React rules) |

### 6.5 Code Structure

| Check | Concern |
|-------|---------|
| `users/page.tsx` ~997 lines | God-file — consider splitting into sub-components |
| Duplicated patterns across admin pages | Each page re-implements the same table/detail pattern |
| Error handling consistency | Some pages show errors, others silently fail |
| Hardcoded strings | Status values, color mappings — should be constants? |

---

## Verification Checklist

### Automated Checks

```bash
# 1. Dependency security
npm audit

# 2. Type safety
npx tsc --noEmit

# 3. Lint
npx eslint .

# 4. Build
npm run build

# 5. Bundle analysis (inspect output)
du -sh out/
find out/ -name "*.html" | head -20

# 6. Code quality scans
grep -rn "any" src/ --include="*.ts" --include="*.tsx" | grep ": any"
grep -rn "ts-ignore\|ts-expect-error" src/
grep -rn "console\.log" src/
grep -rn "TODO\|FIXME\|HACK" src/
grep -rn "dangerouslySetInnerHTML" src/
```

### Manual Checks

- [ ] Walk through every public page in Chrome (desktop + mobile viewport)
- [ ] Walk through every public page in dark mode
- [ ] Complete OTP login flow on admin
- [ ] Visit every admin section, verify data loads
- [ ] Test admin actions: remove post, review flag, issue strike
- [ ] Test logout + back button
- [ ] Test direct URL access to admin when not logged in
- [ ] Keyboard-only navigation through entire site
- [ ] axe-core browser extension on every page
- [ ] Lighthouse audit on homepage + one admin page

### Supabase Dashboard Checks (requires dashboard access)

- [ ] RLS enabled on every table
- [ ] Read policies: anon cannot read admin tables
- [ ] Read policies: authenticated non-admin cannot read admin tables
- [ ] Write policies: only admins can update posts, flags, documents
- [ ] Write policies: only admins can insert strikes, admin_actions
- [ ] Storage bucket policies (if used for document uploads)
- [ ] Auth settings: OTP rate limiting configured
- [ ] Auth settings: email template customized

---

## Known Risks (Pre-Audit)

### Critical

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **Supabase RLS not configured** | All 17 tables publicly readable/writable via anon key | Verify every policy in Supabase dashboard |
| 2 | **GitHub Pages SPA deep linking** | Direct URL to `/admin/bookings` may 404 | Verify static export creates all HTML files, add 404.html fallback if needed |
| 3 | **Client-side admin check only** | `isAdmin` check is cosmetic if RLS is missing | RLS must enforce role at database level |

### High

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 4 | No favicon/OG image | Poor appearance in browser tabs, social shares | ⚠️ **Still needs real image assets** — manual task |
| 5 | ~~No robots.txt/sitemap.xml~~ | ~~Poor SEO indexing~~ | ✅ Created both |
| 6 | ~~No `prefers-reduced-motion`~~ | ~~Accessibility violation~~ | ✅ Added to particle-text-effect.tsx |
| 7 | ~~`prompt()` for UUID input in moderation~~ | ~~Potential injection~~ | ✅ UUID regex validation added |

### Medium

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 8 | No pagination beyond 200 records | Admin pages won't scale | Add pagination or infinite scroll |
| 9 | No search/filter on admin pages | Hard to find specific records | Add search bars |
| 10 | No error toast system | Errors shown inline or logged to console — easy to miss | Add toast/notification component |
| 11 | ~997-line users page | Hard to maintain, higher bug risk | Consider splitting |

---

## Scope & Exclusions

### In Scope

- Every source file under `src/`
- All configuration files (next.config, tsconfig, eslint, postcss, package.json, components.json)
- Dependency audit (npm audit, version checks)
- Build output validation
- Client-side security analysis
- Accessibility compliance check
- SEO readiness check
- Performance profiling

### Out of Scope

| Exclusion | Reason | How to Address Separately |
|-----------|--------|---------------------------|
| Supabase server-side config | Cannot access from code alone | Audit via Supabase dashboard |
| DNS configuration | Infrastructure level | Check registrar + GitHub Pages settings |
| SSL certificates | Managed by GitHub Pages | Verify "Enforce HTTPS" in repo settings |
| Email deliverability | Supabase manages OTP emails | Test OTP flow manually, check spam |
| Legal review of Privacy/Terms | Requires legal expertise | Have a lawyer review before launch |
| Load testing | Requires production environment | Run after deployment |
| Penetration testing | Requires authorized security testing | Separate engagement |

### Deliverables

1. **This document** — the audit plan (you're reading it)
2. **Audit findings** — issues classified as Critical / High / Medium / Low
3. **Fix recommendations** — specific code changes or configuration changes per issue
4. **Post-fix verification** — re-run checks to confirm fixes

---

## Issue Tracker

Issues found during the audit will be logged here with severity, description, file location, and recommended fix.

| # | Severity | Category | Description | File(s) | Status |
|---|----------|----------|-------------|---------|--------|
| 1 | Critical | Security | hono dependency CVE vulnerability | `package.json` | ✅ Fixed — `npm audit fix` applied, 0 vulnerabilities |
| 2 | High | Security | UUID input in `issueStrike` not validated — potential injection | `moderation/page.tsx` | ✅ Fixed — UUID regex validation added |
| 3 | High | Security | Destructive admin actions lack confirmation dialogs | `moderation/page.tsx`, `users/page.tsx` | ✅ Fixed — `confirm()` dialogs on all destructive actions |
| 4 | High | A11y | Canvas element missing role/aria-label | `particle-text-effect.tsx` | ✅ Fixed — `role="img"` + `aria-label` added |
| 5 | High | A11y | No `prefers-reduced-motion` check on heavy animations | `particle-text-effect.tsx` | ✅ Fixed — motion query skips `animate()` when reduced motion preferred |
| 6 | High | A11y | Homepage missing `<h1>` — first heading is `<h2>` | `(public)/page.tsx` | ✅ Fixed — sr-only `<h1>` added to hero |
| 7 | High | SEO | No `robots.txt` | `public/` | ✅ Fixed — `robots.txt` created |
| 8 | High | SEO | No `sitemap.xml` | `public/` | ✅ Fixed — `sitemap.xml` created with all 7 public URLs |
| 9 | High | UX | CTA buttons `href="#"` (dead links) | `cinematic-landing-hero.tsx` | ✅ Fixed — both App Store & Google Play CTAs point to `/download` |
| 10 | Medium | SEO | No favicon or OG image | `public/` | ⚠️ Manual — requires real image assets, cannot be generated by audit |
| 11 | Medium | Code | Unused `X` import from lucide-react | `admin-shell.tsx` | ✅ Fixed — removed (and restored broken import closing brace) |
| 12 | Low | Code | ESLint `react-hooks/set-state-in-effect` warnings in admin pages | 6 admin pages | ✅ Fixed — suppress directives added then auto-cleaned when rule stopped firing |
| 13 | Info | Legal | Hardcoded "April 12, 2026" effective dates | `terms/page.tsx`, `privacy/page.tsx` | ✅ Accepted — valid effective dates for pre-launch legal docs |
| 14 | Info | Quality | ~997-line users page | `users/page.tsx` | ℹ️ Noted — refactor post-launch, functional as-is |

### Audit Verification Results (April 17, 2026)

| Check | Result |
|-------|--------|
| `npm audit` | ✅ 0 vulnerabilities |
| `npx eslint src/` | ✅ 0 errors, 0 warnings |
| `npx next build` | ✅ All 16 pages compiled as static content |
| TypeScript | ✅ Strict mode, no `any` types in source |
| `console.log` | None in production code |
| `dangerouslySetInnerHTML` | None used |
| `ts-ignore` / `ts-expect-error` | None used |
