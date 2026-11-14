document.addEventListener('toggle', event => {
  const trailer = event.target;
  if (!trailer.matches('.film-trailer')) return;

  const player = trailer.querySelector('iframe');
  if (trailer.open) player.src = player.dataset.src;
  else player.removeAttribute('src');
}, true);

document.addEventListener('close', event => {
  if (!event.target.matches('.project-dialog')) return;
  for (const trailer of event.target.querySelectorAll('.film-trailer[open]')) {
    trailer.open = false;
  }
}, true);
