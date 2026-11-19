import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';
const db = createClient('https://tfarhghukyogaowjqykn.supabase.co', 'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS', { auth: { persistSession: false, autoRefreshToken: false } });
const ar = document.body.dataset.locale === 'ar';
const root = document.getElementById('journal-root');
const message = document.getElementById('journal-message');
const loc = (en, arabic) => ar ? arabic : en;
const entryTitle = row => ar ? (row.title_ar || row.title_en) : row.title_en;
const entryExcerpt = row => ar ? (row.excerpt_ar || row.excerpt_en || '') : (row.excerpt_en || '');
const entryBody = row => ar ? (row.body_ar || row.body_en || '') : row.body_en;
const el = (tag, cls, content) => { const node = document.createElement(tag); if (cls) node.className = cls; if (content != null) node.textContent = content; return node; };
function imageUrl(url) {
  if (!url) return '';
  if (/^\/assets\/[a-z0-9_./-]+$/i.test(url)) return url;
  try { const value = new URL(url); return value.protocol === 'https:' ? value.href : ''; }
  catch { return ''; }
}
const slug = new URLSearchParams(location.search).get('slug');
const linkFor = row => 'journal.html?slug=' + encodeURIComponent(row.slug);
async function loadJournal() {
  message.textContent = loc('Loading journal…', 'جارٍ تحميل الكتابات…');
  const { data, error } = await db.from('editorial_entries')
    .select('slug,section,title_en,title_ar,excerpt_en,excerpt_ar,body_en,body_ar,cover_image_url,published_at')
    .eq('status', 'published').lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(250);
  if (error) { message.textContent = loc('The journal could not load. Please try again later.', 'تعذّر تحميل الكتابات. يرجى المحاولة لاحقًا.'); return; }
  message.textContent = '';
  const entries = data || [];
  if (slug) {
    const row = entries.find(item => item.slug === slug);
    if (!row) { message.textContent = loc('This entry is not available.', 'هذا النص غير متاح.'); return; }
    const article = el('article', 'journal-article');
    const back = el('a','journal-back',loc('← All entries','← كل الكتابات')); back.href='journal.html';
    article.append(back,el('span','journal-tags', row.section),el('h1','',entryTitle(row)));
    if (entryExcerpt(row)) article.append(el('p','journal-summary',entryExcerpt(row)));
    const picture = imageUrl(row.cover_image_url);
    if (picture) { const img=document.createElement('img'); img.src=picture; img.alt=entryTitle(row); img.loading='lazy'; article.append(img); }
    const body = el('div','journal-body');
    for (const para of entryBody(row).split(/\n\s*\n/).filter(Boolean)) body.append(el('p','',para));
    article.append(body); root.replaceChildren(article);
    document.title = entryTitle(row) + ' — Amira Abdelfadil';
    return;
  }
  if (!entries.length) { root.append(el('p','journal-empty',loc('New stories are on their way.','حكايات جديدة قادمة.'))); return; }
  const list = el('ul','journal-list');
  for (const row of entries) {
    const li = el('li','journal-card'), title = el('h2');
    const link = el('a','',entryTitle(row)); link.href=linkFor(row);
    title.append(link);
    li.append(el('span','journal-tags',row.section),title);
    if (entryExcerpt(row)) li.append(el('p','',entryExcerpt(row)));
    list.append(li);
  }
  root.append(list);
}
void loadJournal();