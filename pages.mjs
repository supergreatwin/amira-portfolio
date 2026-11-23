import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './content.mjs';

const root = fileURLToPath(new URL('./', import.meta.url));
const dist = join(root, 'dist');
const production = new URL(process.env.PORTFOLIO_SITE_URL);
if (production.protocol !== 'https:' || production.href !== `${production.origin}/`) {
  throw new Error('PORTFOLIO_SITE_URL must be an HTTPS site origin with no path');
}

const isPrimary = production.href === site.url;
// Custom domains and Pages origins can share the same Cloudflare deployment.
const searchCanonical = 'https://amiraabdelfadil.com/';
const measurementId = 'G-B9BKV0JKJ8';
const verificationFile = /^google[a-z0-9]+\.html$/i;

// Common header for inner pages; preserve deliberately authored photographic home headers.
// The private educational pages keep their existing Supabase authorization.
function sharedHeader(source, directory, filename) {
  const prefix = directory ? '../' : '';
  const arabic = directory === 'ar' || /<html[^>]*lang=["']ar/i.test(source);
  const photoHome = !directory && filename === 'index.html' && source.includes('photo-mosaic');
  const href = path => arabic ? path : prefix + path;
  const safeActive = name => name === 'films' ? (/(^film-|^films)/.test(filename) || source.includes('data-cms-film'))
    : name === 'photography' ? /^(art|italy|alexandria|west-el-balad|zamalek|between-stone-and-sea|collection)/.test(filename)
    : name === 'writing' ? /^(writing|journal|notes)/.test(filename)
    : name === 'about' ? filename === 'about.html' : false;
  const navItems = arabic
    ? [['films','الأفلام','index.html#work'],['photography','الفن والتصوير','art.html'],['writing','كتابات','../writing.html'],['about','نبذة','../about.html']]
    : [['films','Films','films.html'],['photography','Art & Photography','art.html'],['writing','Writing','writing.html'],['about','About','about.html']];
  const mainNav = navItems.map(([key,label,path]) =>
    '<a href="'+href(path)+'"'+(safeActive(key)?' aria-current="page"':'')+'>'+label.replaceAll('&','&amp;')+'</a>').join('');
  const alternate = arabic ? '../index.html' : (directory === 'the-process' ? '../ar/' : 'ar/');
  const languageLabel = arabic ? 'English' : 'العربية';
  const mobileNav = mainNav +
    '<a href="'+href('notes.html')+'">'+(arabic?'رسائل أميرة':'Field Notes')+'</a>'+
    '<a href="'+alternate+'">'+languageLabel+'</a>';
  const brand = href('index.html');
  return '<header class="site-header topbar home-topbar'+(photoHome?' site-header--home':'')+'">'+
    '<div class="site-header__frame nav-inner">'+
    '<a class="site-header__brand brand" href="'+brand+'" aria-label="Amira Abdelfadil — home">amira abdelfadil</a>'+
    '<div class="site-header__center nav-panel" id="navigation-panel"><div><nav aria-label="Main navigation">'+mainNav+'</nav></div></div>'+
    '<div class="site-header__utilities nav-actions">'+
    '<nav class="site-header__shortcuts nav-shortcuts" aria-label="Resources and language">'+
    '<a href="'+href('notes.html')+'">'+(arabic?'رسائل أميرة':'Field Notes')+'</a><a href="'+alternate+'" lang="'+(arabic?'en':'ar')+'">'+languageLabel+'</a></nav>'+
    '<button type="button" class="menu-toggle" aria-controls="navigation-panel" aria-expanded="false" aria-label="Legacy menu" hidden></button>'+
    '<details class="mobile-menu"><summary>Menu</summary><nav aria-label="Mobile navigation">'+mobileNav+'</nav></details>'+
    '</div></div></header>';
}


await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
// The Process is deliberately deployed as a staff-only Supabase-authenticated application.
await cp(join(root, 'the-process'), join(dist, 'the-process'), { recursive: true });

for (const directory of ['', 'ar', 'the-process']) {
  const files = await readdir(join(root, directory));
  for (const file of files.filter(name => /\.(?:html|css|js)$/.test(name) || ['homepage-photo-guard.mjs', 'robots.txt', 'sitemap.xml'].includes(name))) {
    const path = join(directory, file);
    const source = await readFile(join(root, path), 'utf8');
    const output = join(dist, path);
    await mkdir(dirname(output), { recursive: true });
    const isDocument = file.endsWith('.html') && !verificationFile.test(file);
    // Ensure every public and editorial page shares the same persistent theme.
    // Only insert resources absent from the original page.
    const prefix = directory ? '../' : '';
    let themedSource = source;
    if (isDocument) themedSource = themedSource
      .replace(/theme\.css\?v=[a-zA-Z0-9]+/g, 'theme.css?v=20261120dark')
      .replace(/theme\.js\?v=[a-zA-Z0-9]+/g, 'theme.js?v=20261120site');
    if (isDocument) {
      if (!themedSource.includes('theme-init.js'))
        themedSource = themedSource.replace(/<head>/i, '<head>\n<script src="' + prefix + 'theme-init.js"></script>');
      const themeResources = [
        !themedSource.includes('theme.css') ? '<link rel="stylesheet" href="' + prefix + 'theme.css?v=20261120dark">' : '',
        !themedSource.includes('theme.js') ? '<script src="' + prefix + 'theme.js?v=20261120site" defer></script>' : ''
      ].filter(Boolean).join('\n');
      if (themeResources) themedSource = themedSource.replace(/<\/head>/i, themeResources + '\n</head>');
    }
    // Preserve the single authored photographic header on all four current homepages.
    // Replacing it with the generic sharedHeader caused opaque/unequal EN/AR headers
    // and overrode the viewport-specific home-header-unified.css rules.
    const photographicHome = isDocument && ['', 'ar'].includes(directory) &&
      ['index.html', 'responsive.html', 'current.html'].includes(file) &&
      themedSource.includes('class="photo-mosaic"');
    // The old Arabic landing page is the classic Arabic design: preserve it too.
    const classicArabicHome = isDocument && directory === 'ar' && file === 'index.html' &&
      !photographicHome;
    // No host-agnostic redirects: they would also affect custom-domain aliases.
    if (isDocument && directory !== 'the-process' && file !== 'classic.html' && !photographicHome && !classicArabicHome &&
        /<header\b[\s\S]*?<\/header>/i.test(themedSource)) {
      themedSource = themedSource.replace(/<header\b[\s\S]*?<\/header>/i, sharedHeader(themedSource, directory, file));
      // The shared CSS loads after existing theme and layout rules.
      themedSource = themedSource.replace(/<\/head>/i,
        '<link rel="stylesheet" href="' + prefix + 'site-header.css?v=20261121unified" />\n</head>');
    }
    // Legal notices and cookie settings are available on every page and in both languages.
    // GA4 is only initialized on the canonical production domain after opt-in.
    let html = themedSource;
    if (isDocument) {
      // Tally iframe elements are lazy and rendered after user action.
      // Remove eagerly loaded third-party widget code to prevent pre-interaction requests.
      html = html.replace(/<script\s+async\s+src=["']https:\/\/tally\.so\/widgets\/embed\.js["']><\/script>/gi, '');
    }
    if (isDocument) {
      const isArabic = directory === 'ar' || /<html[^>]*lang=["']ar/i.test(themedSource);
      const labels = isArabic
        ? [['privacy','الخصوصية'],['terms','الشروط'],['cookies','ملفات الارتباط']]
        : [['privacy','Privacy'],['terms','Terms'],['cookies','Cookies']];
      const legalPath = name => directory === 'ar' ? name + '.html' : prefix + name + '.html';
      const legalLinks = '<nav class="legal-links" aria-label="' +
        (isArabic ? 'المعلومات القانونية' : 'Legal information') + '">' +
        labels.map(([slug,label]) => '<a href="' + legalPath(slug) + '">' + label + '</a>').join('') +
        '<button type="button" class="legal-privacy-settings" data-privacy-settings>' +
        (isArabic ? 'إعدادات الخصوصية' : 'Privacy settings') + '</button></nav>';
      html = /<\/footer>/i.test(html)
        ? html.replace(/<\/footer>/i, legalLinks + '</footer>')
        : html.replace(/<\/body>/i, legalLinks + '</body>');
      const legalStyles = html.includes('legal.css') ? '' :
        '<link rel="stylesheet" href="' + prefix + 'legal.css?v=20261122" />\n';
      // Restrict tag activation by runtime hostname; Cloudflare's pages.dev build also serves the custom domain.
      const analyticsId = measurementId;
      const controls = '<script defer src="' + prefix +
        'privacy-controls.js?v=20261122" data-measurement-id="' + analyticsId + '"></script>\n';
      html = html.replace(/<\/head>/i, legalStyles + controls + '</head>');
    }
    // Apply the branded canonical domain to public HTML and discovery files.
    const seoOutput = isDocument || ['robots.txt', 'sitemap.xml'].includes(file)
      ? html.replaceAll(site.url, searchCanonical)
      : html;
    await writeFile(output, seoOutput);
  }
}

// Keep the Cloudflare Pages preview origin crawlable only on the official
// custom domain. Cloudflare host-specific headers leave the custom domain alone.
await writeFile(join(dist, '_headers'),
  ('/*\\n' +
  '  X-Content-Type-Options: nosniff\\n' +
  '  Referrer-Policy: strict-origin-when-cross-origin\\n' +
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()\\n' +
  '  X-Frame-Options: SAMEORIGIN\\n' +
  "  Content-Security-Policy: frame-ancestors 'self'\\n" +
  'https://amira-portfolio-ds4.pages.dev/*\\n  X-Robots-Tag: noindex\\n').replaceAll('\\n', '\n'));
// Exclude private learning routes from indexing and shared caches.
await writeFile(join(dist, '_headers'),
  (await readFile(join(dist, '_headers'), 'utf8')) +
  '/the-process/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  '/education-studio.html\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n');

await writeFile(join(dist, '404.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found | Amira Abdelfadil</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="shell section inner-page">
  <h1>Page not found</h1>
  <p><a href="/">Back to Amira’s portfolio</a></p>
  <p lang="ar" dir="rtl"><a href="/ar/">العودة إلى أعمال أميرة</a></p>
</main>
</body>
</html>
`);
