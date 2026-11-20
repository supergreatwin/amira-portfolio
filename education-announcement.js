// Homepage-only announcement for Amira's forthcoming educational content.
(() => {
  const notice = document.querySelector('[data-education-announcement]');
  if (!notice) return;
  const close = notice.querySelector('[data-education-dismiss]');
  const storageKey = 'amira-education-announcement-dismissed-v3';
  const dismissalDuration = 24 * 60 * 60 * 1000;
  const forceOpen = new URLSearchParams(location.search).get('education') === 'show';
  let dismissed = false;
  try {
    const timestamp = Number(localStorage.getItem(storageKey));
    dismissed = !forceOpen && timestamp > 0 && Date.now() - timestamp < dismissalDuration;
  } catch (_) { /* Storage can be disabled; show the announcement anyway. */ }

  const show = () => {
    if (dismissed || document.visibilityState === 'hidden') return;
    notice.hidden = false;
    notice.classList.add('is-visible');
  };
  const dismiss = () => {
    dismissed = true;
    notice.hidden = true;
    notice.classList.remove('is-visible');
    try { localStorage.setItem(storageKey, String(Date.now())); } catch (_) {}
  };
  close?.addEventListener('click', dismiss);
  document.addEventListener('visibilitychange', show);
  window.addEventListener('pageshow', show);
  // A short entrance delay keeps it from obscuring the initial viewport.
  window.setTimeout(show, 950);
})();
