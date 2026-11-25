/* Sitewide privacy controls. Optional analytics is blocked until opt-in. */
(() => {
  'use strict';
  const bootScript = document.currentScript;
  const measurementId = bootScript?.dataset.measurementId || '';
  const privateRoute=/(?:^|\/)(?:editorial|content-studio|portfolio-studio|education-studio)(?:\.html)?(?:\/|$)|(?:^|\/)the-process(?:\/|$)/.test(location.pathname);
  const sensitiveQuery=new URLSearchParams(location.search).has('unsubscribe');
  const activeAnalytics = !privateRoute && !sensitiveQuery && /^G-[A-Z0-9]+$/.test(measurementId) &&
    ['amiraabdelfadil.com', 'www.amiraabdelfadil.com'].includes(location.hostname);
  const key = 'amira-privacy-choice-v1';
  const oldKey = 'amira-analytics-consent-v2';
  const expiry = 180 * 24 * 60 * 60 * 1000;
  const ar = document.documentElement.lang.toLowerCase().startsWith('ar');
  const L = ar ? {
    privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام', cookies: 'ملفات تعريف الارتباط',
    settings: 'إعدادات الخصوصية', title: 'خيارات الخصوصية', intro: 'نستخدم التخزين الضروري لتشغيل الموقع وحفظ إعداداتك. لا نفعّل Google Analytics إلا بموافقتك. اختيارك اختياري ويمكن تغييره في أي وقت.',
    essential: 'التخزين الضروري', essentialHelp: 'ضروري لتسجيل الدخول وحفظ إعدادات الموقع ولا يمكن تعطيله هنا.',
    analytics: 'تحليلات اختيارية', analyticsHelp: 'يساعدنا Google Analytics وCloudflare Web Analytics في فهم استخدام الصفحات العامة وأدائها، ولا يعملان إلا بعد الموافقة.',
    deny: 'رفض الاختياري', accept: 'السماح بالتحليلات', customize: 'تخصيص',
    save: 'حفظ الاختيارات', notice: 'خصوصيتك تهمنا', details: 'لن نستخدم تحليلات اختيارية قبل موافقتك. تستطيع الرفض أو الموافقة أو تعديل اختيارك.',
    more: 'اقرأ سياسة ملفات تعريف الارتباط', close: 'إغلاق'
  } : {
    privacy: 'Privacy', terms: 'Terms', cookies: 'Cookies',
    settings: 'Privacy settings', title: 'Privacy preferences',
    intro: 'Essential storage keeps this site working and remembers your choices. Google Analytics is optional and runs only with your permission. You can change your mind at any time.',
    essential: 'Essential storage', essentialHelp: 'Used for authentication and site settings; it cannot be turned off here.',
    analytics: 'Optional analytics', analyticsHelp: 'Google Analytics and Cloudflare Web Analytics help us understand public-page visits and performance; they only start after opt-in.',
    deny: 'Reject optional', accept: 'Accept analytics', customize: 'Customize',
    save: 'Save choices', notice: 'Your privacy matters', details: 'We do not activate optional analytics without consent. You can accept, reject, or choose your settings.',
    more: 'Read the Cookie Policy', close: 'Close'
  };
  const base = location.hostname === 'supergreatwin.github.io' && location.pathname.startsWith('/amira-portfolio/')
    ? '/amira-portfolio/' : '/';
  const legalUrl = name => base + (ar ? 'ar/' : '') + name + '.html';
  let preference = null;
  let loaded = false;
  const storageRead = name => { try { return localStorage.getItem(name); } catch { return null; } };
  const storageWrite = (name, value) => { try { localStorage.setItem(name, value); } catch {} };
  try {
    const saved = JSON.parse(storageRead(key) || 'null');
    if (saved && saved.version === 1 && typeof saved.analytics === 'boolean' &&
        typeof saved.time === 'number' && Date.now() >= saved.time &&
        Date.now() - saved.time < expiry) preference = saved.analytics;
  } catch {}
  if (preference === null) {
    const legacy = storageRead(oldKey);
    if (legacy === 'granted' || legacy === 'denied') {
      preference = legacy === 'granted';
      storageWrite(key, JSON.stringify({version: 1, analytics: preference, time: Date.now()}));
    }
  }
  const consentState = granted => ({
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  function loadAnalytics() {
    if (!activeAnalytics || loaded || preference !== true) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', consentState(false));
    window.gtag('consent', 'update', consentState(true));
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    tag.dataset.amiraOptionalAnalytics = 'true';
    document.head.appendChild(tag);
    // Cloudflare's automatic injection is replaced by this consent-controlled
    // public-page beacon. Account and unsubscribe routes never load analytics.
    const rum=document.createElement('script');rum.defer=true;
    rum.src='https://static.cloudflareinsights.com/beacon.min.js';
    rum.dataset.cfBeacon=JSON.stringify({token:'d1b8df1a57674a22bfcf836dc51a2c67'});
    rum.dataset.amiraOptionalAnalytics='true';document.head.appendChild(rum);
  }
  function clearAnalyticsCookies() {
    for (const part of document.cookie.split(';')) {
      const name = part.split('=')[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
      for (const domain of ['', '.amiraabdelfadil.com']) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' +
          (domain ? '; domain=' + domain : '');
      }
    }
  }
  function setPreference(enabled) {
    const previous = preference;
    preference = enabled;
    storageWrite(key, JSON.stringify({version: 1, analytics: enabled, time: Date.now()}));
    if (enabled) loadAnalytics();
    else {
      if (window.gtag) window.gtag('consent', 'update', consentState(false));
      clearAnalyticsCookies();
      if (loaded && previous === true) location.reload(); // Stop loaded tracking code, not just future events.
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('footer');
    const legalNav = document.querySelector('.legal-links');
    if (!legalNav && footer) {
      const nav = document.createElement('nav');
      nav.className = 'legal-links';
      nav.setAttribute('aria-label', ar ? 'المعلومات القانونية' : 'Legal information');
      for (const [name,label] of [['privacy',L.privacy],['terms',L.terms],['cookies',L.cookies]]) {
        const a = document.createElement('a'); a.href = legalUrl(name); a.textContent = label; nav.append(a);
      }
      footer.append(nav);
    }
    document.querySelectorAll('.fn-privacy').forEach(item => {
      if (item.querySelector('a')) return;
      const a = document.createElement('a');
      a.href = legalUrl('privacy');
      a.textContent = L.privacy;
      item.append(document.createTextNode(' · '), a);
    });
    // Tally forms are intentionally not loaded on initial page view.
    // Visitors choose to open third-party content, with a direct-link fallback.
    document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach(frame => {
      let target;
      try {
        target = new URL(frame.dataset.tallySrc);
        if (target.protocol !== 'https:' || target.hostname !== 'tally.so' || !target.pathname.startsWith('/embed/')) return;
      } catch { return; }
      frame.hidden = true;
      const prompt = document.createElement('div');
      prompt.className = 'amira-embed-consent';
      const heading = document.createElement('strong');
      heading.textContent = ar ? 'عرض النموذج الخارجي' : 'Load the external form';
      const explanation = document.createElement('p');
      explanation.textContent = ar
        ? 'تُقدّم Tally هذا النموذج. عند فتحه، يتصل المتصفح بخوادم Tally وقد تُعالَج بيانات تقنية وفق سياسة خصوصيتها.'
        : 'This form is provided by Tally. Loading it connects your browser to Tally, which may process technical data under its privacy policy.';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = ar ? 'فتح نموذج Tally' : 'Load Tally form';
      button.addEventListener('click', () => {
        frame.src = target.href;
        frame.hidden = false;
        prompt.remove();
      });
      prompt.append(heading, explanation, button);
      frame.before(prompt);
    });
    const dialog = document.createElement('dialog');
    dialog.className = 'amira-privacy-dialog';
    dialog.setAttribute('aria-label', L.title);
    const panel = document.createElement('div');
    panel.className = 'amira-privacy-panel';
    const heading = document.createElement('h2'); heading.textContent = L.title;
    const intro = document.createElement('p'); intro.textContent = L.intro;
    const requiredLabel = document.createElement('label'); requiredLabel.className = 'amira-privacy-option';
    const required = document.createElement('input'); required.type = 'checkbox'; required.checked = true; required.disabled = true;
    const requiredCopy = document.createElement('span');
    const requiredTitle = document.createElement('strong'); requiredTitle.textContent = L.essential;
    const requiredNote = document.createElement('small'); requiredNote.textContent = L.essentialHelp;
    requiredCopy.append(requiredTitle, requiredNote); requiredLabel.append(required, requiredCopy);
    const optionalLabel = document.createElement('label'); optionalLabel.className = 'amira-privacy-option';
    const optional = document.createElement('input'); optional.type = 'checkbox'; optional.checked = preference === true;
    const optionalCopy = document.createElement('span');
    const optionalTitle = document.createElement('strong'); optionalTitle.textContent = L.analytics;
    const optionalNote = document.createElement('small'); optionalNote.textContent = L.analyticsHelp;
    optionalCopy.append(optionalTitle, optionalNote); optionalLabel.append(optional, optionalCopy);
    const policy = document.createElement('a'); policy.href = legalUrl('cookies'); policy.textContent = L.more;
    const actions = document.createElement('div'); actions.className = 'amira-privacy-actions';
    function makeButton(label, action, className = '') {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label;
      button.className = className;
      button.addEventListener('click', action);
      return button;
    }
    const banner = document.createElement('section');
    banner.className = 'amira-privacy-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', L.notice);
    const bannerText = document.createElement('div');
    const bannerHeading = document.createElement('strong'); bannerHeading.textContent = L.notice;
    const bannerDescription = document.createElement('p'); bannerDescription.textContent = L.details;
    bannerText.append(bannerHeading, bannerDescription);
    const bannerActions = document.createElement('div'); bannerActions.className = 'amira-privacy-actions';
    function save(value) { setPreference(value); banner.hidden = true; dialog.close(); }
    const reject = () => save(false);
    const accept = () => save(true);
    const openSettings = () => { optional.checked = preference === true; dialog.showModal(); };
    actions.append(
      makeButton(L.deny, reject, 'amira-privacy-secondary'),
      makeButton(L.save, () => save(optional.checked), 'amira-privacy-primary')
    );
    bannerActions.append(
      makeButton(L.deny, reject, 'amira-privacy-primary'),
      makeButton(L.customize, openSettings, 'amira-privacy-secondary'),
      makeButton(L.accept, accept, 'amira-privacy-primary')
    );
    panel.append(heading, intro, requiredLabel, optionalLabel, policy, actions);
    dialog.append(panel);
    banner.append(bannerText, bannerActions);
    document.body.append(dialog, banner);
    banner.hidden = preference !== null;
    // Delegation also supports the site's dynamic layout variants.
    document.addEventListener('click', event => {
      const control = event.target instanceof Element
        ? event.target.closest('[data-privacy-settings]') : null;
      if (control) { event.preventDefault(); openSettings(); }
    });
    if (preference === true) loadAnalytics();
  });
})();
