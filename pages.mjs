import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './content.mjs';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import './days-with-amira-build.mjs';
import { applySocialPreview } from './social-preview.mjs';

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
const approvedShell = JSON.parse(await readFile(join(root, 'approved-shell.json'), 'utf8'));
const assetRevisions = Object.fromEntries(await Promise.all(['privacy-controls.js','approved-classic.css','handover.css','approved-classic.js','cms-display.js','field-notes-native.js','theme-init.js','education-announcement.css','education-announcement.js','days-with-amira.css','days-with-amira.js','days-with-amira-editor.js','days-with-amira-editor.css'].map(async file=>[file,createHash('sha256').update(await readFile(join(root,file))).digest('hex').slice(0,12)])));

// Common header for inner pages; preserve deliberately authored photographic home headers.
// The private educational pages keep their existing Supabase authorization.
function sharedHeader(source, directory, filename) {
  const arabic = directory === 'ar' || /<html[^>]*lang=["']ar/i.test(source);
  const prefix = directory && !arabic ? '../' : '';
  const primary = arabic
    ? [['الأفلام','../films.html'],['الفن والتصوير','art.html'],['الكتابات','writing.html']]
    : [['Films','films.html'],['Art & Photography','art.html'],['Writing','writing.html']];
  const extra = arabic
    ? [['الرئيسية','index.html'],['دفتر الملاحظات','notes.html'],['التعاونات','collaborations.html'],['التوصيات','endorsements.html'],['العروض والمعارض','screenings.html'],['الجوائز','awards.html'],['خارج الإطار','beyond-the-frame.html'],['أيام مع أميرة','days-with-amira.html'],['عن أميرة','../about.html'],['التواصل','contact.html']]
    : [['Home','index.html'],['Notebook','notes.html'],['Collaborations','collaborations.html'],['Endorsements','endorsements.html'],['Screenings & Exhibitions','screenings.html'],['Awards','awards.html'],['Beyond the Frame','beyond-the-frame.html'],['أيام مع أميرة','days-with-amira.html'],['About','about.html'],['Contact','contact.html']];
  const link = ([text,url], mobileOnly) => '<a'+(mobileOnly?' class="menu-mobile-only"':'')+' href="'+(arabic?url:prefix+url)+'">'+text.replaceAll('&','&amp;')+'</a>';
  const direct = primary.map(item=>link(item,false)).join('');
  const dropdown = primary.map(item=>link(item,true)).join('') + extra.map(item=>link(item,false)).join('');
  const mark = '<span class="amira-menu-bars" aria-hidden="true"><span></span><span></span><span></span></span>';
  const brand = arabic ? 'أميرة عبد الفضيل' : 'amira abdelfadil';
  const alternate = arabic ? '../' : (directory ? '../ar/' : 'ar/');
  return '<header class="site-header topbar amira-unified-header"><div class="site-header__frame nav-inner">'+
    '<a class="site-header__brand brand" href="'+(arabic?'index.html':prefix+'index.html')+'">'+brand+'</a>'+
    '<div class="site-header__center nav-panel"><div><nav aria-label="Primary navigation">'+direct+'</nav></div></div>'+
    '<div class="site-header__utilities nav-actions"><nav class="site-header__shortcuts nav-shortcuts" aria-label="Language">'+
    '<a href="'+alternate+'" lang="'+(arabic?'en':'ar')+'">'+(arabic?'English':'العربية')+'</a></nav>'+
    '<button class="menu-toggle legacy-menu-adapter" type="button" aria-controls="navigation-panel" aria-expanded="false" aria-label="Legacy navigation adapter" hidden></button>'+ 
    '<details class="mobile-menu amira-more-menu"><summary aria-label="'+(arabic?'فتح قائمة الصفحات':'Open more pages')+'">'+mark+'</summary>'+
    '<nav aria-label="More pages">'+dropdown+'</nav></details></div></div></header>';
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
// The Process is deliberately deployed as a staff-only Supabase-authenticated application.
await cp(join(root, 'the-process'), join(dist, 'the-process'), { recursive: true });

for (const directory of ['', 'ar', 'the-process']) {
  const files = await readdir(join(root, directory));
  for (const file of files.filter(name => /\.(?:html|css|js)$/.test(name) || ['homepage-photo-guard.mjs', 'days-with-amira-model.mjs', 'robots.txt', 'sitemap.xml'].includes(name))) {
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
    if (isDocument && directory !== 'the-process' && !(directory === '' && ['index.html','classic.html'].includes(file)) && !photographicHome && !classicArabicHome &&
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
        'privacy-controls.js?v=' + assetRevisions['privacy-controls.js'] + '" data-measurement-id="' + analyticsId + '"></script>\n';
      html = html.replace(/<\/head>/i, legalStyles + controls + '</head>');
    }
    // Preserve all original photographs and photography gallery pages.
    if (isDocument && directory !== 'the-process') {
      const prefix = directory === 'ar' ? '../' : '';
      if (!html.includes('site-refinement.css'))
        html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="' + prefix + 'site-refinement.css?v=20261123production"></head>');
      if (!html.includes('site-refinement.js'))
        html = html.replace(/<\/body>/i, '<script defer src="' + prefix + 'site-refinement.js?v=20261123production"></script></body>');
    }
    // Use the exact approved shell on every public page. Original gallery content,
    // signed-media integrations and authenticated editorial applications are retained.
    if (isDocument && directory !== 'the-process' && /<main\b/i.test(html)) {
      const ar = directory === 'ar';
      const approved = html.includes('data-approved-classic');
      const key = (ar ? 'ar/' : '') + file;
      let newHeader = (approvedShell.headers[key] || approvedShell.headers[(ar?'ar/':'')+'art.html'])
        .replace(/<a\b[^>]*href="index\.html"[^>]*>(?:Home|الرئيسية)<\/a>/g,'');
      newHeader=newHeader.replace(/(<a\b[^>]*href="days-with-amira\.html"[^>]*>)[^<]*(<\/a>)/g,'$1'+(ar?'أيام مع أميرة':'Days with Amira')+'$2');
      const parentSection = /^film(?:-|\.html)/.test(file) ? 'films.html'
        : ['italy.html','alexandria.html','west-el-balad.html','zamalek.html','between-stone-and-sea.html','collection.html'].includes(file) ? 'art.html'
        : file === 'journal.html' ? 'writing.html'
        : ['collaborate.html','pitch.html'].includes(file) ? 'notes.html' : null;
      if (parentSection) {
        newHeader = newHeader.replace(/ aria-current="(?:page|location)"/g,'')
          .replace(/<a\b[^>]*>/g,tag=>tag.includes('href="'+parentSection+'"')?tag.replace('<a ','<a aria-current="location" '):tag);
      }
      if (existsSync(join(root,ar?'':'ar',file))) {
        const alternate = (ar?'../':'ar/')+file;
        newHeader = newHeader.replace(/<a\b[^>]*class="header-aux"[^>]*>/,tag=>tag.replace(/href="[^"]*"/,'href="'+alternate+'"'));
      }
      // Generate real inline navigation icons in the HTML (no emoji glyph or runtime dependency).
      const menuArrow='<svg class="amira-menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(ar?'M17 17 7 7m10 0H7v10':'M7 17 17 7M7 7h10v10')+'"/></svg>';
      newHeader=newHeader.replace(/<nav\b[^>]*id="siteMenu"[^>]*>[\s\S]*?<\/nav>/i,menu=>menu.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi,link=>link.replace(/<\/a>$/i,menuArrow+'</a>')));
      html = html.replace(/<header\b[\s\S]*?<\/header>/i,newHeader);
      html = html.replace(/<div class="nav-foot">([\s\S]*?)<span>(©[^<]*)<\/span>/g,'<div class="nav-foot">$1<span dir="ltr">$2</span>');
      if(file==='index.html'){
        html=html.replace(/(<button\b[^>]*id="filmDialogNext")/,'<span id="filmDialogPosition" dir="ltr" role="status" aria-live="polite" aria-atomic="true"></span><button type="button" class="film-next" id="filmDialogPrevious">'+(ar?'→ السابق':'← Previous')+'</button>$1');
        if(ar)html=html.replace(/aria-label="Explore ([^"]+) film details"/g,'aria-label="تفاصيل فيلم $1"')
          .replaceAll('aria-label="Close film details"','aria-label="إغلاق تفاصيل الفيلم"');
        // Let the visible title and metadata name each film button. A shorter
        // aria-label omits the visible duration and breaks voice-control matching.
        html=html.replace(/<button\b[^>]*data-film="[^"]+"[^>]*>/g,tag=>tag.replace(/\saria-label="[^"]*"/,''));
      }
      if(ar)html=html.replaceAll('aria-label="Featured sections"','aria-label="الأقسام الرئيسية"')
        .replaceAll('aria-label="Site navigation"','aria-label="التنقل في الموقع"');
      html = html.replace(/<footer\b[\s\S]*?<\/footer>/i,approvedShell.footers[ar?'ar':'en']);
      // The persistent header provides the section navigation and the home link.
      html = html.replace(/<a\b[^>]*class="[^"]*\b(?:film-page-back|back-link|studio-back)\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi,'');
      // Old scripts owned a competing header, theme or design mode.
      html = html.replace(/<script\b[^>]*src=["'][^"']*(?:\/|^)(?:home|site|theme|site-refinement|site-design-router|education-announcement)\.js[^"']*["'][^>]*><\/script>/gi,'');
      html = html.replace(/<script\b[^>]*src=["'](?:\.\.\/)?(?:home|site|theme|site-refinement|site-design-router|education-announcement)\.js[^"']*["'][^>]*><\/script>/gi,'');
      html = html.replace(/<link\b[^>]*href=["'][^"']*(?:site-header|site-refinement|education-announcement)\.css[^"']*["'][^>]*>/gi,'');
      if (!approved) {
        html = html.replace(/<body([^>]*)>/i,'<body$1><div id="canvas" dir="'+(ar?'rtl':'ltr')+'">');
        html = html.replace(/<\/body>/i,'</div></body>');
        if (!html.includes('data-visual-diary')) html = html.replace(/<\/body>/i,'<dialog id="filmImageViewer" aria-label="Original image viewer"><div class="viewer-bar"><strong>Original photograph</strong><button type="button" data-viewer-close aria-label="Close photograph">Close ×</button></div><img id="filmViewerPhoto" alt=""><p id="filmViewerCaption"></p></dialog></body>');
      }
      if (approved) html=html.replace(/<link\b[^>]*href=["'][^"']*theme\.css[^"']*["'][^>]*>/gi,'');
      if (!html.includes('rel="icon"')) html=html.replace(/<\/head>/i,'<link rel="icon" href="'+prefix+'assets/portrait-title.webp" type="image/webp"></head>');
      // Last stylesheet is authoritative; content hashes invalidate stale edge caches.
      html = html.replace(/<link\b[^>]*href=["'][^"']*approved-classic\.css[^"']*["'][^>]*>/gi,'');
      html = html.replace(/<\/head>/i,'<link rel="stylesheet" href="'+prefix+'approved-classic.css?v='+assetRevisions['approved-classic.css']+'"><link rel="stylesheet" href="'+prefix+'handover.css?v='+assetRevisions['handover.css']+'"></head>');
      if (!html.includes('approved-classic.js')) html=html.replace(/<\/body>/i,'<script defer src="'+prefix+'approved-classic.js"></script></body>');
      // The original Notebook announcement is a homepage component, not a competing design shell.
      if (file === 'index.html' && html.includes('data-education-announcement')) {
        html = html.replace(/<\/head>/i,'<link rel="stylesheet" href="'+prefix+'education-announcement.css?v='+assetRevisions['education-announcement.css']+'"><script defer src="'+prefix+'education-announcement.js?v='+assetRevisions['education-announcement.js']+'"></script></head>');
        if (html.includes('data-field-notes-form')) html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="'+prefix+'field-notes-native.css?v=1"><script defer src="'+prefix+'field-notes-native.js?v='+assetRevisions['field-notes-native.js']+'"></script></head>');
      }
      html=html.replace(/field-notes-native\.js(?:\?v=[a-zA-Z0-9]+)?"/g,'field-notes-native.js?v='+assetRevisions['field-notes-native.js']+'"');
      for (const [asset,hash] of Object.entries(assetRevisions)) html=html.replaceAll(asset+'"',asset+'?v='+hash+'"');
    }
    if (isDocument && (directory === '' || directory === 'ar')) html = applySocialPreview(html, file, directory === 'ar');
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
  "  Content-Security-Policy: frame-ancestors 'self'; object-src 'none'; base-uri 'self'\\n" +
  'https://amiraabdelfadil.com/*\\n  Strict-Transport-Security: max-age=86400\\n' +
  'https://amira-portfolio-ds4.pages.dev/*\\n  X-Robots-Tag: noindex\\n').replaceAll('\\n', '\n'));
// Exclude private learning routes from indexing and shared caches.
await writeFile(join(dist, '_headers'),
  (await readFile(join(dist, '_headers'), 'utf8')) +
  '/the-process/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  '/portfolio-studio*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  '/education-studio*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  '/content-studio*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  '/editorial*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  '/ar/editorial*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n' +
  'https://amiraabdelfadil.pages.dev/*\n  X-Robots-Tag: noindex\n' +
  '/editorial.js\n  Cache-Control: no-store\n' +
  '/cms-core.js\n  Cache-Control: no-store\n' +
  '/days-with-amira-model.mjs\n  Cache-Control: no-cache\n');

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
