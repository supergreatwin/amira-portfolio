/* Live editorial homepage photographs. Start from the saved image sources
   embedded in HTML; preload any later changes before updating the whole grid. */
(() => {
  const PROJECT='https://tfarhghukyogaowjqykn.supabase.co';
  const KEY='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
  const validSource=/^\/assets\/homepage\/photo-[1-4]\.webp$|^https:\/\/tfarhghukyogaowjqykn\.supabase\.co\/storage\/v1\/object\/public\/homepage-photos\/[A-Za-z0-9._/-]+$/;
  const photos=[...document.querySelectorAll('.photo-mosaic img[data-slot]')];
  const positions=/^(100|[1-9]?\d)% (100|[1-9]?\d)%$/;
  for(const img of photos){
    const fallback=img.dataset.fallbackSrc;
    if(fallback)img.addEventListener('error',()=>{
      const absolute=new URL(fallback,location.origin).href;
      if(img.src!==absolute)img.src=absolute;
    });
  }
  function preloaded(url){
    return new Promise(resolve=>{
      const next=new Image();
      next.onload=()=>resolve(true);
      next.onerror=()=>resolve(false);
      next.src=url;
      if(next.complete)resolve(next.naturalWidth>0);
    });
  }
  async function refreshPhotos(){
    if(!photos.length)return;
    try{
      const response=await fetch(
        PROJECT+'/rest/v1/homepage_photos?select=slot,image_url,object_position&order=slot.asc',
        {headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'}
      );
      if(!response.ok)throw Error('Photo settings unavailable');
      const rows=await response.json();
      const changes=[];
      for(const row of rows){
        const slot=Number(row.slot);
        const img=photos.find(el=>Number(el.dataset.slot)===slot);
        if(!img||typeof row.image_url!=='string'||!validSource.test(row.image_url))continue;
        const url=new URL(row.image_url,location.origin).href;
        const position=positions.test(row.object_position||'')?row.object_position:null;
        changes.push({img,url,position,needsLoad:img.src!==url});
      }
      const pending=changes.filter(change=>change.needsLoad);
      const ready=await Promise.all(pending.map(change=>preloaded(change.url)));
      /* One paint, rather than four sequential image changes and mixed tiles. */
      requestAnimationFrame(()=>{
        for(const change of changes){
          if(change.needsLoad){
            const index=pending.indexOf(change);
            if(index<0||!ready[index])continue;
            change.img.src=change.url;
          }
          if(change.position)change.img.style.objectPosition=change.position;
        }
      });
    }catch{/* Original photographs already in the document remain in place. */}
  }
  void refreshPhotos();

  // Deep links on the responsive homepage are actual page sections.
  // Retired legacy anchors only redirect from the simpler four-photo version.
  const legacy={'#writing':'writing.html','#about':'about.html','#art':'art.html','#contact':'contact.html'};
  if(!document.getElementById('writing')&&legacy[location.hash]){
    const prefix=document.documentElement.lang==='ar'?'../':'';
    location.replace(prefix+legacy[location.hash]);
  }

  const bar=document.querySelector('.home-topbar');
  const hero=document.querySelector('.photo-hero');
  if(bar&&hero){
    const update=()=>bar.classList.toggle('is-after-hero',
      hero.getBoundingClientRect().bottom<=bar.offsetHeight);
    update();
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
  }
  document.querySelectorAll('.mobile-menu nav a').forEach(link=>link.addEventListener('click',()=>{
    const menu=document.querySelector('.mobile-menu');
    if(menu)menu.open=false;
  }));
  const featured=document.getElementById('selected');
  if(featured&&'IntersectionObserver' in window&&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('reveal-ready');
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        featured.classList.add('is-in-view');
        observer.disconnect();
      }
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    observer.observe(featured);
  }
})();