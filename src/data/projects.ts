import type { Project } from "@/lib/types";

// Static fallback catalogue. Used when Supabase is not configured or empty.
// The admin panel's "Export code" produces exactly this array — paste it here
// to make edits permanent for every visitor. See docs/data/CONTEXT.md.
export const PROJECTS_DEFAULT: Project[] = [
  { id: 1, title: "E-Motion Lab", meta: "// Branding // 2026", category: "branding", image: null, description: "Interaction, spatial systems and controlled rhythm in a digital installation context." },
  { id: 2, title: "Neural Echo", meta: "// 3D Design // 2025", category: "3d", image: null, description: "Volumetric studies where geometry meets tactile noise." },
  { id: 3, title: "Kinetic Static", meta: "// Art Direction // 2024", category: "art", image: null, description: "A visual study of motion frozen mid-frame." },
  { id: 4, title: "Glitch Field", meta: "// Visual Study // 2025", category: "art", image: null, description: "Signal corruption as an aesthetic language." },
  { id: 5, title: "Signal Noise", meta: "// Motion Graphic // 2026", category: "motion", image: null, description: "Rhythm and interference rendered in motion." },
  { id: 6, title: "Peripheral Vision", meta: "// Interface // 2024", category: "web", image: null, description: "An interface that lives at the edge of attention." },
  { id: 7, title: "Holo Archive", meta: "// Experimental // 2026", category: "art", image: null, description: "Speculative archives of light." },
  { id: 8, title: "Static Pulse", meta: "// Spatial Lab // 2025", category: "type", image: null, description: "Typography that breathes with the grid." },
  { id: 9, title: "Orbit Sequence", meta: "// Motion Study // 2024", category: "motion", image: null, description: "Orbital paths as compositional structure." },
];
