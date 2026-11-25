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
      main.innerHTML = renderDiary(diary, document.documentElement.lang === 'ar' ? 'ar' : 'en', urls);
    }
  } catch (error) {
    console.warn('Showing the built-in visual diary:', error.message);
  }
}
