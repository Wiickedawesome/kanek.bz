<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Behavioral Contract for the Kanek Website/Admin Repo

This file tells the agent **how to act** in the Kanek website/admin repository.
It does **not** describe the repo's factual structure — that lives in
`.github/copilot-instructions.md`. It does **not** replace the cross-repo
shared agent — that lives in the user-level prompt surface.

The rules below are mandatory. When the website/admin repo and the sibling
mobile repo interact, this file governs how to move safely and explicitly.

---

## Table of Contents

1. Operating pillars
2. MUST PAUSE — actions that require explicit consent
3. MUST NOTIFY — events that require an unprompted heads-up
4. NEVER — things you do not do here
5. Communication contract
6. Verification protocol
7. False-error filter
8. Anti-hallucination rules
9. Tool discipline
10. Failure recovery
11. Cross-repo boundary rules
12. Definition of done

---

## 1. Operating pillars

### 1.1 Verify before you claim

Do not invent facts about:
- Next.js behavior
- Firebase Hosting
- `admin-api`
- schema or RLS
- mobile-owned backend behavior

Every concrete claim must be either:
- verified from the live file or command output
- marked `UNKNOWN — needs verification`
- asked about explicitly before being relied on

### 1.2 Repo ownership stays explicit

This repo owns:
- the public website
- the static admin frontend
- Firebase Hosting config and workflow
- the local `admin-api` implementation

This repo does **not** own:
- the shared schema
- Supabase migrations
- RLS source of truth
- most edge functions
- mobile app behavior

If the task touches one of those mobile-owned areas, say so explicitly and read
the sibling repo.

### 1.3 Static export is a load-bearing constraint

Do not casually suggest local Next.js server solutions for secure production
admin behavior while `next.config.ts` still has `output: 'export'`.

### 1.4 Next.js version sensitivity matters

This repo explicitly warns that the installed Next.js version may differ from
training assumptions. When behavior is version-sensitive, check local docs or
the installed source before answering.

### 1.5 Shared backend means cross-repo claims need both sides

If a website/admin issue could be caused by schema, auth, RLS, storage, or a
mobile-owned function, inspect `/home/wicked/Projects/kanek` before making a
confident claim.

### 1.6 Say what changed and what remains unverified

Be direct about:
- what you changed
- what you validated
- what still depends on remote systems, deployed functions, or the sibling repo

---

## 2. MUST PAUSE — actions that require explicit consent

Before doing any of the following, stop and confirm with the user.

### Hosting, deploy, and operations

- Running a live Firebase Hosting deploy
- Changing `firebase.json`
- Changing `.firebaserc`
- Editing `.github/workflows/deploy.yml`
- Triggering a GitHub Actions deploy path intentionally
- Changing GitHub repo secret expectations
- Changing the project id or Hosting site target
- Any DNS or domain action for `kanek.bz`

### Backend and security

- Deploying `supabase/functions/admin-api`
- Changing `admin-api` auth or role checks
- Changing document-access behavior or signed URL logic
- Adding new privileged admin actions
- Touching anything that requires a service-role assumption
- Proposing schema or RLS changes in the sibling mobile repo

### Cross-repo work

- Editing `/home/wicked/Projects/kanek`
- Proposing paired schema / RLS / auth changes across repos
- Changing shared auth/session expectations

### Dependencies and framework behavior

- Adding or removing top-level dependencies
- Changing `next.config.ts`
- Changing static export behavior
- Introducing new runtime assumptions that depend on a server process

### Git and remote systems

- `git push`
- `git push --force`
- deleting branches
- merging PRs
- touching Firebase console configuration
- touching Supabase dashboard configuration

---

## 3. MUST NOTIFY — events that require an unprompted heads-up

Proactively tell the user when:
- a production Hosting deploy path is about to run
- a production Hosting deploy finished
- a Hosting or workflow deploy failed
- `admin-api` needs deployment for a code change to matter remotely
- a website/admin change depends on a sibling mobile-repo change
- a repo secret or env expectation changed
- a previous claim of yours was wrong
- a task is blocked by the current lack of any admin profile in `profiles`

Keep the notice short and concrete.

---

## 4. NEVER — things you do not do here

1. Never invent Next.js, Firebase, Supabase, or schema facts.
2. Never treat this repo as the schema source of truth.
3. Never assume `admin-api` can override a missing admin profile; it checks `profiles.role = 'admin'`.
4. Never recommend local Next.js server handlers as the production secure-admin fix while static export remains enabled.
5. Never claim a website/admin failure belongs to this repo until you verify the owning surface.
6. Never silently edit the sibling mobile repo.
7. Never claim a deploy is live without verifying the actual deploy surface.
8. Never paraphrase a failed workflow step when the exact failing line is available.
9. Never hand-wave version-sensitive Next.js behavior.
10. Never assume a public env is present in GitHub Actions without reading the workflow.

---

## 5. Communication contract

Default style:
- concise
- specific
- explicit about repo ownership
- explicit about uncertainty

Before non-trivial work, say:
1. what you are changing
2. which repo owns it
3. whether the sibling repo may also be involved
4. what you will verify after

After work, say:
1. what changed
2. what you verified
3. what still depends on deploy, remote config, or sibling-repo coordination

Do not bury uncertainty inside vague language.

---

## 6. Verification protocol

Before you assert any of the following, run the matching check.

| Claim | Verification |
|---|---|
| "Lint passes" | `npm run lint` |
| "The site builds" | `npm run build` |
| "The repo statically exports" | verify `next.config.ts` contains `output: 'export'` |
| "The Hosting target is kanek-bz" | inspect `.firebaserc` and `firebase.json` |
| "The deploy workflow sets the needed env" | inspect `.github/workflows/deploy.yml` |
| "The admin backend exists here" | inspect `supabase/functions/admin-api/index.ts` |
| "The admin backend checks admin role" | inspect `requireAdmin()` in `admin-api/index.ts` |
| "Schema X exists" | inspect sibling mobile repo or generated DB types there |
| "This production admin action should work" | verify deployed function, caller session, and `profiles.role = 'admin'` |

If you cannot verify a remote claim, say that clearly and do not pretend it is
done.

---

## 7. False-error filter

Do not flag these as failures by themselves:

| Output | Meaning |
|---|---|
| general Next.js warnings with exit code 0 | warning only |
| Firebase Hosting action setup noise | informational |
| static export asset chatter | informational |

What matters is the step that exits non-zero or blocks the deploy.

---

## 8. Anti-hallucination rules

- Do not invent route behavior; read the route.
- Do not invent workflow env names; read the workflow.
- Do not invent endpoint contracts; read `admin-api/index.ts` or README.
- Do not invent schema fields from website code alone; inspect the mobile repo.
- Do not invent whether a user is admin-capable; that is a live data question.

Correct fallback phrases:
- "I don't know yet — I need to check the repo."
- "UNKNOWN — needs verification."
- "That claim depends on the sibling mobile repo or live Supabase state."

---

## 9. Tool discipline

Prefer:
- workspace reads for known files
- targeted search for symbols and endpoint names
- terminal commands for real build, deploy, git, or Supabase operations

When the issue is cross-repo:
1. inspect the local website/admin file first
2. identify the backend boundary
3. inspect the sibling mobile repo if the boundary is owned there

Do not use broad exploratory searching when the user gave a concrete anchor.

---

## 10. Failure recovery

If a plan fails:
1. stop
2. read the actual output
3. identify whether the issue is local website code, Hosting config, `admin-api`, or mobile-owned backend behavior
4. tell the user which surface actually owns the problem
5. propose the next concrete check or fix

Do not retry harder without changing the diagnosis.

---

## 11. Cross-repo boundary rules

When a task depends on schema, auth, RLS, storage policy, or non-local edge
functions:
- inspect `/home/wicked/Projects/kanek`
- state that the mobile repo owns that surface
- call out whether this repo only consumes it

When a mobile-side change would affect the admin frontend or `admin-api`, say so
explicitly.

Do not answer cross-repo behavior from website files alone when the backend is
shared.

---

## 12. Definition of done

A task in this repo is done only when:
1. the local change matches the request
2. touched code passes the smallest relevant validation
3. any required deploy step is either done or explicitly called out as pending
4. any sibling-repo dependency is explicitly called out
5. the summary states what changed, what was verified, and what is still open

Anything less is still in progress.

---

**End of behavioral contract.**

The factual guide is `.github/copilot-instructions.md`. The repo-local agent is
`.github/agents/kanek-website-workspace.agent.md`. Use those together.
