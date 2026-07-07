# CONTEXT MAP

> **Read this first.** It's the index to everything an agent needs to work on
> this repo. Each area has a `CONTEXT.md` that goes deep. Open the ones your task
> touches **before** you edit code — and **update them when you change that area**
> (see "The contract" below).

## What this project is

`hhppll.online` — a personal portfolio site ("HPL // Visual Research", Matvey
Lukin). **Next.js 16** (App Router, TypeScript, Tailwind 4). Content is
bilingual RU/EN. Project/laboratory/contact data comes from **Supabase** with a
static fallback in `src/data/`. Deployed to a **K3s + Traefik + ArgoCD** VPS as a
Docker image.

## Where things live

| Area | Doc | Covers |
|------|-----|--------|
| Frontend app | [docs/frontend/CONTEXT.md](./frontend/CONTEXT.md) | App Router structure, components, i18n, styling, client/server split |
| Data & admin | [docs/data/CONTEXT.md](./data/CONTEXT.md) | Supabase schema, the static fallback, the admin panel, how edits persist |
| Deployment | [docs/deployment/CONTEXT.md](./deployment/CONTEXT.md) | Docker, Helm chart, ArgoCD, Traefik/TLS, CI, DNS, how to ship |

## Quick map of the tree

```
src/
  app/
    layout.tsx            fonts (next/font/local), providers, grain, metadata
    page.tsx              home: Hud + Hero + Works + Laboratory + Contact + AdminPanel
    project/[id]/page.tsx project detail route → <ProjectDetail>
    globals.css           the whole design system (ported from the old style.css)
    fonts/                NeutralFace / NonBureau / Geologica
  components/             Hud, Hero, Works, Laboratory, Contact, AdminPanel, ProjectDetail, GrainOverlay
  lib/                    i18n, translations, supabase (optional client), projects-store, types
  data/                   projects.ts (static fallback), site.ts (categories, defaults)
legacy/                   the ORIGINAL static HTML/CSS/JS — reference only, not built
k8s/                      Helm chart (helm/hppl) + ArgoCD Application (argocd)
docs/                     you are here
Dockerfile, .github/workflows/deploy.yml
```

## The contract (why this map exists)

This repo is maintained largely by AI agents. To keep them effective:

1. **Before editing** an area, read its `CONTEXT.md`.
2. **After a change that makes a `CONTEXT.md` wrong** (new component, changed data
   flow, new env var, changed deploy step), update that `CONTEXT.md` in the **same
   change**. Treat stale docs as a bug.
3. If you add a whole new area, add a `CONTEXT.md` for it and a row to the table
   above.

Keep docs short and true. A wrong doc is worse than no doc.
