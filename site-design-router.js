/* Server-controlled homepage design selector. All public pages remain accessible as previews. */
(()=>{
 const host=location.hostname;
 if(!['amiraabdelfadil.com','www.amiraabdelfadil.com'].includes(host))return;
 if(new URLSearchParams(location.search).has('design-preview'))return;
 const path=location.pathname;
 const english=new Set(['/','/index.html','/classic.html','/classic','/responsive.html','/responsive']);
 const arabic=new Set(['/ar/','/ar/index.html','/ar/responsive.html','/ar/responsive']);
 const isArabic=arabic.has(path);
 if(!english.has(path)&&!isArabic)return;
 const endpoint='https://tfarhghukyogaowjqykn.supabase.co/rest/v1/site_design_settings?select=design_mode&id=eq.true';
 const key='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
 fetch(endpoint,{cache:'no-store',headers:{apikey:key,Accept:'application/json'}})
  .then(response=>{if(!response.ok)throw Error('Design preference unavailable');return response.json();})
  .then(rows=>{
    const mode=['current','classic','responsive'].includes(rows?.[0]?.design_mode)?rows[0].design_mode:'current';
    const desired=isArabic
      ? (mode==='responsive'?'/ar/responsive.html':'/ar/')
      : (mode==='responsive'?'/responsive.html':mode==='classic'?'/classic.html':'/');
    const equivalent=desired==='/'?['/','/index.html']:desired==='/ar/'?['/ar/','/ar/index.html']:[desired];
    if(!equivalent.includes(path))location.replace(desired+location.search+location.hash);
  })
  .catch(()=>{/* Graceful failure: keep the requested design visible. */});
})();
