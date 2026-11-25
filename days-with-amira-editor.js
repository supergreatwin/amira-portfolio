import { cms, isEditor, BUCKET } from './cms-core.js';
import { validateDiary, storagePaths, publicationRows, stripWebpMetadata, renderDiary, escape } from './days-with-amira-model.mjs';

const root = document.querySelector('[data-diary-editor]');
const ar = document.documentElement.lang === 'ar';
const say = (en, arabic) => ar ? arabic : en;
const body = root?.querySelector('[data-diary-editor-body]');
let diary, previousAssets = [], revision = '', busy = false, upload;
const pending = new Map(), previews = new Map();
const element = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const notice = (text, error = false) => {
  const target = body.querySelector('[data-diary-notice]');
  if (target) { target.textContent = text; target.classList.toggle('is-error', error); }
};
async function editor() {
  if (document.getElementById('ed-dashboard').hidden) throw Error(say('Sign in to the Editorial Desk first.', 'سجّلي الدخول إلى المكتب التحريري أولًا.'));
  const { data, error } = await cms.auth.getUser();
  if (error || !isEditor(data.user)) throw Error('Editorial access is required.');
  return data.user;
}
function button(label, action) {
  const b = element('button', label, 'ed-button ghost'); b.type = 'button';
  b.onclick = () => { if (!busy) void Promise.resolve().then(action).catch(e => notice(e.message, true)); };
  return b;
}
let fieldNumber = 0;
function field(label, value, change, multiline = false, rtl = false) {
  const box = element('div', undefined, 'ed-field'), name = element('label', label);
  const input = element(multiline ? 'textarea' : 'input');
  input.id = 'diary-field-' + (++fieldNumber); name.htmlFor = input.id;
  input.value = value; input.maxLength = multiline ? 1800 : 600;
  if (multiline) input.rows = 3;
  if (rtl) input.dir = 'rtl';
  input.oninput = () => change(input.value);
  box.append(name, input); return box;
}
function pair(label, record, multiline = false) {
  const grid = element('div', undefined, 'ed-grid');
  grid.append(field(label + ' · English', record.en, v => record.en = v, multiline),
    field(label + ' · العربية', record.ar, v => record.ar = v, multiline, true));
  return grid;
}
function move(items, item, delta) {
  const i = items.indexOf(item), j = i + delta;
  if (j >= 0 && j < items.length) [items[i], items[j]] = [items[j], items[i]];
  render();
}
async function records() {
  const { data, error } = await cms.from('cms_sections').select('key,body_en,image_path,updated_at')
    .like('key', 'days_with_amira%');
  if (error) throw error;
  return (data || []).filter(row => row.key === 'days_with_amira' || row.key === 'days_with_amira_draft' || row.key.startsWith('days_with_amira_asset_'));
}
async function load() {
  await editor();
  if (busy) return;
  busy = true;
  try {
    const rows = await records();
    const saved = rows.find(r => r.key === 'days_with_amira_draft') || rows.find(r => r.key === 'days_with_amira');
    if (saved) diary = validateDiary(JSON.parse(saved.body_en));
    else {
      const response = await fetch(new URL('assets/days-with-amira/diary.json', import.meta.url), { cache: 'no-store' });
      if (!response.ok) throw Error('Could not load the original diary.');
      diary = validateDiary(await response.json());
    }
    revision = rows.map(r => r.key + ':' + r.updated_at).sort().join('|');
    previousAssets = rows.map(r => r.image_path).filter(Boolean);
    pending.clear();
    for (const url of previews.values()) URL.revokeObjectURL(url);
    previews.clear();
    const paths = storagePaths(diary);
    if (paths.length) {
      const { data, error } = await cms.storage.from(BUCKET).createSignedUrls(paths, 3600);
      if (error) throw error;
      for (const item of data || []) if (item.signedUrl) previews.set(item.path, item.signedUrl);
    }
    render();
    notice(saved ? say('Loaded the saved diary. Changes stay private until Publish.', 'تم تحميل اليوميات المحفوظة. تظل التغييرات خاصة حتى النشر.') : say('Loaded the original diary. Save a draft or publish your changes.', 'تم تحميل اليوميات الأصلية. يمكنك حفظ مسودة أو نشر التغييرات.'));
  } finally { busy = false; }
}
function render() {
  body.replaceChildren();
  const status = element('p', '', 'ed-status'); status.dataset.diaryNotice = ''; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const tools = element('div', undefined, 'ed-actions');
  tools.append(button(say('Save private draft', 'حفظ مسودة خاصة'), () => save(false)),
    button(say('Preview saved photographs', 'معاينة الصور المحفوظة'), preview),
    button(say('Publish diary', 'نشر اليوميات'), () => save(true)),
    button(say('Restore original diary', 'استعادة اليوميات الأصلية'), restoreOriginal),
    button(say('Reload saved diary', 'إعادة تحميل المحفوظ'), async () => {
      if (confirm(say('Discard unsaved changes and reload?', 'هل تريدين تجاهل التغييرات غير المحفوظة؟'))) await load();
    }));
  const link = element('a', say('View public diary ↗', 'عرض اليوميات المنشورة ↗'), 'ed-button alt');
  link.href = 'days-with-amira.html'; link.target = '_blank'; link.rel = 'noopener'; tools.append(link);
  body.append(element('p', say('Edit both languages, arrange chapters and photographs, and choose the opening image. New photographs are cropped and prepared before upload; drafts are private.', 'حرّري اللغتين، ورتّبي الفصول والصور، واختاري صورة الافتتاح. تُجهّز الصور وتُقص قبل رفعها، وتبقى المسودات خاصة.'), 'ed-muted'), tools, status);
  const copy = element('details'); copy.append(element('summary', say('Opening words', 'كلمات الافتتاح')));
  for (const [key, label] of [['title', 'Title'], ['kicker', 'Eyebrow'], ['lead', 'Opening line'], ['intro', 'Introduction']]) copy.append(pair(label, diary[key], key === 'intro'));
  body.append(copy, element('h3', say('Chapters', 'الفصول')));
  for (const chapter of diary.chapters) {
    const section = element('details', undefined, 'diary-editor-chapter');
    section.append(element('summary', (ar ? chapter.title.ar : chapter.title.en) || chapter.id), pair('Chapter title', chapter.title), pair('Reflection', chapter.reflection, true));
    const actions = element('div', undefined, 'ed-actions');
    actions.append(button(say('Move up', 'لأعلى'), () => move(diary.chapters, chapter, -1)), button(say('Move down', 'لأسفل'), () => move(diary.chapters, chapter, 1)), button(say('Remove chapter', 'حذف الفصل'), () => {
      if (diary.chapters.length === 1) throw Error(say('Keep at least one chapter.', 'يجب إبقاء فصل واحد على الأقل.'));
      if (!confirm(say('Remove this chapter? Its photographs will move to the first remaining chapter.', 'حذف الفصل ونقل صوره إلى أول فصل متبقٍ؟'))) return;
      diary.chapters = diary.chapters.filter(c => c !== chapter);
      diary.photos.filter(p => p.chapter === chapter.id).forEach(p => p.chapter = diary.chapters[0].id); render();
    }));
    section.append(actions); body.append(section);
  }
  body.append(button(say('+ Add chapter', '+ إضافة فصل'), () => {
    if (diary.chapters.length >= 30) throw Error('The diary supports up to 30 chapters.');
    diary.chapters.push({ id: 'chapter-' + crypto.randomUUID(), title: { en: 'New chapter', ar: 'فصل جديد' }, reflection: { en: '', ar: '' } }); render();
  }), element('h3', say('Photographs in reading order', 'الصور بحسب ترتيب القراءة')));
  const list = element('div', undefined, 'diary-editor-photos');
  for (const photo of diary.photos) {
    const card = element('details', undefined, 'diary-editor-photo');
    const summary = element('summary'), img = new Image();
    img.alt = ar ? photo.alt.ar : photo.alt.en; img.loading = 'lazy';
    img.src = photo.src.startsWith('assets/') ? new URL(photo.src, new URL('./', import.meta.url)).href : previews.get(photo.src) || '';
    summary.append(img, element('span', photo.alt[ar ? 'ar' : 'en'])); card.append(summary);
    card.append(pair('Image description', photo.alt), pair('Caption / reflection', photo.caption, true));
    const label = element('label', say('Chapter', 'الفصل')), select = element('select');
    select.setAttribute('aria-label', say('Chapter for this photograph', 'فصل هذه الصورة'));
    for (const chapter of diary.chapters) { const option = element('option', chapter.title[ar ? 'ar' : 'en']); option.value = chapter.id; select.append(option); }
    select.value = photo.chapter; select.onchange = () => { photo.chapter = select.value; }; label.append(select); card.append(label);
    const actions = element('div', undefined, 'ed-actions');
    actions.append(button(photo.id === diary.opening ? say('Opening photograph ✓', 'صورة الافتتاح ✓') : say('Use as opening', 'استخدام للافتتاح'), () => { diary.opening = photo.id; render(); }),
      button(say('Earlier', 'قبل'), () => move(diary.photos, photo, -1)), button(say('Later', 'بعد'), () => move(diary.photos, photo, 1)), button(say('Remove photo', 'حذف الصورة'), () => {
        if (diary.photos.length === 1) throw Error('Keep at least one photograph.');
        if (!confirm(say('Remove this photograph from the diary?', 'هل تريدين حذف الصورة من اليوميات؟'))) return;
        diary.photos = diary.photos.filter(p => p !== photo);
        if (diary.opening === photo.id) diary.opening = diary.photos[0].id;
        pending.delete(photo.id); render();
      }));
    card.append(actions); list.append(card);
  }
  body.append(list); uploadForm();
}
async function preview(){
  await editor();validateDiary(diary);
  if(pending.size)throw Error(say('Save a private draft before previewing new photographs.', 'احفظي مسودة خاصة قبل معاينة الصور الجديدة.'));
  const tab=window.open('','_blank');
  if(!tab)throw Error(say('Allow a preview window for this site.', 'اسمحي بفتح نافذة المعاينة لهذا الموقع.'));
  tab.opener=null;
  try{
    const urls={},paths=storagePaths(diary);
    if(paths.length){
      const {data,error}=await cms.storage.from(BUCKET).createSignedUrls(paths,3600);
      if(error)throw error;
      for(const row of data||[])if(row.signedUrl)urls[row.path]=row.signedUrl;
    }
    const locale=ar?'ar':'en',base=new URL(ar?'ar/':'./',import.meta.url);
    const style=file=>escape(new URL(file,import.meta.url).href);
    tab.document.open();
    tab.document.write('<!doctype html><html lang="'+locale+'" dir="'+(ar?'rtl':'ltr')+'" data-theme="'+(document.documentElement.dataset.theme==='dark'?'dark':'light')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><base href="'+escape(base.href)+'"><title>'+say('Private diary preview','معاينة خاصة لليوميات')+'</title><link rel="stylesheet" href="'+style('approved-classic.css')+'"><link rel="stylesheet" href="'+style('days-with-amira.css')+'"></head><body><div id="canvas" dir="'+(ar?'rtl':'ltr')+'"><main class="diary"><p>'+say('Private preview · not published','معاينة خاصة · غير منشورة')+'</p>'+renderDiary(diary,locale,urls)+'</main></div></body></html>');
    tab.document.close();
  }catch(error){tab.close();throw error;}
}
async function restoreOriginal(){
  await editor();
  if(!confirm(say('Restore the built-in diary on the public site? Your private draft will be kept.', 'استعادة اليوميات الأصلية على الموقع مع الاحتفاظ بمسودتك الخاصة؟')))return;
  const {error}=await cms.from('cms_sections').update({enabled:false})
    .like('key','days_with_amira%').neq('key','days_with_amira_draft');
  if(error)throw error;
  const rows=await records();
  revision=rows.map(r=>r.key+':'+r.updated_at).sort().join('|');
  notice(say('Original public diary restored. Your private draft is kept.', 'استُعيدت اليوميات الأصلية مع الاحتفاظ بالمسودة الخاصة.'));
}
function uploadForm() {
  const area = element('section', undefined, 'diary-upload');
  area.append(element('h3', say('Add an original photograph', 'إضافة صورة أصلية')), element('p', say('Use JPG, PNG or WebP. Remove phone controls, borders and private information with the crop fields, then check the preview. No colour effects are applied.', 'استخدمي JPG أو PNG أو WebP. أزيلي واجهة الهاتف والحواف والمعلومات الخاصة بالقص، ثم راجعي المعاينة. لا تُطبّق أي تأثيرات لونية.'), 'ed-muted'));
  const input = element('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.setAttribute('aria-label', say('Original photograph', 'الصورة الأصلية'));
  input.onchange = async () => {
    try {
      const file = input.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 30 * 1024 * 1024) throw Error('Choose a JPG, PNG or WebP smaller than 30 MB.');
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 50000000) { bitmap.close(); throw Error('Photograph exceeds 50 megapixels.'); }
      upload?.bitmap.close(); upload = { bitmap, file, x: 0, y: 0, width: bitmap.width, height: bitmap.height };
      crop.replaceChildren();
      for (const key of ['x', 'y', 'width', 'height']) {
        const labels = { x: say('Crop from left (pixels)', 'القص من اليسار (بكسل)'), y: say('Crop from top (pixels)', 'القص من الأعلى (بكسل)'), width: say('Photo width (pixels)', 'عرض الصورة (بكسل)'), height: say('Photo height (pixels)', 'ارتفاع الصورة (بكسل)') };
        const box = field(labels[key], String(upload[key]), value => upload[key] = Number(value));
        const control = box.querySelector('input'); control.type = 'number'; control.step = '1'; control.min = key === 'x' || key === 'y' ? '0' : '1';
        crop.append(box);
      }
      const preview = new Image(); preview.src = URL.createObjectURL(file); preview.alt = say('Original photograph before cropping', 'الصورة الأصلية قبل القص'); preview.onload = () => URL.revokeObjectURL(preview.src); crop.append(preview);
      crop.append(button(say('Prepare cropped photo', 'تجهيز الصورة المقصوصة'), prepare));
    } catch (error) { notice(error.message, true); }
  };
  const crop = element('div', undefined, 'diary-crop'); area.append(input, crop); body.append(area);
}
async function prepare() {
  if (!upload) return;
  const { bitmap, x, y, width, height } = upload;
  if (![x, y, width, height].every(Number.isInteger) || x < 0 || y < 0 || width < 1 || height < 1 || x + width > bitmap.width || y + height > bitmap.height) throw Error('The crop must fit inside the original photograph.');
  if (diary.photos.length >= 200) throw Error('The diary supports up to 200 photographs.');
  const uuid = crypto.randomUUID(), blobs = [], variants = [];
  for (const target of [...new Set([480, 960, 1600].map(w => Math.min(w, width)))]) {
    const canvas = document.createElement('canvas'); canvas.width = target; canvas.height = Math.round(height * target / width);
    canvas.getContext('2d', { colorSpace: 'srgb' }).drawImage(bitmap, x, y, width, height, 0, 0, canvas.width, canvas.height);
    const encoded = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .88));
    if (!encoded || encoded.type !== 'image/webp') throw Error('This browser could not prepare WebP images.');
    const blob = new Blob([stripWebpMetadata(await encoded.arrayBuffer())], { type: 'image/webp' });
    // Path suffix is a stable size slot; descriptor records the actual width for small originals.
    const slot = target <= 480 ? 480 : target <= 960 ? 960 : 1600;
    const path = `sections/days-with-amira/${uuid}/${slot}.webp`;
    blobs.push({ path, blob }); variants.push({ path, width: target }); previews.set(path, URL.createObjectURL(blob));
  }
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await upload.file.arrayBuffer()))].map(v => v.toString(16).padStart(2, '0')).join('');
  if (diary.photos.some(p => p.sourceHash === hash)) throw Error('This original photograph is already in the diary.');
  const photo = { id: 'memory-' + uuid, chapter: diary.chapters[0].id, alt: { en: '', ar: '' }, caption: { en: '', ar: '' }, width, height, src: variants.at(-1).path, variants, sourceHash: hash };
  diary.photos.push(photo); pending.set(photo.id, blobs); bitmap.close(); upload = null; render();
  notice(say('Prepared without metadata. Add an image description in both languages before saving. Open the new photo to review the crop.', 'تم التجهيز دون بيانات وصفية. أضيفي وصف الصورة باللغتين قبل الحفظ، وافتحي الصورة الجديدة لمراجعة القص.'));
}
async function save(publish) {
  if (busy) return;
  await editor(); validateDiary(diary); busy = true;
  root.querySelectorAll('input,textarea,select,button').forEach(el => el.disabled = true);
  try {
    const current = await records();
    if (current.map(r => r.key + ':' + r.updated_at).sort().join('|') !== revision) throw Error(say('The saved diary changed in another window. Reload before saving.', 'تغيّرت اليوميات في نافذة أخرى. أعيدي تحميلها قبل الحفظ.'));
    notice(say('Preparing and saving photographs…', 'جارٍ حفظ الصور…'));
    for (const blobs of pending.values()) while (blobs.length) {
      const { path, blob } = blobs[0];
      const { error } = await cms.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false });
      if (error) throw error;
      // Successful uploads are retained on retry rather than uploading the same path twice.
      blobs.shift();
    }
    if ([...pending.values()].some(items => items.length)) throw Error('Photographs are not fully uploaded. Save again to finish.');
    const now = new Date().toISOString();
    const draft = { key: 'days_with_amira_draft', heading_en: '', heading_ar: '', body_en: JSON.stringify(diary), body_ar: '', image_path: null, button_label: null, button_href: null, enabled: false, updated_at: now };
    const rows = publish ? [...publicationRows(diary, previousAssets, now), draft] : [draft];
    const { data, error } = await cms.from('cms_sections').upsert(rows, { onConflict: 'key' }).select('key,updated_at');
    if (error || data?.length !== rows.length) throw error || Error('Save could not be verified.');
    revision = (await records()).map(r => r.key + ':' + r.updated_at).sort().join('|');
    if (publish) previousAssets = storagePaths(diary);
    pending.clear();
    notice(publish ? say('Published. Both languages now use this diary.', 'تم النشر. تستخدم اللغتان هذه اليوميات الآن.') : say('Private draft saved. The public diary is unchanged.', 'حُفظت المسودة الخاصة. لم تتغيّر اليوميات المنشورة.'));
  } catch (error) { notice(error.message, true); }
  finally { busy = false; root.querySelectorAll('input,textarea,select,button').forEach(el => el.disabled = false); }
}
root?.addEventListener('toggle', () => {
  if (root.open && !diary) void load().catch(error => { body.textContent = error.message; });
});
