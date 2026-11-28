/* Production interactions for the owner-approved classic reference. */
(() => {
  'use strict';
  const ar=document.documentElement.lang==='ar';
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const canvas=document.getElementById('canvas');

  // Render interface glyphs as real, monochrome SVGs, never platform emoji.
  // Only interactive labels are processed; editorial prose, images and copyright stay intact.
  const iconPaths={
    '↗':'<path d="M7 17 17 7M7 7h10v10"/>',
    '↖':'<path d="M17 17 7 7m10 0H7v10"/>',
    '→':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    '←':'<path d="M20 12H4m6-6-6 6 6 6"/>',
    '↑':'<path d="M12 20V4m-6 6 6-6 6 6"/>',
    '↓':'<path d="M12 4v16m-6-6 6 6 6-6"/>',
    '×':'<path d="m6 6 12 12M18 6 6 18"/>',
    '▶':'<path d="m9 5 11 7-11 7z"/>',
    '☼':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    '☾':'<path d="M20.9 13.3A9 9 0 0 1 10.7 3.1 9 9 0 1 0 20.9 13.3Z"/>',
    '✓':'<path d="m5 12 4 4L19 6"/>',
    '✔':'<path d="m5 12 4 4L19 6"/>',
    '✕':'<path d="m6 6 12 12M18 6 6 18"/>',
    '✖':'<path d="m6 6 12 12M18 6 6 18"/>',
    '☀':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'
  };
  const interfaceSelector='a,button,summary,[role="button"],.showcase-arrow,.icon-circle,.special-play-symbol,.education-announcement__cta-arrow';
  const glyphPattern=/[↗↖→←↑↓×▶☼☾✓✔✕✖☀][\uFE0E\uFE0F]?/gu;
  function interfaceIcon(glyph){
    const key=glyph[0]==='↗'&&ar?'↖':glyph[0];
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','amira-ui-icon');
    svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
    svg.innerHTML=iconPaths[key];return svg;
  }
  function convertInterfaceText(node){
    const owner=node.parentElement?.closest(interfaceSelector);
    if(!owner||node.parentElement.closest('svg,script,style,code,pre,textarea,[contenteditable="true"]'))return;
    const text=node.nodeValue||'';
    // Multiplication within dimensions or other words is not a close icon.
    const matches=[...text.matchAll(glyphPattern)].filter(m=>m[0][0]!=='×'||/^\s*×[\uFE0E\uFE0F]?\s*$/.test(text)||/\s×[\uFE0E\uFE0F]?\s*$/.test(text));
    if(!matches.length)return;
    const lone=owner.textContent.trim();
    if(owner.matches('button,a,summary,[role="button"]')&&!owner.hasAttribute('aria-label')&&!owner.hasAttribute('aria-labelledby')&&/^[↗↖→←↑↓×▶☼☾✓✔✕✖☀][\uFE0E\uFE0F]?$/.test(lone)){
      const labels={'×':ar?'إغلاق':'Close','✕':ar?'إغلاق':'Close','✖':ar?'إغلاق':'Close','▶':ar?'تشغيل':'Play','☼':ar?'تبديل المظهر':'Toggle theme','☀':ar?'تبديل المظهر':'Toggle theme','☾':ar?'تبديل المظهر':'Toggle theme','→':ar?'انتقال إلى اليمين':'Go right','←':ar?'انتقال إلى اليسار':'Go left','↑':ar?'انتقال إلى الأعلى':'Go up','↓':ar?'انتقال إلى الأسفل':'Go down','✓':ar?'تأكيد':'Confirm','✔':ar?'تأكيد':'Confirm'};
      owner.setAttribute('aria-label',labels[lone[0]]||(ar?'فتح الرابط':'Open link'));
    }
    const fragment=document.createDocumentFragment();let cursor=0;
    for(const match of matches){
      fragment.append(document.createTextNode(text.slice(cursor,match.index)),interfaceIcon(match[0]));
      cursor=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));node.replaceWith(fragment);
  }
  function convertInterfaceIcons(root){
    if(root.nodeType===3){convertInterfaceText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1&&root.closest('svg,script,style,code,pre,textarea,[contenteditable="true"]'))return;
    const controls=[];
    if(root.nodeType===1&&root.matches(interfaceSelector))controls.push(root);
    controls.push(...root.querySelectorAll(interfaceSelector));
    // A newly inserted span inside a control need not itself match the selector.
    if(root.nodeType===1&&root.closest(interfaceSelector)&&!controls.includes(root))controls.push(root);
    for(const control of controls){
      const walker=document.createTreeWalker(control,NodeFilter.SHOW_TEXT);const nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      for(const node of nodes)convertInterfaceText(node);
    }
  }
  function installInterfaceIcons(){
    convertInterfaceIcons(document);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')convertInterfaceIcons(record.target);
        else for(const node of record.addedNodes)convertInterfaceIcons(node);
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }

  const language=document.querySelector('.header-aux');
  const publicSlug=new URL(location.href).searchParams.get('slug');
  if(language&&publicSlug&&/\/(?:film|collection|journal)(?:\.html)?$/.test(location.pathname)){
    const target=new URL(language.href,location.href);target.searchParams.set('slug',publicSlug);language.href=target.href;
  }
  const menu=document.getElementById('siteMenu');
  // Keep About immediately before Contact in the shared navigation, including keyboard tab order.
  if(menu){
    for(const link of menu.querySelectorAll(':scope > a[href]')){
      if(/\/beyond-the-frame(?:\.html)?\/?$/.test(new URL(link.href,location.href).pathname))link.remove();
    }
    const contact=[...menu.children].find(link=>link.matches('a[href]')&&/\/contact(?:\.html)?\/?$/.test(new URL(link.href,location.href).pathname));
    const footer=menu.querySelector('.nav-foot');
    const about=[...menu.children].find(link=>link.matches('a[href]')&&/\/about(?:\.html)?\/?$/.test(new URL(link.href,location.href).pathname));
    if(contact)menu.insertBefore(contact,footer);
    if(about&&contact)menu.insertBefore(about,contact);
  }
  const toggle=document.getElementById('menuToggle');
  // Do not change body positioning or root overflow: doing either can relocate
  // Safari's sticky header while the document is scrolled.
  const menuIsOpen=()=>!!menu?.classList.contains('open');
  const setMenu=open=>{
    if(!menu||!toggle||menuIsOpen()===open)return;
    menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));
    if(open){
      menu.scrollTop=0;
      [...menu.querySelectorAll('a[href]')].find(link=>link.getClientRects().length)?.focus({preventScroll:true});
    }
    document.dispatchEvent(new CustomEvent('amira-menu-change',{detail:{open}}));
  };
  toggle?.addEventListener('click',()=>setMenu(!menuIsOpen()));
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.site-header'))setMenu(false);});
  menu?.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
  // Prevent background gestures without changing the scroll container.
  const blockBackgroundScroll=e=>{
    if(menuIsOpen()&&!menu.contains(e.target)&&e.cancelable)e.preventDefault();
  };
  document.addEventListener('wheel',blockBackgroundScroll,{passive:false});
  document.addEventListener('touchmove',blockBackgroundScroll,{passive:false});
  document.addEventListener('keydown',e=>{
    if(!menuIsOpen())return;
    if(e.key==='Escape'){setMenu(false);toggle.focus({preventScroll:true});return;}
    if(['PageDown','PageUp','Home','End','ArrowUp','ArrowDown',' '].includes(e.key)&&!menu.contains(e.target)){
      e.preventDefault();return;
    }
    if(e.key!=='Tab')return;
    const links=[...menu.querySelectorAll('a[href]')].filter(el=>el.getClientRects().length);
    const first=links[0],last=links.at(-1);
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===toggle)){e.preventDefault();last?.focus({preventScroll:true});}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();toggle.focus({preventScroll:true});}
    else if(!e.shiftKey&&document.activeElement===toggle){e.preventDefault();first?.focus({preventScroll:true});}
  });
  window.addEventListener('pagehide',()=>setMenu(false));
  window.addEventListener('pageshow',()=>setMenu(false));
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
  const filmDialog=document.getElementById('filmDialog');let filmTrigger,activeFilmIndex=-1;
  const filmCards=[...document.querySelectorAll('#page-home [data-film]')].filter(card=>document.getElementById('popup-'+card.dataset.film)?.content);
  const nextFilm=filmDialog?.querySelector('#filmDialogNext');
  const previousFilm=filmDialog?.querySelector('#filmDialogPrevious');
  const filmPosition=filmDialog?.querySelector('#filmDialogPosition');
  function showFilm(index){
    const trigger=filmCards[index];if(!trigger||!filmDialog)return;
    const id=trigger.dataset.film;const source=document.getElementById('popup-'+id)?.content;if(!source)return;
    activeFilmIndex=index;
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
    if(nextFilm){
      nextFilm.hidden=filmCards.length<2;
      const upcoming=filmCards[(index+1)%filmCards.length];
      const upcomingTitle=document.getElementById('popup-'+upcoming.dataset.film).content.querySelector('h1').textContent;
      nextFilm.setAttribute('aria-label',(ar?'الفيلم التالي: ':'Next film: ')+upcomingTitle);
    }
    if(previousFilm){
      previousFilm.hidden=filmCards.length<2;
      const previous=filmCards[(index-1+filmCards.length)%filmCards.length];
      const previousTitle=document.getElementById('popup-'+previous.dataset.film).content.querySelector('h1').textContent;
      previousFilm.setAttribute('aria-label',(ar?'الفيلم السابق: ':'Previous film: ')+previousTitle);
    }
    if(filmPosition){
      filmPosition.textContent=String(index+1).padStart(2,'0')+' / '+String(filmCards.length).padStart(2,'0');
      filmPosition.setAttribute('aria-label',ar?'الفيلم '+(index+1)+' من '+filmCards.length+': '+title:'Film '+(index+1)+' of '+filmCards.length+': '+title);
    }
    if(!filmDialog.open)filmDialog.showModal();
    filmDialog.scrollTop=0;
  }
  filmCards.forEach((trigger,index)=>trigger.addEventListener('click',()=>{filmTrigger=trigger;showFilm(index);}));
  nextFilm?.addEventListener('click',()=>{if(filmCards.length>1&&activeFilmIndex>=0)showFilm((activeFilmIndex+1)%filmCards.length);});
  previousFilm?.addEventListener('click',()=>{if(filmCards.length>1&&activeFilmIndex>=0)showFilm((activeFilmIndex-1+filmCards.length)%filmCards.length);});
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
    for(const b of formButtons)b.addEventListener('click',()=>{
      origin=b;dialog.querySelector('h2').textContent=b.textContent;
      // Tally's saved light theme needs its opaque background on a dark page.
      const transparentBackground=document.documentElement.dataset.theme==='dark'?'0':'1';
      frame.src='https://tally.so/embed/'+encodeURIComponent(b.dataset.tallyForm)+'?alignLeft=1&hideTitle=1&transparentBackground='+transparentBackground+'&dynamicHeight=1';
      dialog.showModal();
    });
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{frame.removeAttribute('src');origin?.focus();});
  }
  const announcement=document.getElementById('collabAnnouncement');
  if(announcement){
    const close=()=>announcement.close();announcement.querySelector('#collabAnnouncementX').addEventListener('click',close);announcement.querySelector('#collabAnnouncementDismiss').addEventListener('click',close);
    announcement.showModal();const timer=setTimeout(close,12*60*1000);announcement.addEventListener('close',()=>clearTimeout(timer),{once:true});
  }
  installInterfaceIcons();
  if(canvas&&!motion.matches&&typeof document.startViewTransition==='function'){
    // Native cross-document transitions are provided by the stylesheet, without intercepting links.
    motion.addEventListener('change',()=>{if(motion.matches)document.getAnimations().forEach(a=>a.cancel());});
  }
})();
