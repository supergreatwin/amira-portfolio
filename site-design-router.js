/* Server-controlled, reversible homepage layout switch.
   Pre-render guard in theme-init.js prevents EN/AR design flashes. */
(()=>{
 const root=document.documentElement;
 const reveal=()=>root.classList.remove('amira-design-routing');
 if(!['amiraabdelfadil.com','www.amiraabdelfadil.com'].includes(location.hostname)){reveal();return;}
 if(new URLSearchParams(location.search).has('design-preview')){reveal();return;}
 const path=location.pathname;
 const english=new Set(['/','/index.html','/classic.html','/classic','/responsive.html','/responsive']);
 const arabic=new Set(['/ar/','/ar/index.html','/ar/current.html','/ar/current','/ar/responsive.html','/ar/responsive']);
 const isArabic=arabic.has(path);
 if(!english.has(path)&&!isArabic){reveal();return;}
 const endpoint='https://tfarhghukyogaowjqykn.supabase.co/rest/v1/site_design_settings?select=design_mode&id=eq.true';
 const key='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
 fetch(endpoint,{cache:'no-store',headers:{apikey:key,Accept:'application/json'}})
  .then(response=>{if(!response.ok)throw Error('Design preference unavailable');return response.json();})
  .then(rows=>{
   const mode=['current','classic','responsive'].includes(rows?.[0]?.design_mode)?rows[0].design_mode:'current';
   const target=isArabic
    ? (mode==='responsive'?'/ar/responsive.html':mode==='classic'?'/ar/':'/ar/current.html')
    : (mode==='responsive'?'/responsive.html':mode==='classic'?'/classic.html':'/');
   const equivalent=target==='/'?['/','/index.html']:target==='/ar/'?['/ar/','/ar/index.html']:[target];
   if(!equivalent.includes(path)){location.replace(target+location.search+location.hash);return;}
   reveal();
  }).catch(reveal);
})();
