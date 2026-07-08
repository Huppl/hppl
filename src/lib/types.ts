// Domain types — mirror the Supabase `projects` / `contacts` / `laboratory` tables.
// See docs/data/CONTEXT.md for the schema of record.

export type CategoryValue =
  | "3d"
  | "web"
  | "branding"
  | "art"
  | "ai"
  | "type"
  | "motion";

export interface Project {
  id: number;
  title: string;
  meta: string; // short line, e.g. "// Branding // 2026"
  category: CategoryValue; // legacy single tag
  tags?: CategoryValue[]; // multiple tags (preferred)
  image: string | null; // path or URL; null → framed placeholder
  gallery?: string[] | null; // array of image URLs (Supabase Storage)
  description: string;
  link?: string | null; // legacy; routing now uses /project/<id>
  external_url?: string | null;
  sort_order?: number | null;
}

export interface Contact {
  id: number;
  label: string;
  url: string;
  sort_order?: number | null;
}

export interface Laboratory {
  content: string;
}
