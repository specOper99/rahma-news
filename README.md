# Herald

Multilingual newsroom: English, Arabic, and Central Kurdish (Sorani). Public site is SSR. Staff CMS at `/admin` uses email and password. There is no public signup and no OAuth.

## Languages

- `en` — LTR
- `ar` — RTL
- `ckb` — Central Kurdish / Sorani, Arabic script, RTL

A story can exist in one, two, or three editions. Publish state is per edition.

## SEO note

App locale and `html[lang]` for Kurdish is `ckb`. Google `hreflang` emits `ku-Arab` (ISO 639-1 `ku` + Arabic script), never `hreflang="ckb"`. `x-default` points at `/ar`.

## Requirements

- Node 20+
- pnpm
- Docker (Postgres 16)

## Setup

```bash
docker compose up -d
cp .env.example .env
pnpm i
pnpm db:migrate
pnpm seed
pnpm dev
```

Open http://localhost:3000 (redirects to a locale). Admin: http://localhost:3000/admin/login

Credentials are in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Defaults for local:

- owner@rahma.local / RahmaOwner10
- editor@rahma.local / RahmaEditor10
- author@rahma.local / RahmaAuthor10

Admin chrome is English. Article fields are per-edition.

## Scripts

- `pnpm dev` — Next.js
- `pnpm db:push` / `pnpm db:generate` / `pnpm db:migrate`
- `pnpm seed` — demo newsroom (refused in production unless `ALLOW_SEED=1`)
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright

## Architecture

Next.js 16 App Router, next-intl (`src/proxy.ts`), Postgres + Drizzle, Better Auth (`disableSignUp: true`), TipTap in the CMS. Design tokens: [DESIGN.md](DESIGN.md).
