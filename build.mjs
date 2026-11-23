import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collaborations, films, locales, site } from './content.mjs';
import { collectionPhotos, photographyCollections } from './photos.mjs';
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
const biography = '<p>Amira Abdel-Fadil has always been drawn to the things people carry quietly: a grandmother’s recipes, the green that grows between buildings, the small moments that hold a whole life. A filmmaker, writer and photographer from Cairo, she lets each story decide its own pace, and she is still learning to listen well enough to follow it.</p><p>Her path began in digital media, where her articles and edited videos reached audiences of more than a million. Event coordination, teaching and volunteering shaped her too, and she credits them with teaching her patience and care for the people on the other side of the lens.</p><p>Her documentaries have been recognized and screened at international festivals, and she is grateful for every audience that has stayed to watch. What she hopes to make, in the end, is not a film but a feeling: an invitation to look inward, and to step back into a world that feels a little closer than it seemed, a little more tender, and a little more open to everyone in it.</p>';

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

function image(asset, { priority = false, sizes = '(max-width: 640px) 100vw, 50vw', prefix = '' } = {}) {
  const [file, width, height, alt] = asset;
  const src = `assets/${file.endsWith('.webp') ? 'optimized/' : ''}${file}`;
  const webp = file.replace(/\.jpg$/, '.webp');
  const smallSource = 'assets/optimized/';
  const thumbnail = webp.replace('.webp', '-480.webp');
  const hasWebp = file.endsWith('.jpg') && existsSync(join(root, smallSource, webp)) && existsSync(join(root, smallSource, thumbnail));
  return `<picture>${hasWebp ? `<source type="image/webp" srcset="${prefix}${smallSource}${thumbnail} 480w, ${prefix}${smallSource}${webp} ${width}w" sizes="${escape(sizes)}">` : ''}<img src="${prefix}${src}" width="${width}" height="${height}" alt="${escape(alt)}" ${priority ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}></picture>`;
}

function galleryItem(asset, caption, group, settings = {}, className = '') {
  const [file, width, height, alt] = asset;
  const href = `${settings.prefix ?? ''}assets/${file.endsWith('.webp') ? 'optimized/' : ''}${file}`;
  const label = settings.arabic ? 'تكبير الصورة' : 'Enlarge image';
  return `<figure${className ? ` class="${className}"` : ''}><a class="image-link" href="${href}" data-lightbox="${group}" data-caption="${escape(caption)}" data-width="${width}" data-height="${height}" aria-label="${label}: ${escape(alt)}">${image(asset, settings)}<span class="image-expand">${icon('expand-icon')}</span></a>${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`;
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

function visualPage(arabic) {
  const heading = arabic ? 'الفن و<em>التصوير</em>' : 'Art &amp; <em>Photography</em>';
  const intro = arabic ? 'مختارات من أعمال أميرة في التصوير الفوتوغرافي' : 'A showcase of Amira’s Photography';
  const instagram = arabic ? 'يوميات أميرة البصرية على إنستغرام' : 'View Amira’s visual diary on Instagram';
  const localeIndex = arabic ? 1 : 0;
  const prefix = arabic ? '../' : '';
  const cards = photographyCollections.map(collection => {
    const cover = collectionPhotos(collection, localeIndex)[0];
    return `<a class="photography-collection" href="${collection.id}.html">${image(cover, { priority: collection === photographyCollections[0], prefix })}<span>${collection.title[localeIndex]} ${icon(arabic ? 'arrow-left' : 'arrow-right')}</span></a>`;
  });
  return `<section class="shell section inner-page"><h1>${heading}</h1><p class="section-intro">${intro}</p>
    <div class="photography-collections">${cards.join('\n    ')}</div>
    <div class="actions">${external(site.socials.find(profile => profile.id === 'instagram').url, instagram, 'pill')}</div></section>`;
}

function collectionPage(title, photos, arabic) {
  const back = arabic ? 'الفن والتصوير' : 'Art &amp; Photography';
  const [, width, height] = photos[0];
  const layout = width > height ? ' photography-grid--landscape' : '';
  const prefix = arabic ? '../' : '';
  return `<section class="shell section inner-page" aria-labelledby="collection-title">
    <a class="line-link back-link" href="art.html">${icon(arabic ? 'arrow-right' : 'arrow-left')} ${back}</a>
    <h1 id="collection-title">${escape(title)}</h1>
    <div class="photography-grid${layout}">${photos.map((asset, index) => image(asset, { prefix, priority: index === 0 })).join('\n    ')}</div>
  </section>`;
}

function aboutPage() {
  return `<section class="shell section inner-page editorial-grid about-page"><div>${sectionTag('01', 'Biography')}<p class="arabic-kicker" lang="ar" dir="rtl">أميرة عبد الفضيل</p><h1>About <em>Amira</em></h1><div class="prose">${biography}</div><div class="actions">${contactCTA}</div></div><figure>${image(portrait, { priority: true })}<figcaption>Amira Abdelfadil · Portrait</figcaption></figure></section>`;
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
const photographyPages = [false, true].flatMap(arabic => {
  const prefix = arabic ? 'ar/' : '';
  const localeIndex = arabic ? 1 : 0;
  const [image, , , imageAlt] = collectionPhotos(photographyCollections[0], localeIndex)[0];
  return [
    { file: `${prefix}art.html`, title: arabic ? 'الفن والتصوير' : 'Art & Photography', description: arabic ? 'أعمال أميرة عبد الفضيل في التصوير الفوتوغرافي.' : 'Photography by Amira Abdelfadil.', image, imageAlt, photography: true, content: visualPage(arabic) },
    ...photographyCollections.map(collection => {
      const photos = collectionPhotos(collection, localeIndex);
      const [image, , , imageAlt] = photos[0];
      const title = collection.title[localeIndex];
      return { file: `${prefix}${collection.id}.html`, title, description: arabic ? `${title} بعدسة أميرة عبد الفضيل.` : `${title}, a photography series by Amira Abdelfadil.`, image, imageAlt, photography: true, content: collectionPage(title, photos, arabic) };
    }),
  ];
});
const pages = [
  ...photographyPages,
  { file: 'about.html', title: 'About', description: 'About Cairo-based filmmaker, photographer, writer, and visual artist Amira Abdelfadil.', content: aboutPage(), structured: person },
  { file: 'writing.html', title: 'Writing', description: writingIntro[0], content: `<section class="shell section inner-page"><h1>Beyond the <em>frame</em></h1><p class="section-intro">${writingIntro[0]}</p>${writingSection()}</section>`, structured: { '@type': 'ItemList', itemListElement: featuredEssays.flatMap(group => group.articles).map(([title, , url], index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Article', headline: title, url } })) } },
  ...contactAndCollaborationPages,
  ...films.map((film, index) => ({ file: filmPath(film), title: film.title, description: film.excerpt ?? `${film.title}, a film by Amira Abdel-Fadil. View the original poster, film stills, and production credits.`, image: `${film.id}-poster.jpg`, crew: true, trailer: Boolean(film.trailer), content: filmPage(film, index), structured: { '@type': 'Movie', name: film.title, ...(film.genre ? { genre: film.genre } : {}), ...(film.seconds ? { duration: `PT${Math.floor(film.seconds / 60)}M${film.seconds % 60}S` } : {}), image: `${site.url}assets/${film.id}-poster.jpg` } })),
];

const address = file => new URL(file.replace(/index\.html$/, '').replace(/\.html$/, ''), site.url).href;

function alternateLinks(english, arabic) {
  return [
    ['en', english], ['ar', arabic], ['x-default', english],
  ].map(([lang, file]) => `<link rel="alternate" hreflang="${lang}" href="${address(file)}">`).join('\n  ');
}
const arabicPage = file => {
  if (file.startsWith('film-')) return `ar/#project-${file.slice(5, -5)}`;
  if (pages.some(page => page.file === `ar/${file}`)) return `ar/${file}`;
  return `ar/#${file.slice(0, -5)}`;
};

function render(page) {
  const arabic = page.file.startsWith('ar/');
  const locale = arabic ? locales.ar : locales.en;
  const prefix = arabic ? '../' : '';
  const current = page.file.split('/').at(-1);
  const url = address(page.file);
  const otherFile = arabic ? current : `ar/${page.file}`;
  const translated = pages.some(candidate => candidate.file === otherFile);
  const alternates = translated ? `\n  ${alternateLinks(current, `ar/${current}`)}` : '';
  const title = `${page.title} | ${arabic ? 'أميرة عبد الفضيل' : site.name}`;
  return `<!doctype html>
<html lang="${locale.lang}" dir="${locale.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f8f4ec">
  <script src="${prefix}theme-init.js"></script>
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <link rel="canonical" href="${url}">${alternates}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${locale.ogLocale}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:image" content="${site.url}assets/${page.image ?? 'mamina-02.jpg'}">
  <meta property="og:image:alt" content="${escape(page.imageAlt ?? (page.image ? `${page.title} poster` : hero[3]))}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="${prefix}${stylesheet}">${page.trailer ? `\n  <link rel="stylesheet" href="${versioned('trailer.css')}">` : ''}${page.crew ? `\n  <link rel="stylesheet" href="${versioned('crew.css')}">` : ''}
  ${page.file === 'writing.html' ? `<link rel="stylesheet" href="${versioned('writing.css')}">\n  ` : ''}${page.photography ? `<link rel="stylesheet" href="${prefix}${versioned('photography.css')}">\n  ` : ''}<script src="${prefix}${script}" defer></script>${page.trailer ? `\n  <script src="${versioned('trailer.js')}" defer></script>` : ''}
  <link rel="stylesheet" href="${prefix}theme.css?v=1">
  <script src="${prefix}theme.js?v=1" defer></script>
${page.structured ? `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', url, ...page.structured }).replaceAll('<', '\\u003c')}</script>\n` : ''}</head>
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
  const source = readFileSync(join(root, file), 'utf8')
    .replaceAll('https://supergreatwin.github.io/amira-portfolio/', site.url)
    .replace(/^[ \t]*<link rel="alternate" hreflang="[^"]+"[^>]*>\n/gm, '')
    .replace(/^[ \t]*<script type="application\/ld\+json">[^\n]*<\/script>\n/gm, '')
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${address(file)}">\n  ${alternateLinks('index.html', 'ar/index.html')}`)
    .replace(/\s*<\/head>/, () => {
      const profile = {
        '@context': 'https://schema.org', '@type': 'ProfilePage', url: address(file),
        inLanguage: arabic ? 'ar' : 'en',
        mainEntity: { ...person, '@id': site.url + '#amira', url: site.url },
      };
      const website = {
        '@context': 'https://schema.org', '@type': 'WebSite',
        '@id': site.url + '#website', name: site.name,
        alternateName: 'Amira Abdel-Fadil', url: site.url,
        inLanguage: ['en', 'ar'],
      };
      return `\n  <script type="application/ld+json">${JSON.stringify(profile).replaceAll('<', '\\u003c')}</script>\n  <script type="application/ld+json">${JSON.stringify(website).replaceAll('<', '\\u003c')}</script>\n</head>`;
    });
  outputs.push([file, homepageCrew(homepageTrailers(source, films, arabic), films, arabic)
    .replace(/(<!-- writing-archives:start -->)[\s\S]*?(<!-- writing-archives:end -->)/, (_, start, end) => `${start}\n${writingSection({ arabic }).replace(/^/gm, '        ')}\n        ${end}`)]);
}
outputs.push(['sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[site.url, address('ar/'), ...pages.map(page => address(page.file)), ...['notes.html', 'collaborate.html', 'pitch.html', 'ar/notes.html', 'ar/collaborate.html', 'ar/pitch.html'].map(address)].map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`]);
outputs.push(['robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`]);

// The static portfolio includes hand-curated editorial markup and custom styling.
// Strict byte equality with the older generator rejects valid manual improvements.
// Validate file presence, document integrity and documentary metadata in CI instead.
const checkOnly = process.argv.includes('--check');
for (const [file, contents] of outputs) {
  const destination = join(root, file);
  if (!checkOnly) {
    // Approved, hand-authored pages are the source of truth. Never regenerate
    // them from the retired layout templates below.
    if (file.endsWith('.html') && existsSync(destination) && readFileSync(destination, 'utf8').includes('data-approved-classic')) continue;
    writeFileSync(destination, contents);
    continue;
  }
  if (!existsSync(destination)) {
    console.error(`Missing output: ${file}`);
    process.exitCode = 1;
    continue;
  }
  const current = readFileSync(destination, 'utf8');
  if (file.endsWith('.html') && (!current.includes('<!doctype html>') || !current.includes('</html>'))) {
    console.error(`Invalid HTML document: ${file}`);
    process.exitCode = 1;
  }
  const film = films.find(item => filmPath(item) === file);
  if (film && (!/class="[^"]*\bfilm-meta\b[^"]*"/.test(current) || !current.includes(`>${meta(film)}</p>`))) {
    console.error(`Documentary metadata out of sync: ${file}`);
    process.exitCode = 1;
  }
}
