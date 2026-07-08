# CONTEXT — Data & Admin

How project/laboratory/contact content is stored, read, and edited.

> Update this file when you change the Supabase schema, the fallback data shape,
> or the admin flow.

## Two sources, one fallback

1. **Supabase** (primary) — tables `projects`, `laboratory`, `contacts`.
2. **Static files** (fallback) — `src/data/projects.ts` (`PROJECTS_DEFAULT`) and
   `src/data/site.ts` (`DEFAULT_LABORATORY`, `DEFAULT_CONTACTS`, `CATEGORIES`).

Supabase is **optional**. If `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, `src/lib/supabase.ts` exports `sb =
null`; every read returns empty and callers fall back to the static data, every
write is a no-op. The site is fully browsable with no Supabase configured — you
just can't use the admin panel.

## Supabase tables

- `projects`: `id`, `title`, `meta`, `category`, `image` (cover URL), `gallery`
  (`text[]` — extra image URLs shown on the project page), `description`,
  `link?`, `sort_order?`, `updated_at`. `category` is one of the `CATEGORIES`
  values in `src/data/site.ts` (`3d web branding art ai type motion`).
- `laboratory`: single row `id = 1`, `content`, `updated_at`.
- `contacts`: `id`, `label`, `url`, `sort_order?`.

## Storage

- Public bucket `images` (5MB limit, image mime types only). Public read;
  writes (insert/update/delete) require an authenticated session — same admin
  user as everything else.
- `sbUploadImage(file, folder)` in `src/lib/supabase.ts` uploads to
  `covers/` or `gallery/` inside that bucket and returns the public URL. Used
  by `ProjectDetail`'s admin panel for the cover-image and gallery upload
  buttons (actual `<input type="file">`, not manual URL pasting).

Row-level security gates **writes** to the admin user (`NEXT_PUBLIC_ADMIN_EMAIL`).
The anon/publishable key is safe in the browser by design.

Types are in `src/lib/types.ts`; the typed data-access functions
(`sbFetchProjects`, `sbUpdateProject`, `sbSignIn`, …) are in `src/lib/supabase.ts`.

## The admin panel

- Bottom-right `ADMIN` button. It signs in via Supabase Auth
  (`ADMIN_EMAIL` + the password you type) and opens a side panel.
- **Home** (`AdminPanel`): three tabs — projects, laboratory, contacts. Edits
  write straight to Supabase and update the on-screen list live (shared
  `ProjectsProvider`).
- **Project page** (`ProjectDetail`): edits the single current project.
- Without Supabase configured, sign-in fails and the panel does nothing.

## Making edits permanent for everyone WITHOUT Supabase

The admin panel's **"Export code"** button copies the current project list as a
`PROJECTS_DEFAULT = [...]` array. Paste it into `src/data/projects.ts` and commit
— that's the static fallback everyone sees. This is the intended flow when you're
not running Supabase, and it's the most agent-friendly path: **projects are just a
TypeScript file you can edit directly.**

## Env vars

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (anon) key — public by design |
| `NEXT_PUBLIC_ADMIN_EMAIL` | The Supabase Auth user allowed to write |

They live in `.env.production` (committed, publishable only) for builds and
`.env.local` for local dev. See ../deployment/CONTEXT.md.
