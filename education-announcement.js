// Homepage-only, non-modal launch announcement.
(() => {
  const notice = document.querySelector('[data-education-announcement]');
  if (!notice) return;
  const close = notice.querySelector('[data-education-dismiss]');
  const storageKey = 'amira-education-announcement-dismissed-v2';
  const dismissalDuration = 7 * 24 * 60 * 60 * 1000;

  try {
    const dismissedAt = Number(localStorage.getItem(storageKey));
    if (dismissedAt && Date.now() - dismissedAt < dismissalDuration) return;
  } catch (_) {
    // Privacy modes may disable storage; the notice still remains dismissible.
  }

  const show = () => {
    if (document.visibilityState === 'hidden') return;
    notice.hidden = false;
    notice.classList.add('is-visible');
  };

  const dismiss = () => {
    notice.hidden = true;
    notice.classList.remove('is-visible');
    try { localStorage.setItem(storageKey, String(Date.now())); } catch (_) {}
  };

  close.addEventListener('click', dismiss);
  // Only announce once the initial page content has had time to settle.
  window.setTimeout(show, 1800);
})();
