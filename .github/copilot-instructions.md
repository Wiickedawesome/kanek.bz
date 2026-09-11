# Kanek.bz — Copilot Repository Guide

This file is the **factual reference manual** for the Kanek website and admin
repository.
Every claim in this file has been verified against the source on **2026-04-28**.

It tells the agent **what is true about this repo**: file paths, config,
versions, deployment surfaces, env vars, and cross-repo ownership. It does
**not** tell the agent how to behave — behavioral rules live in `AGENTS.md`.

If you find a claim here that contradicts the live code, **fix this file
first**, then do the work. Do not silently work around stale documentation.

> Companion files
> - `AGENTS.md` — behavioral contract for this repo
> - `.github/agents/kanek-website-workspace.agent.md` — repo-local website/admin agent
> - `/home/wicked/Projects/kanek` — sibling mobile repo and schema source of truth

---

## Table of Contents

1. Product and repo role
2. Tech stack — exact versions
3. Directory layout
4. Environment variables
5. App architecture
6. Static export constraints
7. Firebase Hosting
8. GitHub Actions deploy pipeline
9. `admin-api` edge function
10. Shared backend and ownership boundaries
11. Admin access model
12. Styling and UI stack
13. Local development
14. Build and validation commands
15. Verification protocol
16. False-error filter
17. Files you must not touch without explicit instruction
18. Known issues and deferred work
19. Cross-repo change patterns
20. Change log of this file

---

## 1. Product and repo role

This repo owns the **public website** and **static admin frontend** for Kanek.

It is **not** the source of truth for:
- mobile app behavior
- Supabase schema or migrations
- most edge functions
- Expo / EAS distribution

Those are owned by the sibling repo at `/home/wicked/Projects/kanek`.

This repo does own:
- the public marketing site
- the static admin frontend
- Firebase Hosting configuration
- the local `supabase/functions/admin-api/` implementation
- the GitHub Actions workflow that deploys the static export to Firebase Hosting

The system still uses the shared Supabase backend at project ref
`tlggdherqjvybpddsqjj`.

---

## 2. Tech stack — exact versions

Verified from `package.json` on 2026-04-28.

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | `16.2.3` |
| UI runtime | `react` | `19.2.4` |
| DOM runtime | `react-dom` | `19.2.4` |
| Language | `typescript` | `^5` |
| Backend SDK | `@supabase/supabase-js` | `^2.103.2` |
| Motion | `framer-motion` | `^12.38.0` |
| Motion / animation | `gsap` | `^3.14.2` |
| UI utility | `class-variance-authority` | `^0.7.1` |
| UI utility | `clsx` | `^2.1.1` |
| UI utility | `tailwind-merge` | `^3.5.0` |
| Theming | `next-themes` | `^0.4.6` |
| Icons | `lucide-react` | `^1.8.0` |
| Styling | `tailwindcss` | `^4` |
| Styling bridge | `@tailwindcss/postcss` | `^4` |
| Next lint config | `eslint-config-next` | `16.2.3` |

Repo package name: `kanek-site`

Current scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## 3. Directory layout

Verified from the repo on disk.

```
kanek.bz/
├── .github/
│   ├── copilot-instructions.md              # this file
│   ├── agents/
│   │   └── kanek-website-workspace.agent.md
│   └── workflows/
│       ├── deploy.yml                       # Firebase Hosting deploy on push to main
│       ├── review.yml
│       └── security.yml
├── AGENTS.md                                # behavioral contract
├── src/
│   ├── app/
│   │   ├── (public)/                        # public marketing routes
│   │   ├── admin/                           # static admin frontend routes
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   └── lib/
├── supabase/
│   ├── functions/
│   │   └── admin-api/
│   │       └── index.ts                     # secure admin edge function
│   └── sql/
│       └── rls-audit-queries.sql
├── public/
├── out/                                     # static export target for Firebase Hosting
├── .env.example
├── .env.local
├── .firebaserc
├── firebase.json
├── next.config.ts
├── package.json
├── package-lock.json
├── eslint.config.mjs
├── tsconfig.json
└── README.md
```

This repo does **not** contain the canonical shared schema or migration source
of truth. Those live in `/home/wicked/Projects/kanek/supabase/migrations`.

---

## 4. Environment variables

### Local runtime env

Verified from `.env.example` and `README.md`.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key for client-side reads/auth |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | optional but needed for secure admin mutations and document access | base URL for deployed `admin-api` |

Example values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ADMIN_API_BASE_URL=https://your-project-ref.supabase.co/functions/v1/admin-api
```

`NEXT_PUBLIC_ADMIN_API_BASE_URL` is optional only in the sense that the site can
still render without it. If it is missing, the admin dashboard remains
effectively read-only for secure operations.

### GitHub Actions deploy env

Verified from `.github/workflows/deploy.yml`.

The deploy workflow sets:

| Env | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `secrets.NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | derived as `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api` |

### Required GitHub repo secrets

Verified from `README.md` and `.github/workflows/deploy.yml`.

| Secret | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KANEK_BZ` | Firebase Hosting deploy auth |
| `NEXT_PUBLIC_SUPABASE_URL` | public app config |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public app config |

This repo does **not** store service-role credentials in committed files.

---

## 5. App architecture

The site is a **Next.js App Router project** with static export enabled.

Verified from `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};
```

Implications:
- the app is exported as static files
- Firebase Hosting serves the generated `out/` directory
- secure admin actions cannot rely on local Next.js server route handlers in production
- image optimization is disabled in favor of static-export compatibility

Top-level route ownership:

| Area | Path |
|---|---|
| Public site | `src/app/(public)/` |
| Admin frontend | `src/app/admin/` |
| Global layout | `src/app/layout.tsx` |
| Global CSS | `src/app/globals.css` |

---

## 6. Static export constraints

This repo statically exports the website. That means:

1. There is no always-on Node server in production for this app.
2. Secure admin reads and mutations cannot be implemented as regular local
   Next.js server handlers serving live production traffic.
3. The secure backend boundary for admin work is the Supabase edge function in
   `supabase/functions/admin-api/index.ts`.

From `README.md`:

> The site is still a static export, so secure admin reads, secure admin
> mutations, and signed document access cannot live in local Next.js route
> handlers here.

This is a load-bearing architectural constraint. If the repo ever moves away
from `output: 'export'`, this file must be updated.

---

## 7. Firebase Hosting

Verified from `firebase.json` and `.firebaserc`.

### Hosting site

| Setting | Value |
|---|---|
| Firebase project | `kanek-bz` |
| Hosting site | `kanek-bz` |
| Public dir | `out` |

### Hosting behavior

| Setting | Value |
|---|---|
| `cleanUrls` | `true` |
| `trailingSlash` | `false` |

### Cache headers

Verified from `firebase.json`.

| Asset class | Header |
|---|---|
| `*.js`, `*.css`, `*.svg`, `*.png`, `*.jpg`, `*.jpeg`, `*.webp`, `*.woff`, `*.woff2` | `Cache-Control: public, max-age=31536000, immutable` |
| `*.html` | `Cache-Control: public, max-age=0, must-revalidate` |

Do not treat Firebase Hosting as the app-data backend. It only hosts the static
site.

---

## 8. GitHub Actions deploy pipeline

Verified from `.github/workflows/deploy.yml`.

Workflow name: `Deploy to Firebase Hosting`

Trigger:
- push to `main`
- manual `workflow_dispatch`

Concurrency group:
- `firebase-hosting`

Build environment:

| Setting | Value |
|---|---|
| Runner | `ubuntu-latest` |
| Node | `22` |
| Package install | `npm ci` |
| Build command | `npm run build` |

Deploy step:

```yaml
- uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KANEK_BZ }}
    projectId: kanek-bz
    channelId: live
```

This repo’s production hosting deploy path is GitHub Actions on push to `main`.
Manual `firebase deploy` remains available, but it is not the primary path.

---

## 9. `admin-api` edge function

This repo contains one local edge function:

| Function | Path | Purpose |
|---|---|---|
| `admin-api` | `supabase/functions/admin-api/index.ts` | secure admin reads, mutations, and signed document access |

### Why it exists

Because the website is statically exported, secure admin operations need a live
backend boundary somewhere else. This repo uses a Supabase Edge Function for
that.

### Auth model

Verified from `supabase/functions/admin-api/index.ts`.

The function:
1. reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
2. requires a bearer token from the caller
3. validates the bearer token via Supabase Auth
4. looks up the caller's `profiles` row
5. requires `profile.role === 'admin'`
6. then performs privileged reads or writes with the service-role client

This means admin access is enforced by both:
- the caller's authenticated session
- a database role check on `profiles.role`

### Implemented endpoint families

Verified from `README.md`.

```text
POST /dashboard/overview
POST /bookings/list
POST /bookings/contract-events
POST /community/list
POST /content/list
POST /content/cancel-post
POST /documents/resolve
POST /finance/list
POST /lookup/names
POST /moderation/list
POST /moderation/review-flag
POST /moderation/issue-strike
POST /strikes/report
POST /users/list
POST /users/detail
POST /users/account-status
POST /users/decline-account
POST /users/send-reminder
POST /users/process-onboarding-reminders
POST /users/review-driver
POST /users/review-driver-document
POST /users/review-rider-document
```

### Important boundary

This repo owns the implementation of `admin-api`, but it does **not** own the
schema that `admin-api` reads and writes. If the function touches tables,
columns, RLS policies, or enums defined in the mobile repo’s migrations, those
changes must be traced back to `/home/wicked/Projects/kanek`.

---

## 10. Shared backend and ownership boundaries

Both repos share the same Supabase project:

| System | Value |
|---|---|
| Supabase project ref | `tlggdherqjvybpddsqjj` |
| Firebase project | `kanek-bz` |

Ownership split:

| Concern | Owner repo |
|---|---|
| Public website | `kanek.bz` |
| Admin frontend | `kanek.bz` |
| Firebase Hosting deploy | `kanek.bz` |
| `admin-api` function | `kanek.bz` |
| Mobile product behavior | `kanek` |
| App auth flow and onboarding | `kanek` |
| Shared schema and migrations | `kanek` |
| RLS policies | `kanek` |
| Most edge functions | `kanek` |
| EAS / mobile distribution | `kanek` |

When a site or admin task depends on the following, inspect the sibling mobile
repo before making claims:
- a table or column shape
- an RLS policy
- auth/session behavior
- non-local edge function behavior
- mobile-specific product logic

---

## 11. Admin access model

Verified from `README.md` and `admin-api/index.ts`.

### Current admin gating

At least one row in `public.profiles` must have `role = 'admin'`.

From the repo README's latest live audit notes:

- all app-facing public tables inspected had RLS enabled
- the `documents` bucket is private
- the current project has zero admin profiles, so the admin backend will remain
  unusable until one profile is promoted to `admin`

### Document access

Signed document access is handled through the backend, not direct public
storage.

The README also records a data-quality issue:

- 3 of 7 stored document references included a trailing local blob URL suffix
- the edge function now sanitizes those refs before generating signed URLs

This repo is therefore sensitive to both storage privacy assumptions and legacy
document-reference shape.

---

## 12. Styling and UI stack

Verified from `package.json` and `README.md`.

| Area | Library / approach |
|---|---|
| Styling | Tailwind CSS v4 |
| Component patterns | shadcn |
| Motion | framer-motion |
| Motion / animation | GSAP |
| Class helpers | `clsx`, `tailwind-merge`, `class-variance-authority` |
| Theme support | `next-themes` |
| Icons | `lucide-react` |

Because this repo uses Next.js `16.2.3`, do not assume older App Router mental
models are correct. The local `AGENTS.md` explicitly warns that this is **not**
the Next.js you know.

---

## 13. Local development

Verified from `README.md`.

### First-time setup

```bash
cp .env.example .env.local
```

Then populate:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_API_BASE_URL=...
```

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Build locally

```bash
npm run build
```

### Optional local admin backend workflow

```bash
supabase functions serve admin-api --env-file ./supabase/.env.local
```

### Manual hosting deploy

```bash
npx firebase-tools deploy --only hosting
```

That command exists, but the normal production path is still GitHub Actions on
push to `main`.

---

## 14. Build and validation commands

Verified from `package.json` and `README.md`.

```bash
# install
npm install

# local dev
npm run dev

# lint
npm run lint

# production build / export
npm run build

# local runtime (not the normal static-hosting path)
npm run start

# local admin edge function
supabase functions serve admin-api --env-file ./supabase/.env.local

# deploy admin edge function
supabase functions deploy admin-api
```

When changes affect route rendering or exportability, `npm run build` is the
most meaningful validation.

---

## 15. Verification protocol

Do not claim something is working without checking the relevant surface.

### Before claiming the site builds

```bash
npm run build
```

### Before claiming lint is clean

```bash
npm run lint
```

### Before claiming Hosting config is correct

Inspect:
- `firebase.json`
- `.firebaserc`
- `.github/workflows/deploy.yml`

### Before claiming the deploy workflow has the right public env

Verify the workflow `env:` block contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- derived `NEXT_PUBLIC_ADMIN_API_BASE_URL`

### Before claiming the admin backend exists locally in this repo

Verify:
- `supabase/functions/admin-api/index.ts`

### Before claiming a secure admin action works in production

Verify all of:
1. `NEXT_PUBLIC_ADMIN_API_BASE_URL` points to the deployed function
2. the function is deployed
3. the caller has a valid bearer token
4. the caller's `profiles.role` is `admin`

### Before claiming schema behavior

Inspect the sibling repo at `/home/wicked/Projects/kanek`, not just this repo.

### Before claiming storage privacy

Run the SQL audit queries in:

```bash
supabase/sql/rls-audit-queries.sql
```

against the live Supabase project or SQL editor.

---

## 16. False-error filter

When reading logs for this repo, distinguish real failures from expected static
build or workflow output.

Do not flag the following as failures by themselves:

| Output | Meaning | Action |
|---|---|---|
| Next.js warnings that do not fail `npm run build` | warning only | only act if user asks or build fails |
| Firebase action setup lines | normal workflow noise | none |
| Static export asset generation chatter | informational | none |
| Public env validation echoes in workflow | normal guardrail | none |

The failure line that matters is the one that exits non-zero or blocks the
workflow step.

---

## 17. Files you must not touch without explicit instruction

| File | Why |
|---|---|
| `firebase.json` | Controls live Hosting behavior |
| `.firebaserc` | Controls Hosting target/project mapping |
| `.github/workflows/deploy.yml` | Controls live production deploy |
| `supabase/functions/admin-api/index.ts` | Secure backend boundary for admin |
| `.env.local` | User-local env values |
| `package-lock.json` | Large dependency surface; should only change with intended installs |

Also do not edit the sibling mobile repo from this repo silently. Cross-repo
paired changes must be called out explicitly.

---

## 18. Known issues and deferred work

### Zero admin profiles blocks real admin access

Per the README's recorded live audit, the current shared project has zero admin
profiles. That means the deployed admin backend will correctly reject all admin
requests until a profile is promoted to `admin`.

### Schema source of truth lives elsewhere

This repo includes audit queries and an admin backend, but it is not the schema
or migration source of truth. If a site/admin bug is actually caused by schema,
RLS, or shared app behavior, the mobile repo must be inspected.

### Static export limits local server-side solutions

Because `next.config.ts` uses `output: 'export'`, production-safe secure admin
behavior cannot be solved by adding local server handlers unless the repo's
deployment model changes.

### Next.js 16 is version-sensitive

The local `AGENTS.md` warns that the installed Next.js version may differ from
old training assumptions. Check local docs when behavior is version-sensitive.

---

## 19. Cross-repo change patterns

Use this table when deciding whether a website/admin change requires work in the
sibling mobile repo.

| Website/admin change | Likely mobile repo impact |
|---|---|
| Change admin query fields | maybe, if schema assumptions are stale |
| Add admin action against a new table | yes, if schema/RLS changes are needed |
| Rename a field used by admin-api | yes, high risk |
| Change auth/session expectations | yes |
| Change Hosting-only behavior | usually no |
| Change marketing content | no |
| Change admin document-access flow | maybe, depending on storage refs and policy assumptions |

Default rule: if the change depends on schema, policy, auth, or non-local edge
functions, inspect `/home/wicked/Projects/kanek` before making claims.

---

## 20. Change log of this file

| Date | Change |
|---|---|
| 2026-04-28 | Created repo-local factual guide for the Kanek website/admin repo. Verified stack versions, static export config, Firebase Hosting deploy workflow, env vars, `admin-api` boundary, and cross-repo ownership. |

---

**End of repository guide.**

When in doubt, do not invent. Read the actual file, inspect the actual repo,
and check the sibling mobile repo when schema or shared backend behavior is in
scope.