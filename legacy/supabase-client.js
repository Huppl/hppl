// --- Supabase client & data access layer ---
// URL и publishable key безопасны для публичного фронтенда.
// Запись данных (INSERT/UPDATE/DELETE) разрешена только авторизованным
// пользователям Supabase Auth — см. политики RLS в Dashboard → Authentication → Policies.
const SUPABASE_URL = 'https://ynwirdxburfksvymxixq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xDRhzzWbBMMQmegTchMiOw_avgKzOuX';
const ADMIN_EMAIL = 'hupplegend2@gmail.com';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Auth ----------
async function sbSignIn(password) {
  return sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
}

async function sbSignOut() {
  await sb.auth.signOut();
}

async function sbIsAuthenticated() {
  const { data } = await sb.auth.getSession();
  return !!(data && data.session);
}

// ---------- Projects ----------
async function sbFetchProjects() {
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) {
    console.error('sbFetchProjects:', error.message);
    return [];
  }
  return data || [];
}

async function sbInsertProject(project) {
  const { data, error } = await sb.from('projects').insert(project).select().single();
  if (error) {
    console.error('sbInsertProject:', error.message);
    return null;
  }
  return data;
}

async function sbUpdateProject(id, fields) {
  const { error } = await sb
    .from('projects')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('sbUpdateProject:', error.message);
  return !error;
}

async function sbDeleteProject(id) {
  const { error } = await sb.from('projects').delete().eq('id', id);
  if (error) console.error('sbDeleteProject:', error.message);
  return !error;
}

async function sbDeleteAllProjects() {
  const { error } = await sb.from('projects').delete().gte('id', 0);
  if (error) console.error('sbDeleteAllProjects:', error.message);
  return !error;
}

// ---------- Laboratory (single row, id = 1) ----------
async function sbFetchLaboratory() {
  const { data, error } = await sb.from('laboratory').select('*').eq('id', 1).maybeSingle();
  if (error) {
    console.error('sbFetchLaboratory:', error.message);
    return { content: '' };
  }
  return data || { content: '' };
}

async function sbSaveLaboratory(content) {
  const { error } = await sb
    .from('laboratory')
    .upsert({ id: 1, content, updated_at: new Date().toISOString() });
  if (error) console.error('sbSaveLaboratory:', error.message);
  return !error;
}

// ---------- Contacts ----------
async function sbFetchContacts() {
  const { data, error } = await sb
    .from('contacts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) {
    console.error('sbFetchContacts:', error.message);
    return [];
  }
  return data || [];
}

async function sbInsertContact(contact) {
  const { data, error } = await sb.from('contacts').insert(contact).select().single();
  if (error) {
    console.error('sbInsertContact:', error.message);
    return null;
  }
  return data;
}

async function sbUpdateContact(id, fields) {
  const { error } = await sb.from('contacts').update(fields).eq('id', id);
  if (error) console.error('sbUpdateContact:', error.message);
  return !error;
}

async function sbDeleteContact(id) {
  const { error } = await sb.from('contacts').delete().eq('id', id);
  if (error) console.error('sbDeleteContact:', error.message);
  return !error;
}
