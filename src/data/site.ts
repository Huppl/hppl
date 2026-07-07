import type { CategoryValue, Contact } from "@/lib/types";

// Filter categories. Labels resolve through i18n keys (filter_<value>).
export const CATEGORIES: { value: CategoryValue; i18nKey: string }[] = [
  { value: "3d", i18nKey: "filter_3d" },
  { value: "web", i18nKey: "filter_web" },
  { value: "branding", i18nKey: "filter_branding" },
  { value: "art", i18nKey: "filter_art" },
  { value: "ai", i18nKey: "filter_ai" },
  { value: "type", i18nKey: "filter_type" },
  { value: "motion", i18nKey: "filter_motion" },
];

// Default Laboratory text when Supabase is unset/empty.
export const DEFAULT_LABORATORY =
  "Currently learning: Web Design, 3D Modeling, Creative Coding";

// Default contact links when Supabase is unset/empty.
export const DEFAULT_CONTACTS: Contact[] = [
  { id: 1, label: "hello@hhppll.online", url: "mailto:hello@hhppll.online" },
];
