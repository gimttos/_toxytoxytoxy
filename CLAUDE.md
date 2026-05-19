# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

This is a personal "갠홈" (otaku personal homepage) — not a generic web app. The owner wants:

- A banner-led landing page with a strong, "pretty to show others" visual identity
- A public **guestbook** (방명록) anyone can sign
- **Character introduction** pages
- A **schedule/calendar** that ideally ingests events created on the owner's phone calendar (one-way phone → site sync is the priority direction)
- Personal **life-management** surfaces (the calendar doubles as this)
- Image galleries for lots of otaku photos
- **성향표** (preference/tendency tables) embedded on a page

Treat the visual design as a first-class requirement, not an afterthought. When building UI, use the `frontend-design` skill and avoid generic AI-template aesthetics.

## Stack

- **Next.js 16** App Router (`src/app/`), **React 19**, TypeScript (strict), path alias `@/*` → `src/*`
- **Tailwind CSS v4** via `@tailwindcss/postcss` — config lives in `src/app/globals.css` (`@theme inline`), there is no `tailwind.config`
- Deployed to **Cloudflare Workers** through the **OpenNext** adapter (`@opennextjs/cloudflare`), not Vercel

## Commands

```bash
npm run dev          # Webpack dev server, heap-capped (localhost:3000) — see memory constraint below
npm run dev:turbo    # Turbopack dev — DO NOT recommend on the owner's machine (see below)
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run preview      # Build with OpenNext and run on the local Cloudflare workerd runtime — use this to catch Worker-only breakage before deploy
npm run deploy       # Build and deploy to Cloudflare
npm run cf-typegen   # Regenerate cloudflare-env.d.ts after editing bindings in wrangler.jsonc
```

There is no test runner configured yet. `npm run dev` (Node) and `npm run preview` (workerd) can behave differently — verify Worker-runtime features with `preview` before deploying.

### ⚠️ Memory constraint (do not regress this)

The owner's machine is **~8 GB RAM with very little headroom** (often <1 GB free; 12 logical CPUs). Next 16's default Turbopack dev server spawns one worker per logical CPU; on this machine that exhausts memory and **black-screens the whole computer** in an OOM crash loop (`FATAL ERROR: Zone Allocation failed`). This already happened twice.

Therefore `npm run dev` is intentionally `cross-env NODE_OPTIONS=--max-old-space-size=1024 next dev --webpack` — single-process webpack with a heap cap. **Do not change `dev` back to Turbopack / remove the heap cap / remove `--webpack`.** `dev:turbo` exists only for a future higher-RAM machine. Before any heavy command (`dev`, `build`, `preview`), advise closing Chrome (it alone uses ~1.6 GB here).

## Cloudflare architecture (important)

- Deploy config is **`wrangler.jsonc`**. `main` points at the OpenNext-built `.open-next/worker.js`; `.open-next/` is generated, never edit it.
- Bindings already present: `ASSETS` (static assets), `IMAGES` (Next.js image optimization), `WORKER_SELF_REFERENCE` (required by OpenNext caching). Adding storage (D1 / R2 / KV) means adding a binding block to `wrangler.jsonc` **and** running `npm run cf-typegen` so the typed `CloudflareEnv` updates.
- Access bindings in server code via `getCloudflareContext()` from `@opennextjs/cloudflare` — not via `process.env`. This works in `next dev` only because `next.config.ts` calls `initOpenNextCloudflareForDev()`.
- Local secrets/env go in **`.dev.vars`** (gitignored); production secrets are set with `wrangler secret`. `compatibility_flags` includes `nodejs_compat` — Node built-ins are available in the Worker.
- For persistence on this project, prefer Cloudflare-native: **D1** (guestbook entries, schedule events), **R2** (uploaded otaku images), **KV** (small config/flags).
- **D1 is configured** (`d1_databases` → binding `DB`, name `pal3bluedot-db`). `database_id` in `wrangler.jsonc` is a placeholder until the owner provisions the remote DB — see "Owner setup" below. Migrations live in `migrations/`, applied with `wrangler d1 migrations apply`.

## Owner setup (one-time, needs the owner's Cloudflare login)

These need `wrangler` auth and must be run by the owner (e.g. type `! <cmd>` in the session). Local-only commands need no login.

```bash
npx wrangler d1 create pal3bluedot-db          # then paste the printed database_id into wrangler.jsonc
npx wrangler d1 migrations apply pal3bluedot-db --local     # local dev DB
npx wrangler d1 migrations apply pal3bluedot-db --remote    # production DB (needs login)
npm run cf-typegen                              # after the id change
```

Owner auth secret — local: add `OWNER_SECRET="<passphrase>"` to `.dev.vars` (gitignored). Production: `npx wrangler secret put OWNER_SECRET`. Optional `GUESTBOOK_SALT` likewise (falls back to a constant if unset — fine, it's spam-only, not security).

## Current structure (M2 — guestbook live)

- `src/lib/site.ts` — **single source of truth** for site identity and the nav list. Adding/moving a section = editing the `nav` array here; header, footer, home "목차" all render from it. `NavItem.status: "live" | "soon"` and `NavItem.admin?: boolean` (admin items are filtered out of the public UI). Components import **`publicNav`** (admin-excluded), not `nav`; `page-shell` uses full `nav` for lookup.
- `src/app/globals.css` — the design system. All color/font tokens live in the `@theme inline` block (paper / ink / muted / line / accent; Fraunces + Nanum Myeongjo + IBM Plex Sans KR + IBM Plex Mono). Reusable classes: `.kicker`, `.rule`, `.display`, `.display-en`, `.ticks`, `.dot`, `.rise` (the old `.grain` was removed in the white/blue redesign). Change the look here, not in components. Design polish is deferred to M5 — keep new sections functional and on-brand with these classes, don't over-style.
- Fonts load via a Google Fonts `<link>` in `src/app/layout.tsx` (not `next/font`) for reliable Korean glyph coverage — swapping fonts means editing that URL **and** the `--font-*` tokens.
- `src/components/` — `site-header` (masthead + nav), `site-footer` (colophon), `page-shell` (`PageHeader` + `ComingSoon` for stub sections).
- `src/lib/db.ts` — the **only** place that calls `getCloudflareContext()`. `getEnv()` (typed `CloudflareEnv` + optional secrets) and `getDb()` (D1). New server data access goes through here.
- `src/lib/owner.ts` — owner auth (passphrase `OWNER_SECRET` → httpOnly signed cookie). `isOwner()` / `tryUnlock()` / `lock()`. M2-interim; M3 builds on it. Reuse it for any owner-gated feature — don't reinvent.
- `src/lib/guestbook.ts` — guestbook D1 layer (list/create/setHidden/deleteEntry, ip-hash rate limit, validation). `migrations/0001_guestbook.sql` is the schema.
- `/guestbook` is **live** (`force-dynamic`, Server Component + `actions.ts` Server Actions). `/characters`, `/gallery`, `/sessions`, `/banners`, `/log`, `/schedule`, `/about` are intentionally-designed "준비 중" stubs (PageHeader + ComingSoon) for later milestones.

## Roadmap (agreed with owner)

Full feature design is in `.claude/plans/wobbly-dreaming-tower.md` (approved). Owner's directive: **build all features first, do the design pass last** (M5).

- **M1 ✅** design system + banner + nav skeleton
- **M2 ✅** guestbook (D1) — public sign, honeypot + per-IP rate limit, interim owner auth (passphrase → signed cookie) for hide/delete
- **M3** owner auth (formalize) + characters (profiles · PC sheets · relations) + gallery (R2 · albums · tags · 굿즈) + about (성향표 · BYF/DNI · 위시리스트)
- **M4** sessions (TRPG 기록부 + log archive, per-log public/private) + banners/links exchange + log (갱신·잡담) + 소품 (visitor counter · 한마디 · BGM) + admin console (room links · session notes · ops)
- **M5** schedule (Google private `.ics` polled by Worker cron + private memo layer) + full **design pass** + polish

Nav grew 6 → 9 + hidden Admin. 굿즈/콜렉션 = a gallery album (not a tab); 소품 = site-wide chrome (not a tab).

Calendar note: Samsung Calendar can't expose an external `.ics`. The plan is to have the owner store events on the Google-account calendar synced on their Galaxy phone, then the Worker fetches Google's private `.ics` URL.

## Conventions

- Source uses **tabs** for indentation; match it.
- Keep server-only data access in Server Components / Server Actions / Route Handlers; bindings are not available in the browser. Go through `src/lib/db.ts` — don't call `getCloudflareContext()` elsewhere.
- Pages that read bindings must be `export const dynamic = "force-dynamic"` (else `next build` tries to run the D1 query at build time and fails). Mutations are `"use server"` actions in a sibling `actions.ts`; guard owner-only actions with `isOwner()` from `src/lib/owner.ts`.
- `npm run lint` runs `eslint .` directly — `next lint` was removed in Next 16. `eslint.config.mjs` imports the flat configs from `eslint-config-next/core-web-vitals` and `/typescript` directly (FlatCompat breaks under ESLint 9).
