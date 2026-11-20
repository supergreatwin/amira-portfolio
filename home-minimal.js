(() => {
  const PROJECT='https://tfarhghukyogaowjqykn.supabase.co';
  const KEY='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
  const photoPattern=/^\/assets\/homepage\/photo-[1-4]\.webp$|^https:\/\/tfarhghukyogaowjqykn\.supabase\.co\/storage\/v1\/object\/public\/homepage-photos\/[A-Za-z0-9._/-]+$/;
  const images=[...document.querySelectorAll('.photo-mosaic img[data-slot]')];
  const fallback=new Map(images.map(img=>[Number(img.dataset.slot),img.getAttribute('src')]));
  async function refreshPhotos(){
    try{
      const response=await fetch(PROJECT+'/rest/v1/homepage_photos?select=slot,image_url,object_position&order=slot.asc',{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'});
      if(!response.ok)throw new Error('Photo configuration unavailable');
      const rows=await response.json();
      for(const row of rows){
        const slot=Number(row.slot), img=images.find(x=>Number(x.dataset.slot)===slot);
        if(!img||!photoPattern.test(row.image_url))continue;
        const next=row.image_url.startsWith('/')?row.image_url:row.image_url;
        img.onerror=()=>{img.onerror=null;img.src=fallback.get(slot)};
        if(img.getAttribute('src')!==next)img.src=next;
        if(/^(100|[1-9]?\d)% (100|[1-9]?\d)%$/.test(row.object_position||''))img.style.objectPosition=row.object_position;
      }
    }catch(error){console.info('Using original homepage photographs.',error);}
  }
  const legacy={ '#writing':'writing.html', '#about':'about.html', '#art':'art.html', '#contact':'contact.html' };
  if (legacy[location.hash]) location.replace(legacy[location.hash]);
  refreshPhotos();

  /* The navigation overlays the photographs, then regains an opaque theme surface. */
  const homeBar=document.querySelector('.home-topbar');
  const homeHero=document.querySelector('.photo-hero');
  if(homeBar && homeHero){
    const updateBar=()=>{
      const heroBottom=homeHero.getBoundingClientRect().bottom;
      homeBar.classList.toggle('is-after-hero',heroBottom<=homeBar.offsetHeight);
    };
    updateBar();
    window.addEventListener('scroll',updateBar,{passive:true});
    window.addEventListener('resize',updateBar,{passive:true});
  }

  document.querySelectorAll('.mobile-menu nav a').forEach(link=>link.addEventListener('click',()=>{
    const menu=document.querySelector('.mobile-menu');if(menu)menu.open=false;
  }));

  /* Fade-and-rise reveal as the two featured films enter the viewport. */
  const featured=document.getElementById('selected');
  if (featured && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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