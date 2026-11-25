import { validateDiary, renderDiary, storagePaths } from './days-with-amira-model.mjs';

// The complete diary is already in the HTML. Failed CMS requests leave it intact.
const main = document.querySelector('[data-diary]');
if (main) {
  try {
    const { cms, BUCKET } = await import('./cms-core.js');
    const { data, error } = await cms.from('cms_sections').select('body_en')
      .eq('key', 'days_with_amira').eq('enabled', true).maybeSingle();
    if (error) throw error;
    if (data) {
      const diary = validateDiary(JSON.parse(data.body_en));
      const paths = storagePaths(diary), urls = {};
      if (paths.length) {
        const { data: signed, error: signingError } = await cms.storage.from(BUCKET).createSignedUrls(paths, 3600);
        if (signingError) throw signingError;
        for (const item of signed || []) {
          if (item.error || !item.signedUrl || new URL(item.signedUrl).origin !== 'https://tfarhghukyogaowjqykn.supabase.co')
            throw Error('Diary image is unavailable');
          urls[item.path] = item.signedUrl;
        }
        if (paths.some(path => !urls[path])) throw Error('Incomplete diary images');
      }
      const locale=document.documentElement.lang === 'ar' ? 'ar' : 'en';
      const fallback=main.innerHTML;
      main.innerHTML = renderDiary(diary, locale, urls);
      if(paths.length){
        let renewedAt=Date.now(),renewing;
        const renew=()=>renewing ||= (async()=>{
          const {data:signed,error}=await cms.storage.from(BUCKET).createSignedUrls(paths,3600);
          if(error)throw error;
          const next={};
          for(const item of signed||[]){
            if(item.error||!item.signedUrl||new URL(item.signedUrl).origin!=='https://tfarhghukyogaowjqykn.supabase.co')throw Error('Photograph renewal failed');
            next[item.path]=item.signedUrl;
          }
          if(paths.some(path=>!next[path]))throw Error('Incomplete photograph renewal');
          // Update addresses in place so a long reading session keeps its position.
          for(const picture of main.querySelectorAll('picture')){
            const image=picture.querySelector('img'),source=picture.querySelector('source');
            const photo=diary.photos.find(photo=>image.getAttribute('src')===(urls[photo.src]||photo.src));
            if(!photo)continue;
            if(next[photo.src])image.src=next[photo.src];
            source.srcset=photo.variants.map(v=>(next[v.path]||v.path)+' '+v.width+'w').join(', ');
          }
          Object.assign(urls,next);renewedAt=Date.now();
        })().finally(()=>{renewing=null;});
        const refresh=()=>{if(document.visibilityState==='visible'&&Date.now()-renewedAt>50*60*1000)void renew().catch(()=>{});};
        setInterval(refresh,60*1000);document.addEventListener('visibilitychange',refresh);
        let recovered=false;
        main.addEventListener('error',event=>{
          if(event.target.tagName!=='IMG'||!event.target.src.includes('/storage/v1/'))return;
          if(recovered){main.innerHTML=fallback;return;}
          recovered=true;void renew().catch(()=>{main.innerHTML=fallback;});
        },true);
      }
    }
  } catch (error) {
    console.warn('Showing the built-in visual diary:', error.message);
  }
}
