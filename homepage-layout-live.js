/* Homepage-only layout controls, read from the public Supabase configuration.
   Defaults to the existing four-photo mosaic if settings are unavailable. */
(() => {
  const mosaic=document.querySelector('.photo-mosaic');
  if(!mosaic)return;
  const figures=[...mosaic.querySelectorAll('figure')];
  const api='https://tfarhghukyogaowjqykn.supabase.co/rest/v1/homepage_photo_layout?select=image_count,layout&id=eq.true';
  const key='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
  function apply(count,layout) {
    const n=Number(count);
    if(!Number.isInteger(n)||n<1||n>4||!['grid','horizontal','vertical'].includes(layout))return;
    mosaic.dataset.photoCount=String(n);
    mosaic.dataset.photoLayout=layout;
    figures.forEach((figure,i)=>{figure.hidden=i>=n;});
    mosaic.setAttribute('aria-label',n+' photograph'+(n!==1?'s':'')+' in '+(layout==='horizontal'?'horizontal strips':layout==='vertical'?'vertical strips':'a mosaic')+' layout');
  }
  apply(4,'grid');
  fetch(api,{headers:{apikey:key,Accept:'application/json'},cache:'no-store'})
    .then(response=>{if(!response.ok)throw Error('Homepage layout unavailable');return response.json();})
    .then(rows=>{if(rows?.[0])apply(rows[0].image_count,rows[0].layout);})
    .catch(()=>{ /* Preserve Amira's four-picture homepage. */ });
})();