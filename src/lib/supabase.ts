// Supabase data-access layer. Optional: if the NEXT_PUBLIC_ env vars are unset,
// the client is null and reads return empty (callers fall back to static data),
// writes are no-ops. The site is fully functional statically without Supabase.
//
// The anon/publishable key is safe for the browser (it ships in client JS by
// design); row-level-security in Supabase gates all writes to the admin user.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Contact, Laboratory, Project } from "@/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export const sb: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const supabaseEnabled = sb !== null;

// ---------- Storage (image uploads) ----------
export async function sbUploadImage(
  file: File,
  folder: "covers" | "gallery",
): Promise<string | null> {
  if (!sb) return null;
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("images").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) {
    console.error("sbUploadImage:", error.message);
    return null;
  }
  const { data } = sb.storage.from("images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function sbDeleteImage(url: string): Promise<boolean> {
  if (!sb) return false;
  try {
    const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/`;
    if (!url.startsWith(bucketUrl)) return false;
    const path = url.slice(bucketUrl.length);
    const { error } = await sb.storage.from("images").remove([path]);
    if (error) {
      console.error("sbDeleteImage:", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ---------- Auth ----------
export async function sbSignIn(password: string) {
  if (!sb) return { error: new Error("Supabase not configured") };
  return sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
}

export async function sbSignOut() {
  await sb?.auth.signOut();
}

export async function sbIsAuthenticated(): Promise<boolean> {
  if (!sb) return false;
  const { data } = await sb.auth.getSession();
  return !!data?.session;
}

// ---------- Projects ----------
export async function sbFetchProjects(): Promise<Project[]> {
  if (!sb) return [];
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    console.error("sbFetchProjects:", error.message);
    return [];
  }
  return (data as Project[]) ?? [];
}

export async function sbInsertProject(
  project: Partial<Project>,
): Promise<Project | null> {
  if (!sb) return null;
  const { data, error } = await sb.from("projects").insert(project).select().single();
  if (error) {
    console.error("sbInsertProject:", error.message);
    return null;
  }
  return data as Project;
}

export async function sbUpdateProject(
  id: number,
  fields: Partial<Project>,
): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb
    .from("projects")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("sbUpdateProject:", error.message);
  return !error;
}

export async function sbDeleteProject(id: number): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb.from("projects").delete().eq("id", id);
  if (error) console.error("sbDeleteProject:", error.message);
  return !error;
}

// ---------- Laboratory (single row, id = 1) ----------
export async function sbFetchLaboratory(): Promise<Laboratory> {
  if (!sb) return { content: "" };
  const { data, error } = await sb
    .from("laboratory")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("sbFetchLaboratory:", error.message);
    return { content: "" };
  }
  return (data as Laboratory) ?? { content: "" };
}

export async function sbSaveLaboratory(content: string): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb
    .from("laboratory")
    .upsert({ id: 1, content, updated_at: new Date().toISOString() });
  if (error) console.error("sbSaveLaboratory:", error.message);
  return !error;
}

// ---------- Contacts ----------
export async function sbFetchContacts(): Promise<Contact[]> {
  if (!sb) return [];
  const { data, error } = await sb
    .from("contacts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    console.error("sbFetchContacts:", error.message);
    return [];
  }
  return (data as Contact[]) ?? [];
}

export async function sbInsertContact(
  contact: Partial<Contact>,
): Promise<Contact | null> {
  if (!sb) return null;
  const { data, error } = await sb.from("contacts").insert(contact).select().single();
  if (error) {
    console.error("sbInsertContact:", error.message);
    return null;
  }
  return data as Contact;
}

export async function sbUpdateContact(
  id: number,
  fields: Partial<Contact>,
): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb.from("contacts").update(fields).eq("id", id);
  if (error) console.error("sbUpdateContact:", error.message);
  return !error;
}

export async function sbDeleteContact(id: number): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb.from("contacts").delete().eq("id", id);
  if (error) console.error("sbDeleteContact:", error.message);
  return !error;
}
