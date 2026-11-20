/* Amira portfolio — consent-gated Google Tag Manager on the canonical domain. */
(() => {
  const id = document.currentScript?.dataset.containerId;
  if (!/^GTM-[A-Z0-9]+$/.test(id || '')) return;
  if (!['amiraabdelfadil.com', 'www.amiraabdelfadil.com'].includes(location.hostname)) return;

  const storageKey = 'amira-analytics-consent-v2';
  const arabic = document.documentElement.lang.startsWith('ar');
  const labels = arabic ? {
    name: 'إعدادات التحليلات', title: 'خصوصية وتحليلات الموقع',
    description: 'بموافقتك، نستخدم Google Analytics لقياس الزيارات وتحسين التجربة. يمكنك الرفض أو تغيير اختيارك في أي وقت.',
    accept: 'السماح', reject: 'الرفض', close: 'إغلاق', privacy: 'سياسة خصوصية Google',
  } : {
    name: 'Analytics preferences', title: 'Privacy & analytics',
    description: 'With your permission, Google Analytics helps measure visits and improve this site. You may decline or change your choice at any time.',
    accept: 'Allow analytics', reject: 'Decline', close: 'Close', privacy: 'Google privacy policy',
  };

  let choice = null;
  try { choice = localStorage.getItem(storageKey); } catch (_) {}
  let started = false;

  function start() {
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
    document.head.append(script);
  }
  function save(value) {
    choice = value;
    try { localStorage.setItem(storageKey, value); } catch (_) {}
    if (value === 'granted') start();
    // Once a third-party container is loaded, revocation takes effect on the
    // next page view; opt out of future loads now.
    if (value === 'denied' && started) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      window.dataLayer?.push({event:'amira_analytics_disabled'});
    }
  }

  const settings = document.createElement('button');
  settings.className = 'analytics-settings';
  settings.type = 'button';
  settings.textContent = labels.name;
  const dialog = document.createElement('dialog');
  dialog.className = 'analytics-dialog';
  dialog.setAttribute('aria-label', labels.title);
  const title = document.createElement('h2');
  title.textContent = labels.title;
  const description = document.createElement('p');
  description.textContent = labels.description;
  const privacy = document.createElement('a');
  privacy.href = 'https://policies.google.com/privacy';
  privacy.target = '_blank';
  privacy.rel = 'noopener noreferrer';
  privacy.textContent = labels.privacy;
  const actions = document.createElement('div');
  actions.className = 'analytics-actions';

  for (const [label, value] of [[labels.reject, 'denied'], [labels.accept, 'granted'], [labels.close, null]]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      if (value) save(value);
      dialog.close();
    });
    actions.append(button);
  }
  dialog.append(title, description, privacy, actions);
  (document.querySelector('footer') || document.body).append(settings);
  document.body.append(dialog);
  settings.addEventListener('click', () => dialog.open ? dialog.close() : dialog.showModal());
  if (choice === 'granted') start();
  else if (choice !== 'denied') dialog.show();

  document.addEventListener('click', (event) => {
    if (choice !== 'granted' || !started) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link === privacy) return;
    const target = new URL(link.href);
    if (target.protocol === 'mailto:' || target.protocol === 'tel:') {
      window.dataLayer.push({event:'amira_contact_click', method:target.protocol.slice(0,-1)});
    } else if (['http:', 'https:'].includes(target.protocol) && target.origin !== location.origin) {
      window.dataLayer.push({event:'amira_outbound_click', link_domain:target.hostname});
    }
  });
})();
