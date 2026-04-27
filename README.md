# kanek.bz

Official website for **kanek** — a community mobility board for Belize.

## Stack

- Next.js 16 (App Router, static export)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- Firebase Hosting

## Development

Create a local env file first:

```bash
cp .env.example .env.local
```

Required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Optional value for secure admin mutations and document access:

```bash
NEXT_PUBLIC_ADMIN_API_BASE_URL=https://your-project-ref.supabase.co/functions/v1/admin-api
```

You can recover the current project values with the Supabase CLI:

```bash
supabase login
supabase projects api-keys --project-ref tlggdherqjvybpddsqjj -o json
```

Then install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

The site statically exports to `out/` and deploys to Firebase Hosting on project `kanek-bz`.

Push to `main` to deploy automatically via GitHub Actions after the required secrets are set.

Required GitHub repository secrets:

```bash
FIREBASE_SERVICE_ACCOUNT_KANEK_BZ
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

The easiest way to create the Firebase service-account secret is:

```bash
npx firebase-tools init hosting:github
```

Manual deploy remains available:

```bash
npm run build
npx firebase-tools deploy --only hosting
```

The app still reads from Supabase via the public env values in `.env.local`.

Required values:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Secure Admin Backend

The site is still a static export, so secure admin reads, secure admin mutations, and signed document access cannot live in local Next.js route handlers here.

This repo now includes a Supabase Edge Function implementation at `supabase/functions/admin-api/index.ts`.

Recommended frontend value:

```bash
NEXT_PUBLIC_ADMIN_API_BASE_URL=https://your-project-ref.supabase.co/functions/v1/admin-api
```

Local workflow:

```bash
supabase functions serve admin-api --env-file ./supabase/.env.local
```

Deploy workflow:

```bash
supabase functions deploy admin-api
```

If `NEXT_PUBLIC_ADMIN_API_BASE_URL` is not set, the admin dashboard stays read-only for:

- dashboard data
- bookings, community, and finance data
- post removal
- flag review
- strike issuance
- user suspension / reactivation
- driver and rider approval actions
- document preview / open

Implemented backend endpoints in this repo:

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
POST /users/list
POST /users/detail
POST /users/account-status
POST /users/review-driver
POST /users/review-driver-document
POST /users/review-rider-document
```

The function validates the caller's Supabase bearer token, verifies `profiles.role = 'admin'`, and then performs the privileged read or write with the service role key.

At least one row in `public.profiles` must have `role = 'admin'`. If no admin profile exists, the deployed backend will correctly reject every admin request.

## Policy Audit Queries

This repo still does not contain the live Supabase migrations or dashboard policy source of truth, but it now includes a concrete audit checklist query file:

```bash
supabase/sql/rls-audit-queries.sql
```

Run those queries in the Supabase SQL editor or against the linked project database to verify:

- which public tables actually have RLS enabled
- which public and storage policies are active
- whether the `documents` bucket is public
- whether the admin role population matches expectations
- whether stored document references match the signed-URL backend assumptions

Latest live audit findings from April 27, 2026:

- all app-facing public tables inspected had RLS enabled
- the `documents` bucket is private
- the current project has zero admin profiles, so the admin backend will remain unusable until one profile is promoted to `admin`
- 3 of 7 stored document references include a trailing local blob URL suffix; the Edge Function now sanitizes those refs before generating signed URLs
