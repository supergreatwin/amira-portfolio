// Homepage-only Notebook announcement; no tracking or external requests.
(() => {
  'use strict';
  const notice = document.querySelector('[data-education-announcement]');
  if (!notice) return;
  const storageKey = 'amira-notebook-announcement-dismissed-v1';
  const dismissalDuration = 24 * 60 * 60 * 1000;
  const forceOpen = new URLSearchParams(location.search).get('education') === 'show';
  let dismissed = false;
  let ready = false;
  try {
    const timestamp = Number(localStorage.getItem(storageKey));
    dismissed = !forceOpen && timestamp > 0 && Date.now() - timestamp < dismissalDuration;
  } catch (_) {}
  const show = () => {
    if (!ready || dismissed || document.visibilityState === 'hidden' || document.querySelector('dialog[open]')) return;
    notice.hidden = false;
    notice.classList.add('is-visible');
  };
  const dismiss = () => {
    dismissed = true;
    notice.hidden = true;
    notice.classList.remove('is-visible');
    try { localStorage.setItem(storageKey, String(Date.now())); } catch (_) {}
  };
  notice.querySelector('[data-education-dismiss]')?.addEventListener('click', dismiss);
  notice.querySelector('.education-announcement__cta')?.addEventListener('click', dismiss);
  notice.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss(); });
  document.addEventListener('visibilitychange', show);
  window.addEventListener('pageshow', show);
  document.addEventListener('close', show, true);
  window.setTimeout(() => { ready = true; show(); }, 950);
})();
