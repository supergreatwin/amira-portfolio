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
  <iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}" title="${escape(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
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

export function homepageWriting(entries, arabic) {
  return entries.map((entry, index) => {
    const title = escape(arabic ? entry.titleAr : entry.title);
    const attribution = entry.byline ? `${entry.publication} · ${entry.byline}` : entry.publication;
    return `          <a class="essay" href="${escape(entry.url)}"${arabic ? ' hreflang="en"' : ''}><span class="eyebrow" aria-hidden="true">0${index + 4}</span><span><strong>${title}</strong><span class="eyebrow" lang="en" dir="ltr">${escape(attribution)}</span></span><span class="icon-circle">${arrow}</span></a>`;
  }).join('\n');
}
