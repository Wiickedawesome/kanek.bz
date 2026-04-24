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
