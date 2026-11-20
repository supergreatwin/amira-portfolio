import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';

export const db = createClient(
  'https://tfarhghukyogaowjqykn.supabase.co',
  'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

export const STAGES = [
  { id: 'idea', label: '01 / Finding the idea', description: 'The first question and why the story matters.' },
  { id: 'research', label: '02 / Research and ethics', description: 'Context, consent, interviews and responsibility.' },
  { id: 'preproduction', label: '03 / Pre-production', description: 'Treatments, storyboards, schedules and shot lists.' },
  { id: 'production', label: '04 / Production', description: 'Camera, sound, interviews and filming on location.' },
  { id: 'postproduction', label: '05 / Post-production', description: 'Editing, sound design, colour, structure and revision.' },
  { id: 'distribution', label: '06 / Distribution', description: 'Deliverables, festivals, screenings and outreach.' },
  { id: 'reflection', label: '07 / Reflection', description: 'Lessons, feedback, revisions and new questions.' }
];

export const TYPES = ['pdf','video','audio','image','slides','worksheet','template','transcript','subtitles','archive','link','other'];
const staffRoles = new Set(['admin','editor']);

export function isStaff(user) { return !!user && staffRoles.has(user.app_metadata?.editorial_role); }
export function byId(id) { return document.getElementById(id); }
export function setMessage(id, message, error = false) {
  const el = byId(id); if (!el) return;
  el.textContent = message || ''; el.classList.toggle('is-error', !!error);
}
export function niceError(error) { return error?.message || String(error); }
export function safeHttps(url) { try { const x = new URL(url); return x.protocol === 'https:' ? x.href : null; } catch { return null; } }
export function slugify(text) { return String(text).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100); }
export function formatSize(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1024).toFixed(0) + ' KB'; }
export function safeFilename(name) { return String(name).replace(/[^a-zA-Z0-9_.-]+/g,'-').replace(/^-+/,'').slice(-100) || 'resource'; }

export async function identify() {
  const { data, error } = await db.auth.getUser();
  if (error || !data?.user) return { user:null, member:null, staff:false, live:false };
  const user = data.user, staff = isStaff(user);
  const [{data:member},{data:settings}] = await Promise.all([
    db.from('edu_members').select('username,role,is_active,display_name').eq('user_id',user.id).maybeSingle(),
    db.from('edu_settings').select('is_live').eq('id',true).maybeSingle()
  ]);
  return { user, member, staff, live:settings?.is_live === true };
}

export async function signIn(email, username, password) {
  const { error } = await db.auth.signInWithPassword({ email:email.trim(), password });
  if (error) throw error;
  const identity = await identify();
  const expected = username.trim().toLowerCase();
  if (!identity.member || identity.member.username.toLowerCase() !== expected) {
    await db.auth.signOut();
    throw new Error('The username does not match this account. Check your credentials.');
  }
  if (!identity.staff && !(identity.live && identity.member.is_active)) {
    await db.auth.signOut();
    throw new Error('This educational space has not opened to learners.');
  }
  return identity;
}

export function renderStageOptions(select) {
  select.replaceChildren();
  for (const stage of STAGES) {
    const option = document.createElement('option');
    option.value = stage.id; option.textContent = stage.label; select.append(option);
  }
}

// Render editorial Markdown as text only, never unsanitized HTML.
export function articleText(parent, markdown) {
  parent.replaceChildren();
  for (const block of String(markdown || '').split(/\n\s*\n/)) {
    if (!block.trim()) continue;
    const p = document.createElement('p');
    p.textContent = block.trim().replace(/^#{1,6}\s+/,'');
    p.className = /^#{1,6}\s+/.test(block.trim()) ? 'edu-lead' : '';
    parent.append(p);
  }
}
