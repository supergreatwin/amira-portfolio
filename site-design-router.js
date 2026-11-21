/* Server-owned design switch: live visitors receive the editorial team's chosen homepage. */
(()=>{
  if(!['amiraabdelfadil.com','www.amiraabdelfadil.com'].includes(location.hostname))return;
  const path=location.pathname;
  const isCurrent=path==='/'||path==='/index.html';
  const isClassic=path==='/classic.html'||path==='/classic';
  if(!isCurrent&&!isClassic)return;
  const endpoint='https://tfarhghukyogaowjqykn.supabase.co/rest/v1/site_design_settings?select=design_mode&id=eq.true';
  const key='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
  fetch(endpoint,{cache:'no-store',headers:{apikey:key,Accept:'application/json'}})
    .then(response=>{if(!response.ok)throw Error('Design setting unavailable');return response.json();})
    .then(rows=>{
      const classic=rows?.[0]?.design_mode==='classic';
      if(classic&&!isClassic)location.replace('/classic.html'+location.search+location.hash);
      else if(!classic&&!isCurrent)location.replace('/'+location.search+location.hash);
    }).catch(()=>{/* Keep the requested page available if Supabase is unreachable. */});
})();
