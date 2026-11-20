import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';

export const cms = createClient(
  'https://tfarhghukyogaowjqykn.supabase.co',
  'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS',
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
);
export const BUCKET='amira-site-content';
export const $=id=>document.getElementById(id);
export const isEditor=user=>['admin','editor'].includes(user?.app_metadata?.editorial_role);
export const slugify=text=>String(text).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
export const onlyHttps=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:null;}catch{return null;}};
export const mediaFileName=s=>String(s).replace(/[^a-zA-Z0-9_.-]/g,'-').slice(-100)||'image';
export const assetPath=(type,id,file)=>type+'/'+id+'/'+crypto.randomUUID()+'-'+mediaFileName(file.name);
export const mediaType=file=>file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':'audio';
export const duration=(seconds)=>{
  if(seconds===null||seconds===undefined)return '';
  const n=Math.floor(Number(seconds));
  const h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;
  return h?String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')
    :String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
};
export function parseDuration(value){
  if(!value)return null;
  const parts=value.split(':').map(Number);
  if(parts.some(x=>!Number.isSafeInteger(x)||x<0)||parts.length<2||parts.length>3)return null;
  if(parts.at(-1)>59||parts.at(-2)>59)return null;
  return parts.reduce((acc,x)=>acc*60+x,0);
}
export function node(tag,css,text){
  const el=document.createElement(tag);if(css)el.className=css;
  if(text!==undefined)el.textContent=text;
  return el;
}
export async function signedMedia(path,minutes=45){
  if(!path)return null;
  const {data,error}=await cms.storage.from(BUCKET).createSignedUrl(path,minutes*60);
  if(error)throw error;
  return data.signedUrl;
}
export async function uploadMedia(file,path){
  const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/mpeg','audio/mp4','audio/wav'];
  if(!allowed.includes(file.type))throw Error('Unsupported media type. Use JPG, PNG, WebP, MP4, WebM, MP3, M4A or WAV.');
  if(file.size>50*1024*1024)throw Error('File exceeds 50 MB. For long films, add a YouTube or Vimeo link.');
  const {error}=await cms.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
}
export function exactPublished(row){
  return row?.status==='published' && row.published_at && new Date(row.published_at)<=new Date();
}
