(() => {
  const experience = document.querySelector('.portrait-experience');
  if (!experience) return;
  const moments = {
    question: {labelEn:'Looking ahead',labelAr:'نظرة إلى المستقبل',descriptionEn:'A quiet question about the next five years.',descriptionAr:'سؤال هادئ عن السنوات الخمس القادمة.',quote:'شايفة نفسك فين كمان خمس سنين؟',duration:'00:31',scene:'01'},
    conversation:{labelEn:'In conversation',labelAr:'في قلب الحوار',descriptionEn:'An intimate, unguarded exchange in close-up.',descriptionAr:'حوار شخصي ولقطات قريبة بعفوية.',quote:'',duration:'00:24',scene:'02'},
    riverside:{labelEn:'A moment by the river',labelAr:'لحظة على ضفاف النهر',descriptionEn:'A contemplative view through balcony railings, with trees and boats passing beyond.',descriptionAr:'مشهد تأملي من خلف شرفة، بين الأشجار والمراكب العابرة.',quote:'',duration:'00:24',scene:'03'},
  };
  const arabic = document.documentElement.lang === 'ar';
  const mediaBase = arabic ? '../assets/' : 'assets/';
  const sceneFiles = {question:'portrait-future.mp4',conversation:'portrait-conversation.mp4',riverside:'portrait-river.mp4'};
  const tabs = Array.from(experience.querySelectorAll('[data-portrait-moment]'));
  const panel = experience.querySelector('#portrait-moment-panel');
  const nativeClip = document.createElement('video');
  nativeClip.className = 'portrait-native-clip';
  nativeClip.controls = true;
  nativeClip.playsInline = true;
  nativeClip.preload = 'metadata';
  nativeClip.hidden = true;
  nativeClip.setAttribute('aria-label',arabic?'المقطع الأصلي':'Original clip');
  panel.querySelector('[data-moment-desc]').after(nativeClip);
  let activeScene = '';
  function selectMoment(key, focus = false) {
    const moment = moments[key];
    if (!moment) return;
    if (activeScene !== key) {
      activeScene = key;
      nativeClip.pause();
      nativeClip.hidden = true;
      nativeClip.removeAttribute('poster');
      nativeClip.src = mediaBase + sceneFiles[key];
      nativeClip.load();
    }
    tabs.forEach(tab => {
      const selected = tab.dataset.portraitMoment === key;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panel.querySelector('[data-moment-number]').textContent = moment.scene;
    panel.querySelector('[data-moment-title]').textContent = arabic ? moment.labelAr : moment.labelEn;
    panel.querySelector('[data-moment-desc]').textContent = arabic ? moment.descriptionAr : moment.descriptionEn;
    const quote = panel.querySelector('[data-moment-quote]');
    quote.hidden = !moment.quote;
    quote.textContent = moment.quote ? '«' + moment.quote + '»' : '';
    panel.querySelector('[data-moment-time]').textContent = moment.duration;
    panel.setAttribute('aria-labelledby',tabs.find(tab => tab.dataset.portraitMoment===key)?.id||'');
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',()=>selectMoment(tab.dataset.portraitMoment));
    tab.addEventListener('keydown',event=>{
      let offset = 0;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') offset = 1;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') offset = -1;
      if (!offset && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const target = event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+offset+tabs.length)%tabs.length;
      selectMoment(tabs[target].dataset.portraitMoment,true);
    });
  });
  selectMoment('question');
  nativeClip.addEventListener('loadedmetadata',() => { nativeClip.hidden = false; });
  nativeClip.addEventListener('error',() => { nativeClip.hidden = true; });

  // Enhance the editorial title with the supplied hand-drawn cards when hosted.
  const titleCard = experience.querySelector('.portrait-title-card');
  function addArtwork(filename,klass) {
    const artwork = document.createElement('img');
    artwork.src = mediaBase + filename;
    artwork.alt = '';
    artwork.className = 'portrait-title-art ' + klass;
    artwork.loading = 'lazy';
    artwork.hidden = true;
    artwork.addEventListener('load',()=>{
      artwork.hidden = false;
      titleCard.classList.add('has-original-art');
    });
    titleCard.prepend(artwork);
  }
  addArtwork('portrait-title.webp','portrait-art-primary');
  addArtwork('portrait-credits.webp','portrait-art-secondary');
  const opening = document.createElement('video');
  opening.className = 'portrait-opening-video';
  opening.src = mediaBase + 'portrait-opening.mp4';
  opening.muted = true;
  opening.loop = true;
  opening.playsInline = true;
  opening.preload = 'none';
  opening.hidden = true;
  opening.addEventListener('loadeddata',() => {
    opening.hidden = false;
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) opening.play().catch(()=>{});
  });
  titleCard.append(opening);
  if('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)) {opening.preload='metadata';observer.disconnect();}
    },{rootMargin:'250px'});
    observer.observe(titleCard);
  } else opening.preload='metadata';

  // Only expose the complete uploaded film if its optimized source is available.
  fetch(mediaBase+'portrait-feature.mp4',{method:'HEAD'}).then(response=>{
    if(!response.ok)return;
    const actions=experience.querySelector('.portrait-actions');
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='portrait-play';
    btn.textContent=arabic?'شاهد البورتريه كاملًا ↗':'Watch the portrait film ↗';
    actions.prepend(btn);
    btn.addEventListener('click',()=>{
      const modal=document.querySelector('.portrait-modal');
      const player=modal.querySelector('.portrait-player');
      player.dataset.provider='feature';
      const movie=document.createElement('video');
      movie.src=mediaBase+'portrait-feature.mp4';
      movie.controls=true;
      movie.autoplay=true;
      movie.playsInline=true;
      movie.style.width='100%';
      movie.style.height='100%';
      player.replaceChildren(movie);
      modal.querySelector('[data-portrait-modal-title]').textContent=arabic?'أيام مع أميرة':'Days with Amira';
      modal.querySelector('[data-portrait-external]').hidden=true;
      modal.showModal();
      modal.querySelector('[data-portrait-close]').focus();
    });
  }).catch(()=>{});
  const modal = document.querySelector('.portrait-modal');
  const player = modal?.querySelector('.portrait-player');
  const close = modal?.querySelector('[data-portrait-close]');
  const external = modal?.querySelector('[data-portrait-external]');
  const title = modal?.querySelector('[data-portrait-modal-title]');
  const sources = {
    youtube:{embed:'https://www.youtube-nocookie.com/embed/1vrU0HedW4M?autoplay=1&rel=0',url:'https://youtu.be/1vrU0HedW4M',title:'Amira Abdelfadil — YouTube video'},
    tiktok:{embed:'https://www.tiktok.com/player/v1/7702955168425397512',url:'https://www.tiktok.com/@byamiramero/video/7702955168425397512',title:'Amira Abdelfadil — TikTok video'},
  };
  experience.querySelectorAll('[data-portrait-play]').forEach(button => button.addEventListener('click',()=>{
    const key=button.dataset.portraitPlay;
    const source=sources[key];
    if(!source) return;
    if(!modal || typeof modal.showModal!=='function') {window.open(source.url,'_blank','noopener,noreferrer');return;}
    player.dataset.provider=key;
    const frame=document.createElement('iframe');
    frame.src=source.embed;
    frame.title=source.title;
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen; web-share';
    frame.allowFullscreen=true;
    frame.referrerPolicy='strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    external.hidden=false;
    external.href=source.url;
    external.textContent=arabic?'افتح الفيديو الأصلي ↗':'Watch on original platform ↗';
    title.textContent=key==='tiktok'?'TikTok · @byamiramero':'YouTube · Amira Abdelfadil';
    modal.showModal();
    close.focus();
  }));
  if(modal) {
    close.addEventListener('click',()=>modal.close());
    modal.addEventListener('close',()=>{player.replaceChildren();delete player.dataset.provider;});
    modal.addEventListener('click',event=>{
      if(event.target!==modal)return;
      const rect=modal.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)modal.close();
    });
  }
})();
