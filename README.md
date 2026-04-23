# kanek.bz

Official website for **kanek** — a community mobility board for Belize.

## Stack

- Next.js 16 (App Router, static export)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- Deployed to GitHub Pages

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

Push to `main` — GitHub Actions builds and deploys to GitHub Pages automatically.

The GitHub Pages workflow expects these repository secrets:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

With GitHub CLI:

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo Wiickedawesome/kanek.bz
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo Wiickedawesome/kanek.bz
```

```bash
npm run build   # outputs to ./out
```
