import { cms as db } from './cms-core.js';

const PROJECT_URL = 'https://tfarhghukyogaowjqykn.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
const activeEmail = () => $('ed-email').value.trim().toLowerCase();
const $ = id => document.getElementById(id);
const ar = document.body.dataset.locale === 'ar';
const msg = (en, arabic) => ar ? arabic : en;
const state = { id: null, entries: [], user: null, loading: false };
const fields = ['title-en', 'title-ar', 'slug', 'section', 'excerpt-en', 'excerpt-ar', 'body-en', 'body-ar', 'cover', 'featured'];
const names = { 'title-en': 'title_en', 'title-ar': 'title_ar', slug: 'slug', section: 'section', 'excerpt-en': 'excerpt_en', 'excerpt-ar': 'excerpt_ar', 'body-en': 'body_en', 'body-ar': 'body_ar', cover: 'cover_image_url', featured: 'featured' };
let recoveryMode = false;
function notice(text, isError = false) {
  $('ed-message').textContent = text || '';
  $('ed-message').style.color = isError ? '#a02a2a' : 'var(--plum)';
}
function saving(enabled) {
  state.loading = enabled;
  document.querySelectorAll('button[data-save], #ed-new, #ed-refresh').forEach(button => { button.disabled = enabled; });
}
function showGuest() {
  state.user = null;
  $('ed-auth').hidden = false;
  $('ed-dashboard').hidden = true;
}
function startNew() {
  state.id = null;
  $('ed-editor').reset();
  $('ed-edit-title').textContent = msg('Create an entry', 'إنشاء نص جديد');
  $('ed-edit-status').textContent = msg('Unsaved new entry', 'نص جديد لم يُحفظ');
  $('ed-public-link').href = ar ? 'journal.html' : 'journal.html';
}
function openEntry(entry) {
  state.id = entry.id;
  for (const key of fields) {
    const el = $('ed-' + key);
    el[el.type === 'checkbox' ? 'checked' : 'value'] = key === 'featured' ? !!entry.featured : (entry[names[key]] ?? '');
  }
  $('ed-edit-title').textContent = entry.title_en || msg('Untitled', 'بدون عنوان');
  $('ed-edit-status').textContent = msg('Current status: ', 'الحالة الحالية: ') + entry.status;
  $('ed-public-link').href = 'journal.html?slug=' + encodeURIComponent(entry.slug);
}
function renderList() {
  const list = $('ed-list');
  list.replaceChildren();
  if (!state.entries.length) {
    const item = document.createElement('li');
    item.className = 'ed-muted';
    item.textContent = msg('No entries yet. Choose + New entry to begin.', 'لا توجد نصوص بعد. اختاري إضافة نص جديد.');
    list.append(item);
    return;
  }
  for (const entry of state.entries) {
    const item = document.createElement('li'), button = document.createElement('button');
    const title = document.createElement('span'), meta = document.createElement('span');
    title.className = 'ed-entry-title';
    meta.className = 'ed-entry-meta';
    title.textContent = ar ? (entry.title_ar || entry.title_en) : entry.title_en;
    meta.textContent = entry.section + ' · ' + entry.status;
    button.type = 'button';
    button.append(title, meta);
    button.addEventListener('click', () => openEntry(entry));
    item.append(button);
    list.append(item);
  }
}
async function loadEntries() {
  const { data, error } = await db.from('editorial_entries').select('*').order('updated_at', { ascending: false }).limit(150);
  if (error) { notice(error.message, true); return; }
  state.entries = data || [];
  renderList();
  if (state.id) {
    const current = state.entries.find(row => row.id === state.id);
    if (current) openEntry(current);
  }
}
async function refreshAuth() {
  const { data, error } = await db.auth.getUser();
  const user = data?.user;
  if (error || !user) { showGuest(); return; }
  const role = user.app_metadata?.editorial_role;
  if (role !== 'admin' && role !== 'editor') {
    showGuest();
    notice(msg('This account does not have Editorial Desk access. Contact the site administrator.', 'هذا الحساب غير مُصرّح له بالدخول إلى المكتب التحريري. تواصلي مع مديرة الموقع.'), true);
    return;
  }
  state.user = user;
  $('ed-auth').hidden = true;
  $('ed-dashboard').hidden = false;
  $('ed-account').textContent = user.email + ' · ' + role;
  notice('');
  await loadEntries();
}
function slugify(text) {
  return String(text).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 110);
}
async function saveEntry(status) {
  if (state.loading || !state.user) return;
  const form = $('ed-editor');
  if (!form.reportValidity()) return;
  const previous = state.entries.find(row => row.id === state.id);
  const title = $('ed-title-en').value.trim(), body = $('ed-body-en').value.trim();
  if (!title || !body) { notice(msg('English title and text are required.', 'العنوان والنص الإنجليزيان مطلوبان.'), true); return; }
  const slug = $('ed-slug').value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    notice(msg('Use lowercase English letters, digits and hyphens for the URL.', 'استخدمي أحرفًا إنجليزية صغيرة وأرقامًا وشرطات للرابط.'), true); return;
  }
  const cover = $('ed-cover').value.trim();
  if (cover && !(cover.startsWith('/assets/') || /^https:\/\//i.test(cover))) {
    notice(msg('Use an HTTPS image URL or a path beginning /assets/.', 'استخدمي رابط صورة HTTPS أو مسارًا يبدأ بـ /assets/.'), true); return;
  }
  const payload = {
    slug, section: $('ed-section').value, title_en: title,
    title_ar: $('ed-title-ar').value.trim() || null,
    excerpt_en: $('ed-excerpt-en').value.trim() || null,
    excerpt_ar: $('ed-excerpt-ar').value.trim() || null,
    body_en: body, body_ar: $('ed-body-ar').value.trim(),
    cover_image_url: cover || null, featured: $('ed-featured').checked, status,
    published_at: status === 'published' ? (previous?.published_at || new Date().toISOString()) : (previous?.published_at || null)
  };
  saving(true);
  try {
    const q = state.id
      ? db.from('editorial_entries').update(payload).eq('id', state.id)
      : db.from('editorial_entries').insert({ ...payload, author_id: state.user.id });
    const { data, error } = await q.select('id').single();
    if (error) throw error;
    state.id = data.id;
    await loadEntries();
    notice(status === 'published'
      ? msg('Published. Your entry is available in the public journal.', 'تم النشر. النص متاح الآن في صفحة الكتابات.')
      : msg('Entry saved successfully.', 'تم حفظ النص بنجاح.'));
  } catch (error) { notice(error.message || String(error), true); }
  finally { saving(false); }
}
$('ed-title-en').addEventListener('input', event => {
  if (!state.id && !$('ed-slug').dataset.manual) $('ed-slug').value = slugify(event.target.value);
});
$('ed-slug').addEventListener('input', () => { $('ed-slug').dataset.manual = '1'; });
$('ed-new').addEventListener('click', () => { delete $('ed-slug').dataset.manual; startNew(); });
$('ed-refresh').addEventListener('click', loadEntries);
document.querySelectorAll('button[data-save]').forEach(button => button.addEventListener('click', () => saveEntry(button.dataset.save)));
let signInPending = false;
$('ed-auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (signInPending) return;
  const email = activeEmail();
  const password = $('ed-password').value;
  if (!email || !password) return;
  signInPending = true;
  const submit = $('ed-auth-form').querySelector('button[type="submit"]');
  submit.disabled = true;
  notice(msg('Signing in…', 'جارٍ تسجيل الدخول…'));
  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === 'invalid_credentials') {
        notice(msg('Incorrect email or password. Check your account email or use Reset password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحققي من البريد أو استخدمي إعادة تعيين كلمة المرور.'), true);
      } else if (error.code === 'over_request_rate_limit') {
        notice(msg('Too many sign-in attempts. Please try again later.', 'محاولات تسجيل دخول كثيرة. يُرجى المحاولة لاحقًا.'), true);
      } else {
        notice(error.message, true);
      }
      return;
    }
    $('ed-password').value = '';
    await refreshAuth();
  } catch {
    notice(msg('Could not sign in. Check your connection and try again.', 'تعذر تسجيل الدخول. تحققي من الاتصال وحاولي مجددًا.'), true);
  } finally {
    signInPending = false;
    submit.disabled = false;
  }
});
// UI cooldown improves feedback; the actual limits are enforced on the server.
const RESET_COOLDOWN_MS = 60_000;
const RESET_COOLDOWN_KEY = 'amira-editorial-password-reset-at';
let resetPending = false;
const resetButton = $('ed-forgot');
const resetOriginalLabel = resetButton.textContent;
function resetCooldownRemaining() {
  try {
    const lastRequest = Number(localStorage.getItem(RESET_COOLDOWN_KEY)) || 0;
    return Math.max(0, Math.ceil((lastRequest + RESET_COOLDOWN_MS - Date.now()) / 1000));
  } catch { return 0; }
}
function refreshResetButton() {
  const remaining = resetCooldownRemaining();
  resetButton.disabled = resetPending || remaining > 0;
  resetButton.textContent = remaining > 0
    ? msg('Try again in ' + remaining + 's', 'حاولي مجددًا بعد ' + remaining + ' ثانية')
    : (resetPending ? msg('Requesting…', 'جارٍ الطلب…') : resetOriginalLabel);
}
refreshResetButton();
setInterval(refreshResetButton, 1000);
resetButton.addEventListener('click', async () => {
  if (resetPending || resetCooldownRemaining() > 0) return;
  if (!$('ed-email').reportValidity()) return;
  const email = activeEmail();
  resetPending = true;
  try { localStorage.setItem(RESET_COOLDOWN_KEY, String(Date.now())); } catch {}
  refreshResetButton();
  try {
    // The browser never calls Auth's recover endpoint directly. The public
    // Edge Function enforces hourly IP/account quotas and masks Auth errors.
    const response = await fetch(PROJECT_URL + '/functions/v1/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY },
      body: JSON.stringify({ email, locale: ar ? 'ar' : 'en' })
    });
    if (!response.ok) throw new Error('Password reset request unavailable');
    notice(msg('If the account exists, a password reset email will be sent if the request is eligible.',
      'إذا كان الحساب موجودًا وكان الطلب مسموحًا، ستُرسل رسالة إعادة تعيين كلمة المرور.'));
  } catch {
    notice(msg('Unable to request a reset right now. Please try again later.',
      'تعذّر طلب إعادة تعيين كلمة المرور حاليًا. يُرجى المحاولة لاحقًا.'), true);
  } finally {
    resetPending = false;
    refreshResetButton();
  }
});
$('ed-recover-form').addEventListener('submit', async event => {
  event.preventDefault();
  const password = $('ed-new-password').value;
  if (password.length < 12) { notice(msg('Use a password of at least 12 characters.', 'كلمة المرور يجب أن تتكون من ١٢ حرفًا على الأقل.'), true); return; }
  const { error } = await db.auth.updateUser({ password });
  if (error) notice(error.message, true);
  else { recoveryMode = false; $('ed-recover-form').hidden = true; notice(msg('Password updated. You can now sign in.', 'تم تغيير كلمة المرور. يمكنك تسجيل الدخول.')); await refreshAuth(); }
});
$('ed-logout').addEventListener('click', async () => {
  const { error } = await db.auth.signOut();
  if (error) notice(error.message, true);
  else { showGuest(); notice(msg('Signed out.', 'تم تسجيل الخروج.')); }
});
db.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryMode = true;
    $('ed-auth').hidden = false;
    $('ed-recover-form').hidden = false;
    $('ed-dashboard').hidden = true;
    notice(msg('Set a new password below.', 'عيّني كلمة مرور جديدة أدناه.'));
  } else if (!recoveryMode && ['SIGNED_IN', 'TOKEN_REFRESHED', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
    setTimeout(() => { if (!recoveryMode) void refreshAuth(); }, 0);
  }
});
startNew();
void refreshAuth();
export { db };
