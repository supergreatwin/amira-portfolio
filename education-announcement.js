// Homepage Notebook announcement; signup uses the existing first-party subscription form.
(() => {
  'use strict';
  const notice = document.querySelector('[data-education-announcement]');
  if (!notice) return;
  const storageKey = 'amira-notebook-announcement-dismissed-v1';
  const dismissalDuration = 24 * 60 * 60 * 1000;
  const forceOpen = new URLSearchParams(location.search).get('education') === 'show';
  let dismissed = false;
  let ready = false;
  const fitNotice=()=>{
    const banner=document.querySelector('.amira-privacy-banner');
    const rect=banner?.getBoundingClientRect();
    const visible=rect&&rect.height>0&&!banner.hidden;
    notice.classList.toggle('has-consent-banner',!!visible);
    if(visible){
      notice.style.setProperty('--announcement-bottom',Math.max(12,innerHeight-rect.top+12)+'px');
      notice.style.setProperty('--announcement-available-height',Math.max(180,rect.top-24)+'px');
    }
  };
  addEventListener('resize',fitNotice);
  new MutationObserver(fitNotice).observe(document.body,{childList:true});
  try {
    const timestamp = Number(localStorage.getItem(storageKey));
    dismissed = !forceOpen && timestamp > 0 && Date.now() - timestamp < dismissalDuration;
  } catch (_) {}
  const show = () => {
    if (!ready || dismissed || document.visibilityState === 'hidden' || document.querySelector('dialog[open]')) return;
    notice.hidden = false;
    fitNotice();
    notice.classList.add('is-visible');
  };
  const dismiss = () => {
    dismissed = true;
    notice.hidden = true;
    notice.classList.remove('is-visible');
    try { localStorage.setItem(storageKey, String(Date.now())); } catch (_) {}
  };
  notice.querySelector('[data-education-dismiss]')?.addEventListener('click', dismiss);
  const trigger=notice.querySelector('[data-education-signup]');
  const intro=notice.querySelector('[data-education-intro]');
  const signup=notice.querySelector('#education-signup');
  const screens=notice.querySelector('.education-announcement__screens');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let slideTimer;
  function setSignup(open){
    if(!trigger||!intro||!signup||!screens)return;
    clearTimeout(slideTimer);
    screens.style.height=screens.getBoundingClientRect().height+'px';
    intro.inert=open;signup.inert=!open;
    intro.setAttribute('aria-hidden',String(open));signup.setAttribute('aria-hidden',String(!open));
    trigger.setAttribute('aria-expanded',String(open));
    notice.classList.toggle('is-signing-up',open);
    requestAnimationFrame(()=>{
      screens.style.height=(open?signup:intro).scrollHeight+'px';
      const focus=open?signup.querySelector('input[type="email"]'):trigger;
      focus?.focus({preventScroll:true});
      if(!open)notice.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});
      slideTimer=setTimeout(()=>{screens.style.height='';},reduced.matches?0:320);
    });
  }
  trigger?.addEventListener('click',()=>setSignup(true));
  notice.querySelector('[data-education-back]')?.addEventListener('click',()=>setSignup(false));
  notice.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss(); });
  document.addEventListener('visibilitychange', show);
  window.addEventListener('pageshow', show);
  document.addEventListener('close', show, true);
  window.setTimeout(() => { ready = true; show(); }, 950);
})();
