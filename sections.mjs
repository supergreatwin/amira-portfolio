const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow-up-right"/></svg>';

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
