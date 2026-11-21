/* Homepage design router.
   Cloudflare Pages canonicalizes /foo.html to /foo. Compare those as the SAME
   page: otherwise /responsive -> /responsive.html -> /responsive loops forever. */
(()=>{
  const root=document.documentElement;
  const reveal=()=>root.classList.remove('amira-design-routing');
  if(!['amiraabdelfadil.com','www.amiraabdelfadil.com'].includes(location.hostname)){reveal();return;}
  if(new URLSearchParams(location.search).has('design-preview')){reveal();return;}
  const path=location.pathname;
  const english=new Set(['/','/index.html','/classic.html','/classic','/responsive.html','/responsive']);
  const arabic=new Set(['/ar/','/ar/index.html','/ar/current.html','/ar/current','/ar/responsive.html','/ar/responsive']);
  if(!english.has(path)&&!arabic.has(path)){reveal();return;}
  const isArabic=arabic.has(path);
  const normalized=p=>p.replace(/\/index\.html$/i,'/').replace(/\.html$/i,'').replace(/\/+$/,'/');
  const endpoint='https://tfarhghukyogaowjqykn.supabase.co/rest/v1/site_design_settings?select=design_mode&id=eq.true';
  const key='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
  fetch(endpoint,{cache:'no-store',headers:{apikey:key,Accept:'application/json'}})
    .then(response=>{if(!response.ok)throw Error('Design preference unavailable');return response.json();})
    .then(rows=>{
      const mode=['current','classic','responsive'].includes(rows?.[0]?.design_mode)?rows[0].design_mode:'current';
      const target=isArabic
        ? (mode==='responsive'?'/ar/responsive':mode==='classic'?'/ar/':'/ar/current')
        : (mode==='responsive'?'/responsive':mode==='classic'?'/classic':'/');
      if(normalized(path)!==normalized(target)){
        location.replace(target+location.search+location.hash);
        return;
      }
      reveal();
    })
    .catch(reveal);
})();
