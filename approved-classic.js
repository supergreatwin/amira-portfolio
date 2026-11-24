/* Production interactions for the owner-approved classic reference. */
(() => {
  'use strict';
  const ar=document.documentElement.lang==='ar';
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const canvas=document.getElementById('canvas');
  const menu=document.getElementById('siteMenu');
  const toggle=document.getElementById('menuToggle');
  const setMenu=open=>{if(!menu||!toggle)return;menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));};
  toggle?.addEventListener('click',()=>setMenu(!menu.classList.contains('open')));
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.site-header'))setMenu(false);});
  menu?.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open')){setMenu(false);toggle.focus();}});
  const theme=document.getElementById('themeIcon');
  const system=matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(value,persist=false){
    document.documentElement.dataset.theme=value;
    theme?.setAttribute('aria-pressed',String(value==='dark'));
    theme?.setAttribute('aria-label',value==='dark'?(ar?'تفعيل الوضع الفاتح':'Switch to light mode'):(ar?'تفعيل الوضع الداكن':'Switch to dark mode'));
    if(theme)theme.textContent=value==='dark'?'☾':'☼';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',value==='dark'?'#000000':'#f8f4ec');
    if(persist)try{localStorage.setItem('amira-portfolio-theme',value);}catch{}
  }
  applyTheme(document.documentElement.dataset.theme||'light');
  theme?.addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true));
  system.addEventListener('change',e=>{let saved;try{saved=localStorage.getItem('amira-portfolio-theme');}catch{}if(!saved)applyTheme(e.matches?'dark':'light');});
  const top=document.getElementById('scrollTop');
  addEventListener('scroll',()=>top?.classList.toggle('show',scrollY>900),{passive:true});
  top?.addEventListener('click',()=>scrollTo({top:0,behavior:motion.matches?'instant':'smooth'}));
  const viewer=document.getElementById('filmImageViewer');
  let viewerTrigger;
  function viewImage(src,alt,trigger){if(!viewer)return;viewerTrigger=trigger;viewer.querySelector('img').src=src;viewer.querySelector('img').alt=alt;viewer.querySelector('#filmViewerCaption').textContent=alt;viewer.showModal();}
  viewer?.querySelector('[data-viewer-close]')?.addEventListener('click',()=>viewer.close());
  viewer?.addEventListener('close',()=>{viewer.querySelector('img').removeAttribute('src');viewerTrigger?.focus();});
  // Enlargement remains available for photography galleries only.
  for(const img of document.querySelectorAll('.photography-grid img')){
    if(img.closest('a,button'))continue;
    const button=document.createElement('button');button.type='button';button.className='gallery-original';button.setAttribute('aria-label',(ar?'تكبير الصورة: ':'Enlarge photograph: ')+img.alt);
    const picture=img.closest('picture')||img;picture.replaceWith(button);button.append(picture);button.dataset.original=img.src;
  }
  document.addEventListener('click',event=>{
    const source=event.target.closest('[data-original]');if(source&&!source.closest('.film-page-stills,.film-still-grid')){event.preventDefault();viewImage(source.dataset.original,source.querySelector('img')?.alt||'',source);}
    const trailer=event.target.closest('[data-trailer]');
    if(trailer){
      const id=trailer.dataset.trailer;if(!/^[\w-]{11}$/.test(id))return;
      const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id;frame.title=ar?'الإعلان الترويجي للفيلم':'Film trailer';frame.allow='encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
      const wrap=document.createElement('div');wrap.className='film-trailer-frame';wrap.append(frame);trailer.replaceWith(wrap);
    }
  });
  const filmDialog=document.getElementById('filmDialog');let filmTrigger;
  for(const trigger of document.querySelectorAll('#page-home [data-film]'))trigger.addEventListener('click',()=>{
    const id=trigger.dataset.film;const source=document.getElementById('popup-'+id)?.content;if(!source||!filmDialog)return;
    const title=source.querySelector('h1').textContent;
    filmDialog.querySelector('#filmDialogTitle').textContent=title;
    filmDialog.querySelector('#filmDialogMeta').textContent=source.querySelector('.film-page-meta').textContent;
    const poster=filmDialog.querySelector('#filmDialogPoster');poster.src=source.querySelector('.film-page-poster img').src;poster.alt=source.querySelector('.film-page-poster img').alt;
    filmDialog.querySelector('#filmDialogSynopsis').textContent=source.querySelector('.film-page-copy p').textContent;
    filmDialog.querySelector('#filmDialogCredits').replaceChildren(source.querySelector('.film-page-credits').cloneNode(true));
    filmDialog.querySelector('#filmDialogStills').replaceChildren(...[...source.querySelector('.film-page-stills').children].map(x=>x.cloneNode(true)));
    filmDialog.querySelector('#filmTrailerArea').replaceChildren();
    const trailer=source.querySelector('[data-trailer]');if(trailer){const button=trailer.cloneNode(true);button.classList.add('film-trailer-button');filmDialog.querySelector('#filmTrailerArea').append(button);}
    filmDialog.querySelector('[data-full-film]').href='film-'+id+'.html';
    filmTrigger=trigger;filmDialog.showModal();filmDialog.scrollTop=0;
  });
  filmDialog?.querySelector('#filmDialogClose')?.addEventListener('click',()=>filmDialog.close());
  filmDialog?.addEventListener('close',()=>{filmDialog.querySelector('#filmTrailerArea').replaceChildren();filmDialog.querySelector('#filmDialogStills').replaceChildren();filmTrigger?.focus();});
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',event=>{
    if(event.target!==d)return;const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();
  });
  const formButtons=[...document.querySelectorAll('[data-tally-form]')];
  if(formButtons.length){
    const dialog=document.createElement('dialog');dialog.className='modal';dialog.setAttribute('aria-labelledby','form-dialog-title');
    dialog.innerHTML='<div class="modal-inner"><div class="modal-top"><h2 id="form-dialog-title"></h2><button type="button" aria-label="'+(ar?'إغلاق النموذج':'Close form')+'">×</button></div><p class="hint">'+(ar?'تتولى Tally معالجة بيانات النموذج.':'Tally processes information submitted through this form.')+'</p><iframe title="'+(ar?'نموذج التواصل':'Submission form')+'" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
    document.body.append(dialog);const frame=dialog.querySelector('iframe');let origin;
    for(const b of formButtons)b.addEventListener('click',()=>{origin=b;dialog.querySelector('h2').textContent=b.textContent;frame.src='https://tally.so/embed/'+encodeURIComponent(b.dataset.tallyForm)+'?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';dialog.showModal();});
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{frame.removeAttribute('src');origin?.focus();});
  }
  const announcement=document.getElementById('collabAnnouncement');
  if(announcement){
    const close=()=>announcement.close();announcement.querySelector('#collabAnnouncementX').addEventListener('click',close);announcement.querySelector('#collabAnnouncementDismiss').addEventListener('click',close);
    announcement.showModal();const timer=setTimeout(close,12*60*1000);announcement.addEventListener('close',()=>clearTimeout(timer),{once:true});
  }
  if(canvas&&!motion.matches&&typeof document.startViewTransition==='function'){
    // Native cross-document transitions are provided by the stylesheet, without intercepting links.
    motion.addEventListener('change',()=>{if(motion.matches)document.getAnimations().forEach(a=>a.cancel());});
  }
})();
