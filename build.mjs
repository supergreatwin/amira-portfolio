import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collaborations, films, locales, site } from './content.mjs';
import { collaborationItems, featuredEssays, filmCrew, homepageCrew, homepageTrailers, trailerPlayer, writingIntro, writingSection } from './sections.mjs';

const root = fileURLToPath(new URL('./', import.meta.url));
const versioned = file => `${file}?v=${createHash('sha256').update(readFileSync(join(root, file))).digest('hex').slice(0, 12)}`;
const stylesheet = versioned('style.css');
const script = versioned('site.js');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const outbound = 'target="_blank" rel="noopener noreferrer"';
const external = (url, label, className = 'line-link') => `<a class="${className}" href="${escape(url)}" ${outbound}>${escape(label)} ${icon('arrow-external')}</a>`;
const filmPath = film => `film-${film.id}.html`;
const poster = film => [`${film.id}-poster.jpg`, film.posterWidth, 900, `${film.title} poster`];
const runtime = seconds => [Math.floor(seconds / 60), seconds % 60].map(part => String(part).padStart(2, '0')).join(':');
const meta = film => [film.genre, film.year, film.seconds && runtime(film.seconds)].filter(Boolean).join(' · ');
const sectionTag = (number, label) => `<p class="section-tag"><span aria-hidden="true">${number}</span>${label}</p>`;
const intro = '<p>Amira’s documentaries pay attention to familiar places and the routines that give them meaning. In <i>Mamina</i>, a grandmother’s kitchen holds the memory of a relationship. <i>Biophilia</i> looks outward, at how nature persists amid city life.</p>';

const symbols = `<svg class="symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <symbol id="arrow-external" viewBox="0 0 24 24"><path d="M6 18 18 6M7 6h11v11"/></symbol>
  <symbol id="arrow-up-right" viewBox="0 0 24 24"><path d="M6 18 18 6M7 6h11v11"/></symbol>
  <symbol id="arrow-right" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></symbol>
  <symbol id="arrow-left" viewBox="0 0 24 24"><path d="M20 12H5m6-6-6 6 6 6"/></symbol>
  <symbol id="close-icon" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
  <symbol id="expand-icon" viewBox="0 0 24 24"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></symbol>
  <symbol id="instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="icon-fill" cx="17.4" cy="6.7" r="1"/></symbol>
  <symbol id="linkedin" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7m4 0v-7m0 3a2.5 2.5 0 0 1 5 0v4"/><circle class="icon-fill" cx="8" cy="7" r=".9"/></symbol>
</svg>`;

function socialProfiles(arabic) {
  const labels = { instagram: 'يوميات بصرية', linkedin: 'تواصل مهني' };
  return `<ul class="social-profiles" aria-label="${arabic ? 'الحسابات الرسمية' : 'Official social profiles'}">${site.socials.map(profile => `<li><a href="${escape(profile.url)}" ${outbound}>${icon(profile.id)}<span><strong>${profile.name}</strong><span>${escape(profile.profile)}</span><small>${arabic ? labels[profile.id] : profile.label}</small></span>${icon('arrow-external')}</a></li>`).join('')}</ul>`;
}

function navigationLinks(page, placement = 'footer', arabic = false) {
  const locale = arabic ? locales.ar : locales.en;
  const standaloneLinks = placement === 'contact'
    ? locale.navigation.filter(([, url]) => url === 'contact.html')
    : locale.navigation.filter(([, url]) => url !== '#top' && url !== 'contact.html');
  const links = placement === 'footer' ? locale.navigation : standaloneLinks;
  return links.map(([label, url]) => {
    const contact = url === 'contact.html';
    const current = page === url || (url === '#work' && page.startsWith('film-'));
    const href = url.startsWith('#') ? `index.html${url}` : url;
    return `<a href="${href}"${contact ? ' class="nav-contact"' : ''}${current ? ' aria-current="page"' : ''}>${escape(contact && placement !== 'footer' ? (arabic ? 'تواصل معي' : 'Contact Me') : label)}</a>`;
  }).join('');
}

function header(page, arabic) {
  const language = arabic
    ? `<a href="../${page}" lang="en" hreflang="en">English</a>`
    : `<a href="${arabicPage(page)}" lang="ar" hreflang="ar">العربية</a>`;
  return `<header class="topbar"><div class="shell nav-inner">
    <a class="brand" href="index.html" aria-label="${arabic ? 'أميرة عبد الفضيل، الصفحة الرئيسية' : 'Amira Abdelfadil, home'}">${arabic ? 'أميرة عبد الفضيل' : 'amira abdelfadil'}</a>
    <div class="nav-panel" id="navigation-panel"><div><nav aria-label="${arabic ? 'التنقل الرئيسي' : 'Primary'}">${navigationLinks(page, 'panel', arabic)}</nav></div></div>
    <div class="nav-actions"><nav class="nav-shortcuts" aria-label="${arabic ? 'التواصل واللغة' : 'Contact and language'}">${navigationLinks(page, 'contact', arabic)}${language}</nav><button class="menu-toggle" type="button" aria-label="${arabic ? 'القائمة' : 'Menu'}" aria-expanded="false" aria-controls="navigation-panel" hidden><span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span></button></div>
  </div><div class="read-progress" aria-hidden="true"></div></header>`;
}

function footer(page, arabic) {
  const name = arabic ? 'أميرة عبد الفضيل' : 'Amira Abdelfadil';
  return `<footer class="footer"><div class="shell footer-inner">
    <div><p class="footer-name">${name}</p><p>${arabic ? 'صانعة أفلام وفنانة بصرية' : 'Filmmaker · Visual Artist'}</p></div>
    <nav aria-label="${arabic ? 'التنقل أسفل الصفحة' : 'Footer'}">${navigationLinks(page, 'footer', arabic)}</nav>
    <div class="footer-base"><span>© ${name}</span><a href="#top">${arabic ? 'أعلى الصفحة' : 'Back to top'} <span aria-hidden="true">↑</span></a></div>
  </div></footer>`;
}

function image(asset, { priority = false, sizes = '(max-width: 640px) 100vw, 50vw' } = {}) {
  const [file, width, height, alt] = asset;
  const src = `assets/${file.endsWith('.webp') ? 'optimized/' : ''}${file}`;
  const webp = file.replace(/\.jpg$/, '.webp');
  const smallSource = 'assets/optimized/';
  const thumbnail = webp.replace('.webp', '-480.webp');
  const hasWebp = file.endsWith('.jpg') && existsSync(join(root, smallSource, webp)) && existsSync(join(root, smallSource, thumbnail));
  return `<picture>${hasWebp ? `<source type="image/webp" srcset="${smallSource}${thumbnail} 480w, ${smallSource}${webp} ${width}w" sizes="${escape(sizes)}">` : ''}<img src="${src}" width="${width}" height="${height}" alt="${escape(alt)}" ${priority ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}></picture>`;
}

function galleryItem(asset, caption, group, settings, className = '') {
  const [file, width, height, alt] = asset;
  const href = `assets/${file.endsWith('.webp') ? 'optimized/' : ''}${file}`;
  return `<figure${className ? ` class="${className}"` : ''}><a class="image-link" href="${href}" data-lightbox="${group}" data-caption="${escape(caption)}" data-width="${width}" data-height="${height}" aria-label="Enlarge image: ${escape(alt)}">${image(asset, settings)}<span class="image-expand">${icon('expand-icon')}</span></a><figcaption>${escape(caption)}</figcaption></figure>`;
}

const contactCTA = `<a class="pill" href="contact.html">Contact Amira ${icon('arrow-right')}</a>`;
const portrait = ['amira-portrait.jpg', 540, 720, 'Amira holding a camera'];
const hero = ['mamina-02.jpg', 1344, 709, 'Two women talk on a balcony overlooking Cairo'];
const lightbox = `<dialog class="lightbox" aria-labelledby="lightbox-title">
  <div class="lightbox-toolbar"><h2 id="lightbox-title">Image viewer</h2><p class="lightbox-count" aria-live="polite"></p><button class="round-button" type="button" data-close aria-label="Close image viewer">${icon('close-icon')}</button></div>
  <div class="lightbox-stage"><button class="round-button" type="button" data-step="-1" aria-label="Previous image">${icon('arrow-left')}</button><figure><img alt="" draggable="false"><figcaption></figcaption></figure><button class="round-button" type="button" data-step="1" aria-label="Next image">${icon('arrow-right')}</button></div>
</dialog>`;

function filmPage(film, index) {
  const previous = films[(index + films.length - 1) % films.length];
  const next = films[(index + 1) % films.length];
  const lead = film.stills.find(asset => asset[1] > asset[2]);
  const trailer = trailerPlayer(film);
  return `<article class="shell section project">
    <a class="line-link back-link" href="index.html#work">${icon('arrow-left')} All films</a>
    <div class="project-heading">${sectionTag(String(index + 1).padStart(2, '0'), 'Film')}<h1>${escape(film.title)}</h1>${meta(film) ? `<p class="film-meta">${meta(film)}</p>` : ''}</div>
    ${lead ? `<figure class="project-hero">${image(lead, { priority: true, sizes: '(max-width: 1360px) 100vw, 1280px' })}<figcaption>Still from <i>${escape(film.title)}</i></figcaption></figure>` : ''}
    <div class="project-body"><div class="poster-column">${galleryItem(poster(film), `Original poster · ${film.title}`, 'poster', { priority: !lead, sizes: '(max-width: 720px) 65vw, 28vw' }, 'project-poster')}${filmCrew(film)}</div><div class="prose project-copy">${film.synopsis ? `<h2>Synopsis</h2><p>${escape(film.synopsis)}</p>` : ''}<div class="actions">${contactCTA}</div></div></div>
    ${trailer ? `<div class="project-trailer">${trailer}</div>\n    ` : ''}<section class="project-gallery" aria-labelledby="stills-title"><h2 id="stills-title">Film stills</h2><div class="gallery-grid">${film.stills.map((asset, assetIndex) => galleryItem(asset, `Film still ${String(assetIndex + 1).padStart(2, '0')} · ${film.title}`, film.id)).join('')}</div></section>
    <nav class="related" aria-label="Related films"><a href="${filmPath(previous)}"><span>${icon('arrow-left')} Previous film</span><strong>${escape(previous.title)}</strong></a><a href="${filmPath(next)}"><span>Next film ${icon('arrow-right')}</span><strong>${escape(next.title)}</strong></a></nav>
  </article>`;
}

function visualPage() {
  return `<section class="shell section inner-page"><h1>Art &amp; <em>Photography</em></h1><p class="section-intro">A showcase of Amira’s Photography</p><div class="actions">${external(site.socials.find(profile => profile.id === 'instagram').url, 'View Amira’s visual diary on Instagram', 'pill')}</div></section>`;
}

function aboutPage() {
  return `<section class="shell section inner-page editorial-grid about-page"><div>${sectionTag('01', 'Biography')}<p class="arabic-kicker" lang="ar" dir="rtl">أميرة عبد الفضيل</p><h1>About <em>Amira</em></h1><div class="prose"><p>Amira Abdel-Fadil is a Cairo-based filmmaker, photographer, writer, and visual artist. She studied broadcasting at October University for Modern Sciences and Arts.</p>${intro}<p>Her work spans directing, writing, producing, cinematography, editing, and sound. Outside her films she has worked in digital media, script development, event coordination, and education.</p></div><div class="actions">${contactCTA}</div></div><figure>${image(portrait, { priority: true })}<figcaption>Amira Abdelfadil · Portrait</figcaption></figure></section>`;
}

function contactPage(arabic) {
  const heading = arabic ? 'تواصل مع <em>أميرة</em>' : 'Contact <em>Amira</em>';
  const lead = arabic ? 'لنتعاون على رواية قصص تستحق أن تُحكى.' : 'Let’s collaborate together on stories worth telling.';
  const details = arabic ? 'للتعاون في صناعة الأفلام والمشاريع الوثائقية والإبداعية، أو للاستفسارات المهنية.' : 'Get in touch for filmmaking, documentary projects, creative collaborations, and professional enquiries.';
  return `<section class="shell section inner-page contact-page"><h1>${heading}</h1><p class="contact-lead">${lead}</p><p class="section-intro">${details}</p><a class="line-link contact-email" href="mailto:${escape(site.email)}"><bdi>${escape(site.email)}</bdi> ${icon('arrow-right')}</a>${socialProfiles(arabic)}</section>`;
}

function collaborationPage(arabic) {
  const heading = arabic ? 'التعاونات' : 'Collaborations';
  return `<section class="shell section inner-page"><h1>${heading}</h1><dl class="collaboration-list">\n${collaborationItems(collaborations, arabic)}\n</dl></section>`;
}

const contactAndCollaborationPages = [false, true].flatMap(arabic => {
  const prefix = arabic ? 'ar/' : '';
  return [
    { file: `${prefix}contact.html`, title: arabic ? 'تواصل' : 'Contact', description: arabic ? 'تواصل مع صانعة الأفلام أميرة عبد الفضيل.' : 'Contact filmmaker and visual artist Amira Abdelfadil.', content: contactPage(arabic) },
    { file: `${prefix}collaborations.html`, title: arabic ? 'التعاونات' : 'Collaborations', description: arabic ? 'أعمال أميرة عبد الفضيل المشتركة في السينما والكتابة.' : 'Film and editorial collaborations by Amira Abdelfadil.', content: collaborationPage(arabic) },
  ];
});

const person = { '@type': 'Person', '@id': `${site.url}#amira`, name: site.name, url: site.url, image: `${site.url}assets/amira-portrait.jpg`, jobTitle: 'Filmmaker and visual artist', sameAs: site.socials.map(profile => profile.url) };
const pages = [
  { file: 'art.html', title: 'Art & Photography', description: 'Photography by Amira Abdelfadil, a filmmaker and visual artist based in Cairo.', content: visualPage() },
  { file: 'about.html', title: 'About', description: 'About Cairo-based filmmaker, photographer, writer, and visual artist Amira Abdelfadil.', content: aboutPage(), structured: person },
  { file: 'writing.html', title: 'Writing', description: writingIntro[0], content: `<section class="shell section inner-page"><h1>Beyond the <em>frame</em></h1><p class="section-intro">${writingIntro[0]}</p>${writingSection()}</section>`, structured: { '@type': 'ItemList', itemListElement: featuredEssays.flatMap(group => group.articles).map(([title, , url], index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Article', headline: title, url } })) } },
  ...contactAndCollaborationPages,
  ...films.map((film, index) => ({ file: filmPath(film), title: film.title, description: film.excerpt ?? `${film.title}, a film by Amira Abdel-Fadil. View the original poster, film stills, and production credits.`, image: `${film.id}-poster.jpg`, crew: true, trailer: Boolean(film.trailer), content: filmPage(film, index), structured: { '@type': 'Movie', name: film.title, ...(film.genre ? { genre: film.genre } : {}), ...(film.seconds ? { duration: `PT${Math.floor(film.seconds / 60)}M${film.seconds % 60}S` } : {}), image: `${site.url}assets/${film.id}-poster.jpg` } })),
];

const address = file => new URL(file, site.url).href;
const arabicPage = file => {
  if (file.startsWith('film-')) return `ar/#project-${file.slice(5, -5)}`;
  if (file === 'contact.html' || file === 'collaborations.html') return `ar/${file}`;
  return `ar/#${file.slice(0, -5)}`;
};

function render(page) {
  const arabic = page.file.startsWith('ar/');
  const locale = arabic ? locales.ar : locales.en;
  const prefix = arabic ? '../' : '';
  const current = page.file.split('/').at(-1);
  const url = address(page.file);
  const title = `${page.title} | ${arabic ? 'أميرة عبد الفضيل' : site.name}`;
  return `<!doctype html>
<html lang="${locale.lang}" dir="${locale.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f8f4ec">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${locale.ogLocale}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:image" content="${site.url}assets/${page.image ?? 'mamina-02.jpg'}">
  <meta property="og:image:alt" content="${escape(page.image ? `${page.title} poster` : hero[3])}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="${prefix}${stylesheet}">${page.trailer ? `\n  <link rel="stylesheet" href="${versioned('trailer.css')}">` : ''}${page.crew ? `\n  <link rel="stylesheet" href="${versioned('crew.css')}">` : ''}
  ${page.file === 'writing.html' ? `<link rel="stylesheet" href="${versioned('writing.css')}">\n  ` : ''}<script src="${prefix}${script}" defer></script>${page.trailer ? `\n  <script src="${versioned('trailer.js')}" defer></script>` : ''}
  ${page.structured ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', url, ...page.structured }).replaceAll('<', '\\u003c')}</script>` : ''}
</head>
<body id="top">
  <a class="skip-link" href="#main">${arabic ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
  ${symbols}
  ${header(current, arabic)}
  <main id="main" tabindex="-1">
  ${page.content}
  </main>
  ${footer(current, arabic)}
  ${lightbox}
</body>
</html>
`;
}

const outputs = pages.map(page => [page.file, render(page)]);
for (const [file, arabic] of [['index.html', false], ['ar/index.html', true]]) {
  const source = readFileSync(join(root, file), 'utf8');
  outputs.push([file, homepageCrew(homepageTrailers(source, films, arabic), films, arabic)
    .replace(/(<!-- writing-archives:start -->)[\s\S]*?(<!-- writing-archives:end -->)/, (_, start, end) => `${start}\n${writingSection({ arabic }).replace(/^/gm, '        ')}\n        ${end}`)]);
}
outputs.push(['sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[site.url, address('ar/'), ...pages.map(page => address(page.file))].map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`]);
outputs.push(['robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`]);

for (const [file, contents] of outputs) {
  const destination = join(root, file);
  if (!process.argv.includes('--check')) writeFileSync(destination, contents);
  else if (readFileSync(destination, 'utf8') !== contents) {
    console.error(`Regenerate ${file}`);
    process.exitCode = 1;
  }
}
