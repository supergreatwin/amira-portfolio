export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const asset = /^(?:assets\/days-with-amira\/[a-z0-9-]+\.(?:jpg|webp)|sections\/days-with-amira\/[a-f0-9-]{36}\/(?:480|960|1600)\.webp)$/;
const text = (value, max = 1800) => typeof value === 'string' && value.length <= max;
const bilingual = (value, max) => value && text(value.en, max) && text(value.ar, max);
const id = value => typeof value === 'string' && /^[a-z0-9-]{1,70}$/.test(value);
export function validateDiary(input) {
  if (!input || input.version !== 1 || !['title', 'kicker', 'lead', 'intro'].every(key => bilingual(input[key])) ||
      !Array.isArray(input.chapters) || input.chapters.length < 1 || input.chapters.length > 30 ||
      !Array.isArray(input.photos) || input.photos.length < 1 || input.photos.length > 200) throw Error('Invalid diary');
  const chapters = new Set(), photos = new Set();
  for (const chapter of input.chapters) {
    if (!id(chapter.id) || chapters.has(chapter.id) || !bilingual(chapter.title, 160) || !bilingual(chapter.reflection, 1800)) throw Error('Invalid chapter');
    chapters.add(chapter.id);
  }
  for (const photo of input.photos) {
    if (!id(photo.id) || photos.has(photo.id) || !chapters.has(photo.chapter) || !bilingual(photo.alt, 600) ||
        !photo.alt.en.trim() || !photo.alt.ar.trim() || !bilingual(photo.caption, 1800) ||
        !Number.isInteger(photo.width) || !Number.isInteger(photo.height) || photo.width < 1 || photo.height < 1 ||
        photo.width > 20000 || photo.height > 20000 || !asset.test(photo.src) ||
        !Array.isArray(photo.variants) || photo.variants.length < 1 || photo.variants.length > 3) throw Error('Invalid photograph');
    let last = 0;
    for (const variant of photo.variants) {
      if (!asset.test(variant.path) || !variant.path.endsWith('.webp') || !Number.isInteger(variant.width) || variant.width <= last || variant.width > 1600 || variant.width > photo.width) throw Error('Invalid responsive photograph');
      last = variant.width;
    }
    photos.add(photo.id);
  }
  if (!photos.has(input.opening)) throw Error('Choose an opening photograph');
  return structuredClone(input);
}
export function storagePaths(diary) {
  return [...new Set(diary.photos.flatMap(photo => [photo.src, ...photo.variants.map(v => v.path)]).filter(path => path.startsWith('sections/')))];
}
export function assetKey(path) {
  const match = /^sections\/days-with-amira\/([a-f0-9-]{36})\/(480|960|1600)\.webp$/.exec(path);
  if (!match) throw Error('Invalid stored photograph');
  return 'days_with_amira_asset_' + match[1] + '_' + match[2];
}
// Canvas WebP encoders can attach an sRGB ICC chunk. Keep encoded pixels intact
// while removing all metadata chunks and their VP8X presence flags.
export function stripWebpMetadata(buffer) {
  const bytes = new Uint8Array(buffer), read = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const name = offset => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (bytes.length < 12 || name(0) !== 'RIFF' || name(8) !== 'WEBP' || read.getUint32(4, true) + 8 !== bytes.length) throw Error('Invalid WebP');
  const chunks = []; let length = 12;
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) throw Error('Invalid WebP chunk');
    const size = read.getUint32(offset + 4, true), end = offset + 8 + size + (size % 2), type = name(offset);
    if (end > bytes.length) throw Error('Invalid WebP chunk');
    if (!['ICCP', 'EXIF', 'XMP '].includes(type)) {
      const chunk = bytes.slice(offset, end);
      if (type === 'VP8X') chunk[8] &= ~0x2c;
      chunks.push(chunk); length += chunk.length;
    }
    offset = end;
  }
  const result = new Uint8Array(length); result.set(bytes.slice(0, 12));
  new DataView(result.buffer).setUint32(4, length - 8, true);
  let offset = 12; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
export function publicationRows(diary, previousAssets = [], now = new Date().toISOString()) {
  validateDiary(diary);
  const active = new Set(storagePaths(diary));
  const all = new Set([...active, ...previousAssets]);
  return [
    { key: 'days_with_amira', heading_en: 'Days with Amira', heading_ar: 'أيام مع أميرة', body_en: JSON.stringify(diary), enabled: true, updated_at: now },
    ...[...all].map(path => ({ key: assetKey(path), image_path: path, enabled: active.has(path), updated_at: now }))
  ].map(row => ({ heading_en: '', heading_ar: '', body_en: '', body_ar: '', image_path: null, button_label: null, button_href: null, ...row }));
}
export function renderDiary(diary, locale = 'en', signed = {}) {
  validateDiary(diary);
  const ar = locale === 'ar', prefix = ar ? '../' : '', t = value => escape(value[locale]);
  const url = path => {
    if (path.startsWith('assets/')) return prefix + path;
    const resolved = signed[path];
    if (!resolved || new URL(resolved).origin !== 'https://tfarhghukyogaowjqykn.supabase.co') throw Error('Missing photograph URL');
    return resolved;
  };
  const picture = (photo, opening = false, index = 0) => {
    const sizes = opening ? '(max-width: 700px) 88vw, 42vw' : '(max-width: 700px) 88vw, (max-width: 1100px) 55vw, 50vw';
    return `<figure class="diary-photo${opening ? ' diary-opening' : ''}"${opening ? '' : ` data-placement="${index % 4}"`}><picture><source type="image/webp" srcset="${photo.variants.map(v => escape(url(v.path)) + ' ' + v.width + 'w').join(', ')}" sizes="${sizes}"><img src="${escape(url(photo.src))}" width="${photo.width}" height="${photo.height}" alt="${t(photo.alt)}" ${opening ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>${photo.caption[locale] ? '<figcaption>' + t(photo.caption) + '</figcaption>' : ''}</figure>`;
  };
  const opening = diary.photos.find(photo => photo.id === diary.opening);
  return `<section class="diary-intro" aria-labelledby="diary-title"><div class="diary-intro-copy"><p class="diary-kicker">${t(diary.kicker)}</p><h1 id="diary-title">${t(diary.title)}</h1><p class="diary-lead">${t(diary.lead)}</p><p class="diary-intro-text">${t(diary.intro)}</p><a class="diary-begin" href="#diary-${diary.chapters[0].id}">${ar ? 'بين صفحات اليوميات' : 'A few pages from the diary'} <span aria-hidden="true">↓</span></a></div>${picture(opening, true)}</section>` +
    diary.chapters.map((chapter, index) => `<section class="diary-chapter" id="diary-${chapter.id}" aria-labelledby="diary-title-${chapter.id}"><div class="diary-chapter-head"><p class="diary-kicker"><span>${String(index + 1).padStart(2, '0')}</span> — ${ar ? 'فصل' : 'Chapter'}</p><h2 id="diary-title-${chapter.id}">${t(chapter.title)}</h2><p class="diary-reflection">${t(chapter.reflection)}</p></div><div class="diary-sequence">${diary.photos.filter(photo => photo.chapter === chapter.id && photo.id !== diary.opening).map((photo, i) => picture(photo, false, i)).join('')}</div></section>`).join('');
}
