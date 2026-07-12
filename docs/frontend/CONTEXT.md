# CONTEXT — Frontend

The Next.js app. App Router, TypeScript, Tailwind 4, React 19.

> Update this file when you add/rename a component, change the client/server
> split, touch i18n, or change the styling system.

## Structure

- `src/app/layout.tsx` — root layout. Registers the three local fonts via
  `next/font/local` (exposes `--font-neutral`, `--font-nonbureau`,
  `--font-geologica`), wraps everything in `LanguageProvider`, renders the global
  `<GrainOverlay/>`, sets metadata. Server component.
- `src/app/page.tsx` — the home page. Wraps the sections in `ProjectsProvider`
  and renders `Hud → Hero → Works → Laboratory → Contact → AdminPanel`.
- `src/app/project/[id]/page.tsx` — thin client wrapper; reads the id with
  `useParams` and renders `<ProjectDetail id={...}/>`.
- `src/app/fresh/page.tsx` — "Fresh" page. Horizontal scroll feed of latest
  works, sorted by id descending. Wrapped in `ProjectsProvider`, uses
  `useProjects()`. Cards show thumbnail, tags, title, meta; click navigates to
  `/project/[id]`. Scroll-snap CSS + wheel-to-horizontal-scroll conversion.
- `src/app/globals.css` — **the entire visual system**, ported 1:1 from the old
  `legacy/style.css`. Design tokens live in `:root` (`--bg --text --dim --line
  --accent`). Component classes: `.ui-layer`, `.hero-view`, `.work-*`,
  `.filter-*`, `.simple-section`, `.admin-*`, `.project-*`, `.fresh-*`. Fonts are referenced
  as CSS variables. Tailwind is available for new work, but the existing look is
  plain CSS classes — don't rewrite it into Tailwind for its own sake.

## Components (`src/components/`)

| Component | Client? | Role |
|-----------|---------|------|
| `Hud` | yes | Fixed HUD: live clock + timezone, nav, RU/EN switch, bio |
| `Hero` | yes | Video bg, two mouse-parallax circles, title |
| `Works` | yes | Filterable project grid; filter bar fades in on scroll (IntersectionObserver) |
| `Laboratory` | yes | "In progress" line (Supabase read, static fallback) |
| `Contact` | yes | Contact links (Supabase read, static fallback) |
| `AdminPanel` | yes | Sign-in + edit projects/laboratory/contacts (home) |
| `ProjectDetail` | yes | Project detail + single-project admin (`/project/[id]`) |
| `GrainOverlay` | no | Static SVG grain, in the layout |

Most components are `"use client"` because the site is interactive (clock,
parallax, localStorage language, Supabase, admin). Keep new purely-presentational
pieces as server components.

## i18n (`src/lib/i18n.tsx`, `src/lib/translations.ts`)

- `LanguageProvider` holds the current language (`ru` | `en`), persisted to
  `localStorage["hpl_language"]`. Default and first render are `ru` (keeps
  hydration stable).
- In a component: `const { t, lang, setLang } = useLang();` then `t("some_key")`.
- Every user-visible string goes through `t()`. Add new copy to **both** `ru` and
  `en` in `translations.ts`.

## Data flow (summary — full detail in ../data/CONTEXT.md)

- `ProjectsProvider` (`src/lib/projects-store.tsx`) loads projects once (Supabase
  → static fallback) and shares them; `Works` renders them, `AdminPanel` edits
  them live.
- `Laboratory`/`Contact` fetch their own single values with a static fallback.

## Conventions

- `@/*` path alias → `src/*`.
- Project images are user-supplied paths/URLs, so plain `<img>` is used on purpose
  (the `no-img-element` lint rule is off).
- Run `npm run lint` and `npm run build` before shipping; both must pass.

## Commands

```
npm run dev     # local dev (http://localhost:3000)
npm run build   # production build (also typechecks + lints)
npm run lint
```
