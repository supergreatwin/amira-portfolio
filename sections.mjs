const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow-up-right"/></svg>';

export const writingIntro = [
  'A collection of essays on memory, identity, the creative process and taking chances.',
  'مجموعة مقالات عن الذاكرة والهوية والعملية الإبداعية والجرأة على خوض التجربة.',
];

const featuredEssays = [
  {
    heading: ['Personal essays', 'مقالات شخصية'],
    articles: [
      ['The Beauty of Capturing Memories', 'جمال توثيق الذكريات', 'https://thought.is/the-beauty-of-capturing-memories/'],
      ['Maybe One Day I’ll Write a Masterpiece', 'ربما أكتب يومًا عملًا خالدًا', 'https://thought.is/maybe-one-day-ill-write-a-masterpiece/'],
      ['No Matter What, I Will Always Choose Effort', 'مهما حدث، سأختار دائمًا بذل الجهد', 'https://thought.is/no-matter-what-i-will-always-choose-effort/'],
    ],
  },
  {
    heading: ['Essays on film', 'مقالات عن السينما'],
    articles: [
      ['Romance Movies Have Affected How We Perceive Love', 'كيف أثّرت الأفلام الرومانسية في نظرتنا إلى الحب؟', 'https://movieweb.com/the-danger-of-romantic-movies-in-how-we-perceive-love/'],
      ['The 11 All-Time Best Documentaries About Racism', 'أفضل ١١ فيلمًا وثائقيًا عن العنصرية', 'https://movieweb.com/the-best-documentaries-about-racism/'],
      ['Blue Lock: 11 Life Lessons We All Can Learn from the Popular Soccer Anime TV Show', '١١ درسًا في الحياة من أنمي كرة القدم «بلو لوك»', 'https://movieweb.com/blue-lock-life-lessons-we-can-learn/'],
    ],
  },
];

export function filmCrew(film, arabic = false) {
  const credits = arabic ? film.creditsAr : film.credits;
  return `<dl class="film-crew">${credits.map(([role, person]) => `<div><dt>${escape(role)}</dt><dd>${escape(person)}</dd></div>`).join('')}</dl>`;
}

export function homepageCrew(html, films, arabic) {
  return html.replace(
    /(<article class="film-detail" id="project-([a-z-]+)">)([\s\S]*?)(<\/article>)/g,
    (_, start, id, mark, end) => {
      const film = films.find(entry => entry.id === id);
      const poster = /<img class="project-poster"[^>]*>/;
      const oldColumn = /<div class="poster-column">[\s\S]*?<\/dl><\/div>/;
      const currentPoster = mark.match(poster)[0];
      const column = `<div class="poster-column">${currentPoster}${filmCrew(film, arabic)}</div>`;
      const body = oldColumn.test(mark)
        ? mark.replace(oldColumn, () => column)
        : mark.replace(poster, () => column).replace(/\n +<dl>[\s\S]*?<\/dl>/, '');
      return start + body + end;
    },
  );
}

export function writingSection(groups, arabic = false) {
  const index = Number(arabic);
  const archive = arabic ? 'تصفّح الأرشيف الكامل' : 'Browse the full writing archive';
  const categories = featuredEssays.map(category => `<section class="featured-essays">
  <h3>${category.heading[index]}</h3>
  <ul>${category.articles.map(([english, translated, url]) => `<li><a href="${url}"${arabic ? ' hreflang="en"' : ''}>${escape(arabic ? translated : english)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>
</section>`).join('\n');
  return `<div class="writing-selection">
${categories}
<details class="full-writing-archive"><summary>${archive}</summary>
${writingArchive(groups, arabic)}
</details>
</div>`;
}

export function trailerPlayer(film, arabic = false) {
  if (!film.trailer) return '';
  const { youtubeId, titleAr } = film.trailer;
  const title = arabic ? `الإعلان التشويقي لفيلم ${titleAr}` : `${film.title} trailer`;
  const watch = arabic ? 'شاهد الإعلان التشويقي' : 'Watch trailer';
  const open = arabic ? 'شاهده على يوتيوب' : 'Watch on YouTube';
  return `<details class="film-trailer">
  <summary>${watch}</summary>
  <iframe data-src="https://www.youtube-nocookie.com/embed/${youtubeId}" title="${escape(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
  <a class="line-link" href="https://youtu.be/${youtubeId}" target="_blank" rel="noopener noreferrer">${open}</a>
</details>`;
}

export function homepageTrailers(html, films, arabic) {
  return html.replace(
    /(<article class="film-detail" id="project-([a-z-]+)">[\s\S]*?)(\n          <div class="film-stills">)/g,
    (article, lead, id, stills) => {
      const film = films.find(entry => entry.id === id);
      if (!film?.trailer) return article;
      const beforeTrailer = lead.replace(/\n          <details class="film-trailer">[\s\S]*?<\/details>/, '');
      const player = trailerPlayer(film, arabic).replace(/^/gm, '          ');
      return `${beforeTrailer}\n${player}${stills}`;
    },
  );
}

export function collaborationItems(entries, arabic) {
  return entries.map(entry => {
    const title = escape(arabic ? entry.titleAr : entry.title);
    const description = escape(arabic ? entry.descriptionAr : entry.description);
    const heading = entry.url ? `<a href="${escape(entry.url)}">${title} ${arrow}</a>` : title;
    return `          <div><dt>${heading}</dt><dd>${description}</dd></div>`;
  }).join('\n');
}

export function writingArchive(groups, arabic = false) {
  const viewProfile = arabic ? 'صفحة الكاتبة على' : 'Author page at';
  const count = new Intl.NumberFormat(arabic ? 'ar-EG' : 'en');
  const language = arabic ? ' lang="en" dir="ltr" hreflang="en"' : '';
  return `<div class="writing-archives">${groups.map(group => `
  <details class="writing-archive">
    <summary>${escape(arabic ? group.titleAr : group.title)} <span class="archive-count">${count.format(group.articles.length)}</span></summary>
    <a class="line-link archive-source" href="${escape(group.url)}"${arabic ? ' hreflang="en"' : ''}>${viewProfile} <bdi>${escape(group.publication)}</bdi></a>
    <ul>${group.articles.map(([title, url]) => `\n      <li><a href="${escape(url)}"${language}>${escape(title)}</a></li>`).join('')}
    </ul>
  </details>`).join('')}
</div>`;
}
