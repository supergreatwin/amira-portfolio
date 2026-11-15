(() => {
  const experience = document.querySelector('.portrait-experience');
  if (!experience) return;
  const moments = {
    question: {labelEn:'Looking ahead',labelAr:'نظرة إلى المستقبل',descriptionEn:'A quiet question about the next five years.',descriptionAr:'سؤال هادئ عن السنوات الخمس القادمة.',quote:'شايفة نفسك فين كمان خمس سنين؟',duration:'00:31',scene:'01'},
    conversation:{labelEn:'In conversation',labelAr:'في قلب الحوار',descriptionEn:'An intimate, unguarded exchange in close-up.',descriptionAr:'حوار شخصي ولقطات قريبة بعفوية.',quote:'',duration:'00:24',scene:'02'},
    riverside:{labelEn:'A moment by the river',labelAr:'لحظة على ضفاف النهر',descriptionEn:'A contemplative view through balcony railings, with trees and boats passing beyond.',descriptionAr:'مشهد تأملي من خلف شرفة، بين الأشجار والمراكب العابرة.',quote:'',duration:'00:24',scene:'03'},
  };
  const arabic = document.documentElement.lang === 'ar';
  const tabs = Array.from(experience.querySelectorAll('[data-portrait-moment]'));
  const panel = experience.querySelector('#portrait-moment-panel');
  function selectMoment(key, focus = false) {
    const moment = moments[key];
    if (!moment) return;
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
