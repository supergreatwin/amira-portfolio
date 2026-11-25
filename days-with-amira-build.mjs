import { readFile, writeFile } from 'node:fs/promises';
import { validateDiary, renderDiary, escape } from './days-with-amira-model.mjs';
const root = new URL('./', import.meta.url);
const diary = validateDiary(JSON.parse(await readFile(new URL('assets/days-with-amira/diary.json', root), 'utf8')));
for (const locale of ['en', 'ar']) {
  const ar = locale === 'ar', prefix = ar ? '../' : '', path = (ar ? 'ar/' : '') + 'days-with-amira.html';
  const title = ar ? 'أيام مع أميرة' : 'Days with Amira';
  const description = ar ? 'يوميات بصرية تجمع الأشخاص والأماكن واللحظات الصغيرة التي تحيط بالعمل.' : 'A visual diary of the people, places and small moments around the work.';
  const html = `<!doctype html>
<html lang="${locale}" dir="${ar ? 'rtl' : 'ltr'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f8f4ec">
<title>${title} | Amira Abdelfadil</title><meta name="description" content="${escape(description)}">
<link rel="canonical" href="https://amiraabdelfadil.com/${ar ? 'ar/' : ''}days-with-amira">
<link rel="alternate" hreflang="en" href="https://amiraabdelfadil.com/days-with-amira"><link rel="alternate" hreflang="ar" href="https://amiraabdelfadil.com/ar/days-with-amira">
<script src="${prefix}theme-init.js"></script><link rel="stylesheet" href="${prefix}theme.css">
<link rel="stylesheet" href="${prefix}days-with-amira.css"><script type="module" src="${prefix}days-with-amira.js"></script>
</head><body class="visual-diary-page" data-visual-diary>
<a href="#main" class="diary-skip">${ar ? 'انتقل للمحتوى' : 'Skip to content'}</a>
<header class="site-header"><a href="index.html">${ar ? 'أميرة عبد الفضيل' : 'amira abdelfadil'}</a></header>
<main id="main" class="diary" data-diary>${renderDiary(diary, locale)}</main>
<footer class="site-footer"><a href="index.html">${ar ? 'الرئيسية' : 'Home'}</a></footer>
</body></html>\n`;
  await writeFile(new URL(path, root), html);
}
