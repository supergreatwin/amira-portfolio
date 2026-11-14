const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow-up-right"/></svg>';

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
