# AGENTS.md

Guidance for AI coding agents (Gemini CLI, Claude Code, etc.) working in this
repo. Humans: this is a useful map too.

This is **hhppll.online** — a Next.js 16 portfolio site (App Router, TypeScript,
Tailwind 4), deployed to a K3s + Traefik + ArgoCD VPS.

## ⭐ Start every task here

1. **Read [`docs/CONTEXT-MAP.md`](./docs/CONTEXT-MAP.md) first.** It's the index to
   the whole project and points you to the right deep doc.
2. **Before editing an area, read its `docs/**/CONTEXT.md`.** (frontend / data /
   deployment). It'll save you from guessing.
3. **After your change, update any `CONTEXT.md` it made stale — in the same
   commit.** New component, changed data flow, new env var, changed deploy step →
   the doc must reflect it. A wrong doc is a bug. This is how the next agent (and
   you, next week) stays fast. Don't skip it.

Keep docs short and true. If you add a whole new area, give it a `CONTEXT.md` and
add it to the map.

## Commands

```
npm run dev     # local dev → http://localhost:3000
npm run build   # production build — MUST pass before you consider work done
npm run lint    # eslint
```

Always run `npm run build` before finishing; it typechecks, lints, and builds.

## Layout (see docs for detail)

```
src/app/         routes + layout + globals.css (the design system)
src/components/   Hud, Hero, Works, Laboratory, Contact, AdminPanel, ProjectDetail
src/lib/          i18n, translations, supabase (optional), projects-store, types
src/data/         projects.ts + site.ts — static content you can edit directly
legacy/           the ORIGINAL static site — reference only, never built or imported
k8s/, Dockerfile, .github/  deployment
```

## Conventions (the short list)

- **TypeScript, strict.** No `any` unless truly unavoidable.
- **i18n:** every visible string goes through `t("key")` from `useLang()`. Add new
  copy to **both** `ru` and `en` in `src/lib/translations.ts`.
- **Client vs server:** the site is interactive, so most components are
  `"use client"`. Keep new static/presentational pieces as server components.
- **Data:** Supabase is optional; there's always a static fallback in `src/data/`.
  Don't hard-break the site when Supabase is unset. See `docs/data/CONTEXT.md`.
- **Styling:** the look lives in `src/app/globals.css` as plain classes ported
  from the old site. Tailwind is available for new work — don't rewrite the
  existing CSS into Tailwind just to "modernize" it.
- **Path alias:** `@/*` → `src/*`.
- **Secrets:** only `NEXT_PUBLIC_` (publishable) values may be committed
  (`.env.production`). Never commit a real secret.

## Deploying

Create a GitHub Release (tag `vX.Y.Z`). CI builds the image and ArgoCD ships it
to `https://hhppll.online` automatically. Never push directly to `main` — all
changes go through a Pull Request. Details + one-time setup in
`docs/deployment/CONTEXT.md`. Don't invent a new deploy mechanism.

## Don't

- Don't touch `legacy/` expecting it to run — it's a reference snapshot.
- Don't add a dependency for something a few lines or the platform already does.
- Don't leave `CONTEXT.md` docs stale after a change.
- **Never use `git push --force`** — this has already wiped history twice.
- **Never recreate `.git`** — always `git clone` / `git pull`.
- **Never push directly to `main`** — use a feature branch + Pull Request.
